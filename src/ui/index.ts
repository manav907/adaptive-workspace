import type AdaptiveWorkspacePlugin from '../main';
import {
	HELLO_WORLD_VIEW_TYPE,
	HelloWorldView,
	openHelloWorldView,
} from './hello-world-view';

export function registerViews(plugin: AdaptiveWorkspacePlugin): void {
	plugin.registerView(
		HELLO_WORLD_VIEW_TYPE,
		(leaf) => new HelloWorldView(leaf),
	);

	plugin.addRibbonIcon('message-square', 'Open Hello world', async () => {
		await openHelloWorldView(plugin.app);
	});
}

export function detachViews(plugin: AdaptiveWorkspacePlugin): void {
	plugin.app.workspace.detachLeavesOfType(HELLO_WORLD_VIEW_TYPE);
}
