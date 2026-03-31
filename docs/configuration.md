# Configuration Reference

Complete reference for all Browser Layout settings. All settings live under the `browserLayout` namespace.

Open the Settings UI (`Cmd+,`) and search **"Browser Layout"**, or edit `settings.json` directly.

---

## `browserLayout.position`

Controls where the Simple Browser tab opens relative to your editor groups.

|                    |                                 |
| ------------------ | ------------------------------- |
| **Type**           | `string`                        |
| **Default**        | `"active"`                      |
| **Allowed values** | `"active"`, `"right"`, `"left"` |

### Values

#### `"active"` (default)

Opens the browser tab in whichever editor group currently has focus. No editor groups are created or rearranged. This is the simplest mode — the browser opens in place, just like opening any other tab.

#### `"right"`

Ensures a two-group (split) editor layout and opens the browser in the **right** group. If only one group exists, a second group is created automatically. After the browser opens, focus returns to the **left** group so you can keep coding without switching manually.

This is the recommended setting for side-by-side development — code on the left, browser on the right.

#### `"left"`

The inverse of `"right"`. Ensures a two-group layout and opens the browser in the **left** group, then returns focus to the **right** group. Useful if you prefer your browser on the left and code on the right.

### Example

```jsonc
{
  "browserLayout.position": "right",
}
```

---

## `browserLayout.defaultUrl`

A URL to open immediately when clicking the status bar button, skipping the quick pick menu entirely.

|             |                     |
| ----------- | ------------------- |
| **Type**    | `string`            |
| **Default** | `""` (empty string) |

When set, clicking the status bar button (or running the command) opens this URL directly — no quick pick appears. Leave empty to always show the quick pick with your presets.

Must start with `http://` or `https://`.

### Example

```jsonc
{
  "browserLayout.defaultUrl": "http://localhost:3000",
}
```

### Notes

- The quick pick menu (with presets) is still available via the command palette when `defaultUrl` is set.
- Also used by `browserLayout.openOnStartup` as the URL to auto-open.

---

## `browserLayout.openOnStartup`

Automatically open a browser tab when the workspace loads.

|             |           |
| ----------- | --------- |
| **Type**    | `boolean` |
| **Default** | `false`   |

When `true`, the extension opens a browser tab immediately on activation using the value of `browserLayout.defaultUrl`. Has no effect if `defaultUrl` is empty.

Respects `browserLayout.position` for placement.

### Example

```jsonc
{
  "browserLayout.defaultUrl": "http://localhost:3000",
  "browserLayout.openOnStartup": true,
  "browserLayout.position": "right",
}
```

---

## `browserLayout.statusBar.label`

Text displayed on the status bar button.

|             |                      |
| ----------- | -------------------- |
| **Type**    | `string`             |
| **Default** | `"$(globe) Browser"` |

Supports VS Code [codicons](https://microsoft.github.io/vscode-codicons/dist/codicon.html) via the `$(icon-name)` syntax. Set to an empty string to hide the status bar button entirely.

Changes take effect immediately — no reload required.

### Examples

| Value                | Result                      |
| -------------------- | --------------------------- |
| `"$(globe) Browser"` | 🌐 Browser (default)        |
| `"$(globe)"`         | Icon only, no text          |
| `"$(browser) Dev"`   | Browser icon + "Dev"        |
| `"$(link-external)"` | External link icon          |
| `""`                 | Hides the status bar button |

### Useful codicons

Some codicons that work well for this button: `$(globe)`, `$(browser)`, `$(link-external)`, `$(preview)`, `$(open-preview)`, `$(window)`.

### Example

```jsonc
{
  "browserLayout.statusBar.label": "$(globe)",
}
```

---

## `browserLayout.urls`

A key-value map of preset URLs shown in the quick pick menu. The **key** is the display label; the **value** is the URL to open.

|             |                                        |
| ----------- | -------------------------------------- |
| **Type**    | `object` (string keys → string values) |
| **Default** | `{}` (empty — no presets)              |

URLs must start with `http://` or `https://`. Any other protocol is rejected at runtime.

When you invoke **Browser Layout: Open URL**, presets appear as selectable items in the quick pick. You can still type a custom URL in the input field regardless of what presets are defined.

### Example

```jsonc
{
  "browserLayout.urls": {
    "Local Dev": "http://localhost:3000",
    "Local API": "http://localhost:8080",
    "Staging": "https://staging.example.com",
    "Prod": "https://example.com",
    "Docs": "https://developer.mozilla.org",
  },
}
```

### Notes

- Labels must be unique (duplicate keys are overwritten by JSON rules).
- There is no limit on the number of presets.
- Changes take effect immediately — no reload required.

---

## `browserLayout.updateCheck.enabled`

Whether the extension checks [GitHub Releases](https://github.com/dcampman/vscode-browser-layout/releases) for new versions when VS Code starts.

|             |           |
| ----------- | --------- |
| **Type**    | `boolean` |
| **Default** | `true`    |

When enabled, a single HTTPS request is made to the GitHub Releases API (`api.github.com`) on startup — at most once per `browserLayout.updateCheck.intervalHours`. If a newer version is found, a notification appears with options to update, view release notes, skip, or dismiss. The extension **never** auto-installs without your approval.

Set to `false` to disable all update checks and network calls entirely.

### Example

```jsonc
{
  "browserLayout.updateCheck.enabled": false,
}
```

---

## `browserLayout.updateCheck.intervalHours`

Minimum number of hours between update checks.

|             |          |
| ----------- | -------- |
| **Type**    | `number` |
| **Default** | `24`     |
| **Minimum** | `1`      |

Only takes effect when `browserLayout.updateCheck.enabled` is `true`. The extension records the timestamp of the last check and skips subsequent checks until the interval has elapsed.

### Example

```jsonc
{
  // Check at most once every 3 days
  "browserLayout.updateCheck.intervalHours": 72,
}
```

---

## Full settings.json example

```jsonc
{
  // Open browser in the right editor group with code on the left
  "browserLayout.position": "right",

  // Skip the quick pick — open this URL directly on click
  "browserLayout.defaultUrl": "http://localhost:3000",

  // Auto-open the browser when the workspace loads
  "browserLayout.openOnStartup": true,

  // Icon only in the status bar
  "browserLayout.statusBar.label": "$(globe)",

  // Preset URLs for quick access (used when defaultUrl is empty)
  "browserLayout.urls": {
    "Local Dev": "http://localhost:3000",
    "Local API": "http://localhost:8080",
    "Staging": "https://staging.example.com",
  },

  // Check for updates once a day
  "browserLayout.updateCheck.enabled": true,
  "browserLayout.updateCheck.intervalHours": 24,
}
```
