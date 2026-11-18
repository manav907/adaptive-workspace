import type AdaptiveWorkspacePlugin from '../main';
import { openHelloWorldView } from '../ui/hello-world-view';
import { collapseWorkspace, expandWorkspace } from './workspace';

export function registerCommands(plugin: AdaptiveWorkspacePlugin): void {
	plugin.addCommand({
		id: 'expand-workspace',
		name: 'Zoom-in workspace',
		callback: async () => {
			await expandWorkspace(plugin.app, plugin.settings);
		},
	});

	plugin.addCommand({
		id: 'collapse-workspace',
		name: 'Zoom-out workspace',
		callback: async () => {
			await collapseWorkspace(plugin.app, plugin.settings);
		},
	});

	plugin.addCommand({
		id: 'open-hello-world',
		name: 'Open workspace controls',
		callback: async () => {
			await openHelloWorldView(plugin.app);
		},
	});
}
