import type AdaptiveWorkspacePlugin from '../main';
import {
	HELLO_WORLD_VIEW_TYPE,
	HelloWorldView,
	openHelloWorldView,
} from './hello-world-view';

export function registerViews(plugin: AdaptiveWorkspacePlugin): void {
	plugin.registerView(
		HELLO_WORLD_VIEW_TYPE,
		(leaf) => new HelloWorldView(leaf, plugin),
	);

	plugin.addRibbonIcon('message-square', 'Open workspace controls', async () => {
		await openHelloWorldView(plugin.app);
	});
}

export function refreshViews(plugin: AdaptiveWorkspacePlugin): void {
	for (const leaf of plugin.app.workspace.getLeavesOfType(
		HELLO_WORLD_VIEW_TYPE,
	)) {
		if (leaf.view instanceof HelloWorldView) {
			leaf.view.renderSettings();
		}
	}
}

export function detachViews(plugin: AdaptiveWorkspacePlugin): void {
	plugin.app.workspace.detachLeavesOfType(HELLO_WORLD_VIEW_TYPE);
}
