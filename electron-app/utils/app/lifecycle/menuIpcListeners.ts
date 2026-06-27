import { openFileSelector } from "../../files/import/openFileSelector.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import type { ElectronMenuEventApi } from "../../../shared/preloadApi.js";

type MenuSendChannel = "menu-export" | "menu-save-as";

type MenuEventMethodName =
    | "onMenuAbout"
    | "onMenuExport"
    | "onMenuKeyboardShortcuts"
    | "onMenuOpenOverlay"
    | "onMenuRestartUpdate"
    | "onMenuSaveAs"
    | "onOpenAccentColorPicker";

type MenuElectronAPI = Partial<
    Pick<
        ElectronMenuEventApi,
        | "installUpdate"
        | MenuEventMethodName
        | "requestExport"
        | "requestSaveAs"
    >
>;

type MenuElectronApiCandidate = {
    readonly [K in keyof MenuElectronAPI]?: unknown;
};

type RegisterMenuIpcListenersParams = {
    debugMenuLog: (...args: unknown[]) => void;
    electronApiScope?: RendererElectronApiScope | undefined;
    isTestEnvironment: boolean;
    showAboutModal: (
        html?: string,
        options?: { electronApiScope?: RendererElectronApiScope | undefined }
    ) => void;
    showNotification: (
        message: string,
        type?: string,
        durationMs?: number
    ) => void;
    trackUnsubscribe: (maybeUnsubscribe: unknown) => void;
};

type AccentColorPickerModule = {
    openAccentColorPicker?: () => void;
};

type KeyboardShortcutsModalModule = {
    showKeyboardShortcutsModal?: (options?: {
        electronApiScope?: RendererElectronApiScope | undefined;
    }) => void;
};

type ShowKeyboardShortcutsModal = NonNullable<
    KeyboardShortcutsModalModule["showKeyboardShortcutsModal"]
>;

type ShortcutDefinition = readonly [action: string, keys: string];

const accentColorPickerModulePath =
    "../../../ui/modals/accentColorPicker.js" as const;
const keyboardShortcutsModalModulePath =
    "../../ui/modals/keyboardShortcutsModal.js" as const;

let cachedAccentColorPicker: (() => void) | undefined;
let cachedKeyboardShortcutsModal: ShowKeyboardShortcutsModal | undefined;
const menuForwardRegistry = new Set<MenuSendChannel>();

function getMenuElectronApi(
    electronApiScope: RendererElectronApiScope | undefined
): MenuElectronAPI | null {
    return getRendererElectronApi(isMenuElectronApi, electronApiScope);
}

function isMenuElectronApi(value: unknown): value is MenuElectronAPI {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const api = value as MenuElectronApiCandidate;
    return (
        hasOptionalFunction(api.installUpdate) &&
        hasOptionalFunction(api.onMenuAbout) &&
        hasOptionalFunction(api.onMenuExport) &&
        hasOptionalFunction(api.onMenuKeyboardShortcuts) &&
        hasOptionalFunction(api.onMenuOpenOverlay) &&
        hasOptionalFunction(api.onMenuRestartUpdate) &&
        hasOptionalFunction(api.onMenuSaveAs) &&
        hasOptionalFunction(api.onOpenAccentColorPicker) &&
        hasOptionalFunction(api.requestExport) &&
        hasOptionalFunction(api.requestSaveAs)
    );
}

function hasOptionalFunction(value: unknown): boolean {
    return value === undefined || typeof value === "function";
}

function getMenuForwardRegistry(): Set<MenuSendChannel> {
    return menuForwardRegistry;
}

async function openAccentColorPickerFromModule({
    debugMenuLog,
    showNotification,
}: Pick<
    RegisterMenuIpcListenersParams,
    "debugMenuLog" | "showNotification"
>): Promise<void> {
    try {
        // eslint-disable-next-line no-unsanitized/method -- Static local module path generated from the TypeScript modal source.
        const mod = (await import(
            accentColorPickerModulePath
        )) as AccentColorPickerModule;
        if (typeof mod.openAccentColorPicker === "function") {
            cachedAccentColorPicker = mod.openAccentColorPicker;
            cachedAccentColorPicker();
            return;
        }

        debugMenuLog(
            "Accent color picker module loaded, but openAccentColorPicker is unavailable"
        );
        showNotification("Accent color picker is unavailable.", "error", 3000);
    } catch (error) {
        debugMenuLog("Failed to load accent color picker module", error);
        showNotification("Failed to open accent color picker.", "error", 3000);
    }
}

function buildKeyboardShortcutsHtml(): string {
    const shortcuts: readonly ShortcutDefinition[] = [
        ["Open File", "Ctrl+O"],
        ["Save As", "Ctrl+S"],
        ["Print", "Ctrl+P"],
        ["Close Window", "Ctrl+W"],
        ["Reload", "Ctrl+R"],
        ["Toggle DevTools", "Ctrl+Shift+I"],
        ["Toggle Fullscreen", "F11"],
        ["Export", "No default"],
        ["Theme: Dark/Light", "Settings > Theme"],
    ];
    const items = shortcuts
        .map(
            ([action, keys]) =>
                `<li class='shortcut-list-item'><strong>${action}:</strong> <span class='shortcut-key'>${keys}</span></li>`
        )
        .join("");

    return `<h2>Keyboard Shortcuts</h2><ul class="shortcut-list">${items}</ul>`;
}

async function openKeyboardShortcutsModalFromModule({
    debugMenuLog,
    electronApiScope,
    showAboutModal,
}: Pick<
    RegisterMenuIpcListenersParams,
    "debugMenuLog" | "electronApiScope" | "showAboutModal"
>): Promise<void> {
    try {
        // eslint-disable-next-line no-unsanitized/method -- Static local module path owned by the app bundle.
        const mod = (await import(
            keyboardShortcutsModalModulePath
        )) as KeyboardShortcutsModalModule;
        if (typeof mod.showKeyboardShortcutsModal === "function") {
            cachedKeyboardShortcutsModal = mod.showKeyboardShortcutsModal;
            cachedKeyboardShortcutsModal({ electronApiScope });
            return;
        }

        debugMenuLog(
            "Keyboard shortcuts modal module loaded, but showKeyboardShortcutsModal is unavailable"
        );
        showAboutModal(buildKeyboardShortcutsHtml(), { electronApiScope });
    } catch (error) {
        debugMenuLog("Failed to load keyboard shortcuts modal module:", error);
        showAboutModal(buildKeyboardShortcutsHtml(), { electronApiScope });
    }
}

/**
 * Registers renderer-side IPC listeners that are specifically driven by the
 * Electron application menu.
 */
export function registerMenuIpcListeners({
    debugMenuLog,
    electronApiScope,
    isTestEnvironment,
    showAboutModal,
    showNotification,
    trackUnsubscribe,
}: RegisterMenuIpcListenersParams): void {
    const electronAPI = getMenuElectronApi(electronApiScope);
    if (!electronAPI) {
        return;
    }

    const trackMenuEvent = (
        methodName: MenuEventMethodName,
        callback: () => unknown
    ): void => {
        const register = electronAPI[methodName];
        if (typeof register === "function") {
            trackUnsubscribe(register(callback));
        }
    };

    trackMenuEvent("onMenuRestartUpdate", () => {
        try {
            electronAPI.installUpdate?.();
        } catch {
            /* ignore */
        }
    });

    trackMenuEvent("onMenuOpenOverlay", async () => {
        try {
            await openFileSelector();
        } catch (error) {
            if (!isTestEnvironment) {
                console.error(
                    "[MenuIpcListeners] Failed to open overlay selector:",
                    error
                );
            }
            showNotification("Failed to open overlay selector.", "error", 3000);
        }
    });

    const ensureMenuForwarder = (channel: MenuSendChannel): void => {
        const registry = getMenuForwardRegistry();
        if (registry.has(channel)) {
            return;
        }

        registry.add(channel);
        trackMenuEvent(
            channel === "menu-save-as" ? "onMenuSaveAs" : "onMenuExport",
            () => {
                if (channel === "menu-save-as") {
                    electronAPI.requestSaveAs?.();
                    return;
                }

                electronAPI.requestExport?.();
            }
        );
    };

    ensureMenuForwarder("menu-save-as");
    ensureMenuForwarder("menu-export");

    trackMenuEvent("onMenuAbout", () => {
        // The styled system info section loads version data by itself.
        showAboutModal("", { electronApiScope });
    });

    trackMenuEvent("onOpenAccentColorPicker", async () => {
        debugMenuLog("Opening accent color picker");
        if (cachedAccentColorPicker) {
            cachedAccentColorPicker();
            return;
        }

        await openAccentColorPickerFromModule({
            debugMenuLog,
            showNotification,
        });
    });

    trackMenuEvent("onMenuKeyboardShortcuts", async () => {
        debugMenuLog("Keyboard shortcuts menu clicked - starting handler");

        const globalKeyboardShortcutsModal = cachedKeyboardShortcutsModal;
        if (typeof globalKeyboardShortcutsModal !== "function") {
            debugMenuLog(
                "Keyboard shortcuts modal not loaded, importing dynamically..."
            );
            await openKeyboardShortcutsModalFromModule({
                debugMenuLog,
                electronApiScope,
                showAboutModal,
            });
            return;
        }

        debugMenuLog(
            "Keyboard shortcuts modal already loaded, calling function directly"
        );
        globalKeyboardShortcutsModal({ electronApiScope });
    });
}

/**
 * Reset module-owned listener registry state for isolated tests.
 */
export function resetMenuIpcListenerStateForTests(): void {
    cachedAccentColorPicker = undefined;
    cachedKeyboardShortcutsModal = undefined;
    menuForwardRegistry.clear();
}
