import { setIcon, setTooltip } from 'obsidian';
import type AdaptiveWorkspacePlugin from '../main';
import { isControlInStatusBar } from '../settings';

interface StatusBarControls {
	editingMode: HTMLElement;
	sidebarChanges: HTMLElement;
}

const controls = new WeakMap<AdaptiveWorkspacePlugin, StatusBarControls>();

function updateControl(
	element: HTMLElement,
	active: boolean,
	label: string,
	icon: string,
): void {
	element.classList.toggle('is-active', active);
	element.setAttribute('aria-pressed', String(active));
	element.setAttribute('aria-label', label);
	setIcon(element, icon);
	setTooltip(element, label);
}

export function refreshStatusBarControls(
	plugin: AdaptiveWorkspacePlugin,
): void {
	const statusBarControls = controls.get(plugin);
	if (!statusBarControls) {
		return;
	}

	statusBarControls.editingMode.classList.toggle(
		'plugin-adaptive-workspace-is-hidden',
		!isControlInStatusBar(
			plugin.settings.editingModeControlLocation,
		),
	);
	statusBarControls.sidebarChanges.classList.toggle(
		'plugin-adaptive-workspace-is-hidden',
		!isControlInStatusBar(
			plugin.settings.sidebarChangesControlLocation,
		),
	);

	updateControl(
		statusBarControls.editingMode,
		plugin.settings.useSourceMode,
		plugin.settings.useSourceMode
			? 'Use Live Preview for Edit'
			: 'Use source mode for Edit',
		'code-xml',
	);
	updateControl(
		statusBarControls.sidebarChanges,
		plugin.settings.disableSidebarChanges,
		plugin.settings.disableSidebarChanges
			? 'Enable sidebar changes'
			: 'Disable sidebar changes',
		plugin.settings.disableSidebarChanges
			? 'panel-left-close'
			: 'panels-top-left',
	);
}

function registerStatusButton(
	plugin: AdaptiveWorkspacePlugin,
	element: HTMLElement,
	onActivate: () => Promise<void>,
): void {
	element.classList.add('plugin-adaptive-workspace-control', 'mod-clickable');
	element.setAttribute('role', 'button');
	element.tabIndex = 0;
	plugin.registerDomEvent(element, 'click', onActivate);
	plugin.registerDomEvent(element, 'keydown', (event) => {
		if (event.key !== 'Enter' && event.key !== ' ') {
			return;
		}
		event.preventDefault();
		void onActivate();
	});
}

export function registerStatusBarControls(
	plugin: AdaptiveWorkspacePlugin,
): void {
	const editingMode = plugin.addStatusBarItem();
	editingMode.classList.add('plugin-adaptive-workspace-editing-mode');
	registerStatusButton(plugin, editingMode, async () => {
		plugin.settings.useSourceMode = !plugin.settings.useSourceMode;
		await plugin.saveSettings();
	});

	const sidebarChanges = plugin.addStatusBarItem();
	sidebarChanges.classList.add('plugin-adaptive-workspace-sidebar-changes');
	registerStatusButton(plugin, sidebarChanges, async () => {
		plugin.settings.disableSidebarChanges =
			!plugin.settings.disableSidebarChanges;
		await plugin.saveSettings();
	});

	controls.set(plugin, { editingMode, sidebarChanges });
	plugin.register(() => controls.delete(plugin));
	refreshStatusBarControls(plugin);
}
