import { ItemView, Setting } from 'obsidian';
import type { App, WorkspaceLeaf } from 'obsidian';
import {
	BEHAVIOR_TOGGLE_SETTINGS,
} from '../settings';
import type AdaptiveWorkspacePlugin from '../main';

export const HELLO_WORLD_VIEW_TYPE = 'adaptive-workspace-hello-world';

export class HelloWorldView extends ItemView {
	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: AdaptiveWorkspacePlugin,
	) {
		super(leaf);
	}

	getViewType(): string {
		return HELLO_WORLD_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Adaptive Workspace';
	}

	async onOpen(): Promise<void> {
		this.renderSettings();
	}

	renderSettings(): void {
		this.contentEl.empty();
		this.contentEl.createEl('h2', { text: 'Adaptive Workspace' });

		for (const { key, name, desc } of BEHAVIOR_TOGGLE_SETTINGS) {
			new Setting(this.contentEl)
				.setName(name)
				.setDesc(desc)
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings[key])
						.onChange(async (value) => {
							this.plugin.settings[key] = value;
							await this.plugin.saveSettings();
						});
				});
		}
	}
}

export async function openHelloWorldView(app: App): Promise<void> {
	const existingLeaf = app.workspace.getLeavesOfType(HELLO_WORLD_VIEW_TYPE)[0];
	const leaf = existingLeaf ?? app.workspace.getLeaf('tab');

	if (!existingLeaf) {
		await leaf.setViewState({
			type: HELLO_WORLD_VIEW_TYPE,
			active: true,
		});
	}

	await app.workspace.revealLeaf(leaf);
}
