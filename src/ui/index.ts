import type AdaptiveWorkspacePlugin from '../main';
import {
	refreshSidebarStatusItem,
	registerSidebarStatusItem,
} from './status-bar';

export { refreshSidebarStatusItem };

export function registerUi(plugin: AdaptiveWorkspacePlugin): void {
	plugin.app.workspace.detachLeavesOfType('adaptive-workspace-hello-world');
	registerSidebarStatusItem(plugin);
}
