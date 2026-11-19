import type AdaptiveWorkspacePlugin from '../main';
import {
	refreshMarkdownViewActions,
	registerMarkdownSourceToggle,
} from './markdown-source-toggle';
import {
	refreshStatusBarControls,
	registerStatusBarControls,
} from './status-bar';

export function refreshControls(plugin: AdaptiveWorkspacePlugin): void {
	refreshMarkdownViewActions(plugin);
	refreshStatusBarControls(plugin);
}

export function registerControls(plugin: AdaptiveWorkspacePlugin): void {
	plugin.app.workspace.detachLeavesOfType('adaptive-workspace-hello-world');
	registerMarkdownSourceToggle(plugin);
	registerStatusBarControls(plugin);
}
