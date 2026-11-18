import { Plugin } from 'obsidian';
import { collapseWorkspace, expandWorkspace } from './workspace';

export function registerCommands(plugin: Plugin): void {
	plugin.addCommand({
		id: 'expand-workspace',
		name: 'Expand workspace',
		callback: async () => {
			await expandWorkspace(plugin.app);
		},
	});

	plugin.addCommand({
		id: 'collapse-workspace',
		name: 'Collapse workspace',
		callback: async () => {
			await collapseWorkspace(plugin.app);
		},
	});
}
