import type AdaptiveWorkspacePlugin from '../main';
import {
	refreshMarkdownHeaderControls,
	registerMarkdownHeaderControls,
} from './markdown-header-controls';

export function refreshUi(plugin: AdaptiveWorkspacePlugin): void {
	refreshMarkdownHeaderControls(plugin);
}

export function registerUi(plugin: AdaptiveWorkspacePlugin): void {
	registerMarkdownHeaderControls(plugin);
}
