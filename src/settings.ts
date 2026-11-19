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
	showEditingModeHeaderControl: boolean;
	showSidebarChangesHeaderControl: boolean;
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
export type MarkdownModeAction =
	| 'edit'
	| 'live-preview'
	| 'source'
	| 'reading'
	| 'unchanged';

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
	'live-preview': 'Live Preview',
	source: 'Source mode',
	reading: 'Reading',
};

export const DEFAULT_SETTINGS: AdaptiveWorkspaceSettings = {
	disableSidebarChanges: false,
	showEditingModeHeaderControl: true,
	showSidebarChangesHeaderControl: true,
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
		|| value === 'live-preview'
		|| value === 'source'
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
		showEditingModeHeaderControl: getHeaderControlVisibility(
			saved.showEditingModeHeaderControl,
			saved.editingModeControlLocation,
			saved.showSourceModeButton,
			DEFAULT_SETTINGS.showEditingModeHeaderControl,
		),
		showSidebarChangesHeaderControl: getHeaderControlVisibility(
			saved.showSidebarChangesHeaderControl,
			saved.sidebarChangesControlLocation,
			saved.showSidebarChangesButton,
			DEFAULT_SETTINGS.showSidebarChangesHeaderControl,
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

function getHeaderControlVisibility(
	value: unknown,
	legacyLocation: unknown,
	legacyVisible: unknown,
	defaultValue: boolean,
): boolean {
	if (typeof value === 'boolean') {
		return value;
	}
	if (legacyLocation === 'header' || legacyLocation === 'both') {
		return true;
	}
	if (legacyLocation === 'hidden' || legacyLocation === 'status') {
		return false;
	}
	return getBoolean(legacyVisible, defaultValue);
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
			this.plugin.refreshUi();
			return;
		}

		await super.setControlValue(key, value);
		this.plugin.refreshUi();
	}

	getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
		return [
			{
				type: 'group',
				heading: 'Status bar',
				items: [
					{
						name: 'Editing mode control',
						control: {
							type: 'toggle',
							key: 'showEditorStatus',
							defaultValue: true,
						},
					},
					{
						name: 'Sidebar changes control',
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
				heading: 'Markdown header',
				items: [
					{
						name: 'Editing mode control',
						control: {
							type: 'toggle',
							key: 'showEditingModeHeaderControl',
							defaultValue:
								DEFAULT_SETTINGS.showEditingModeHeaderControl,
						},
					},
					{
						name: 'Sidebar changes control',
						control: {
							type: 'toggle',
							key: 'showSidebarChangesHeaderControl',
							defaultValue:
								DEFAULT_SETTINGS.showSidebarChangesHeaderControl,
						},
					},
				],
			},
			{
				type: 'group',
				heading: 'Zoom-in workspace',
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
				heading: 'Zoom-out workspace',
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
						name: 'Open hotkeys',
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
			render: (setting) => {
				const binding = this.plugin.settings[key];
				setting.addButton((button) => button
					.setButtonText(formatMouseBinding(binding))
					.setTooltip('Set binding')
					.onClick(() => {
						new MouseBindingModal(this.app, (newBinding) => {
							void this.setMouseBinding(key, newBinding);
						}).open();
					}));

				if (binding) {
					setting.addExtraButton((button) => button
						.setIcon('x')
						.setTooltip('Clear binding')
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
			control: {
				type: 'dropdown',
				key,
				defaultValue: DEFAULT_SETTINGS[key],
				options: MARKDOWN_MODE_OPTIONS,
			},
		};
	}
}
