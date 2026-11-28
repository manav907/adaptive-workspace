import { SIDEBAR_CHANGES_ICON } from './icons';

export interface ControlPresentation {
	active: boolean;
	icon: string;
	label: string;
	pressed: boolean;
}

export const HIDDEN_CONTROL_CLASS =
	'plugin-adaptive-workspace-is-hidden';

export function getSidebarChangesPresentation(
	disabled: boolean,
): ControlPresentation {
	return disabled
		? {
			active: true,
			icon: SIDEBAR_CHANGES_ICON,
			label: 'Enable sidebar changes',
			pressed: true,
		}
		: {
			active: false,
			icon: SIDEBAR_CHANGES_ICON,
			label: 'Disable sidebar changes',
			pressed: false,
		};
}
