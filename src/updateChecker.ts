import * as https from "https";
import * as vscode from "vscode";

const OWNER = "dcampman";
const REPO = "vscode-browser-layout";
const RELEASES_API = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;
const RELEASE_PAGE = `https://github.com/${OWNER}/${REPO}/releases/latest`;

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  assets: { name: string; browser_download_url: string }[];
}

const STATE_LAST_CHECK = "browserLayout.lastUpdateCheck";
const STATE_SKIPPED_VERSION = "browserLayout.skippedVersion";

export function scheduleUpdateCheck(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration("browserLayout");
  if (!config.get<boolean>("updateCheck.enabled", true)) {
    return;
  }

  const intervalHours = config.get<number>("updateCheck.intervalHours", 24);
  const lastCheck = context.globalState.get<number>(STATE_LAST_CHECK, 0);
  const elapsed = (Date.now() - lastCheck) / (1000 * 60 * 60);

  if (elapsed < intervalHours) {
    return;
  }

  // Fire and forget — never block activation
  checkForUpdate(context).catch(() => {});
}

async function checkForUpdate(context: vscode.ExtensionContext): Promise<void> {
  const release = await fetchLatestRelease();
  if (!release) {
    return;
  }

  const latestVersion = release.tag_name.replace(/^v/, "");
  const currentVersion = getInstalledVersion();

  if (!isNewer(latestVersion, currentVersion)) {
    await context.globalState.update(STATE_LAST_CHECK, Date.now());
    return;
  }

  const skipped = context.globalState.get<string>(STATE_SKIPPED_VERSION);
  if (skipped === latestVersion) {
    await context.globalState.update(STATE_LAST_CHECK, Date.now());
    return;
  }

  await context.globalState.update(STATE_LAST_CHECK, Date.now());

  const vsixAsset = release.assets.find((a) => a.name.endsWith(".vsix"));

  // Honour VS Code's built-in "Auto Update" toggle.
  // When enabled, silently download + install and just offer Reload.
  const autoUpdate = vscode.workspace
    .getConfiguration("extensions")
    .get<boolean | string>("autoUpdate", true);
  const shouldAutoUpdate =
    autoUpdate === true || autoUpdate === "onlyEnabledExtensions";

  if (shouldAutoUpdate && vsixAsset) {
    try {
      await vscode.commands.executeCommand(
        "workbench.extensions.installExtension",
        vscode.Uri.parse(vsixAsset.browser_download_url),
      );
      const reload = await vscode.window.showInformationMessage(
        `Browser Layout was auto-updated to v${latestVersion}. Reload to activate.`,
        "Reload",
        "View Release Notes",
      );
      if (reload === "Reload") {
        await vscode.commands.executeCommand("workbench.action.reloadWindow");
      } else if (reload === "View Release Notes") {
        vscode.env.openExternal(vscode.Uri.parse(release.html_url));
      }
      return;
    } catch {
      // Fall through to manual prompt if silent install fails
    }
  }

  const updateNow = "Update Now";
  const viewNotes = "View Release Notes";
  const skip = "Skip This Version";
  const later = "Later";

  const choice = await vscode.window.showInformationMessage(
    `A new version of Browser Layout is available (v${latestVersion}).`,
    updateNow,
    viewNotes,
    skip,
    later,
  );

  if (choice === updateNow) {
    if (vsixAsset) {
      try {
        await vscode.commands.executeCommand(
          "workbench.extensions.installExtension",
          vscode.Uri.parse(vsixAsset.browser_download_url),
        );
        const reload = await vscode.window.showInformationMessage(
          "Browser Layout has been updated. Reload to activate the new version.",
          "Reload",
        );
        if (reload === "Reload") {
          await vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
      } catch {
        // Fallback: open the release page so the user can download manually
        vscode.env.openExternal(vscode.Uri.parse(release.html_url));
      }
    } else {
      vscode.env.openExternal(vscode.Uri.parse(release.html_url));
    }
  } else if (choice === viewNotes) {
    vscode.env.openExternal(vscode.Uri.parse(release.html_url));
  } else if (choice === skip) {
    await context.globalState.update(STATE_SKIPPED_VERSION, latestVersion);
  }
  // 'Later' or dismissed — do nothing
}

function getInstalledVersion(): string {
  const ext = vscode.extensions.getExtension(`dcampman.vscode-browser-layout`);
  if (ext) {
    return ext.packageJSON.version as string;
  }
  // Fallback: read from our own package.json at compile time is not dynamic,
  // so we hard-read the extension manifest at runtime.
  return "0.0.0";
}

function isNewer(latest: string, current: string): boolean {
  const l = latest.split(".").map(Number);
  const c = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const lv = l[i] ?? 0;
    const cv = c[i] ?? 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
}

function fetchLatestRelease(): Promise<GitHubRelease | null> {
  return new Promise((resolve) => {
    const req = https.get(
      RELEASES_API,
      {
        headers: {
          "User-Agent": "vscode-browser-layout",
          Accept: "application/vnd.github+json",
        },
        timeout: 10000,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          resolve(null);
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data) as GitHubRelease);
          } catch {
            resolve(null);
          }
        });
      },
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
}
