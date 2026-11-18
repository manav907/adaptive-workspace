import {
	App,
	PluginSettingTab,
	SearchComponent,
	Setting,
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

	display(): void {
		this.containerEl.empty();
		this.containerEl.createEl('p', { text: 'Hello world' });

		new Setting(this.containerEl)
			.setName('Expand workspace command')
			.setHeading();

		this.addSidebarActionSetting(
			'Left sidebar',
			'Choose what happens to the left sidebar.',
			'expandCommandLeftSidebar',
		);
		this.addSidebarActionSetting(
			'Right sidebar',
			'Choose what happens to the right sidebar.',
			'expandCommandRightSidebar',
		);
		this.addMarkdownModeSetting(
			'Markdown view',
			'Choose the mode for the active Markdown view.',
			'expandCommandMarkdownMode',
		);

		new Setting(this.containerEl)
			.setName('Collapse workspace command')
			.setHeading();

		this.addSidebarActionSetting(
			'Left sidebar',
			'Choose what happens to the left sidebar.',
			'collapseCommandLeftSidebar',
		);
		this.addSidebarActionSetting(
			'Right sidebar',
			'Choose what happens to the right sidebar.',
			'collapseCommandRightSidebar',
		);
		this.addMarkdownModeSetting(
			'Markdown view',
			'Choose the mode for the active Markdown view.',
			'collapseCommandMarkdownMode',
		);

		new Setting(this.containerEl)
			.setName('Hotkeys')
			.setHeading();

		new Setting(this.containerEl)
			.setName('Configure hotkeys')
			.setDesc('Assign shortcuts to Adaptive Workspace commands.')
			.addButton((button) =>
				button
					.setButtonText('Open hotkeys')
					.setCta()
					.onClick(() => {
						openPluginHotkeys(this.app, this.plugin.manifest.id);
					}),
			);
	}

	private addSidebarActionSetting(
		name: string,
		description: string,
		key: SidebarSettingKey,
	): void {
		new Setting(this.containerEl)
			.setName(name)
			.setDesc(description)
			.addDropdown((dropdown) =>
				dropdown
					.addOption('expand', 'Expand')
					.addOption('collapse', 'Collapse')
					.addOption('unchanged', 'No change')
					.setValue(this.plugin.settings[key])
					.onChange(async (value) => {
						if (!isSidebarAction(value)) {
							return;
						}
						this.plugin.settings[key] = value;
						await this.plugin.saveSettings();
					}),
			);
	}

	private addMarkdownModeSetting(
		name: string,
		description: string,
		key: 'expandCommandMarkdownMode' | 'collapseCommandMarkdownMode',
	): void {
		new Setting(this.containerEl)
			.setName(name)
			.setDesc(description)
			.addDropdown((dropdown) =>
				dropdown
					.addOption('edit', 'Edit')
					.addOption('reading', 'Reading')
					.addOption('unchanged', 'No change')
					.setValue(this.plugin.settings[key])
					.onChange(async (value) => {
						if (!isMarkdownModeAction(value)) {
							return;
						}
						this.plugin.settings[key] = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
