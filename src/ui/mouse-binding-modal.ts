import { Modal, Setting } from 'obsidian';
import type { App } from 'obsidian';
import {
	addStandardHeldButtonsFromMask,
	createButtonBinding,
	createWheelBinding,
	formatMouseBinding,
	hasModifier,
} from '../mouse-bindings';
import type { MouseBinding } from '../mouse-bindings';

export class MouseBindingModal extends Modal {
	private cleanupCaptureListeners: (() => void) | null = null;

	constructor(
		app: App,
		private readonly onChoose: (binding: MouseBinding | null) => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.containerEl.addClass('adaptive-workspace-mouse-binding-modal');
		this.setTitle('Set mouse binding');
		this.contentEl.createEl('p', {
			text: 'Hold keyboard modifiers and mouse buttons, then scroll or press another mouse button.',
		});

		const captureEl = this.contentEl.createDiv({
			cls: 'adaptive-workspace-mouse-capture',
			text: 'Recording anywhere in this window. For example, hold Mouse button 5, scroll up, then release it.',
		});
		captureEl.tabIndex = 0;
		captureEl.focus();

		const feedbackEl = this.contentEl.createDiv({
			cls: 'adaptive-workspace-mouse-feedback',
		});
		const heldButtons = new Set<number>();
		const startedButtons = new Set<number>();
		let pendingBinding: MouseBinding | null = null;
		const captureWindow = this.containerEl.win;

		const isRecorderControl = (event: Event): boolean => {
			const target = event.target as {
				closest?: (selector: string) => Element | null;
			} | null;
			return typeof target?.closest === 'function'
				&& target.closest(
					'.adaptive-workspace-mouse-recorder-controls',
				) !== null;
		};

		const consume = (event: Event): void => {
			event.preventDefault();
			event.stopImmediatePropagation();
		};

		const showFeedback = (text: string, isError = false): void => {
			feedbackEl.setText(text);
			feedbackEl.toggleClass('is-error', isError);
		};

		const choose = (binding: MouseBinding): void => {
			if ((binding.input === 'button-0' || binding.input === 'button-2')
				&& !hasModifier(binding)
				&& binding.heldButtons.length === 0) {
				showFeedback(
					'Primary and secondary buttons require a keyboard modifier.',
					true,
				);
				return;
			}

			showFeedback(formatMouseBinding(binding));
			this.onChoose(binding);
			this.close();
		};

		const onWheel = (event: WheelEvent): void => {
			if (isRecorderControl(event)) {
				return;
			}
			consume(event);
			addStandardHeldButtonsFromMask(event.buttons, heldButtons);
			const binding = createWheelBinding(event, heldButtons);
			if (binding) {
				if (heldButtons.size > 0) {
					pendingBinding = binding;
					showFeedback(
						`${formatMouseBinding(binding)} — release the held mouse button to save.`,
					);
				} else {
					choose(binding);
				}
			}
		};

		const onMouseDown = (event: MouseEvent): void => {
			if (isRecorderControl(event)) {
				return;
			}
			consume(event);
			heldButtons.add(event.button);
			startedButtons.add(event.button);
			showFeedback(
				`${formatMouseBinding(createButtonBinding(event))} held — scroll now, or release to bind it alone.`,
			);
		};

		const onMouseUp = (event: MouseEvent): void => {
			if (isRecorderControl(event)
				|| (!startedButtons.has(event.button)
					&& !heldButtons.has(event.button))) {
				return;
			}
			consume(event);
			startedButtons.delete(event.button);
			if (pendingBinding) {
				heldButtons.delete(event.button);
				if (heldButtons.size === 0) {
					choose(pendingBinding);
				}
				return;
			}

			const binding = createButtonBinding(event, heldButtons);
			heldButtons.delete(event.button);
			if (binding) {
				choose(binding);
			}
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
		captureWindow.addEventListener('mousedown', onMouseDown, { capture: true });
		captureWindow.addEventListener('mouseup', onMouseUp, { capture: true });
		captureWindow.addEventListener(
			'contextmenu',
			onContextMenu,
			{ capture: true },
		);
		this.cleanupCaptureListeners = () => {
			captureWindow.removeEventListener('wheel', onWheel, { capture: true });
			captureWindow.removeEventListener('mousedown', onMouseDown, { capture: true });
			captureWindow.removeEventListener('mouseup', onMouseUp, { capture: true });
			captureWindow.removeEventListener(
				'contextmenu',
				onContextMenu,
				{ capture: true },
			);
			heldButtons.clear();
			startedButtons.clear();
			pendingBinding = null;
		};

		const controls = new Setting(this.contentEl)
			.addButton((button) => button
				.setButtonText('Clear binding')
				.onClick(() => {
					this.onChoose(null);
					this.close();
				}))
			.addButton((button) => button
				.setButtonText('Cancel')
				.onClick(() => this.close()));
		controls.settingEl.addClass('adaptive-workspace-mouse-recorder-controls');
	}

	onClose(): void {
		this.cleanupCaptureListeners?.();
		this.cleanupCaptureListeners = null;
		this.containerEl.removeClass('adaptive-workspace-mouse-binding-modal');
		this.contentEl.empty();
	}
}
