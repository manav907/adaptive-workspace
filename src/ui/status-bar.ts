import { setIcon, setTooltip } from 'obsidian';
import type AdaptiveWorkspacePlugin from '../main';
import { isControlInStatusBar } from '../settings';
import {
	getEditingModePresentation,
	getSidebarChangesPresentation,
} from './control-presentation';
import type { ControlPresentation } from './control-presentation';

interface StatusBarControls {
	editingMode: HTMLElement;
	sidebarChanges: HTMLElement;
}

const controls = new WeakMap<AdaptiveWorkspacePlugin, StatusBarControls>();

function updateControl(
	element: HTMLElement,
	presentation: ControlPresentation,
): void {
	element.classList.toggle('is-active', presentation.active);
	element.setAttribute('aria-pressed', String(presentation.pressed));
	element.setAttribute('aria-label', presentation.label);
	setIcon(element, presentation.icon);
	const statusText = document.createElement('span');
	statusText.classList.add('plugin-adaptive-workspace-status-label');
	statusText.textContent = presentation.statusText;
	element.appendChild(statusText);
	setTooltip(element, presentation.label);
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
		getEditingModePresentation(plugin.settings),
	);
	updateControl(
		statusBarControls.sidebarChanges,
		getSidebarChangesPresentation(plugin.settings),
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
