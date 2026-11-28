import type AdaptiveWorkspacePlugin from '../main';
import { registerPluginIcons } from './icons';
import {
	refreshMarkdownHeaderControls,
	registerMarkdownHeaderControls,
} from './markdown-header-controls';

export function refreshUi(plugin: AdaptiveWorkspacePlugin): void {
	refreshMarkdownHeaderControls(plugin);
}

export function registerUi(plugin: AdaptiveWorkspacePlugin): void {
	registerPluginIcons(plugin);
	registerMarkdownHeaderControls(plugin);
}
