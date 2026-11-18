import { MarkdownView } from 'obsidian';
import type { App } from 'obsidian';
import type {
	AdaptiveWorkspaceSettings,
	MarkdownModeAction,
	SidebarAction,
} from '../settings';

interface InternalCommandRegistry {
	executeCommandById(commandId: string): boolean;
}

type AppWithInternalCommands = App & {
	commands?: InternalCommandRegistry;
};

function executeCommandById(app: App, commandId: string): void {
	const { commands } = app as AppWithInternalCommands;
	commands?.executeCommandById(commandId);
}

interface Sidebar {
	collapse(): void;
	expand(): void;
}

function applySidebarAction(sidebar: Sidebar, action: SidebarAction): void {
	if (action === 'expand') {
		sidebar.expand();
	} else if (action === 'collapse') {
		sidebar.collapse();
	}
}

async function applyMarkdownMode(
	app: App,
	action: MarkdownModeAction,
	useSourceMode: boolean,
): Promise<void> {
	if (action === 'unchanged') {
		return;
	}

	const view = app.workspace.getActiveViewOfType(MarkdownView);

	if (!view) {
		return;
	}

	const state = action === 'edit'
		? { mode: 'source', source: useSourceMode }
		: { mode: 'preview' };

	await view.setState({ ...view.getState(), ...state }, { history: false });
}

export async function expandWorkspace(
	app: App,
	settings: AdaptiveWorkspaceSettings,
): Promise<void> {
	if (!settings.disableSidebarChanges) {
		applySidebarAction(
			app.workspace.leftSplit,
			settings.expandCommandLeftSidebar,
		);
		applySidebarAction(
			app.workspace.rightSplit,
			settings.expandCommandRightSidebar,
		);
	}
	executeCommandById(app, 'window:zoom-in');

	if (!settings.disableMarkdownViewChanges) {
		await applyMarkdownMode(
			app,
			settings.expandCommandMarkdownMode,
			settings.useSourceMode,
		);
	}
}

export async function collapseWorkspace(
	app: App,
	settings: AdaptiveWorkspaceSettings,
): Promise<void> {
	if (!settings.disableSidebarChanges) {
		applySidebarAction(
			app.workspace.leftSplit,
			settings.collapseCommandLeftSidebar,
		);
		applySidebarAction(
			app.workspace.rightSplit,
			settings.collapseCommandRightSidebar,
		);
	}
	executeCommandById(app, 'window:zoom-out');

	if (!settings.disableMarkdownViewChanges) {
		await applyMarkdownMode(
			app,
			settings.collapseCommandMarkdownMode,
			settings.useSourceMode,
		);
	}
}
