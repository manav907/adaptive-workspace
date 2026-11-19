import { MarkdownView } from 'obsidian';
import type AdaptiveWorkspacePlugin from '../main';
import { isControlInHeader } from '../settings';

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
			const sourceModeAction = view.addAction(
				'code-xml',
				'Use source mode for Edit',
				async () => {
					plugin.settings.useSourceMode =
						!plugin.settings.useSourceMode;
					await plugin.saveSettings();
				},
			);
			sourceModeAction.classList.add(
				'plugin-adaptive-workspace-control',
			);
			const sidebarAction = view.addAction(
				'panel-left',
				'Disable sidebar changes',
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
		active: boolean,
		label: string,
	): void => {
		action.classList.toggle('is-active', active);
		action.setAttribute('aria-pressed', String(active));
		action.setAttribute('aria-label', label);
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
				plugin.settings.useSourceMode,
				plugin.settings.useSourceMode
					? 'Use Live Preview for Edit'
					: 'Use source mode for Edit',
			);
			updateAction(
				actions.sidebars,
				plugin.settings.disableSidebarChanges,
				plugin.settings.disableSidebarChanges
					? 'Enable sidebar changes'
					: 'Disable sidebar changes',
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
