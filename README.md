# Adaptive Workspace

Adaptive Workspace provides hotkey-ready commands that coordinate Obsidian's sidebars, window zoom, and active Markdown view mode.

## Commands

- **Adaptive Workspace: Zoom-in workspace** zooms in once and applies the configured sidebar and Markdown view actions.
- **Adaptive Workspace: Zoom-out workspace** zooms out once and applies the configured sidebar and Markdown view actions.

Assign hotkeys under **Settings → Hotkeys** by searching for “Adaptive Workspace.” The sidebar and zoom actions still run when the active view is not a Markdown note.

For each command, the left and right sidebars can independently be set to **Expand**, **Collapse**, or **No change** under **Settings → Adaptive Workspace**. Zoom in and zoom out always run with their corresponding commands.

The active Markdown view can independently be set to **No change**, **Edit**, or **Reading** for each command.

**Edit** uses the note's current Obsidian editing mode, either Live Preview or Source mode. Obsidian's editing-mode status control can switch between them.

Adaptive Workspace adds a status-bar control that enables or disables sidebar changes without opening plugin settings. Its active state and tooltip update when the setting changes; zoom remains enabled for both workspace commands.

Under **Settings → Adaptive Workspace**, the **Status bar** section can show or hide both Obsidian's editing-mode control and the Adaptive Workspace sidebar control.

## Mouse bindings

Each workspace command can be assigned a mouse binding under **Settings → Adaptive Workspace**. Select **Mouse binding**, then enter the binding anywhere in the Obsidian window. Hold Ctrl, Alt, Shift, Meta, or another mouse button while scrolling to record combinations such as **Ctrl + Wheel up** or **Mouse button 5 (Forward) + Wheel down**. Release held mouse buttons after scrolling to save the binding.

Bindings match modifiers exactly. Unmatched scrolling and mouse clicks keep their normal behavior. A mouse button used as a chord modifier is reserved while the binding's keyboard modifiers match, preventing actions such as Back or Forward from firing during the chord. Plain primary and secondary mouse buttons are not accepted because they would block normal interaction; they can be recorded when combined with a keyboard modifier.

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
