import { App } from 'obsidian';
import type {
	AdaptiveWorkspaceSettings,
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

async function setActiveMarkdownState(
	app: App,
	state: Record<string, unknown>,
): Promise<void> {
	const view = app.workspace.activeLeaf?.view;

	if (view?.getViewType() !== 'markdown') {
		return;
	}

	await view.setState(
		{ ...view.getState(), ...state },
		{ history: false },
	);
}

export async function expandWorkspace(
	app: App,
	settings: AdaptiveWorkspaceSettings,
): Promise<void> {
	applySidebarAction(
		app.workspace.leftSplit,
		settings.expandCommandLeftSidebar,
	);
	applySidebarAction(
		app.workspace.rightSplit,
		settings.expandCommandRightSidebar,
	);
	executeCommandById(app, 'window:zoom-in');

	await setActiveMarkdownState(app, {
		mode: 'source',
		source: false,
	});
}

export async function collapseWorkspace(
	app: App,
	settings: AdaptiveWorkspaceSettings,
): Promise<void> {
	applySidebarAction(
		app.workspace.leftSplit,
		settings.collapseCommandLeftSidebar,
	);
	applySidebarAction(
		app.workspace.rightSplit,
		settings.collapseCommandRightSidebar,
	);
	executeCommandById(app, 'window:zoom-out');

	await setActiveMarkdownState(app, {
		mode: 'preview',
	});
}
