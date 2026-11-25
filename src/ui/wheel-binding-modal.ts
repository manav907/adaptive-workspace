import { Modal, Setting } from 'obsidian';
import type { App } from 'obsidian';
import {
	createKeyboardWheelBinding,
	createMouseWheelBinding,
	formatWheelBinding,
	isWheelMouseButton,
} from '../wheel-binding';
import type {
	WheelBinding,
	WheelMouseButton,
} from '../wheel-binding';
import { beginWheelBindingCapture } from '../wheel-binding-capture';

export class WheelBindingModal extends Modal {
	private cleanupCaptureListeners: (() => void) | null = null;
	private endBindingCapture: (() => void) | null = null;

	constructor(
		app: App,
		private readonly onChoose: (binding: WheelBinding | null) => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.setTitle('Set wheel binding');

		const instructionEl = this.contentEl.createDiv({
			cls: 'setting-item-description',
			text: 'Hold keyboard modifiers or one mouse button, then scroll.',
		});
		instructionEl.tabIndex = 0;
		instructionEl.focus();

		const feedbackEl = this.contentEl.createDiv({
			cls: 'setting-item-description',
		});
		const heldButtons = new Set<WheelMouseButton>();
		const captureWindow = this.containerEl.win;
		this.endBindingCapture = beginWheelBindingCapture(captureWindow);

		const isRecorderControl = (event: Event): boolean => {
			const target = event.target as {
				closest?: (selector: string) => Element | null;
			} | null;
			return typeof target?.closest === 'function'
				&& target.closest(
					'.adaptive-workspace-wheel-recorder-controls',
				) !== null;
		};

		const consume = (event: Event): void => {
			event.preventDefault();
			event.stopImmediatePropagation();
		};

		const showFeedback = (text: string): void => {
			feedbackEl.setText(text);
		};

		const choose = (binding: WheelBinding): void => {
			showFeedback(formatWheelBinding(binding));
			this.onChoose(binding);
			this.close();
		};

		const onWheel = (event: WheelEvent): void => {
			if (isRecorderControl(event)) {
				return;
			}
			consume(event);

			const hasKeyboardModifiers = event.ctrlKey
				|| event.altKey
				|| event.shiftKey
				|| event.metaKey;
			if (heldButtons.size > 0 && hasKeyboardModifiers) {
				showFeedback('Use keyboard modifiers or one mouse button, not both.');
				return;
			}
			if (heldButtons.size > 1) {
				showFeedback('Hold only one mouse button.');
				return;
			}

			const button = heldButtons.values().next().value;
			const binding = button === undefined
				? createKeyboardWheelBinding(event)
				: createMouseWheelBinding(event, button);
			if (!binding) {
				showFeedback('Hold Ctrl, Alt, Shift, Meta, middle mouse, MB4, or MB5.');
				return;
			}
			choose(binding);
		};

		const onMouseDown = (event: MouseEvent): void => {
			if (isRecorderControl(event)) {
				return;
			}
			consume(event);
			if (!isWheelMouseButton(event.button)) {
				showFeedback('Use middle mouse, MB4, or MB5.');
				return;
			}
			heldButtons.add(event.button);
			showFeedback('Scroll to finish.');
		};

		const onMouseUp = (event: MouseEvent): void => {
			if (!isWheelMouseButton(event.button)) {
				return;
			}
			if (isRecorderControl(event)) {
				heldButtons.delete(event.button);
				return;
			}
			consume(event);
			heldButtons.delete(event.button);
		};

		const onContextMenu = (event: MouseEvent): void => {
			if (!isRecorderControl(event)) {
				consume(event);
			}
		};

		captureWindow.addEventListener(
			'wheel',
			onWheel,
			{ capture: true, passive: false },
		);
		captureWindow.addEventListener('pointerdown', onMouseDown, { capture: true });
		captureWindow.addEventListener('mousedown', onMouseDown, { capture: true });
		captureWindow.addEventListener('pointerup', onMouseUp, { capture: true });
		captureWindow.addEventListener('mouseup', onMouseUp, { capture: true });
		captureWindow.addEventListener('auxclick', onContextMenu, { capture: true });
		captureWindow.addEventListener(
			'contextmenu',
			onContextMenu,
			{ capture: true },
		);
		this.cleanupCaptureListeners = () => {
			captureWindow.removeEventListener(
				'wheel',
				onWheel,
				{ capture: true },
			);
			captureWindow.removeEventListener(
				'pointerdown',
				onMouseDown,
				{ capture: true },
			);
			captureWindow.removeEventListener(
				'mousedown',
				onMouseDown,
				{ capture: true },
			);
			captureWindow.removeEventListener(
				'pointerup',
				onMouseUp,
				{ capture: true },
			);
			captureWindow.removeEventListener(
				'mouseup',
				onMouseUp,
				{ capture: true },
			);
			captureWindow.removeEventListener(
				'auxclick',
				onContextMenu,
				{ capture: true },
			);
			captureWindow.removeEventListener(
				'contextmenu',
				onContextMenu,
				{ capture: true },
			);
			heldButtons.clear();
		};

		const controls = new Setting(this.contentEl)
			.addButton((button) => button
				.setButtonText('Clear')
				.onClick(() => {
					this.onChoose(null);
					this.close();
				}))
			.addButton((button) => button
				.setButtonText('Cancel')
				.onClick(() => this.close()));
		controls.settingEl.addClass(
			'adaptive-workspace-wheel-recorder-controls',
		);
	}

	onClose(): void {
		this.endBindingCapture?.();
		this.endBindingCapture = null;
		this.cleanupCaptureListeners?.();
		this.cleanupCaptureListeners = null;
		this.contentEl.empty();
	}
}
