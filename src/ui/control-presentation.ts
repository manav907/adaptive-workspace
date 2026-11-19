import type { AdaptiveWorkspaceSettings } from '../settings';

export interface ControlPresentation {
	active: boolean;
	icon: string;
	label: string;
	pressed: boolean;
	statusText: string;
}

export function getEditingModePresentation(
	settings: AdaptiveWorkspaceSettings,
): ControlPresentation {
	if (settings.useSourceMode) {
		return {
			active: true,
			icon: 'file-code-2',
			label: 'Edit commands use Source mode. Select to use Live Preview.',
			pressed: true,
			statusText: 'Edit: Source',
		};
	}

	return {
		active: false,
		icon: 'file-pen-line',
		label: 'Edit commands use Live Preview. Select to use Source mode.',
		pressed: false,
		statusText: 'Edit: Live Preview',
	};
}

export function getSidebarChangesPresentation(
	settings: AdaptiveWorkspaceSettings,
): ControlPresentation {
	if (settings.disableSidebarChanges) {
		return {
			active: false,
			icon: 'lock',
			label: 'Workspace commands cannot change sidebars. Select to enable sidebar changes.',
			pressed: false,
			statusText: 'Sidebars: Locked',
		};
	}

	return {
		active: true,
		icon: 'panels-top-left',
		label: 'Workspace commands can change sidebars. Select to lock sidebar changes.',
		pressed: true,
		statusText: 'Sidebars: Enabled',
	};
}
