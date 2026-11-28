import { MarkdownView, setIcon, setTooltip } from 'obsidian';
import type AdaptiveWorkspacePlugin from '../main';
import {
	getSidebarChangesPresentation,
	HIDDEN_CONTROL_CLASS,
} from './control-presentation';
import type { ControlPresentation } from './control-presentation';

type MarkdownDisplayMode = 'source' | 'live' | 'read';

interface MarkdownModeControl {
	element: HTMLElement;
	refresh(): void;
}

interface ViewControls {
	markdownModes: MarkdownModeControl;
	sidebarChanges: HTMLElement;
}

const MARKDOWN_MODES = [
	{
		mode: 'source',
		icon: 'file-code-2',
		label: 'Source mode',
	},
	{
		mode: 'live',
		icon: 'file-pen-line',
		label: 'Live Preview',
	},
	{
		mode: 'read',
		icon: 'book-open',
		label: 'Reading view',
	},
] as const satisfies ReadonlyArray<{
	mode: MarkdownDisplayMode;
	icon: string;
	label: string;
}>;

const refreshers = new WeakMap<AdaptiveWorkspacePlugin, () => void>();
const HIDE_NATIVE_VIEW_SWITCHER_CLASS =
	'plugin-adaptive-workspace-hide-native-view-switcher';

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

function getMarkdownMode(view: MarkdownView): MarkdownDisplayMode {
	const state = view.getState();

	if (state.mode === 'preview') {
		return 'read';
	}

	return state.source === true ? 'source' : 'live';
}

async function setMarkdownMode(
	view: MarkdownView,
	mode: MarkdownDisplayMode,
): Promise<void> {
	const state = view.getState();
	const nextState = mode === 'read'
		? { ...state, mode: 'preview' }
		: {
			...state,
			mode: 'source',
			source: mode === 'source',
		};

	await view.setState(nextState, { history: false });
}

function addMarkdownModeControl(view: MarkdownView): MarkdownModeControl {
	const group = view.containerEl.ownerDocument.createElement('div');
	group.classList.add('plugin-adaptive-workspace-mode-group');
	group.setAttribute('role', 'toolbar');
	group.setAttribute('aria-label', 'Markdown view mode');

	const buttons = MARKDOWN_MODES.map(({ mode, icon, label }) => {
		const button = view.addAction(icon, label, async () => {
			if (getMarkdownMode(view) === mode) {
				return;
			}

			await setMarkdownMode(view, mode);
			refresh();
		});
		button.classList.add('plugin-adaptive-workspace-control');
		button.setAttribute('role', 'button');
		setTooltip(button, label);

		return { button, mode };
	});

	buttons[0]?.button.before(group);
	for (const { button } of buttons) {
		group.append(button);
	}

	function refresh(): void {
		const currentMode = getMarkdownMode(view);

		for (const { button, mode } of buttons) {
			const selected = mode === currentMode;
			button.classList.toggle('is-active', selected);
			button.setAttribute('aria-pressed', String(selected));
		}
	}

	refresh();

	return {
		element: group,
		refresh,
	};
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
			const markdownModes = addMarkdownModeControl(view);

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
				markdownModes,
				sidebarChanges,
			});
		}
	};

	const refreshControls = (): void => {
		for (const [view, controls] of viewControls) {
			if (!controls.markdownModes.element.isConnected
				|| !controls.sidebarChanges.isConnected) {
				view.containerEl.classList.remove(
					HIDE_NATIVE_VIEW_SWITCHER_CLASS,
				);
				controls.markdownModes.element.remove();
				controls.sidebarChanges.remove();
				viewControls.delete(view);
			}
		}

		addControls();

		for (const [view, controls] of viewControls) {
			controls.markdownModes.element.hidden = false;
			controls.markdownModes.element.classList.toggle(
				HIDDEN_CONTROL_CLASS,
				!plugin.settings.showEditingModeHeaderControl,
			);
			controls.sidebarChanges.hidden = false;
			controls.sidebarChanges.classList.toggle(
				HIDDEN_CONTROL_CLASS,
				!plugin.settings.showSidebarChangesHeaderControl,
			);
			view.containerEl.classList.toggle(
				HIDE_NATIVE_VIEW_SWITCHER_CLASS,
				plugin.settings.showEditingModeHeaderControl
					&& plugin.settings.hideNativeMarkdownViewSwitcher,
			);

			controls.markdownModes.refresh();
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
		for (const [view, controls] of viewControls) {
			view.containerEl.classList.remove(
				HIDE_NATIVE_VIEW_SWITCHER_CLASS,
			);
			controls.markdownModes.element.remove();
			controls.sidebarChanges.remove();
		}
		viewControls.clear();
	});
}
