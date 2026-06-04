import { openFileSelector } from "../../files/import/openFileSelector.js";
import type { ElectronAPI } from "../../../shared/preloadApi.js";

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
        ElectronAPI,
        | "installUpdate"
        | MenuEventMethodName
        | "requestExport"
        | "requestSaveAs"
    >
>;

type MenuIpcGlobal = typeof globalThis & {
    __ffvMenuForwardRegistry?: Set<MenuSendChannel>;
    electronAPI?: MenuElectronAPI;
    showAccentColorPicker?: () => void;
    showKeyboardShortcutsModal?: () => void;
};

type RegisterMenuIpcListenersParams = {
    debugMenuLog: (...args: unknown[]) => void;
    isTestEnvironment: boolean;
    showAboutModal: (html?: string) => void;
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
    showKeyboardShortcutsModal?: () => void;
};

type ShortcutDefinition = readonly [action: string, keys: string];

const accentColorPickerModulePath =
    "../../../ui/modals/accentColorPicker.js" as const;
const keyboardShortcutsModalModulePath =
    "../../ui/modals/keyboardShortcutsModal.js" as const;

function getMenuIpcGlobal(): MenuIpcGlobal {
    return globalThis;
}

function getMenuForwardRegistry(): Set<MenuSendChannel> {
    const holder = getMenuIpcGlobal();
    if (!(holder.__ffvMenuForwardRegistry instanceof Set)) {
        holder.__ffvMenuForwardRegistry = new Set<MenuSendChannel>();
    }

    return holder.__ffvMenuForwardRegistry;
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
            getMenuIpcGlobal().showAccentColorPicker = () => {
                mod.openAccentColorPicker?.();
            };
            getMenuIpcGlobal().showAccentColorPicker?.();
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
    showAboutModal,
}: Pick<
    RegisterMenuIpcListenersParams,
    "debugMenuLog" | "showAboutModal"
>): Promise<void> {
    try {
        // eslint-disable-next-line no-unsanitized/method -- Static local module path owned by the app bundle.
        const mod = (await import(
            keyboardShortcutsModalModulePath
        )) as KeyboardShortcutsModalModule;
        if (typeof mod.showKeyboardShortcutsModal === "function") {
            getMenuIpcGlobal().showKeyboardShortcutsModal =
                mod.showKeyboardShortcutsModal;
            mod.showKeyboardShortcutsModal();
            return;
        }

        debugMenuLog(
            "Keyboard shortcuts modal module loaded, but showKeyboardShortcutsModal is unavailable"
        );
        showAboutModal(buildKeyboardShortcutsHtml());
    } catch (error) {
        debugMenuLog("Failed to load keyboard shortcuts modal module:", error);
        showAboutModal(buildKeyboardShortcutsHtml());
    }
}

/**
 * Registers renderer-side IPC listeners that are specifically driven by the
 * Electron application menu.
 */
export function registerMenuIpcListeners({
    debugMenuLog,
    isTestEnvironment,
    showAboutModal,
    showNotification,
    trackUnsubscribe,
}: RegisterMenuIpcListenersParams): void {
    const menuGlobal = getMenuIpcGlobal();
    const electronAPI = menuGlobal.electronAPI;
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
            getMenuIpcGlobal().electronAPI?.installUpdate?.();
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
                    getMenuIpcGlobal().electronAPI?.requestSaveAs?.();
                    return;
                }

                getMenuIpcGlobal().electronAPI?.requestExport?.();
            }
        );
    };

    ensureMenuForwarder("menu-save-as");
    ensureMenuForwarder("menu-export");

    trackMenuEvent("onMenuAbout", () => {
        // The styled system info section loads version data by itself.
        showAboutModal();
    });

    trackMenuEvent("onOpenAccentColorPicker", async () => {
        debugMenuLog("Opening accent color picker");
        const globalAccentPicker = getMenuIpcGlobal().showAccentColorPicker;
        if (typeof globalAccentPicker === "function") {
            globalAccentPicker();
            return;
        }

        await openAccentColorPickerFromModule({
            debugMenuLog,
            showNotification,
        });
    });

    trackMenuEvent("onMenuKeyboardShortcuts", async () => {
        debugMenuLog("Keyboard shortcuts menu clicked - starting handler");

        const globalKeyboardShortcutsModal =
            getMenuIpcGlobal().showKeyboardShortcutsModal;
        if (typeof globalKeyboardShortcutsModal !== "function") {
            debugMenuLog(
                "Keyboard shortcuts modal not loaded, importing dynamically..."
            );
            await openKeyboardShortcutsModalFromModule({
                debugMenuLog,
                showAboutModal,
            });
            return;
        }

        debugMenuLog(
            "Keyboard shortcuts modal already loaded, calling function directly"
        );
        globalKeyboardShortcutsModal();
    });
}
