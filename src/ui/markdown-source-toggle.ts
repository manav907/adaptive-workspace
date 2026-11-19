import { MarkdownView, setIcon, setTooltip } from 'obsidian';
import type AdaptiveWorkspacePlugin from '../main';
import { isControlInHeader } from '../settings';
import {
	getEditingModePresentation,
	getSidebarChangesPresentation,
} from './control-presentation';
import type { ControlPresentation } from './control-presentation';

interface ViewActions {
	sourceMode: HTMLElement;
	sidebars: HTMLElement;
}

const refreshers = new WeakMap<AdaptiveWorkspacePlugin, () => void>();

export function refreshMarkdownViewActions(
	plugin: AdaptiveWorkspacePlugin,
): void {
	refreshers.get(plugin)?.();
}

export function registerMarkdownSourceToggle(
	plugin: AdaptiveWorkspacePlugin,
): void {
	const viewActions = new Map<MarkdownView, ViewActions>();

	const addActions = (): void => {
		for (const leaf of plugin.app.workspace.getLeavesOfType('markdown')) {
			if (!(leaf.view instanceof MarkdownView)
				|| viewActions.has(leaf.view)) {
				continue;
			}

			const view = leaf.view;
			const editingMode = getEditingModePresentation(plugin.settings);
			const sourceModeAction = view.addAction(
				editingMode.icon,
				editingMode.label,
				async () => {
					plugin.settings.useSourceMode =
						!plugin.settings.useSourceMode;
					await plugin.saveSettings();
				},
			);
			sourceModeAction.classList.add(
				'plugin-adaptive-workspace-control',
			);
			const sidebarChanges = getSidebarChangesPresentation(plugin.settings);
			const sidebarAction = view.addAction(
				sidebarChanges.icon,
				sidebarChanges.label,
				async () => {
					plugin.settings.disableSidebarChanges =
						!plugin.settings.disableSidebarChanges;
					await plugin.saveSettings();
				},
			);
			sidebarAction.classList.add(
				'plugin-adaptive-workspace-control',
			);

			viewActions.set(view, {
				sourceMode: sourceModeAction,
				sidebars: sidebarAction,
			});
		}
	};

	const updateAction = (
		action: HTMLElement,
		presentation: ControlPresentation,
	): void => {
		action.classList.toggle('is-active', presentation.active);
		action.setAttribute('aria-pressed', String(presentation.pressed));
		action.setAttribute('aria-label', presentation.label);
		setIcon(action, presentation.icon);
		setTooltip(action, presentation.label);
	};

	const refreshActions = (): void => {
		addActions();

		for (const [view, actions] of viewActions) {
			if (!actions.sourceMode.isConnected || !actions.sidebars.isConnected) {
				viewActions.delete(view);
				continue;
			}

			actions.sourceMode.classList.toggle(
				'plugin-adaptive-workspace-is-hidden',
				!isControlInHeader(
					plugin.settings.editingModeControlLocation,
				),
			);
			actions.sidebars.classList.toggle(
				'plugin-adaptive-workspace-is-hidden',
				!isControlInHeader(
					plugin.settings.sidebarChangesControlLocation,
				),
			);

			updateAction(
				actions.sourceMode,
				getEditingModePresentation(plugin.settings),
			);
			updateAction(
				actions.sidebars,
				getSidebarChangesPresentation(plugin.settings),
			);
		}
	};

	refreshers.set(plugin, refreshActions);
	refreshActions();
	plugin.registerEvent(
		plugin.app.workspace.on('layout-change', refreshActions),
	);
	plugin.register(() => {
		refreshers.delete(plugin);
		for (const actions of viewActions.values()) {
			actions.sourceMode.remove();
			actions.sidebars.remove();
		}
		viewActions.clear();
	});
}
