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
): Promise<void> {
	if (action === 'unchanged') {
		return;
	}

	const view = app.workspace.getActiveViewOfType(MarkdownView);

	if (!view) {
		return;
	}

	let state: Record<string, unknown>;
	if (action === 'reading') {
		state = { mode: 'preview' };
	} else if (action === 'live-preview') {
		state = { mode: 'source', source: false };
	} else if (action === 'source') {
		state = { mode: 'source', source: true };
	} else {
		state = { mode: 'source' };
	}

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

	await applyMarkdownMode(
		app,
		settings.expandCommandMarkdownMode,
	);
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

	await applyMarkdownMode(
		app,
		settings.collapseCommandMarkdownMode,
	);
}
