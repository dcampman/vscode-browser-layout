# Development Guide

Internal reference for building, debugging, and releasing Browser Layout.

## Access

This repository is public and read-only for external visitors. If you need write access or want to contribute, open an issue or reach out to [@dcampman](https://github.com/dcampman) to request collaborator access.

## Prerequisites

- Node.js 20+
- npm

## Setup

```sh
git clone https://github.com/dcampman/vscode-browser-layout.git
cd vscode-browser-layout
npm install
npm run compile
```

## Run / Debug

Open the folder in VS Code, then press `F5` to launch the Extension Development Host.

## Package a VSIX

```sh
npm run package
```

This produces `vscode-browser-layout-<version>.vsix` in the project root.

## Release Flow

1. Bump the `version` in `package.json`.
2. Commit and push to `main`.
3. GitHub Actions automatically builds, packages, and creates a GitHub Release with the VSIX and update scripts attached.

If the version was not bumped, the workflow warns and skips release creation.

## Trust Model

- Updates are distributed only through GitHub Releases on this repository.
- The extension checks `api.github.com` only — no other network calls.
- No telemetry, no analytics, no third-party services.
- All source code is public and auditable.

## Repository Settings

The following GitHub repository settings should be applied manually if not automated:

- **Branch protection on `main`:**
  - Require pull requests before merging
  - Disable force pushes
  - Disable branch deletion
  - Enable required status checks (require the `build` job to pass)
- **Repository visibility:** Public
- **No additional collaborators** (read-only for the public)

## Updating Demo Media

Raw screen recordings go in `media/raw/`. A local ffmpeg script converts them into optimized GIFs for the README.

```sh
npm run demo-media
```

See the [Demo Media Workflow](demo-media-workflow.md) for full details on the directory structure, tuning, and how to reference GIFs from the README.
