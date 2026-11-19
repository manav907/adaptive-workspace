import { PluginSettingTab } from 'obsidian';
import type {
	App,
	SearchComponent,
	SettingDefinition,
	SettingDefinitionItem,
} from 'obsidian';
import type AdaptiveWorkspacePlugin from './main';
import {
	formatMouseBinding,
	mouseBindingsEqual,
	normalizeMouseBinding,
} from './mouse-bindings';
import type {
	MouseBinding,
	MouseBindingSettingKey,
} from './mouse-bindings';
import { MouseBindingModal } from './ui/mouse-binding-modal';
import {
	isEditorStatusEnabled,
	setEditorStatusEnabled,
} from './ui/status-bar';

export interface AdaptiveWorkspaceSettings {
	disableSidebarChanges: boolean;
	showSidebarStatusItem: boolean;
	expandCommandMouseBinding: MouseBinding | null;
	expandCommandLeftSidebar: SidebarAction;
	expandCommandRightSidebar: SidebarAction;
	expandCommandMarkdownMode: MarkdownModeAction;
	collapseCommandMouseBinding: MouseBinding | null;
	collapseCommandLeftSidebar: SidebarAction;
	collapseCommandRightSidebar: SidebarAction;
	collapseCommandMarkdownMode: MarkdownModeAction;
}

export type SidebarAction = 'expand' | 'collapse' | 'unchanged';
export type MarkdownModeAction = 'edit' | 'reading' | 'unchanged';

type SidebarSettingKey =
	| 'expandCommandLeftSidebar'
	| 'expandCommandRightSidebar'
	| 'collapseCommandLeftSidebar'
	| 'collapseCommandRightSidebar';

type SettingKey = keyof AdaptiveWorkspaceSettings | 'showEditorStatus';

const SIDEBAR_OPTIONS: Record<SidebarAction, string> = {
	expand: 'Expand',
	collapse: 'Collapse',
	unchanged: 'No change',
};

const MARKDOWN_MODE_OPTIONS: Record<MarkdownModeAction, string> = {
	unchanged: 'No change',
	edit: 'Edit',
	reading: 'Reading',
};

export const DEFAULT_SETTINGS: AdaptiveWorkspaceSettings = {
	disableSidebarChanges: false,
	showSidebarStatusItem: true,
	expandCommandMouseBinding: null,
	expandCommandLeftSidebar: 'expand',
	expandCommandRightSidebar: 'expand',
	expandCommandMarkdownMode: 'unchanged',
	collapseCommandMouseBinding: null,
	collapseCommandLeftSidebar: 'collapse',
	collapseCommandRightSidebar: 'collapse',
	collapseCommandMarkdownMode: 'unchanged',
};

function isSidebarAction(value: unknown): value is SidebarAction {
	return value === 'expand' || value === 'collapse' || value === 'unchanged';
}

function isMarkdownModeAction(value: unknown): value is MarkdownModeAction {
	return value === 'edit'
		|| value === 'reading'
		|| value === 'unchanged';
}

export function normalizeSettings(data: unknown): AdaptiveWorkspaceSettings {
	const saved = data && typeof data === 'object'
		? data as Record<string, unknown>
		: {};
	const expandCommandMouseBinding = normalizeMouseBinding(
		saved.expandCommandMouseBinding,
	);
	let collapseCommandMouseBinding = normalizeMouseBinding(
		saved.collapseCommandMouseBinding,
	);
	if (mouseBindingsEqual(
		expandCommandMouseBinding,
		collapseCommandMouseBinding,
	)) {
		collapseCommandMouseBinding = null;
	}

	return {
		disableSidebarChanges: getBoolean(
			saved.disableSidebarChanges,
			DEFAULT_SETTINGS.disableSidebarChanges,
		),
		showSidebarStatusItem: getBoolean(
			saved.showSidebarStatusItem,
			DEFAULT_SETTINGS.showSidebarStatusItem,
		),
		expandCommandMouseBinding,
		expandCommandLeftSidebar: getSidebarAction(
			saved.expandCommandLeftSidebar,
			saved.expandLeftSidebar,
			DEFAULT_SETTINGS.expandCommandLeftSidebar,
		),
		expandCommandRightSidebar: getSidebarAction(
			saved.expandCommandRightSidebar,
			saved.expandRightSidebar,
			DEFAULT_SETTINGS.expandCommandRightSidebar,
		),
		expandCommandMarkdownMode: getMarkdownModeAction(
			saved.expandCommandMarkdownMode,
			DEFAULT_SETTINGS.expandCommandMarkdownMode,
		),
		collapseCommandMouseBinding,
		collapseCommandLeftSidebar: getSidebarAction(
			saved.collapseCommandLeftSidebar,
			saved.collapseLeftSidebar,
			DEFAULT_SETTINGS.collapseCommandLeftSidebar,
		),
		collapseCommandRightSidebar: getSidebarAction(
			saved.collapseCommandRightSidebar,
			saved.collapseRightSidebar,
			DEFAULT_SETTINGS.collapseCommandRightSidebar,
		),
		collapseCommandMarkdownMode: getMarkdownModeAction(
			saved.collapseCommandMarkdownMode,
			DEFAULT_SETTINGS.collapseCommandMarkdownMode,
		),
	};
}

function getBoolean(value: unknown, defaultValue: boolean): boolean {
	return typeof value === 'boolean' ? value : defaultValue;
}

function getSidebarAction(
	value: unknown,
	legacyEnabled: unknown,
	defaultAction: SidebarAction,
): SidebarAction {
	if (isSidebarAction(value)) {
		return value;
	}
	if (typeof legacyEnabled === 'boolean') {
		return legacyEnabled ? defaultAction : 'unchanged';
	}
	return defaultAction;
}

function getMarkdownModeAction(
	value: unknown,
	defaultAction: MarkdownModeAction,
): MarkdownModeAction {
	if (isMarkdownModeAction(value)) {
		return value;
	}
	if (value === 'live-preview' || value === 'source') {
		return 'edit';
	}
	return defaultAction;
}

interface InternalSettingsManager {
	activeTab?: {
		searchComponent?: SearchComponent;
	};
	open(): void;
	openTabById(tabId: string): void;
}

function openPluginHotkeys(app: App, pluginId: string): void {
	const settings = (
		app as App & { setting?: InternalSettingsManager }
	).setting;

	settings?.open();
	settings?.openTabById('hotkeys');
	settings?.activeTab?.searchComponent
		?.setValue(pluginId)
		.onChanged();
}

export class AdaptiveWorkspaceSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: AdaptiveWorkspacePlugin,
	) {
		super(app, plugin);
	}

	getControlValue(key: string): unknown {
		if (key === 'showEditorStatus') {
			return isEditorStatusEnabled(this.app);
		}
		return super.getControlValue(key);
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		if (key === 'showEditorStatus') {
			if (typeof value === 'boolean') {
				await setEditorStatusEnabled(this.app, value);
			}
			return;
		}

		await super.setControlValue(key, value);
		if (key === 'showSidebarStatusItem') {
			this.plugin.refreshStatusBarItem();
		}
	}

	getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
		return [
			{
				type: 'group',
				heading: 'Status bar',
				items: [
					{
						name: 'Show editing mode control',
						desc: "Show Obsidian's editing-mode control in the status bar.",
						control: {
							type: 'toggle',
							key: 'showEditorStatus',
							defaultValue: true,
						},
					},
					{
						name: 'Show sidebar changes control',
						desc: 'Show the sidebar-change control in the status bar.',
						control: {
							type: 'toggle',
							key: 'showSidebarStatusItem',
							defaultValue: DEFAULT_SETTINGS.showSidebarStatusItem,
						},
					},
				],
			},
			{
				type: 'group',
				heading: 'Zoom-in workspace command',
				items: [
					this.createMouseBindingSetting(
						'expandCommandMouseBinding',
					),
					this.createSidebarSetting(
						'Left sidebar',
						'expandCommandLeftSidebar',
					),
					this.createSidebarSetting(
						'Right sidebar',
						'expandCommandRightSidebar',
					),
					this.createMarkdownModeSetting('expandCommandMarkdownMode'),
				],
			},
			{
				type: 'group',
				heading: 'Zoom-out workspace command',
				items: [
					this.createMouseBindingSetting(
						'collapseCommandMouseBinding',
					),
					this.createSidebarSetting(
						'Left sidebar',
						'collapseCommandLeftSidebar',
					),
					this.createSidebarSetting(
						'Right sidebar',
						'collapseCommandRightSidebar',
					),
					this.createMarkdownModeSetting('collapseCommandMarkdownMode'),
				],
			},
			{
				type: 'group',
				heading: 'Hotkeys',
				items: [
					{
						name: 'Configure hotkeys',
						desc: 'Assign shortcuts to Adaptive Workspace commands.',
						action: () => {
							openPluginHotkeys(this.app, this.plugin.manifest.id);
						},
					},
				],
			},
		];
	}

	private createMouseBindingSetting(
		key: MouseBindingSettingKey,
	): SettingDefinition<SettingKey> {
		return {
			name: 'Mouse binding',
			desc: 'Assign a wheel direction or mouse button with optional keyboard and held-mouse-button modifiers.',
			render: (setting) => {
				const binding = this.plugin.settings[key];
				setting.addButton((button) => button
					.setButtonText(formatMouseBinding(binding))
					.setTooltip('Record mouse binding')
					.onClick(() => {
						new MouseBindingModal(this.app, (newBinding) => {
							void this.setMouseBinding(key, newBinding);
						}).open();
					}));

				if (binding) {
					setting.addExtraButton((button) => button
						.setIcon('x')
						.setTooltip('Clear mouse binding')
						.onClick(() => {
							void this.setMouseBinding(key, null);
						}));
				}
			},
		};
	}

	private async setMouseBinding(
		key: MouseBindingSettingKey,
		binding: MouseBinding | null,
	): Promise<void> {
		const otherKey: MouseBindingSettingKey =
			key === 'expandCommandMouseBinding'
				? 'collapseCommandMouseBinding'
				: 'expandCommandMouseBinding';

		if (mouseBindingsEqual(binding, this.plugin.settings[otherKey])) {
			this.plugin.settings[otherKey] = null;
		}
		this.plugin.settings[key] = binding;
		await this.plugin.saveSettings();
		this.update();
	}

	private createSidebarSetting(
		name: string,
		key: SidebarSettingKey,
	): SettingDefinition<SettingKey> {
		return {
			name,
			desc: `Choose what happens to the ${name.toLowerCase()}.`,
			control: {
				type: 'dropdown',
				key,
				defaultValue: DEFAULT_SETTINGS[key],
				options: SIDEBAR_OPTIONS,
			},
		};
	}

	private createMarkdownModeSetting(
		key: 'expandCommandMarkdownMode' | 'collapseCommandMarkdownMode',
	): SettingDefinition<SettingKey> {
		return {
			name: 'Markdown view',
			desc: 'Choose the mode for the active Markdown view.',
			control: {
				type: 'dropdown',
				key,
				defaultValue: DEFAULT_SETTINGS[key],
				options: MARKDOWN_MODE_OPTIONS,
			},
		};
	}
}
