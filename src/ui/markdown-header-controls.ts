import { MarkdownView, setIcon, setTooltip } from 'obsidian';
import type AdaptiveWorkspacePlugin from '../main';
import {
	getEditingModePresentation,
	getSidebarChangesPresentation,
	HIDDEN_CONTROL_CLASS,
} from './control-presentation';
import type { ControlPresentation } from './control-presentation';

interface ViewControls {
	editingMode: HTMLElement;
	sidebarChanges: HTMLElement;
}

const refreshers = new WeakMap<AdaptiveWorkspacePlugin, () => void>();

function updateControl(
	control: HTMLElement,
	presentation: ControlPresentation,
): void {
	control.classList.toggle('is-active', presentation.active);
	control.setAttribute('aria-pressed', String(presentation.pressed));
	control.setAttribute('aria-label', presentation.label);
	setIcon(control, presentation.icon);
	setTooltip(control, presentation.label);
}

export function refreshMarkdownHeaderControls(
	plugin: AdaptiveWorkspacePlugin,
): void {
	refreshers.get(plugin)?.();
}

export function registerMarkdownHeaderControls(
	plugin: AdaptiveWorkspacePlugin,
): void {
	const viewControls = new Map<MarkdownView, ViewControls>();

	const addControls = (): void => {
		for (const leaf of plugin.app.workspace.getLeavesOfType('markdown')) {
			if (!(leaf.view instanceof MarkdownView)
				|| viewControls.has(leaf.view)) {
				continue;
			}

			const view = leaf.view;
			const editingMode = view.addAction(
				'file-pen-line',
				'Use Source mode',
				async () => {
					const state = view.getState();
					await view.setState(
						{
							...state,
							mode: 'source',
							source: state.source !== true,
						},
						{ history: false },
					);
					refreshMarkdownHeaderControls(plugin);
				},
			);
			editingMode.classList.add('plugin-adaptive-workspace-control');
			editingMode.setAttribute('role', 'button');

			const sidebarChanges = view.addAction(
				'panels-top-left',
				'Disable sidebar changes',
				async () => {
					plugin.settings.disableSidebarChanges =
						!plugin.settings.disableSidebarChanges;
					await plugin.saveSettings();
				},
			);
			sidebarChanges.classList.add('plugin-adaptive-workspace-control');
			sidebarChanges.setAttribute('role', 'button');

			viewControls.set(view, {
				editingMode,
				sidebarChanges,
			});
		}
	};

	const refreshControls = (): void => {
		for (const [view, controls] of viewControls) {
			if (!controls.editingMode.isConnected
				|| !controls.sidebarChanges.isConnected) {
				controls.editingMode.remove();
				controls.sidebarChanges.remove();
				viewControls.delete(view);
			}
		}

		addControls();

		for (const [view, controls] of viewControls) {

			controls.editingMode.hidden = false;
			controls.editingMode.classList.toggle(
				HIDDEN_CONTROL_CLASS,
				!plugin.settings.showEditingModeHeaderControl,
			);
			controls.sidebarChanges.hidden = false;
			controls.sidebarChanges.classList.toggle(
				HIDDEN_CONTROL_CLASS,
				!plugin.settings.showSidebarChangesHeaderControl,
			);

			const state = view.getState();
			updateControl(
				controls.editingMode,
				getEditingModePresentation(state.source === true),
			);
			updateControl(
				controls.sidebarChanges,
				getSidebarChangesPresentation(
					plugin.settings.disableSidebarChanges,
				),
			);
		}
	};

	refreshers.set(plugin, refreshControls);
	refreshControls();
	plugin.registerEvent(
		plugin.app.workspace.on('layout-change', refreshControls),
	);
	plugin.registerEvent(
		plugin.app.workspace.on('active-leaf-change', refreshControls),
	);
	plugin.register(() => {
		refreshers.delete(plugin);
		for (const controls of viewControls.values()) {
			controls.editingMode.remove();
			controls.sidebarChanges.remove();
		}
		viewControls.clear();
	});
}
