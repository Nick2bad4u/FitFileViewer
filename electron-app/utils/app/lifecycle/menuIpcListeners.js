import { openFileSelector } from "../../files/import/openFileSelector.js";
const accentColorPickerModulePath = "../../../ui/modals/accentColorPicker.js";
function getMenuIpcGlobal() {
    return globalThis;
}
function getMenuForwardRegistry() {
    const holder = getMenuIpcGlobal();
    if (!(holder.__ffvMenuForwardRegistry instanceof Set)) {
        holder.__ffvMenuForwardRegistry = new Set();
    }
    return holder.__ffvMenuForwardRegistry;
}
async function openAccentColorPickerFromModule({ debugMenuLog, showNotification, }) {
    try {
        // eslint-disable-next-line no-unsanitized/method -- Static local module path; this modal remains JS-only during this migration slice.
        const mod = (await import(accentColorPickerModulePath));
        if (typeof mod.openAccentColorPicker === "function") {
            getMenuIpcGlobal().showAccentColorPicker = () => {
                mod.openAccentColorPicker?.();
            };
            getMenuIpcGlobal().showAccentColorPicker?.();
            return;
        }
        debugMenuLog("Accent color picker module loaded, but openAccentColorPicker is unavailable");
        showNotification("Accent color picker is unavailable.", "error", 3000);
    }
    catch (error) {
        debugMenuLog("Failed to load accent color picker module", error);
        showNotification("Failed to open accent color picker.", "error", 3000);
    }
}
function buildKeyboardShortcutsHtml() {
    const shortcuts = [
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
        .map(([action, keys]) => `<li class='shortcut-list-item'><strong>${action}:</strong> <span class='shortcut-key'>${keys}</span></li>`)
        .join("");
    return `<h2>Keyboard Shortcuts</h2><ul class="shortcut-list">${items}</ul>`;
}
function loadKeyboardShortcutsScript({ debugMenuLog, showAboutModal, }) {
    const script = document.createElement("script");
    const scriptController = new AbortController();
    script.src = "./utils/keyboardShortcutsModal.js";
    script.addEventListener("load", () => {
        scriptController.abort();
        debugMenuLog("Script loaded successfully");
        if (typeof getMenuIpcGlobal().showKeyboardShortcutsModal ===
            "function") {
            debugMenuLog("Calling showKeyboardShortcutsModal function");
            getMenuIpcGlobal().showKeyboardShortcutsModal?.();
            return;
        }
        debugMenuLog("showKeyboardShortcutsModal function not available after script load");
    }, { signal: scriptController.signal });
    script.addEventListener("error", (error) => {
        scriptController.abort();
        debugMenuLog("Failed to load keyboard shortcuts modal script:", error);
        showAboutModal(buildKeyboardShortcutsHtml());
    }, { signal: scriptController.signal });
    document.head.append(script);
}
/**
 * Registers renderer-side IPC listeners that are specifically driven by the
 * Electron application menu.
 */
export function registerMenuIpcListeners({ debugMenuLog, isTestEnvironment, showAboutModal, showNotification, trackUnsubscribe, }) {
    const menuGlobal = getMenuIpcGlobal();
    const electronAPI = menuGlobal.electronAPI;
    if (!electronAPI || typeof electronAPI.onIpc !== "function") {
        return;
    }
    trackUnsubscribe(electronAPI.onIpc("menu-restart-update", () => {
        try {
            getMenuIpcGlobal().electronAPI?.installUpdate?.();
        }
        catch {
            /* ignore */
        }
    }));
    trackUnsubscribe(electronAPI.onIpc("menu-open-overlay", async () => {
        try {
            await openFileSelector();
        }
        catch (error) {
            if (!isTestEnvironment) {
                console.error("[MenuIpcListeners] Failed to open overlay selector:", error);
            }
            showNotification("Failed to open overlay selector.", "error", 3000);
        }
    }));
    const ensureMenuForwarder = (channel) => {
        const registry = getMenuForwardRegistry();
        if (registry.has(channel)) {
            return;
        }
        registry.add(channel);
        trackUnsubscribe(electronAPI.onIpc(channel, () => {
            getMenuIpcGlobal().electronAPI?.send?.(channel);
        }));
    };
    ensureMenuForwarder("menu-save-as");
    ensureMenuForwarder("menu-export");
    trackUnsubscribe(electronAPI.onIpc("menu-about", () => {
        // The styled system info section loads version data by itself.
        showAboutModal();
    }));
    trackUnsubscribe(electronAPI.onIpc("open-accent-color-picker", async () => {
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
    }));
    trackUnsubscribe(electronAPI.onIpc("menu-keyboard-shortcuts", () => {
        debugMenuLog("Keyboard shortcuts menu clicked - starting handler");
        if (getMenuIpcGlobal().showKeyboardShortcutsModal === undefined) {
            debugMenuLog("Modal script not loaded, loading dynamically...");
            loadKeyboardShortcutsScript({
                debugMenuLog,
                showAboutModal,
            });
            return;
        }
        debugMenuLog("Modal script already loaded, calling function directly");
        getMenuIpcGlobal().showKeyboardShortcutsModal?.();
    }));
}
