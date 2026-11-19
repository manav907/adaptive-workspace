import { Component } from 'obsidian';
import type AdaptiveWorkspacePlugin from './main';
import { collapseWorkspace, expandWorkspace } from './commands/workspace';

const FOLLOW_UP_SUPPRESSION_MS = 0;
const MAX_MOUSE_BUTTON = 400;

const STANDARD_BUTTON_MASKS = new Map<number, number>([
	[0, 1],
	[1, 4],
	[2, 2],
	[3, 8],
	[4, 16],
]);

export type MouseInput =
	| 'wheel-up'
	| 'wheel-down'
	| `button-${number}`;

export interface MouseBinding {
	input: MouseInput;
	heldButtons: number[];
	ctrl: boolean;
	alt: boolean;
	shift: boolean;
	meta: boolean;
}

export type MouseBindingSettingKey =
	| 'expandCommandMouseBinding'
	| 'collapseCommandMouseBinding';

interface ModifierEvent {
	ctrlKey: boolean;
	altKey: boolean;
	shiftKey: boolean;
	metaKey: boolean;
}

type MouseCommand = () => Promise<void>;

function isMouseInput(value: unknown): value is MouseInput {
	if (value === 'wheel-up' || value === 'wheel-down') {
		return true;
	}
	if (typeof value !== 'string') {
		return false;
	}

	const match = /^button-(\d+)$/.exec(value);
	if (!match) {
		return false;
	}

	const button = Number(match[1]);
	return Number.isInteger(button)
		&& button >= 0
		&& button <= MAX_MOUSE_BUTTON;
}

export function normalizeMouseBinding(value: unknown): MouseBinding | null {
	if (!value || typeof value !== 'object') {
		return null;
	}

	const saved = value as Record<string, unknown>;
	if (!isMouseInput(saved.input)) {
		return null;
	}

	const inputButton = getInputButton(saved.input);
	const heldButtons = Array.isArray(saved.heldButtons)
		? [...new Set(saved.heldButtons)]
			.filter((button): button is number => Number.isInteger(button)
				&& button >= 0
				&& button <= MAX_MOUSE_BUTTON
				&& button !== inputButton)
			.sort((left, right) => left - right)
		: [];
	const binding: MouseBinding = {
		input: saved.input,
		heldButtons,
		ctrl: saved.ctrl === true,
		alt: saved.alt === true,
		shift: saved.shift === true,
		meta: saved.meta === true,
	};

	if ((binding.input === 'button-0' || binding.input === 'button-2')
		&& !hasModifier(binding)
		&& binding.heldButtons.length === 0) {
		return null;
	}

	return binding;
}

function getModifiers(event: ModifierEvent): Omit<MouseBinding, 'input'> {
	return {
		heldButtons: [],
		ctrl: event.ctrlKey,
		alt: event.altKey,
		shift: event.shiftKey,
		meta: event.metaKey,
	};
}

export function createWheelBinding(
	event: WheelEvent,
	heldButtons: Iterable<number> = [],
): MouseBinding | null {
	if (event.deltaY === 0) {
		return null;
	}

	return {
		input: event.deltaY < 0 ? 'wheel-up' : 'wheel-down',
		...getModifiers(event),
		heldButtons: normalizeHeldButtons(heldButtons),
	};
}

export function createButtonBinding(
	event: MouseEvent,
	heldButtons: Iterable<number> = [],
): MouseBinding | null {
	if (event.button < 0 || event.button > MAX_MOUSE_BUTTON) {
		return null;
	}

	return {
		input: `button-${event.button}`,
		...getModifiers(event),
		heldButtons: normalizeHeldButtons(heldButtons, event.button),
	};
}

function normalizeHeldButtons(
	buttons: Iterable<number>,
	excludedButton?: number,
): number[] {
	return [...new Set(buttons)]
		.filter((button) => Number.isInteger(button)
			&& button >= 0
			&& button <= MAX_MOUSE_BUTTON
			&& button !== excludedButton)
		.sort((left, right) => left - right);
}

function getInputButton(input: MouseInput): number | null {
	return input.startsWith('button-')
		? Number(input.slice('button-'.length))
		: null;
}

export function hasModifier(binding: MouseBinding): boolean {
	return binding.ctrl || binding.alt || binding.shift || binding.meta;
}

export function mouseBindingsEqual(
	left: MouseBinding | null,
	right: MouseBinding | null,
): boolean {
	return left !== null
		&& right !== null
		&& left.input === right.input
		&& left.heldButtons.length === right.heldButtons.length
		&& left.heldButtons.every(
			(button, index) => button === right.heldButtons[index],
		)
		&& left.ctrl === right.ctrl
		&& left.alt === right.alt
		&& left.shift === right.shift
		&& left.meta === right.meta;
}

export function formatMouseBinding(binding: MouseBinding | null): string {
	if (!binding) {
		return 'Not assigned';
	}

	const parts: string[] = [];
	if (binding.ctrl) parts.push('Ctrl');
	if (binding.alt) parts.push('Alt');
	if (binding.shift) parts.push('Shift');
	if (binding.meta) parts.push('Meta');
	for (const button of binding.heldButtons) {
		parts.push(formatMouseButton(button));
	}

	if (binding.input === 'wheel-up') {
		parts.push('Wheel up');
	} else if (binding.input === 'wheel-down') {
		parts.push('Wheel down');
	} else {
		const button = Number(binding.input.slice('button-'.length));
		parts.push(formatMouseButton(button));
	}

	return parts.join(' + ');
}

function formatMouseButton(button: number): string {
	if (button === 0) return 'Primary button';
	if (button === 1) return 'Middle button';
	if (button === 2) return 'Secondary button';
	if (button === 3) return 'Mouse button 4 (Back)';
	if (button === 4) return 'Mouse button 5 (Forward)';
	return `Mouse button ${button + 1}`;
}

function isMouseBindingCapture(event: Event): boolean {
	const target = event.target as {
		closest?: (selector: string) => Element | null;
		ownerDocument?: Document;
	} | null;
	return (typeof target?.closest === 'function'
		&& target.closest('.adaptive-workspace-mouse-binding-modal') !== null)
		|| (target?.ownerDocument?.querySelector(
			'.adaptive-workspace-mouse-binding-modal',
		) ?? null) !== null;
}

function consumeEvent(event: Event): void {
	event.preventDefault();
	event.stopImmediatePropagation();
}

function modifiersMatch(
	binding: MouseBinding,
	event: ModifierEvent,
): boolean {
	return binding.ctrl === event.ctrlKey
		&& binding.alt === event.altKey
		&& binding.shift === event.shiftKey
		&& binding.meta === event.metaKey;
}

function isHeldModifierButton(
	plugin: AdaptiveWorkspacePlugin,
	button: number,
	event: ModifierEvent,
): boolean {
	return [
		plugin.settings.expandCommandMouseBinding,
		plugin.settings.collapseCommandMouseBinding,
	].some((binding) => binding !== null
		&& binding.heldButtons.includes(button)
		&& modifiersMatch(binding, event));
}

export function addStandardHeldButtonsFromMask(
	buttonsMask: number,
	heldButtons: Set<number>,
): void {
	for (const [button, mask] of STANDARD_BUTTON_MASKS) {
		if ((buttonsMask & mask) !== 0) {
			heldButtons.add(button);
		}
	}
}

function resolveCommand(
	plugin: AdaptiveWorkspacePlugin,
	binding: MouseBinding | null,
): MouseCommand | null {
	if (mouseBindingsEqual(
		binding,
		plugin.settings.expandCommandMouseBinding,
	)) {
		return () => expandWorkspace(plugin.app, plugin.settings);
	}
	if (mouseBindingsEqual(
		binding,
		plugin.settings.collapseCommandMouseBinding,
	)) {
		return () => collapseWorkspace(plugin.app, plugin.settings);
	}
	return null;
}

function registerWindowMouseBindings(
	component: Component,
	targetWindow: Window,
	plugin: AdaptiveWorkspacePlugin,
): void {
	const heldButtons = new Set<number>();
	const blockedButtons = new Set<number>();
	const chordConsumedButtons = new Set<number>();
	const suppressFollowUpUntil = new Map<number, number>();
	let commandQueue = Promise.resolve();

	const queueCommand = (command: MouseCommand): void => {
		commandQueue = commandQueue
			.then(command)
			.catch((error: unknown) => {
				console.error('Adaptive Workspace mouse command failed.', error);
			});
	};

	const resetInputState = (): void => {
		heldButtons.clear();
		blockedButtons.clear();
		chordConsumedButtons.clear();
		suppressFollowUpUntil.clear();
	};

	component.registerDomEvent(targetWindow, 'wheel', (event) => {
		if (isMouseBindingCapture(event)) {
			return;
		}

		addStandardHeldButtonsFromMask(event.buttons, heldButtons);
		const binding = createWheelBinding(event, heldButtons);
		const command = resolveCommand(
			plugin,
			binding,
		);
		if (!binding || !command) {
			return;
		}

		consumeEvent(event);
		for (const button of heldButtons) {
			blockedButtons.add(button);
			chordConsumedButtons.add(button);
		}
		queueCommand(command);
	}, { capture: true, passive: false });

	component.registerDomEvent(targetWindow, 'mousedown', (event) => {
		if (isMouseBindingCapture(event)) {
			return;
		}

		const binding = createButtonBinding(event, heldButtons);
		heldButtons.add(event.button);
		if (resolveCommand(plugin, binding)
			|| isHeldModifierButton(plugin, event.button, event)) {
			blockedButtons.add(event.button);
			consumeEvent(event);
		}
	}, { capture: true });

	component.registerDomEvent(targetWindow, 'mouseup', (event) => {
		if (isMouseBindingCapture(event)) {
			return;
		}

		const wasBlocked = blockedButtons.has(event.button);
		const wasChordConsumed = chordConsumedButtons.has(event.button);
		const binding = createButtonBinding(event, heldButtons);
		const command = wasChordConsumed
			? null
			: resolveCommand(plugin, binding);
		if (command && binding) {
			for (const button of binding.heldButtons) {
				blockedButtons.add(button);
				chordConsumedButtons.add(button);
			}
		}
		heldButtons.delete(event.button);
		blockedButtons.delete(event.button);
		chordConsumedButtons.delete(event.button);

		if (wasBlocked || wasChordConsumed || command) {
			consumeEvent(event);
			suppressFollowUpUntil.set(
				event.button,
				Date.now() + FOLLOW_UP_SUPPRESSION_MS,
			);
		}
		if (command) {
			queueCommand(command);
		}
	}, { capture: true });

	const suppressBoundButton = (event: MouseEvent): void => {
		if (blockedButtons.has(event.button)) {
			consumeEvent(event);
			return;
		}

		const suppressUntil = suppressFollowUpUntil.get(event.button) ?? 0;
		if (Date.now() <= suppressUntil) {
			consumeEvent(event);
			suppressFollowUpUntil.delete(event.button);
		} else {
			suppressFollowUpUntil.delete(event.button);
		}
	};
	component.registerDomEvent(
		targetWindow,
		'click',
		suppressBoundButton,
		{ capture: true },
	);
	component.registerDomEvent(
		targetWindow,
		'auxclick',
		suppressBoundButton,
		{ capture: true },
	);
	component.registerDomEvent(
		targetWindow,
		'contextmenu',
		suppressBoundButton,
		{ capture: true },
	);
	component.registerDomEvent(targetWindow, 'blur', resetInputState);
	component.registerDomEvent(targetWindow, 'pointercancel', resetInputState);
	component.registerDomEvent(targetWindow, 'mouseout', (event) => {
		if (event.relatedTarget === null) {
			resetInputState();
		}
	});
}

export function registerMouseBindings(
	plugin: AdaptiveWorkspacePlugin,
): void {
	const windowListeners = new Map<Window, Component>();

	const addWindow = (targetWindow: Window): void => {
		if (windowListeners.has(targetWindow)) {
			return;
		}

		const component = plugin.addChild(new Component());
		registerWindowMouseBindings(component, targetWindow, plugin);
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
