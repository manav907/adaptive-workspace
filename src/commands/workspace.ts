import { App } from 'obsidian';

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

export async function expandWorkspace(app: App): Promise<void> {
	app.workspace.leftSplit.expand();
	app.workspace.rightSplit.expand();
	executeCommandById(app, 'window:zoom-in');

	await setActiveMarkdownState(app, {
		mode: 'source',
		source: false,
	});
}

export async function collapseWorkspace(app: App): Promise<void> {
	app.workspace.leftSplit.collapse();
	app.workspace.rightSplit.collapse();
	executeCommandById(app, 'window:zoom-out');

	await setActiveMarkdownState(app, {
		mode: 'preview',
	});
}
