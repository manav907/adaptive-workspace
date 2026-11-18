import { Plugin } from 'obsidian';
import { registerCommands } from './commands';
import {
	AdaptiveWorkspaceSettingTab,
	normalizeSettings,
} from './settings';
import type { AdaptiveWorkspaceSettings } from './settings';
import {
	detachViews,
	refreshViews as refreshWorkspaceViews,
	registerViews,
} from './ui';

export default class AdaptiveWorkspacePlugin extends Plugin {
	settings!: AdaptiveWorkspaceSettings;

	async onload(): Promise<void> {
		await this.loadSettings();
		registerViews(this);
		registerCommands(this);
		this.addSettingTab(new AdaptiveWorkspaceSettingTab(this.app, this));
	}

	onunload(): void {
		detachViews(this);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.refreshSettingsViews();
	}

	refreshSettingsViews(): void {
		refreshWorkspaceViews(this);
	}

	private async loadSettings(): Promise<void> {
		this.settings = normalizeSettings(await this.loadData());
	}
}
