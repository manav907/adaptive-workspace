const activeCaptures = new WeakMap<Window, number>();

export function beginWheelBindingCapture(
	targetWindow: Window,
): () => void {
	activeCaptures.set(
		targetWindow,
		(activeCaptures.get(targetWindow) ?? 0) + 1,
	);

	let ended = false;
	return () => {
		if (ended) {
			return;
		}
		ended = true;

		const remaining = (activeCaptures.get(targetWindow) ?? 1) - 1;
		if (remaining > 0) {
			activeCaptures.set(targetWindow, remaining);
		} else {
			activeCaptures.delete(targetWindow);
		}
	};
}

export function isWheelBindingCaptureActive(
	targetWindow: Window,
): boolean {
	return (activeCaptures.get(targetWindow) ?? 0) > 0;
}
