# Adaptive Workspace

Adaptive Workspace adds two commands that coordinate zoom, sidebars, and the active Markdown view.

## Commands

- **Zoom-in workspace** zooms in and applies its configured actions.
- **Zoom-out workspace** zooms out and applies its configured actions.

Configure sidebar and Markdown actions under **Settings → Adaptive Workspace**. **Edit** preserves the current Live Preview or Source mode; the explicit options switch modes. Assign keyboard shortcuts under **Settings → Hotkeys**. Optional Markdown-header and status-bar controls switch editing mode or temporarily disable sidebar changes.

## Mouse wheel

Middle-mouse wheel control is enabled by default. Hold the middle mouse button and scroll to run the workspace commands. While enabled, the plugin captures middle-button clicks, so middle-click autoscroll is unavailable. The control can be disabled or its direction inverted in the plugin settings.

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
- Node.js 20.19, 22.13, or 24 and newer
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
