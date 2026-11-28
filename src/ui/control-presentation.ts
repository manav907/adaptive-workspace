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
	invertClicks: boolean,
): ControlPresentation {
	const changeAction = disabled
		? 'Enable sidebar changes'
		: 'Disable sidebar changes';
	const label = invertClicks
		? `Expand or collapse sidebars\nRight-click: ${changeAction}`
		: `${changeAction}\nRight-click: expand or collapse sidebars`;

	return disabled
		? {
			active: true,
			icon: SIDEBAR_CHANGES_ICON,
			label,
			pressed: true,
		}
		: {
			active: false,
			icon: SIDEBAR_CHANGES_ICON,
			label,
			pressed: false,
		};
}
