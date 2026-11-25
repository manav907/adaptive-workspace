import { Component } from 'obsidian';
import type AdaptiveWorkspacePlugin from './main';
import { collapseWorkspace, expandWorkspace } from './commands/workspace';
import { getWheelDirection } from './wheel-binding';
import type {
	WheelBinding,
	WheelMouseButton,
} from './wheel-binding';
import { isWheelBindingCaptureActive } from './wheel-binding-capture';

interface ModifierEvent {
	ctrlKey: boolean;
	altKey: boolean;
	shiftKey: boolean;
	metaKey: boolean;
}

type WorkspaceCommand = () => Promise<void>;

const FOLLOW_UP_SUPPRESSION_MS = 250;
const SUPPORTED_BUTTONS = new Set<number>([1, 3, 4]);
const BUTTON_MASKS = new Map<WheelMouseButton, number>([
	[1, 4],
	[3, 8],
	[4, 16],
]);

function modifiersMatch(
	binding: WheelBinding,
	event: ModifierEvent,
): boolean {
	return binding.ctrl === event.ctrlKey
		&& binding.alt === event.altKey
		&& binding.shift === event.shiftKey
		&& binding.meta === event.metaKey;
}

function consumeEvent(event: Event): void {
	event.preventDefault();
	event.stopImmediatePropagation();
}

function getBindings(plugin: AdaptiveWorkspacePlugin): WheelBinding[] {
	return [
		plugin.settings.zoomInWheelBinding,
		plugin.settings.zoomOutWheelBinding,
	].filter((binding): binding is WheelBinding => binding !== null);
}

function getReservedButtons(
	plugin: AdaptiveWorkspacePlugin,
): Set<WheelMouseButton> {
	return new Set(getBindings(plugin)
		.map((binding) => binding.button)
		.filter((button): button is WheelMouseButton => button !== null));
}

function hasSupportedButton(buttonsMask: number): boolean {
	for (const mask of BUTTON_MASKS.values()) {
		if ((buttonsMask & mask) !== 0) {
			return true;
		}
	}
	return false;
}

function bindingMatchesEvent(
	binding: WheelBinding,
	event: WheelEvent,
	pressedButtons: ReadonlySet<number>,
): boolean {
	if (binding.direction !== getWheelDirection(event)) {
		return false;
	}

	if (binding.button !== null) {
		return !event.ctrlKey
			&& !event.altKey
			&& !event.shiftKey
			&& !event.metaKey
			&& pressedButtons.has(binding.button);
	}

	return !hasSupportedButton(event.buttons)
		&& ![...pressedButtons].some((button) => SUPPORTED_BUTTONS.has(button))
		&& modifiersMatch(binding, event);
}

function resolveCommand(
	plugin: AdaptiveWorkspacePlugin,
	event: WheelEvent,
	pressedButtons: ReadonlySet<number>,
): WorkspaceCommand | null {
	if (plugin.settings.zoomInWheelBinding
		&& bindingMatchesEvent(
			plugin.settings.zoomInWheelBinding,
			event,
			pressedButtons,
		)) {
		return () => expandWorkspace(plugin.app, plugin.settings);
	}
	if (plugin.settings.zoomOutWheelBinding
		&& bindingMatchesEvent(
			plugin.settings.zoomOutWheelBinding,
			event,
			pressedButtons,
		)) {
		return () => collapseWorkspace(plugin.app, plugin.settings);
	}
	return null;
}

function registerWindowWheelBindings(
	component: Component,
	targetWindow: Window,
	plugin: AdaptiveWorkspacePlugin,
): void {
	const targetDocument = targetWindow.document;
	const pressedButtons = new Set<number>();
	const suppressClickUntil = new Map<number, number>();
	let commandQueue = Promise.resolve();

	const reserveButton = (event: MouseEvent): void => {
		if (isWheelBindingCaptureActive(targetWindow)
			|| !getReservedButtons(plugin).has(event.button as WheelMouseButton)) {
			return;
		}

		pressedButtons.add(event.button);
		consumeEvent(event);
	};

	const releaseButton = (event: MouseEvent): void => {
		if (isWheelBindingCaptureActive(targetWindow)) {
			return;
		}

		const isReserved = getReservedButtons(plugin).has(
			event.button as WheelMouseButton,
		);
		if (!isReserved && !pressedButtons.has(event.button)) {
			return;
		}

		consumeEvent(event);
		pressedButtons.delete(event.button);
		suppressClickUntil.set(
			event.button,
			Date.now() + FOLLOW_UP_SUPPRESSION_MS,
		);
	};

	component.registerDomEvent(
		targetDocument,
		'pointerdown',
		reserveButton,
		{ capture: true },
	);
	component.registerDomEvent(
		targetDocument,
		'mousedown',
		reserveButton,
		{ capture: true },
	);

	component.registerDomEvent(targetDocument, 'wheel', (event) => {
		if (isWheelBindingCaptureActive(targetWindow) || event.deltaY === 0) {
			return;
		}

		const reservedButtons = getReservedButtons(plugin);
		for (const [button, mask] of BUTTON_MASKS) {
			if (reservedButtons.has(button) && (event.buttons & mask) !== 0) {
				pressedButtons.add(button);
			}
		}

		const command = resolveCommand(plugin, event, pressedButtons);
		if (!command) {
			return;
		}

		consumeEvent(event);
		commandQueue = commandQueue
			.then(command)
			.catch((error: unknown) => {
				console.error(
					'Adaptive Workspace wheel binding failed.',
					error,
				);
			});
	}, { capture: true, passive: false });

	component.registerDomEvent(
		targetDocument,
		'pointerup',
		releaseButton,
		{ capture: true },
	);
	component.registerDomEvent(
		targetDocument,
		'mouseup',
		releaseButton,
		{ capture: true },
	);

	component.registerDomEvent(targetDocument, 'auxclick', (event) => {
		if (isWheelBindingCaptureActive(targetWindow)) {
			return;
		}

		const suppressUntil = suppressClickUntil.get(event.button) ?? 0;
		const isReserved = getReservedButtons(plugin).has(
			event.button as WheelMouseButton,
		);
		if (!isReserved && Date.now() > suppressUntil) {
			suppressClickUntil.delete(event.button);
			return;
		}

		consumeEvent(event);
		suppressClickUntil.delete(event.button);
	}, { capture: true });

	const resetInputState = (): void => {
		pressedButtons.clear();
		suppressClickUntil.clear();
	};
	component.registerDomEvent(targetWindow, 'blur', resetInputState);
	component.registerDomEvent(targetDocument, 'pointercancel', resetInputState);
	component.registerDomEvent(targetDocument, 'mouseout', (event) => {
		if (event.relatedTarget === null) {
			resetInputState();
		}
	});
}

export function registerWheelBindings(
	plugin: AdaptiveWorkspacePlugin,
): void {
	const windowListeners = new Map<Window, Component>();

	const addWindow = (targetWindow: Window): void => {
		if (windowListeners.has(targetWindow)) {
			return;
		}

		const component = plugin.addChild(new Component());
		registerWindowWheelBindings(component, targetWindow, plugin);
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
