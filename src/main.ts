import { Plugin } from 'obsidian';
import { registerCommands } from './commands';
import {
	AdaptiveWorkspaceSettingTab,
	normalizeSettings,
} from './settings';
import type { AdaptiveWorkspaceSettings } from './settings';
import {
	refreshControls,
	registerControls,
} from './ui';

export default class AdaptiveWorkspacePlugin extends Plugin {
	settings!: AdaptiveWorkspaceSettings;

	async onload(): Promise<void> {
		await this.loadSettings();
		registerControls(this);
		registerCommands(this);
		this.addSettingTab(new AdaptiveWorkspaceSettingTab(this.app, this));
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.refreshControls();
	}

	refreshControls(): void {
		refreshControls(this);
	}

	private async loadSettings(): Promise<void> {
		this.settings = normalizeSettings(await this.loadData());
	}
}
