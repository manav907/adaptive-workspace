import { ItemView } from 'obsidian';
import type { App, WorkspaceLeaf } from 'obsidian';

export const HELLO_WORLD_VIEW_TYPE = 'adaptive-workspace-hello-world';

export class HelloWorldView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return HELLO_WORLD_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Hello world';
	}

	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.createEl('p', { text: 'Hello world' });
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
