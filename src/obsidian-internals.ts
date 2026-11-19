import type { App } from 'obsidian';

interface InternalCommandRegistry {
	executeCommandById(commandId: string): boolean;
}

interface InternalPlugin {
	enabled: boolean;
	disable(): void | Promise<void>;
	enable(): Promise<void>;
}

interface InternalPluginManager {
	getPluginById(pluginId: string): InternalPlugin | null;
}

type AppWithInternals = App & {
	commands?: InternalCommandRegistry;
	internalPlugins?: InternalPluginManager;
};

export function executeInternalCommand(
	app: App,
	commandId: string,
): void {
	(app as AppWithInternals).commands?.executeCommandById(commandId);
}

export function isInternalPluginEnabled(
	app: App,
	pluginId: string,
): boolean {
	return getInternalPlugin(app, pluginId)?.enabled ?? false;
}

export async function setInternalPluginEnabled(
	app: App,
	pluginId: string,
	enabled: boolean,
): Promise<void> {
	const internalPlugin = getInternalPlugin(app, pluginId);
	if (!internalPlugin || internalPlugin.enabled === enabled) {
		return;
	}

	if (enabled) {
		await internalPlugin.enable();
	} else {
		await internalPlugin.disable();
	}
}

function getInternalPlugin(app: App, pluginId: string): InternalPlugin | null {
	return (app as AppWithInternals).internalPlugins
		?.getPluginById(pluginId) ?? null;
}
