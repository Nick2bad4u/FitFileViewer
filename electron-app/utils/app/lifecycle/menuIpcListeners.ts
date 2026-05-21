import { openFileSelector } from "../../files/import/openFileSelector.js";

type MenuSendChannel = "menu-export" | "menu-save-as";
type MenuIpcChannel =
    | MenuSendChannel
    | "menu-about"
    | "menu-keyboard-shortcuts"
    | "menu-open-overlay"
    | "menu-restart-update"
    | "open-accent-color-picker";

type Unsubscribe = () => void;

type MenuElectronAPI = {
    installUpdate?: () => void;
    onIpc: (
        channel: MenuIpcChannel,
        callback: (...args: unknown[]) => unknown
    ) => Unsubscribe | undefined;
    send?: (channel: MenuSendChannel) => void;
};

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
    return globalThis as MenuIpcGlobal;
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
        // eslint-disable-next-line no-unsanitized/method -- Static local module path; this modal remains JS-only during this migration slice.
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
    if (!electronAPI || typeof electronAPI.onIpc !== "function") {
        return;
    }

    trackUnsubscribe(
        electronAPI.onIpc("menu-restart-update", () => {
            try {
                getMenuIpcGlobal().electronAPI?.installUpdate?.();
            } catch {
                /* ignore */
            }
        })
    );

    trackUnsubscribe(
        electronAPI.onIpc("menu-open-overlay", async () => {
            try {
                await openFileSelector();
            } catch (error) {
                if (!isTestEnvironment) {
                    console.error(
                        "[MenuIpcListeners] Failed to open overlay selector:",
                        error
                    );
                }
                showNotification(
                    "Failed to open overlay selector.",
                    "error",
                    3000
                );
            }
        })
    );

    const ensureMenuForwarder = (channel: MenuSendChannel): void => {
        const registry = getMenuForwardRegistry();
        if (registry.has(channel)) {
            return;
        }

        registry.add(channel);
        trackUnsubscribe(
            electronAPI.onIpc(channel, () => {
                getMenuIpcGlobal().electronAPI?.send?.(channel);
            })
        );
    };

    ensureMenuForwarder("menu-save-as");
    ensureMenuForwarder("menu-export");

    trackUnsubscribe(
        electronAPI.onIpc("menu-about", () => {
            // The styled system info section loads version data by itself.
            showAboutModal();
        })
    );

    trackUnsubscribe(
        electronAPI.onIpc("open-accent-color-picker", async () => {
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
        })
    );

    trackUnsubscribe(
        electronAPI.onIpc("menu-keyboard-shortcuts", async () => {
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
        })
    );
}
