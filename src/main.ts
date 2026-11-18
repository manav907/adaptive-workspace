import { Plugin } from 'obsidian';
import { registerCommands } from './commands';
import {
	AdaptiveWorkspaceSettingTab,
	normalizeSettings,
} from './settings';
import type { AdaptiveWorkspaceSettings } from './settings';
import {
	refreshMarkdownViewActions,
	registerViewActions,
} from './ui';

export default class AdaptiveWorkspacePlugin extends Plugin {
	settings!: AdaptiveWorkspaceSettings;

	async onload(): Promise<void> {
		await this.loadSettings();
		registerViewActions(this);
		registerCommands(this);
		this.addSettingTab(new AdaptiveWorkspaceSettingTab(this.app, this));
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.refreshViewActions();
	}

	refreshViewActions(): void {
		refreshMarkdownViewActions(this);
	}

	private async loadSettings(): Promise<void> {
		this.settings = normalizeSettings(await this.loadData());
	}
}
