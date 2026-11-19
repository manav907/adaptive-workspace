import type { App } from 'obsidian';

interface InternalCommandRegistry {
	executeCommandById(commandId: string): boolean;
}

type AppWithInternalCommands = App & {
	commands?: InternalCommandRegistry;
};

export function executeInternalCommand(
	app: App,
	commandId: string,
): void {
	(app as AppWithInternalCommands).commands
		?.executeCommandById(commandId);
}
