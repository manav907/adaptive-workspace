import { MarkdownView } from 'obsidian';
import type {
	App,
	WorkspaceMobileDrawer,
	WorkspaceSidedock,
} from 'obsidian';
import type {
	AdaptiveWorkspaceSettings,
	MarkdownModeAction,
	SidebarAction,
} from '../settings';
import { executeInternalCommand } from '../obsidian-internals';

type Sidebar = WorkspaceSidedock | WorkspaceMobileDrawer;

function applySidebarAction(sidebar: Sidebar, action: SidebarAction): void {
	if (action === 'expand') {
		sidebar.expand();
	} else if (action === 'collapse') {
		sidebar.collapse();
	}
}

export function expandBothSidebars(app: App): void {
	app.workspace.leftSplit.expand();
	app.workspace.rightSplit.expand();
}

export function collapseBothSidebars(app: App): void {
	app.workspace.leftSplit.collapse();
	app.workspace.rightSplit.collapse();
}

export function toggleBothSidebars(app: App): void {
	if (app.workspace.leftSplit.collapsed
		|| app.workspace.rightSplit.collapsed) {
		expandBothSidebars(app);
	} else {
		collapseBothSidebars(app);
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
	executeInternalCommand(app, 'window:zoom-in');

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
	executeInternalCommand(app, 'window:zoom-out');

	await applyMarkdownMode(
		app,
		settings.collapseCommandMarkdownMode,
	);
}
