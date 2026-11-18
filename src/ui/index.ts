import type AdaptiveWorkspacePlugin from '../main';
import {
	refreshMarkdownViewActions,
	registerMarkdownSourceToggle,
} from './markdown-source-toggle';

export { refreshMarkdownViewActions };

export function registerViewActions(plugin: AdaptiveWorkspacePlugin): void {
	plugin.app.workspace.detachLeavesOfType('adaptive-workspace-hello-world');
	registerMarkdownSourceToggle(plugin);
}
