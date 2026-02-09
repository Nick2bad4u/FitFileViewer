import { openFileSelector } from "../../files/import/openFileSelector.js";

/**
 * Registers renderer-side IPC listeners that are specifically driven by the
 * Electron application menu.
 *
 * Why this module exists:
 *
 * - `listeners.js` was exceeding the repo's `max-lines` lint threshold.
 * - Menu IPC wiring is logically separable from general UI lifecycle listeners.
 *
 * @param {{
 *     trackUnsubscribe: (maybeUnsubscribe: unknown) => void;
 *     debugMenuLog: (...args: any[]) => void;
 *     isTestEnvironment: boolean;
 *     showAboutModal: (...args: any[]) => void;
 *     showNotification: (message: string, type?: string, durationMs?: number) => void;
 * }} params
 */
export function registerMenuIpcListeners({
    debugMenuLog,
    isTestEnvironment,
    showAboutModal,
    showNotification,
    trackUnsubscribe,
}) {
    if (
        !globalThis.electronAPI ||
        typeof globalThis.electronAPI.onIpc !== "function"
    ) {
        return;
    }

    // Menu-driven actions that must run in the renderer.
    trackUnsubscribe(
        globalThis.electronAPI.onIpc("menu-restart-update", () => {
            try {
                if (
                    globalThis.electronAPI &&
                    typeof globalThis.electronAPI.installUpdate === "function"
                ) {
                    globalThis.electronAPI.installUpdate();
                }
            } catch {
                /* ignore */
            }
        })
    );

    trackUnsubscribe(
        globalThis.electronAPI.onIpc("menu-open-overlay", async () => {
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

    // Forward selected menu events back to main process.
    // (Main triggers renderer event; renderer calls `electronAPI.send(channel)`;
    // main listens to that channel and performs the privileged action.)
    const ensureMenuForwarder = (channel) => {
        /** @type {Record<string, any>} */
        const holder = /** @type {any} */ (globalThis);
        if (!(holder.__ffvMenuForwardRegistry instanceof Set)) {
            holder.__ffvMenuForwardRegistry = new Set();
        }
        /** @type {Set<string>} */
        const registry = holder.__ffvMenuForwardRegistry;
        if (registry.has(channel)) {
            return;
        }
        registry.add(channel);
        trackUnsubscribe(
            globalThis.electronAPI.onIpc(channel, () => {
                if (
                    globalThis.electronAPI &&
                    typeof globalThis.electronAPI.send === "function"
                ) {
                    globalThis.electronAPI.send(channel);
                }
            })
        );
    };

    ensureMenuForwarder("menu-save-as");
    ensureMenuForwarder("menu-export");

    trackUnsubscribe(
        globalThis.electronAPI.onIpc("menu-about", () => {
            // Show the about modal without any content since the styled system info
            // section will automatically load and display all the version information.
            showAboutModal();
        })
    );

    trackUnsubscribe(
        globalThis.electronAPI.onIpc("open-accent-color-picker", async () => {
            debugMenuLog("Opening accent color picker");
            if (typeof globalThis.showAccentColorPicker === "function") {
                globalThis.showAccentColorPicker();
                return;
            }

            // In dev / non-bundled renderer entrypoints, the global helper may
            // not be registered. Load the modal on-demand so the app menu always works.
            try {
                const mod =
                    await import("../../../ui/modals/accentColorPicker.js");
                if (typeof mod.openAccentColorPicker === "function") {
                    globalThis.showAccentColorPicker = () => {
                        mod.openAccentColorPicker();
                    };
                    globalThis.showAccentColorPicker();
                } else {
                    debugMenuLog(
                        "Accent color picker module loaded, but openAccentColorPicker is unavailable"
                    );
                    showNotification(
                        "Accent color picker is unavailable.",
                        "error",
                        3000
                    );
                }
            } catch (error) {
                debugMenuLog(
                    "Failed to load accent color picker module",
                    error
                );
                showNotification(
                    "Failed to open accent color picker.",
                    "error",
                    3000
                );
            }
        })
    );

    trackUnsubscribe(
        globalThis.electronAPI.onIpc("menu-keyboard-shortcuts", () => {
            debugMenuLog("Keyboard shortcuts menu clicked - starting handler");

            // Check if the keyboard shortcuts modal script is already loaded.
            if (globalThis.showKeyboardShortcutsModal === undefined) {
                debugMenuLog("Modal script not loaded, loading dynamically...");
                const script = document.createElement("script");
                script.src = "./utils/keyboardShortcutsModal.js";
                script.addEventListener("load", () => {
                    debugMenuLog("Script loaded successfully");
                    if (
                        typeof globalThis.showKeyboardShortcutsModal ===
                        "function"
                    ) {
                        debugMenuLog(
                            "Calling showKeyboardShortcutsModal function"
                        );
                        globalThis.showKeyboardShortcutsModal();
                    } else {
                        debugMenuLog(
                            "showKeyboardShortcutsModal function not available after script load"
                        );
                    }
                });
                script.onerror = (error) => {
                    debugMenuLog(
                        "Failed to load keyboard shortcuts modal script:",
                        error
                    );

                    // Fallback to old implementation.
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
                    let html =
                        '<h2>Keyboard Shortcuts</h2><ul class="shortcut-list">';
                    for (const [action, keys] of shortcuts) {
                        html += `<li class='shortcut-list-item'><strong>${action}:</strong> <span class='shortcut-key'>${keys}</span></li>`;
                    }
                    html += "</ul>";
                    showAboutModal(html);
                };
                document.head.append(script);
                return;
            }

            debugMenuLog(
                "Modal script already loaded, calling function directly"
            );
            globalThis.showKeyboardShortcutsModal();
        })
    );
}
