import { PluginSettingTab } from 'obsidian';
import type {
	App,
	SearchComponent,
	SettingDefinition,
	SettingDefinitionItem,
} from 'obsidian';
import type AdaptiveWorkspacePlugin from './main';

export interface AdaptiveWorkspaceSettings {
	expandCommandLeftSidebar: SidebarAction;
	expandCommandRightSidebar: SidebarAction;
	expandCommandMarkdownMode: MarkdownModeAction;
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

type SettingKey = keyof AdaptiveWorkspaceSettings;

const SIDEBAR_OPTIONS: Record<SidebarAction, string> = {
	expand: 'Expand',
	collapse: 'Collapse',
	unchanged: 'No change',
};

const MARKDOWN_MODE_OPTIONS: Record<MarkdownModeAction, string> = {
	edit: 'Edit',
	reading: 'Reading',
	unchanged: 'No change',
};

export const DEFAULT_SETTINGS: AdaptiveWorkspaceSettings = {
	expandCommandLeftSidebar: 'expand',
	expandCommandRightSidebar: 'expand',
	expandCommandMarkdownMode: 'edit',
	collapseCommandLeftSidebar: 'collapse',
	collapseCommandRightSidebar: 'collapse',
	collapseCommandMarkdownMode: 'reading',
};

function isSidebarAction(value: unknown): value is SidebarAction {
	return value === 'expand' || value === 'collapse' || value === 'unchanged';
}

function isMarkdownModeAction(value: unknown): value is MarkdownModeAction {
	return value === 'edit' || value === 'reading' || value === 'unchanged';
}

export function normalizeSettings(data: unknown): AdaptiveWorkspaceSettings {
	const saved = data && typeof data === 'object'
		? data as Record<string, unknown>
		: {};

	return {
		expandCommandLeftSidebar: getSidebarAction(
			saved.expandCommandLeftSidebar,
			saved.expandLeftSidebar,
			'expand',
		),
		expandCommandRightSidebar: getSidebarAction(
			saved.expandCommandRightSidebar,
			saved.expandRightSidebar,
			'expand',
		),
		expandCommandMarkdownMode: getMarkdownModeAction(
			saved.expandCommandMarkdownMode,
			'edit',
		),
		collapseCommandLeftSidebar: getSidebarAction(
			saved.collapseCommandLeftSidebar,
			saved.collapseLeftSidebar,
			'collapse',
		),
		collapseCommandRightSidebar: getSidebarAction(
			saved.collapseCommandRightSidebar,
			saved.collapseRightSidebar,
			'collapse',
		),
		collapseCommandMarkdownMode: getMarkdownModeAction(
			saved.collapseCommandMarkdownMode,
			'reading',
		),
	};
}

function getSidebarAction(
	value: unknown,
	legacyEnabled: unknown,
	defaultAction: Exclude<SidebarAction, 'unchanged'>,
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
	defaultAction: Exclude<MarkdownModeAction, 'unchanged'>,
): MarkdownModeAction {
	return isMarkdownModeAction(value) ? value : defaultAction;
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

	getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
		return [
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
