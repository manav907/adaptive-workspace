import type AdaptiveWorkspacePlugin from '../main';
import {
	refreshMarkdownHeaderControls,
	registerMarkdownHeaderControls,
} from './markdown-header-controls';
import {
	refreshSidebarStatusItem,
	registerSidebarStatusItem,
} from './status-bar';

export function refreshUi(plugin: AdaptiveWorkspacePlugin): void {
	refreshMarkdownHeaderControls(plugin);
	refreshSidebarStatusItem(plugin);
}

export function registerUi(plugin: AdaptiveWorkspacePlugin): void {
	plugin.app.workspace.detachLeavesOfType('adaptive-workspace-hello-world');
	registerMarkdownHeaderControls(plugin);
	registerSidebarStatusItem(plugin);
}
