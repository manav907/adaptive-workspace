export type WheelDirection = 'up' | 'down';
export type WheelMouseButton = 1 | 3 | 4;

export interface WheelBinding {
	direction: WheelDirection;
	button: WheelMouseButton | null;
	ctrl: boolean;
	alt: boolean;
	shift: boolean;
	meta: boolean;
}

export type WheelBindingSettingKey =
	| 'zoomInWheelBinding'
	| 'zoomOutWheelBinding';

export function normalizeWheelBinding(value: unknown): WheelBinding | null {
	if (!value || typeof value !== 'object') {
		return null;
	}

	const saved = value as Record<string, unknown>;
	if (saved.direction !== 'up' && saved.direction !== 'down') {
		return null;
	}
	if (saved.button !== null && !isWheelMouseButton(saved.button)) {
		return null;
	}

	const button = isWheelMouseButton(saved.button) ? saved.button : null;
	const binding: WheelBinding = {
		direction: saved.direction,
		button,
		ctrl: saved.ctrl === true,
		alt: saved.alt === true,
		shift: saved.shift === true,
		meta: saved.meta === true,
	};

	if (button !== null) {
		binding.ctrl = false;
		binding.alt = false;
		binding.shift = false;
		binding.meta = false;
		return binding;
	}

	return hasKeyboardModifier(binding) ? binding : null;
}

export function createKeyboardWheelBinding(
	event: WheelEvent,
): WheelBinding | null {
	const direction = getWheelDirection(event);
	if (!direction) {
		return null;
	}

	const binding: WheelBinding = {
		direction,
		button: null,
		ctrl: event.ctrlKey,
		alt: event.altKey,
		shift: event.shiftKey,
		meta: event.metaKey,
	};
	return hasKeyboardModifier(binding) ? binding : null;
}

export function createMouseWheelBinding(
	event: WheelEvent,
	button: WheelMouseButton,
): WheelBinding | null {
	const direction = getWheelDirection(event);
	return direction ? {
		direction,
		button,
		ctrl: false,
		alt: false,
		shift: false,
		meta: false,
	} : null;
}

export function wheelBindingsEqual(
	left: WheelBinding | null,
	right: WheelBinding | null,
): boolean {
	return left !== null
		&& right !== null
		&& left.direction === right.direction
		&& left.button === right.button
		&& left.ctrl === right.ctrl
		&& left.alt === right.alt
		&& left.shift === right.shift
		&& left.meta === right.meta;
}

export function formatWheelBinding(binding: WheelBinding | null): string {
	if (!binding) {
		return 'None';
	}

	const parts: string[] = [];
	if (binding.button !== null) {
		parts.push(formatMouseButton(binding.button));
	} else {
		if (binding.ctrl) parts.push('Ctrl');
		if (binding.alt) parts.push('Alt');
		if (binding.shift) parts.push('Shift');
		if (binding.meta) parts.push('Meta');
	}
	parts.push(binding.direction === 'up' ? 'Wheel up' : 'Wheel down');
	return parts.join(' + ');
}

export function isWheelMouseButton(value: unknown): value is WheelMouseButton {
	return value === 1 || value === 3 || value === 4;
}

export function getWheelDirection(
	event: WheelEvent,
): WheelDirection | null {
	if (event.deltaY === 0) {
		return null;
	}
	return event.deltaY < 0 ? 'up' : 'down';
}

function hasKeyboardModifier(binding: WheelBinding): boolean {
	return binding.ctrl || binding.alt || binding.shift || binding.meta;
}

function formatMouseButton(button: WheelMouseButton): string {
	if (button === 1) return 'Middle mouse';
	return `MB${button + 1}`;
}
