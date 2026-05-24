"use strict";
{
    const MENU_FILE_EVENTS = ["menu-export", "menu-save-as"];
    const MENU_UPDATE_EVENTS = [
        "install-update",
        "menu-check-for-updates",
        "menu-restart-update",
    ];
    const { CONSTANTS } = require("../constants");
    const {
        registerIpcHandle,
        registerIpcListener,
    } = require("../ipc/ipcRegistry");
    const { sendToRenderer } = require("../ipc/sendToRenderer");
    const { logWithContext } = require("../logging/logWithContext");
    const {
        browserWindowRef,
        dialogRef,
    } = require("../runtime/electronAccess");
    const { fs } = require("../runtime/nodeModules");
    const { getAppState } = require("../state/appState");
    const { validateWindow } = require("../window/windowValidation");
    const { safeCreateAppMenu } = require("./safeCreateAppMenu");
    function getErrorMessage(error) {
        return error instanceof Error ? error.message : String(error);
    }
    function getBrowserWindowFromEvent(event) {
        return browserWindowRef().fromWebContents(event.sender);
    }
    function getLoadedFitFilePath() {
        const loadedFilePath = getAppState("loadedFitFilePath");
        return typeof loadedFilePath === "string" ? loadedFilePath : undefined;
    }
    function getThemeFromPayload(theme) {
        return typeof theme === "string" && theme
            ? theme
            : CONSTANTS.DEFAULT_THEME;
    }
    function normalizePersistedTheme(theme) {
        const raw = typeof theme === "string" ? theme.trim().toLowerCase() : "";
        const normalized = raw === "system" ? "auto" : raw;
        return normalized === "dark" ||
            normalized === "light" ||
            normalized === "auto"
            ? normalized
            : null;
    }
    function persistThemeForMenu(theme) {
        const normalized = normalizePersistedTheme(theme);
        if (!normalized) {
            return;
        }
        const { Conf } = require("electron-conf");
        if (typeof Conf !== "function") {
            return;
        }
        const conf = new Conf({
            name: CONSTANTS.SETTINGS_CONFIG_NAME,
        });
        conf.set("theme", normalized);
    }
    function requireAutoUpdater() {
        const { autoUpdater } = require("electron-updater");
        if (!autoUpdater) {
            throw new Error("electron-updater autoUpdater is unavailable");
        }
        return autoUpdater;
    }
    function showLinuxManualUpdateMessage() {
        if (process.platform !== CONSTANTS.PLATFORMS.LINUX) {
            return;
        }
        const dialog = dialogRef();
        if (dialog && typeof dialog.showMessageBox === "function") {
            void dialog.showMessageBox({
                message:
                    "Your Linux Distro does not support auto-updating, please download and install the latest version manually from the website.",
                title: "Manual Update Required",
                type: "info",
            });
        }
    }
    function logUpdaterError(message, error) {
        logWithContext("error", message, {
            error: getErrorMessage(error),
        });
    }
    /**
     * Registers menu-related IPC handlers and listeners.
     */
    function setupMenuAndEventHandlers() {
        registerIpcListener("theme-changed", async (event, theme) => {
            const win = getBrowserWindowFromEvent(event);
            if (win && validateWindow(win, "theme-changed event")) {
                // Persist the theme in main-process settings so `theme:get`
                // stays in sync with renderer localStorage.
                try {
                    persistThemeForMenu(theme);
                } catch {
                    // Best-effort persistence; menu creation should still proceed.
                }
                safeCreateAppMenu(
                    win,
                    getThemeFromPayload(theme),
                    getLoadedFitFilePath()
                );
            }
        });
        const updateHandlers = {
            "install-update": () => {
                try {
                    requireAutoUpdater().quitAndInstall?.();
                } catch (error) {
                    logUpdaterError("Error during quitAndInstall:", error);
                    showLinuxManualUpdateMessage();
                }
            },
            "menu-check-for-updates": () => {
                try {
                    void requireAutoUpdater().checkForUpdates?.();
                } catch (error) {
                    logUpdaterError("Failed to check for updates:", error);
                }
            },
            "menu-restart-update": () => {
                try {
                    requireAutoUpdater().quitAndInstall?.();
                } catch (error) {
                    logUpdaterError("Error during restart and install:", error);
                    showLinuxManualUpdateMessage();
                }
            },
        };
        for (const event of MENU_UPDATE_EVENTS) {
            const handler = updateHandlers[event];
            registerIpcListener(event, handler);
        }
        const fileMenuHandlers = {
            "menu-export": (event) => {
                const ipcEvent = event;
                return (async () => {
                    const loadedFilePath = getLoadedFitFilePath();
                    const win = getBrowserWindowFromEvent(ipcEvent);
                    if (!loadedFilePath || !win) {
                        return;
                    }
                    try {
                        const dialog = dialogRef();
                        if (
                            !dialog ||
                            typeof dialog.showSaveDialog !== "function"
                        ) {
                            throw new Error("Save dialog is unavailable");
                        }
                        const { canceled, filePath } =
                            await dialog.showSaveDialog(win, {
                                defaultPath: loadedFilePath.replace(
                                    /\.fit$/i,
                                    ".csv"
                                ),
                                filters: CONSTANTS.DIALOG_FILTERS.EXPORT_FILES,
                                title: "Export As",
                            });
                        if (!canceled && filePath) {
                            sendToRenderer(win, "export-file", filePath);
                        }
                    } catch (error) {
                        logWithContext(
                            "error",
                            "Failed to show export dialog:",
                            {
                                error: getErrorMessage(error),
                            }
                        );
                    }
                })();
            },
            "menu-save-as": (event) => {
                const ipcEvent = event;
                return (async () => {
                    const loadedFilePath = getLoadedFitFilePath();
                    const win = getBrowserWindowFromEvent(ipcEvent);
                    if (!loadedFilePath || !win) {
                        return;
                    }
                    try {
                        const dialog = dialogRef();
                        if (
                            !dialog ||
                            typeof dialog.showSaveDialog !== "function"
                        ) {
                            throw new Error("Save dialog is unavailable");
                        }
                        if (!fs) {
                            throw new Error("fs module is unavailable");
                        }
                        const { canceled, filePath } =
                            await dialog.showSaveDialog(win, {
                                defaultPath: loadedFilePath,
                                filters: CONSTANTS.DIALOG_FILTERS.ALL_FILES,
                                title: "Save As",
                            });
                        if (!canceled && filePath) {
                            fs.copyFileSync(loadedFilePath, filePath);
                            sendToRenderer(
                                win,
                                "show-notification",
                                "File saved successfully.",
                                "success"
                            );
                        }
                    } catch (error) {
                        sendToRenderer(
                            win,
                            "show-notification",
                            `Save failed: ${getErrorMessage(error)}`,
                            "error"
                        );
                        logWithContext("error", "Failed to save file:", {
                            error: getErrorMessage(error),
                        });
                    }
                })();
            },
        };
        for (const event of MENU_FILE_EVENTS) {
            const handler = fileMenuHandlers[event];
            registerIpcListener(event, handler);
        }
        registerIpcListener("set-fullscreen", (_event, flag) => {
            const win = browserWindowRef().getFocusedWindow();
            if (win && validateWindow(win, "set-fullscreen event")) {
                win.setFullScreen(Boolean(flag));
            }
        });
        registerIpcHandle(
            "devtools-inject-menu",
            (event, theme, fitFilePath) => {
                const filePath =
                    typeof fitFilePath === "string" && fitFilePath
                        ? fitFilePath
                        : null;
                const resolvedTheme = getThemeFromPayload(theme);
                const win = getBrowserWindowFromEvent(event);
                logWithContext("info", "Manual menu injection requested", {
                    fitFilePath: filePath,
                    theme: resolvedTheme,
                });
                if (win) {
                    safeCreateAppMenu(win, resolvedTheme, filePath);
                }
                return true;
            }
        );
    }
    module.exports = { setupMenuAndEventHandlers };
}
