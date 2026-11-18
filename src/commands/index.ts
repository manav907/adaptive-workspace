import type AdaptiveWorkspacePlugin from '../main';
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
}
