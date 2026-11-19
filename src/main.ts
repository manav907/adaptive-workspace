import { Plugin } from 'obsidian';
import { registerCommands } from './commands';
import {
	AdaptiveWorkspaceSettingTab,
	normalizeSettings,
} from './settings';
import type { AdaptiveWorkspaceSettings } from './settings';
import { registerMiddleMouseWheel } from './middle-mouse-wheel';
import {
	refreshUi as refreshPluginUi,
	registerUi,
} from './ui';

export default class AdaptiveWorkspacePlugin extends Plugin {
	settings!: AdaptiveWorkspaceSettings;

	async onload(): Promise<void> {
		await this.loadSettings();
		registerUi(this);
		registerCommands(this);
		registerMiddleMouseWheel(this);
		this.addSettingTab(new AdaptiveWorkspaceSettingTab(this.app, this));
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.refreshUi();
	}

	refreshUi(): void {
		refreshPluginUi(this);
	}

	private async loadSettings(): Promise<void> {
		this.settings = normalizeSettings(await this.loadData());
	}
}
