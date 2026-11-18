import {
	App,
	Plugin,
	PluginSettingTab,
	SearchComponent,
	Setting,
} from 'obsidian';

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
		private readonly plugin: Plugin,
	) {
		super(app, plugin);
	}

	display(): void {
		this.containerEl.empty();
		this.containerEl.createEl('p', { text: 'Hello world' });

		new Setting(this.containerEl)
			.setName('Hotkeys')
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
}
