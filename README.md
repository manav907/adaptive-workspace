# Adaptive Workspace

Adaptive Workspace provides hotkey-ready commands that coordinate Obsidian's sidebars, window zoom, and active Markdown view mode.

## Commands

- **Adaptive Workspace: Expand workspace** expands both sidebars, zooms in once, and changes the active Markdown view to Live Preview.
- **Adaptive Workspace: Collapse workspace** collapses both sidebars, zooms out once, and changes the active Markdown view to Reading view.

Assign hotkeys under **Settings → Hotkeys** by searching for “Adaptive Workspace.” The sidebar and zoom actions still run when the active view is not a Markdown note.

For each command, the left and right sidebars can independently be set to **Expand**, **Collapse**, or **No change** under **Settings → Adaptive Workspace**. Zoom in and zoom out always run with their corresponding commands.

The active Markdown view can also independently be set to **Edit**, **Reading**, or **No change** for each command.

## Installation

Until packaged releases are available, install the plugin manually:

1. Run `npm install`.
2. Run `npm run build`.
3. Place this project in `<vault>/.obsidian/plugins/adaptive-workspace/`, or copy `main.js`, `manifest.json`, and `styles.css` into a folder at that location.
4. Reload Obsidian.
5. Enable **Adaptive Workspace** under **Settings → Community plugins**.

## Development

Requirements:

- Obsidian 1.13.0 or newer
- Node.js 18 or newer
- npm

Install dependencies and start the development watcher:

```sh
npm install
npm run dev
```

Other available checks:

```sh
npm run build
npm run lint
```

## Releasing

Before creating a release:

1. Set the minimum supported Obsidian version in `manifest.json`.
2. Run `npm version patch`, `npm version minor`, or `npm version major`.
3. Confirm that `package.json`, `manifest.json`, and `versions.json` contain matching release metadata.
4. Push a tag matching the version exactly, without a `v` prefix.

The release workflow builds the plugin and creates a draft GitHub release containing `main.js`, `manifest.json`, and `styles.css` when present.

## License

[0BSD](LICENSE)
