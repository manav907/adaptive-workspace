import { Plugin } from 'obsidian';
import { registerCommands } from './commands';

export default class AdaptiveWorkspacePlugin extends Plugin {
	onload(): void {
		registerCommands(this);
	}
}
