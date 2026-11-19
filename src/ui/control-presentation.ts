export interface ControlPresentation {
	active: boolean;
	icon: string;
	label: string;
	pressed: boolean;
}

export const HIDDEN_CONTROL_CLASS =
	'plugin-adaptive-workspace-is-hidden';

export function getEditingModePresentation(
	usesSourceMode: boolean,
): ControlPresentation {
	return usesSourceMode
		? {
			active: true,
			icon: 'file-code-2',
			label: 'Use Live Preview',
			pressed: true,
		}
		: {
			active: false,
			icon: 'file-pen-line',
			label: 'Use Source mode',
			pressed: false,
		};
}

export function getSidebarChangesPresentation(
	disabled: boolean,
): ControlPresentation {
	return disabled
		? {
			active: true,
			icon: 'panel-left-close',
			label: 'Enable sidebar changes',
			pressed: true,
		}
		: {
			active: false,
			icon: 'panels-top-left',
			label: 'Disable sidebar changes',
			pressed: false,
		};
}
