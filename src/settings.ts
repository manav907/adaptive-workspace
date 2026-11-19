import { PluginSettingTab } from 'obsidian';
import type {
	App,
	SettingDefinition,
	SettingDefinitionItem,
} from 'obsidian';
import type AdaptiveWorkspacePlugin from './main';

export interface AdaptiveWorkspaceSettings {
	disableSidebarChanges: boolean;
	enableMiddleMouseWheel: boolean;
	invertMiddleMouseWheel: boolean;
	showEditingModeHeaderControl: boolean;
	showSidebarChangesHeaderControl: boolean;
	expandCommandLeftSidebar: SidebarAction;
	expandCommandRightSidebar: SidebarAction;
	expandCommandMarkdownMode: MarkdownModeAction;
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

type SettingKey = keyof AdaptiveWorkspaceSettings;

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
	enableMiddleMouseWheel: true,
	invertMiddleMouseWheel: false,
	showEditingModeHeaderControl: true,
	showSidebarChangesHeaderControl: true,
	expandCommandLeftSidebar: 'expand',
	expandCommandRightSidebar: 'expand',
	expandCommandMarkdownMode: 'reading',
	collapseCommandLeftSidebar: 'collapse',
	collapseCommandRightSidebar: 'collapse',
	collapseCommandMarkdownMode: 'edit',
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

	return {
		disableSidebarChanges: getBoolean(
			saved.disableSidebarChanges,
			DEFAULT_SETTINGS.disableSidebarChanges,
		),
		enableMiddleMouseWheel: getBoolean(
			saved.enableMiddleMouseWheel,
			DEFAULT_SETTINGS.enableMiddleMouseWheel,
		),
		invertMiddleMouseWheel: getBoolean(
			saved.invertMiddleMouseWheel,
			DEFAULT_SETTINGS.invertMiddleMouseWheel,
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

export class AdaptiveWorkspaceSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: AdaptiveWorkspacePlugin,
	) {
		super(app, plugin);
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		await super.setControlValue(key, value);
		this.refreshDomState();
		this.plugin.refreshUi();
	}

	getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
		return [
			{
				type: 'group',
				heading: 'Zoom-in workspace',
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
				heading: 'Zoom-out workspace',
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
				heading: 'Input',
				items: [
					{
						name: 'Hotkeys',
						desc: 'Assign shortcuts under Settings → Hotkeys.',
					},
					{
						name: 'Enable middle mouse + wheel',
						control: {
							type: 'toggle',
							key: 'enableMiddleMouseWheel',
							defaultValue:
								DEFAULT_SETTINGS.enableMiddleMouseWheel,
						},
					},
					{
						name: 'Invert wheel direction',
						control: {
							type: 'toggle',
							key: 'invertMiddleMouseWheel',
							defaultValue:
								DEFAULT_SETTINGS.invertMiddleMouseWheel,
							disabled: () =>
								!this.plugin.settings.enableMiddleMouseWheel,
						},
					},
				],
			},
			{
				type: 'group',
				heading: 'Interface controls',
				items: [
					{
						name: 'Editing mode in Markdown header',
						control: {
							type: 'toggle',
							key: 'showEditingModeHeaderControl',
							defaultValue:
								DEFAULT_SETTINGS.showEditingModeHeaderControl,
						},
					},
					{
						name: 'Sidebar changes in Markdown header',
						control: {
							type: 'toggle',
							key: 'showSidebarChangesHeaderControl',
							defaultValue:
								DEFAULT_SETTINGS.showSidebarChangesHeaderControl,
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
