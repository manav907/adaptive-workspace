import { setIcon, setTooltip } from 'obsidian';
import type { App } from 'obsidian';
import type AdaptiveWorkspacePlugin from '../main';
import {
	getSidebarChangesPresentation,
	HIDDEN_CONTROL_CLASS,
} from './control-presentation';

const EDITOR_STATUS_PLUGIN_ID = 'editor-status';

interface InternalPlugin {
	enabled: boolean;
	disable(): void | Promise<void>;
	enable(): Promise<void>;
}

interface InternalPluginManager {
	getPluginById(pluginId: string): InternalPlugin | null;
}

type AppWithInternalPlugins = App & {
	internalPlugins?: InternalPluginManager;
};

const statusItems = new WeakMap<AdaptiveWorkspacePlugin, HTMLElement>();

function getEditorStatusPlugin(app: App): InternalPlugin | null {
	return (app as AppWithInternalPlugins).internalPlugins
		?.getPluginById(EDITOR_STATUS_PLUGIN_ID) ?? null;
}

export function isEditorStatusEnabled(app: App): boolean {
	return getEditorStatusPlugin(app)?.enabled ?? false;
}

export async function setEditorStatusEnabled(
	app: App,
	enabled: boolean,
): Promise<void> {
	const editorStatus = getEditorStatusPlugin(app);
	if (!editorStatus || editorStatus.enabled === enabled) {
		return;
	}

	if (enabled) {
		await editorStatus.enable();
	} else {
		await editorStatus.disable();
	}
}

export function refreshSidebarStatusItem(
	plugin: AdaptiveWorkspacePlugin,
): void {
	const statusItem = statusItems.get(plugin);
	if (!statusItem) {
		return;
	}

	const presentation = getSidebarChangesPresentation(
		plugin.settings.disableSidebarChanges,
	);
	statusItem.hidden = false;
	statusItem.classList.toggle(
		HIDDEN_CONTROL_CLASS,
		!plugin.settings.showSidebarStatusItem,
	);
	statusItem.classList.toggle('is-active', presentation.active);
	statusItem.setAttribute('aria-pressed', String(presentation.pressed));
	statusItem.setAttribute('aria-label', presentation.label);
	setIcon(statusItem, presentation.icon);
	setTooltip(statusItem, presentation.label);
}

export function registerSidebarStatusItem(
	plugin: AdaptiveWorkspacePlugin,
): void {
	const statusItem = plugin.addStatusBarItem();
	statusItem.classList.add(
		'plugin-adaptive-workspace-sidebar',
		'mod-clickable',
	);
	statusItem.setAttribute('role', 'button');
	statusItem.tabIndex = 0;
	statusItems.set(plugin, statusItem);

	const toggleSidebarChanges = async (): Promise<void> => {
		plugin.settings.disableSidebarChanges =
			!plugin.settings.disableSidebarChanges;
		await plugin.saveSettings();
	};

	plugin.registerDomEvent(statusItem, 'click', toggleSidebarChanges);
	plugin.registerDomEvent(statusItem, 'keydown', (event) => {
		if (event.key !== 'Enter' && event.key !== ' ') {
			return;
		}
		event.preventDefault();
		void toggleSidebarChanges();
	});
	plugin.register(() => statusItems.delete(plugin));
	refreshSidebarStatusItem(plugin);
}
