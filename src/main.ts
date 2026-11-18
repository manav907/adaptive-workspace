import { Plugin } from 'obsidian';
import { registerCommands } from './commands';
import { AdaptiveWorkspaceSettingTab } from './settings';

export default class AdaptiveWorkspacePlugin extends Plugin {
	onload(): void {
		registerCommands(this);
		this.addSettingTab(new AdaptiveWorkspaceSettingTab(this.app, this));
	}
}
