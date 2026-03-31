import { URL } from "url";
import * as vscode from "vscode";
import { scheduleUpdateCheck } from "./updateChecker";

export function activate(context: vscode.ExtensionContext) {
  const cmd = vscode.commands.registerCommand(
    "browserLayout.open",
    openBrowser,
  );

  const statusBar = vscode.window.createStatusBarItem(
    "browserLayout.statusBar",
    vscode.StatusBarAlignment.Left,
    0,
  );
  statusBar.name = "Browser Layout";
  statusBar.command = "browserLayout.open";
  statusBar.tooltip = "Open a browser tab beside the editor";

  function applyStatusBarLabel() {
    const config = vscode.workspace.getConfiguration("browserLayout");
    const label: string = config.get("statusBar.label", "$(globe) Browser");
    if (label) {
      statusBar.text = label;
      statusBar.show();
    } else {
      statusBar.hide();
    }
  }

  applyStatusBarLabel();

  const onConfigChange = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("browserLayout.statusBar.label")) {
      applyStatusBarLabel();
    }
  });

  context.subscriptions.push(cmd, statusBar, onConfigChange);

  // Non-blocking update check
  scheduleUpdateCheck(context);

  // Open on startup if configured
  const config = vscode.workspace.getConfiguration("browserLayout");
  const openOnStartup: boolean = config.get("openOnStartup", false);
  const defaultUrl: string = config.get("defaultUrl", "");
  if (openOnStartup && defaultUrl) {
    openUrl(defaultUrl);
  }
}

function openBrowser(): void {
  const config = vscode.workspace.getConfiguration("browserLayout");
  const defaultUrl: string = config.get("defaultUrl", "");

  // If a default URL is set, open it directly — skip the quick pick.
  if (defaultUrl) {
    openUrl(defaultUrl);
    return;
  }

  const urlMap: Record<string, string> = config.get("urls", {});

  const qp = vscode.window.createQuickPick();
  qp.placeholder = "Type a URL and press Enter, or pick a saved one";
  qp.items = Object.entries(urlMap).map(([label, url]) => ({
    label,
    description: url,
  }));

  qp.onDidAccept(async () => {
    const selected = qp.selectedItems[0];
    let url: string;

    if (selected && selected.description) {
      // User picked a preset
      url = selected.description;
    } else if (qp.value.trim()) {
      // User typed a custom URL
      url = qp.value.trim();
    } else {
      return;
    }

    // Validate
    try {
      const parsed = new URL(url);
      if (!parsed.protocol.startsWith("http")) {
        vscode.window.showErrorMessage(
          "Only http and https URLs are supported.",
        );
        return;
      }
    } catch {
      vscode.window.showErrorMessage(`Invalid URL: ${url}`);
      return;
    }

    qp.dispose();
    await openUrl(url);
  });

  qp.onDidHide(() => qp.dispose());
  qp.show();
}

async function openUrl(url: string): Promise<void> {
  const config = vscode.workspace.getConfiguration("browserLayout");
  const position: string = config.get("position", "active");

  if (position === "right") {
    // Ensure a second editor group exists and focus it so the browser opens there.
    await vscode.commands.executeCommand(
      "workbench.action.focusSecondEditorGroup",
    );
  } else if (position === "left") {
    // Ensure a second editor group exists, then focus the first so the browser opens there.
    await vscode.commands.executeCommand(
      "workbench.action.focusSecondEditorGroup",
    );
    await vscode.commands.executeCommand(
      "workbench.action.focusFirstEditorGroup",
    );
  }
  // "active" — no group management, open wherever focus already is.

  try {
    await vscode.commands.executeCommand("simpleBrowser.api.open", url, {
      viewColumn: vscode.ViewColumn.Active,
    });
  } catch {
    try {
      await vscode.commands.executeCommand("simpleBrowser.show", url);
    } catch {
      vscode.window.showErrorMessage(
        "Could not open the built-in Simple Browser. Make sure your VS Code version supports it.",
      );
    }
  }

  // Return focus to the code group so the user can keep coding
  // and so the Simple Browser webview does not steal focus from the next
  // QuickPick invocation (which would cause it to silently dismiss).
  if (position === "right") {
    await vscode.commands.executeCommand(
      "workbench.action.focusFirstEditorGroup",
    );
  } else if (position === "left") {
    await vscode.commands.executeCommand(
      "workbench.action.focusSecondEditorGroup",
    );
  }
}

export function deactivate() {}
