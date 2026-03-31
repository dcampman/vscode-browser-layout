#!/bin/sh
# Downloads and installs the latest Browser Layout VSIX from GitHub Releases.
# Usage: sh update.sh [version]
#   version  Optional. e.g. "0.2.0". Defaults to latest.

set -e

OWNER="dcampman"
REPO="vscode-browser-layout"
VERSION="${1:-}"

if [ -n "$VERSION" ]; then
    RELEASE_URL="https://api.github.com/repos/$OWNER/$REPO/releases/tags/v$VERSION"
else
    RELEASE_URL="https://api.github.com/repos/$OWNER/$REPO/releases/latest"
fi

echo "Fetching release info from $RELEASE_URL ..."

RELEASE_JSON=$(curl -fsSL -H "User-Agent: $REPO" -H "Accept: application/vnd.github+json" "$RELEASE_URL")

DOWNLOAD_URL=$(echo "$RELEASE_JSON" | grep -o '"browser_download_url"[[:space:]]*:[[:space:]]*"[^"]*\.vsix"' | head -1 | sed 's/.*"browser_download_url"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')

if [ -z "$DOWNLOAD_URL" ]; then
    echo "Error: No .vsix asset found in release." >&2
    exit 1
fi

FILENAME=$(basename "$DOWNLOAD_URL")
TMPFILE="${TMPDIR:-/tmp}/$FILENAME"

echo "Downloading $FILENAME ..."
curl -fSL -H "User-Agent: $REPO" -o "$TMPFILE" "$DOWNLOAD_URL"

# Find VS Code CLI
CODE_CLI=""
for name in code code-insiders; do
    if command -v "$name" >/dev/null 2>&1; then
        CODE_CLI="$name"
        break
    fi
done

if [ -z "$CODE_CLI" ]; then
    echo "Error: Could not find 'code' or 'code-insiders' on PATH." >&2
    echo "Install VS Code and ensure it is on PATH." >&2
    exit 1
fi

echo "Installing $FILENAME via $CODE_CLI ..."
"$CODE_CLI" --install-extension "$TMPFILE" --force

rm -f "$TMPFILE"
echo "Done. Reload VS Code to activate the new version."
