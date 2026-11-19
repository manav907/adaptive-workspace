import { Plugin } from 'obsidian';
import { registerCommands } from './commands';
import {
	AdaptiveWorkspaceSettingTab,
	normalizeSettings,
} from './settings';
import type { AdaptiveWorkspaceSettings } from './settings';
import { registerMouseBindings } from './mouse-bindings';
import {
	refreshSidebarStatusItem,
	registerUi,
} from './ui';

export default class AdaptiveWorkspacePlugin extends Plugin {
	settings!: AdaptiveWorkspaceSettings;

	async onload(): Promise<void> {
		await this.loadSettings();
		registerUi(this);
		registerCommands(this);
		registerMouseBindings(this);
		this.addSettingTab(new AdaptiveWorkspaceSettingTab(this.app, this));
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.refreshStatusBarItem();
	}

	refreshStatusBarItem(): void {
		refreshSidebarStatusItem(this);
	}

	private async loadSettings(): Promise<void> {
		this.settings = normalizeSettings(await this.loadData());
	}
}
