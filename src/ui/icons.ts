import { addIcon, removeIcon } from 'obsidian';
import type { Plugin } from 'obsidian';

export const SIDEBAR_CHANGES_ICON =
	'adaptive-workspace-sidebar-changes';

const SIDEBAR_CHANGES_SVG = `

<g fill="none" stroke="currentColor" stroke-width="2"
	stroke-linecap="round" stroke-linejoin="round"
	transform="scale(4.1666667)">
	<rect x="3" y="3" width="18" height="18" rx="2"/>
	<path d="M17 16V8"/>
	<path d="M7 16V8"/>
</g>`;

export function registerPluginIcons(plugin: Plugin): void {
	addIcon(SIDEBAR_CHANGES_ICON, SIDEBAR_CHANGES_SVG);
	plugin.register(() => removeIcon(SIDEBAR_CHANGES_ICON));
}
