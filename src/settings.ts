import { PluginSettingTab } from 'obsidian';
import type {
	App,
	SearchComponent,
	SettingDefinition,
	SettingDefinitionItem,
} from 'obsidian';
import type AdaptiveWorkspacePlugin from './main';

export interface AdaptiveWorkspaceSettings {
	disableSidebarChanges: boolean;
	useSourceMode: boolean;
	editingModeControlLocation: ControlLocation;
	sidebarChangesControlLocation: ControlLocation;
	expandCommandLeftSidebar: SidebarAction;
	expandCommandRightSidebar: SidebarAction;
	expandCommandMarkdownMode: MarkdownModeAction;
	collapseCommandLeftSidebar: SidebarAction;
	collapseCommandRightSidebar: SidebarAction;
	collapseCommandMarkdownMode: MarkdownModeAction;
}

export type SidebarAction = 'expand' | 'collapse' | 'unchanged';
export type MarkdownModeAction = 'edit' | 'reading' | 'unchanged';
export type ControlLocation = 'hidden' | 'header' | 'status' | 'both';

function isControlLocation(value: unknown): value is ControlLocation {
	return value === 'hidden'
		|| value === 'header'
		|| value === 'status'
		|| value === 'both';
}

export function isControlInHeader(location: ControlLocation): boolean {
	return location === 'header' || location === 'both';
}

export function isControlInStatusBar(location: ControlLocation): boolean {
	return location === 'status' || location === 'both';
}

type SidebarSettingKey =
	| 'expandCommandLeftSidebar'
	| 'expandCommandRightSidebar'
	| 'collapseCommandLeftSidebar'
	| 'collapseCommandRightSidebar';

type SettingKey = keyof AdaptiveWorkspaceSettings;

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

const CONTROL_LOCATION_OPTIONS: Record<ControlLocation, string> = {
	hidden: 'Hidden',
	header: 'Markdown header',
	status: 'Status bar',
	both: 'Both',
};

export const DEFAULT_SETTINGS: AdaptiveWorkspaceSettings = {
	disableSidebarChanges: false,
	useSourceMode: false,
	editingModeControlLocation: 'header',
	sidebarChangesControlLocation: 'header',
	expandCommandLeftSidebar: 'expand',
	expandCommandRightSidebar: 'expand',
	expandCommandMarkdownMode: 'unchanged',
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

	return {
		disableSidebarChanges: getBoolean(
			saved.disableSidebarChanges,
			DEFAULT_SETTINGS.disableSidebarChanges,
		),
		useSourceMode: getUseSourceMode(saved),
		editingModeControlLocation: getControlLocation(
			saved.editingModeControlLocation,
			saved.showSourceModeButton,
			saved.showEditorStatus,
			DEFAULT_SETTINGS.editingModeControlLocation,
		),
		sidebarChangesControlLocation: getControlLocation(
			saved.sidebarChangesControlLocation,
			saved.showSidebarChangesButton,
			saved.showSidebarStatusItem,
			DEFAULT_SETTINGS.sidebarChangesControlLocation,
		),
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

function getUseSourceMode(saved: Record<string, unknown>): boolean {
	const savedModes = [
		saved.expandCommandMarkdownMode,
		saved.collapseCommandMarkdownMode,
	];
	if (savedModes.includes('source')) {
		return true;
	}
	if (savedModes.includes('live-preview')) {
		return false;
	}
	return getBoolean(saved.useSourceMode, DEFAULT_SETTINGS.useSourceMode);
}

function getBoolean(value: unknown, defaultValue: boolean): boolean {
	return typeof value === 'boolean' ? value : defaultValue;
}

function getControlLocation(
	value: unknown,
	legacyHeader: unknown,
	legacyStatus: unknown,
	defaultLocation: ControlLocation,
): ControlLocation {
	if (isControlLocation(value)) {
		return value;
	}

	const showHeader = getBoolean(
		legacyHeader,
		isControlInHeader(defaultLocation),
	);
	const showStatus = getBoolean(
		legacyStatus,
		isControlInStatusBar(defaultLocation),
	);
	if (showHeader && showStatus) {
		return 'both';
	}
	if (showHeader) {
		return 'header';
	}
	if (showStatus) {
		return 'status';
	}
	return 'hidden';
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

	async setControlValue(key: string, value: unknown): Promise<void> {
		if ((key === 'editingModeControlLocation'
			|| key === 'sidebarChangesControlLocation')
			&& isControlLocation(value)) {
			this.plugin.settings[key] = value;
			await this.plugin.saveSettings();
			return;
		}

		await super.setControlValue(key, value);
	}

	getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
		return [
			{
				type: 'group',
				heading: 'Control locations',
				items: [
					{
						name: 'Editing mode control',
						desc: 'Choose where to show the Source mode and Live Preview control.',
						control: {
							type: 'dropdown',
							key: 'editingModeControlLocation',
							defaultValue: DEFAULT_SETTINGS.editingModeControlLocation,
							options: CONTROL_LOCATION_OPTIONS,
						},
					},
					{
						name: 'Sidebar changes control',
						desc: 'Choose where to show the sidebar changes control.',
						control: {
							type: 'dropdown',
							key: 'sidebarChangesControlLocation',
							defaultValue: DEFAULT_SETTINGS.sidebarChangesControlLocation,
							options: CONTROL_LOCATION_OPTIONS,
						},
					},
				],
			},
			{
				type: 'group',
				heading: 'Zoom-in workspace command',
				items: [
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
