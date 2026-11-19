import { Component } from 'obsidian';
import type AdaptiveWorkspacePlugin from './main';
import { collapseWorkspace, expandWorkspace } from './commands/workspace';

const MIDDLE_BUTTON = 1;
const MIDDLE_BUTTON_MASK = 4;
const FOLLOW_UP_SUPPRESSION_MS = 250;

function consumeEvent(event: Event): void {
	event.preventDefault();
	event.stopImmediatePropagation();
}

function registerWindowGesture(
	component: Component,
	targetWindow: Window,
	plugin: AdaptiveWorkspacePlugin,
): void {
	let middleButtonPressed = false;
	let suppressClickUntil = 0;
	let commandQueue = Promise.resolve();

	component.registerDomEvent(targetWindow, 'mousedown', (event) => {
		if (!plugin.settings.enableMiddleMouseWheel
			|| event.button !== MIDDLE_BUTTON) {
			return;
		}

		middleButtonPressed = true;
		consumeEvent(event);
	}, { capture: true });

	component.registerDomEvent(targetWindow, 'wheel', (event) => {
		if (!plugin.settings.enableMiddleMouseWheel
			|| event.deltaY === 0
			|| (!middleButtonPressed
				&& (event.buttons & MIDDLE_BUTTON_MASK) === 0)) {
			return;
		}

		consumeEvent(event);
		middleButtonPressed = true;

		const wheelUp = event.deltaY < 0;
		const zoomIn = plugin.settings.invertMiddleMouseWheel
			? !wheelUp
			: wheelUp;
		const command = zoomIn
			? () => expandWorkspace(plugin.app, plugin.settings)
			: () => collapseWorkspace(plugin.app, plugin.settings);

		commandQueue = commandQueue
			.then(command)
			.catch((error: unknown) => {
				console.error(
					'Adaptive Workspace middle-mouse gesture failed.',
					error,
				);
			});
	}, { capture: true, passive: false });

	component.registerDomEvent(targetWindow, 'mouseup', (event) => {
		if (event.button !== MIDDLE_BUTTON || !middleButtonPressed) {
			return;
		}

		consumeEvent(event);
		middleButtonPressed = false;
		suppressClickUntil = Date.now() + FOLLOW_UP_SUPPRESSION_MS;
	}, { capture: true });

	component.registerDomEvent(targetWindow, 'auxclick', (event) => {
		if (event.button !== MIDDLE_BUTTON
			|| Date.now() > suppressClickUntil) {
			suppressClickUntil = 0;
			return;
		}

		consumeEvent(event);
		suppressClickUntil = 0;
	}, { capture: true });

	const resetInputState = (): void => {
		middleButtonPressed = false;
		suppressClickUntil = 0;
	};
	component.registerDomEvent(targetWindow, 'blur', resetInputState);
	component.registerDomEvent(targetWindow, 'pointercancel', resetInputState);
}

export function registerMiddleMouseWheel(
	plugin: AdaptiveWorkspacePlugin,
): void {
	const windowListeners = new Map<Window, Component>();

	const addWindow = (targetWindow: Window): void => {
		if (windowListeners.has(targetWindow)) {
			return;
		}

		const component = plugin.addChild(new Component());
		registerWindowGesture(component, targetWindow, plugin);
		windowListeners.set(targetWindow, component);
	};

	const removeWindow = (targetWindow: Window): void => {
		const component = windowListeners.get(targetWindow);
		if (!component) {
			return;
		}

		plugin.removeChild(component);
		windowListeners.delete(targetWindow);
	};

	addWindow(window);
	plugin.app.workspace.iterateAllLeaves((leaf) => {
		addWindow(leaf.view.containerEl.win);
	});
	plugin.registerEvent(
		plugin.app.workspace.on('window-open', (_workspaceWindow, targetWindow) => {
			addWindow(targetWindow);
		}),
	);
	plugin.registerEvent(
		plugin.app.workspace.on('window-close', (_workspaceWindow, targetWindow) => {
			removeWindow(targetWindow);
		}),
	);
	plugin.register(() => windowListeners.clear());
}
