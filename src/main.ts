import { Plugin } from 'obsidian';
import { registerCommands } from './commands';
import {
	AdaptiveWorkspaceSettingTab,
	normalizeSettings,
} from './settings';
import type { AdaptiveWorkspaceSettings } from './settings';

export default class AdaptiveWorkspacePlugin extends Plugin {
	settings!: AdaptiveWorkspaceSettings;

	async onload(): Promise<void> {
		await this.loadSettings();
		registerCommands(this);
		this.addSettingTab(new AdaptiveWorkspaceSettingTab(this.app, this));
	}

	private async loadSettings(): Promise<void> {
		this.settings = normalizeSettings(await this.loadData());
	}
}
