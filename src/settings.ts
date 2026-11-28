import { PluginSettingTab } from 'obsidian';
import type {
	App,
	SettingDefinition,
	SettingDefinitionItem,
} from 'obsidian';
import type AdaptiveWorkspacePlugin from './main';
import {
	formatWheelBinding,
	wheelBindingsEqual,
	normalizeWheelBinding,
} from './wheel-binding';
import type {
	WheelBinding,
	WheelBindingSettingKey,
	WheelMouseButton,
} from './wheel-binding';
import { WheelBindingModal } from './ui/wheel-binding-modal';

export interface AdaptiveWorkspaceSettings {
	disableSidebarChanges: boolean;
	zoomInWheelBinding: WheelBinding | null;
	zoomOutWheelBinding: WheelBinding | null;
	showEditingModeHeaderControl: boolean;
	hideNativeMarkdownViewSwitcher: boolean;
	showSidebarChangesHeaderControl: boolean;
	invertSidebarControlClicks: boolean;
	expandCommandLeftSidebar: SidebarAction;
	expandCommandRightSidebar: SidebarAction;
	expandCommandMarkdownMode: MarkdownModeAction;
	collapseCommandLeftSidebar: SidebarAction;
	collapseCommandRightSidebar: SidebarAction;
	collapseCommandMarkdownMode: MarkdownModeAction;
}

export type SidebarAction = 'expand' | 'collapse' | 'unchanged';
export type MarkdownModeAction =
	| 'edit'
	| 'live-preview'
	| 'source'
	| 'reading'
	| 'unchanged';

type SidebarSettingKey =
	| 'expandCommandLeftSidebar'
	| 'expandCommandRightSidebar'
	| 'collapseCommandLeftSidebar'
	| 'collapseCommandRightSidebar';

type SettingKey = keyof AdaptiveWorkspaceSettings;

const SIDEBAR_OPTIONS: Record<SidebarAction, string> = {
	expand: 'Expand',
	collapse: 'Collapse',
	unchanged: 'No change',
};

const MARKDOWN_MODE_OPTIONS: Record<MarkdownModeAction, string> = {
	unchanged: 'No change',
	edit: 'Edit',
	'live-preview': 'Live Preview',
	source: 'Source mode',
	reading: 'Reading',
};

export const DEFAULT_SETTINGS: AdaptiveWorkspaceSettings = {
	disableSidebarChanges: false,
	zoomInWheelBinding: {
		direction: 'up',
		button: 4,
		ctrl: false,
		alt: false,
		shift: false,
		meta: false,
	},
	zoomOutWheelBinding: {
		direction: 'down',
		button: 4,
		ctrl: false,
		alt: false,
		shift: false,
		meta: false,
	},
	showEditingModeHeaderControl: true,
	hideNativeMarkdownViewSwitcher: false,
	showSidebarChangesHeaderControl: true,
	invertSidebarControlClicks: false,
	expandCommandLeftSidebar: 'expand',
	expandCommandRightSidebar: 'expand',
	expandCommandMarkdownMode: 'unchanged',
	collapseCommandLeftSidebar: 'collapse',
	collapseCommandRightSidebar: 'collapse',
	collapseCommandMarkdownMode: 'unchanged',
};

function isSidebarAction(value: unknown): value is SidebarAction {
	return value === 'expand' || value === 'collapse' || value === 'unchanged';
}

function isMarkdownModeAction(value: unknown): value is MarkdownModeAction {
	return value === 'edit'
		|| value === 'live-preview'
		|| value === 'source'
		|| value === 'reading'
		|| value === 'unchanged';
}

export function normalizeSettings(data: unknown): AdaptiveWorkspaceSettings {
	const saved = data && typeof data === 'object'
		? data as Record<string, unknown>
		: {};
	const legacyWheelBindings = getLegacyWheelBindings(saved);
	const zoomInWheelBinding = getWheelBinding(
		saved,
		'zoomInWheelBinding',
		legacyWheelBindings
			? legacyWheelBindings.zoomIn
			: DEFAULT_SETTINGS.zoomInWheelBinding,
	);
	let zoomOutWheelBinding = getWheelBinding(
		saved,
		'zoomOutWheelBinding',
		legacyWheelBindings
			? legacyWheelBindings.zoomOut
			: DEFAULT_SETTINGS.zoomOutWheelBinding,
	);
	if (wheelBindingsEqual(zoomInWheelBinding, zoomOutWheelBinding)) {
		zoomOutWheelBinding = null;
	}

	return {
		disableSidebarChanges: getBoolean(
			saved.disableSidebarChanges,
			DEFAULT_SETTINGS.disableSidebarChanges,
		),
		zoomInWheelBinding,
		zoomOutWheelBinding,
		showEditingModeHeaderControl: getHeaderControlVisibility(
			saved.showEditingModeHeaderControl,
			saved.editingModeControlLocation,
			saved.showSourceModeButton,
			DEFAULT_SETTINGS.showEditingModeHeaderControl,
		),
		hideNativeMarkdownViewSwitcher: getBoolean(
			saved.hideNativeMarkdownViewSwitcher,
			DEFAULT_SETTINGS.hideNativeMarkdownViewSwitcher,
		),
		showSidebarChangesHeaderControl: getHeaderControlVisibility(
			saved.showSidebarChangesHeaderControl,
			saved.sidebarChangesControlLocation,
			saved.showSidebarChangesButton,
			DEFAULT_SETTINGS.showSidebarChangesHeaderControl,
		),
		invertSidebarControlClicks: getBoolean(
			saved.invertSidebarControlClicks,
			DEFAULT_SETTINGS.invertSidebarControlClicks,
		),
		expandCommandLeftSidebar: getSidebarAction(
			saved.expandCommandLeftSidebar,
			saved.expandLeftSidebar,
			DEFAULT_SETTINGS.expandCommandLeftSidebar,
		),
		expandCommandRightSidebar: getSidebarAction(
			saved.expandCommandRightSidebar,
			saved.expandRightSidebar,
			DEFAULT_SETTINGS.expandCommandRightSidebar,
		),
		expandCommandMarkdownMode: getMarkdownModeAction(
			saved.expandCommandMarkdownMode,
			DEFAULT_SETTINGS.expandCommandMarkdownMode,
		),
		collapseCommandLeftSidebar: getSidebarAction(
			saved.collapseCommandLeftSidebar,
			saved.collapseLeftSidebar,
			DEFAULT_SETTINGS.collapseCommandLeftSidebar,
		),
		collapseCommandRightSidebar: getSidebarAction(
			saved.collapseCommandRightSidebar,
			saved.collapseRightSidebar,
			DEFAULT_SETTINGS.collapseCommandRightSidebar,
		),
		collapseCommandMarkdownMode: getMarkdownModeAction(
			saved.collapseCommandMarkdownMode,
			DEFAULT_SETTINGS.collapseCommandMarkdownMode,
		),
	};
}

function getBoolean(value: unknown, defaultValue: boolean): boolean {
	return typeof value === 'boolean' ? value : defaultValue;
}

function cloneWheelBinding(binding: WheelBinding | null): WheelBinding | null {
	return binding ? { ...binding } : null;
}

function getWheelBinding(
	saved: Record<string, unknown>,
	key: WheelBindingSettingKey,
	defaultValue: WheelBinding | null,
): WheelBinding | null {
	if (Object.prototype.hasOwnProperty.call(saved, key)) {
		return normalizeWheelBinding(saved[key]);
	}
	return cloneWheelBinding(defaultValue);
}

function getLegacyWheelBindings(saved: Record<string, unknown>): {
	zoomIn: WheelBinding | null;
	zoomOut: WheelBinding | null;
} | null {
	const hasLegacySettings = typeof saved.enableMiddleMouseWheel === 'boolean'
		|| typeof saved.enableSideMouseWheel === 'boolean'
		|| typeof saved.invertMiddleMouseWheel === 'boolean';
	if (!hasLegacySettings) {
		return null;
	}

	let button: WheelMouseButton | null = null;
	if (saved.enableSideMouseWheel === true) {
		button = 4;
	} else if (saved.enableMiddleMouseWheel !== false) {
		button = 1;
	}
	if (button === null) {
		return { zoomIn: null, zoomOut: null };
	}

	const inverted = saved.invertMiddleMouseWheel === true;
	const createBinding = (direction: 'up' | 'down'): WheelBinding => ({
		direction,
		button,
		ctrl: false,
		alt: false,
		shift: false,
		meta: false,
	});
	return {
		zoomIn: createBinding(inverted ? 'down' : 'up'),
		zoomOut: createBinding(inverted ? 'up' : 'down'),
	};
}

function getHeaderControlVisibility(
	value: unknown,
	legacyLocation: unknown,
	legacyVisible: unknown,
	defaultValue: boolean,
): boolean {
	if (typeof value === 'boolean') {
		return value;
	}
	if (legacyLocation === 'header' || legacyLocation === 'both') {
		return true;
	}
	if (legacyLocation === 'hidden' || legacyLocation === 'status') {
		return false;
	}
	return getBoolean(legacyVisible, defaultValue);
}

function getSidebarAction(
	value: unknown,
	legacyEnabled: unknown,
	defaultAction: SidebarAction,
): SidebarAction {
	if (isSidebarAction(value)) {
		return value;
	}
	if (typeof legacyEnabled === 'boolean') {
		return legacyEnabled ? defaultAction : 'unchanged';
	}
	return defaultAction;
}

function getMarkdownModeAction(
	value: unknown,
	defaultAction: MarkdownModeAction,
): MarkdownModeAction {
	if (isMarkdownModeAction(value)) {
		return value;
	}
	return defaultAction;
}

export class AdaptiveWorkspaceSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: AdaptiveWorkspacePlugin,
	) {
		super(app, plugin);
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		await super.setControlValue(key, value);
		this.refreshDomState();
		this.plugin.refreshUi();
	}

	getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
		return [
			{
				type: 'group',
				heading: 'Zoom-in workspace',
				items: [
					this.createWheelBindingSetting('zoomInWheelBinding'),
					this.createSidebarSetting(
						'Left sidebar',
						'expandCommandLeftSidebar',
					),
					this.createSidebarSetting(
						'Right sidebar',
						'expandCommandRightSidebar',
					),
					this.createMarkdownModeSetting('expandCommandMarkdownMode'),
				],
			},
			{
				type: 'group',
				heading: 'Zoom-out workspace',
				items: [
					this.createWheelBindingSetting('zoomOutWheelBinding'),
					this.createSidebarSetting(
						'Left sidebar',
						'collapseCommandLeftSidebar',
					),
					this.createSidebarSetting(
						'Right sidebar',
						'collapseCommandRightSidebar',
					),
					this.createMarkdownModeSetting('collapseCommandMarkdownMode'),
				],
			},
			{
				type: 'group',
				heading: 'Interface controls',
				items: [
					{
						name: 'Markdown modes in header',
						control: {
							type: 'toggle',
							key: 'showEditingModeHeaderControl',
							defaultValue:
								DEFAULT_SETTINGS.showEditingModeHeaderControl,
						},
					},
					{
						name: 'Hide Obsidian view switcher',
						desc: 'Hide the built-in Reading and Editing button while Markdown modes are shown.',
						control: {
							type: 'toggle',
							key: 'hideNativeMarkdownViewSwitcher',
							defaultValue:
								DEFAULT_SETTINGS.hideNativeMarkdownViewSwitcher,
						},
					},
					{
						name: 'Sidebar changes in Markdown header',
						control: {
							type: 'toggle',
							key: 'showSidebarChangesHeaderControl',
							defaultValue:
								DEFAULT_SETTINGS.showSidebarChangesHeaderControl,
						},
					},
					{
						name: 'Invert sidebar button clicks',
						desc: 'Left-click toggles sidebars; right-click locks or unlocks changes.',
						control: {
							type: 'toggle',
							key: 'invertSidebarControlClicks',
							defaultValue:
								DEFAULT_SETTINGS.invertSidebarControlClicks,
						},
					},
				],
			},
		];
	}

	private createWheelBindingSetting(
		key: WheelBindingSettingKey,
	): SettingDefinition<SettingKey> {
		return {
			name: 'Wheel binding',
			desc: 'Keyboard bindings work across all windows. Settings → Hotkeys',
			render: (setting) => {
				const binding = this.plugin.settings[key];
				setting.addButton((button) => button
					.setButtonText(formatWheelBinding(binding))
					.setTooltip('Set binding')
					.onClick(() => {
						new WheelBindingModal(this.app, (newBinding) => {
							void this.setWheelBinding(key, newBinding);
						}).open();
					}));

				if (binding) {
					setting.addExtraButton((button) => button
						.setIcon('x')
						.setTooltip('Clear binding')
						.onClick(() => {
							void this.setWheelBinding(key, null);
						}));
				}
			},
		};
	}

	private async setWheelBinding(
		key: WheelBindingSettingKey,
		binding: WheelBinding | null,
	): Promise<void> {
		const otherKey: WheelBindingSettingKey = key === 'zoomInWheelBinding'
			? 'zoomOutWheelBinding'
			: 'zoomInWheelBinding';
		if (wheelBindingsEqual(binding, this.plugin.settings[otherKey])) {
			this.plugin.settings[otherKey] = null;
		}
		this.plugin.settings[key] = binding;
		await this.plugin.saveSettings();
		this.update();
	}

	private createSidebarSetting(
		name: string,
		key: SidebarSettingKey,
	): SettingDefinition<SettingKey> {
		return {
			name,
			control: {
				type: 'dropdown',
				key,
				defaultValue: DEFAULT_SETTINGS[key],
				options: SIDEBAR_OPTIONS,
			},
		};
	}

	private createMarkdownModeSetting(
		key: 'expandCommandMarkdownMode' | 'collapseCommandMarkdownMode',
	): SettingDefinition<SettingKey> {
		return {
			name: 'Markdown view',
			control: {
				type: 'dropdown',
				key,
				defaultValue: DEFAULT_SETTINGS[key],
				options: MARKDOWN_MODE_OPTIONS,
			},
		};
	}
}
