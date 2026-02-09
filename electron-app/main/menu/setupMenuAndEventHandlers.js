const { CONSTANTS } = require("../constants");
const {
    registerIpcHandle,
    registerIpcListener,
} = require("../ipc/ipcRegistry");
const { sendToRenderer } = require("../ipc/sendToRenderer");
const { logWithContext } = require("../logging/logWithContext");
const { browserWindowRef, dialogRef } = require("../runtime/electronAccess");
const { fs } = require("../runtime/nodeModules");
const { getAppState } = require("../state/appState");
const { validateWindow } = require("../window/windowValidation");
const { safeCreateAppMenu } = require("./safeCreateAppMenu");

/**
 * Registers menu-related IPC handlers and listeners.
 */
function setupMenuAndEventHandlers() {
    registerIpcListener("theme-changed", async (event, theme) => {
        const win = browserWindowRef().fromWebContents(event.sender);
        if (validateWindow(win, "theme-changed event")) {
            // Persist the theme in main-process settings so `theme:get` stays in sync.
            // Renderer typically stores "ffv-theme" in localStorage, but the
            // renderer's theme initialization also consults main via theme:get.
            // Without persisting here, the main process can keep returning the
            // previous theme and cause a bounce-back.
            try {
                const raw =
                    typeof theme === "string" ? theme.trim().toLowerCase() : "";
                const normalized = raw === "system" ? "auto" : raw;

                if (
                    normalized === "dark" ||
                    normalized === "light" ||
                    normalized === "auto"
                ) {
                    const { Conf } = require("electron-conf");
                    const conf = new Conf({
                        name: CONSTANTS.SETTINGS_CONFIG_NAME,
                    });
                    conf.set("theme", normalized);
                }
            } catch {
                // Best-effort persistence; menu creation should still proceed.
            }

            safeCreateAppMenu(
                win,
                theme || CONSTANTS.DEFAULT_THEME,
                getAppState("loadedFitFilePath")
            );
        }
    });

    const updateHandlers = {
        "install-update": () => {
            try {
                const { autoUpdater } = require("electron-updater");
                autoUpdater.quitAndInstall();
            } catch (error) {
                logWithContext("error", "Error during quitAndInstall:", {
                    error: /** @type {Error} */ (error).message,
                });
                if (process.platform === CONSTANTS.PLATFORMS.LINUX) {
                    dialogRef().showMessageBox({
                        message:
                            "Your Linux Distro does not support auto-updating, please download and install the latest version manually from the website.",
                        title: "Manual Update Required",
                        type: "info",
                    });
                }
            }
        },
        "menu-check-for-updates": () => {
            try {
                const { autoUpdater } = require("electron-updater");
                autoUpdater.checkForUpdates();
            } catch (error) {
                logWithContext("error", "Failed to check for updates:", {
                    error: /** @type {Error} */ (error).message,
                });
            }
        },
        "menu-restart-update": () => {
            try {
                const { autoUpdater } = require("electron-updater");
                autoUpdater.quitAndInstall();
            } catch (error) {
                logWithContext("error", "Error during restart and install:", {
                    error: /** @type {Error} */ (error).message,
                });
                if (process.platform === CONSTANTS.PLATFORMS.LINUX) {
                    dialogRef().showMessageBox({
                        message:
                            "Your Linux Distro does not support auto-updating, please download and install the latest version manually from the website.",
                        title: "Manual Update Required",
                        type: "info",
                    });
                }
            }
        },
    };

    for (const [event, handler] of Object.entries(updateHandlers)) {
        registerIpcListener(event, handler);
    }

    const fileMenuHandlers = {
        "menu-export": async (event) => {
            const loadedFilePath = getAppState("loadedFitFilePath");
            const win = browserWindowRef().fromWebContents(event.sender);
            if (!loadedFilePath || !win) {
                return;
            }

            try {
                const { canceled, filePath } = await dialogRef().showSaveDialog(
                    win,
                    {
                        defaultPath: loadedFilePath.replace(/\.fit$/i, ".csv"),
                        filters: CONSTANTS.DIALOG_FILTERS.EXPORT_FILES,
                        title: "Export As",
                    }
                );

                if (!canceled && filePath) {
                    sendToRenderer(win, "export-file", filePath);
                }
            } catch (error) {
                logWithContext("error", "Failed to show export dialog:", {
                    error: /** @type {Error} */ (error).message,
                });
            }
        },
        "menu-save-as": async (event) => {
            const loadedFilePath = getAppState("loadedFitFilePath");
            const win = browserWindowRef().fromWebContents(event.sender);
            if (!loadedFilePath || !win) {
                return;
            }

            try {
                const { canceled, filePath } = await dialogRef().showSaveDialog(
                    win,
                    {
                        defaultPath: loadedFilePath,
                        filters: CONSTANTS.DIALOG_FILTERS.ALL_FILES,
                        title: "Save As",
                    }
                );

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
                    `Save failed: ${error}`,
                    "error"
                );
                logWithContext("error", "Failed to save file:", {
                    error: /** @type {Error} */ (error).message,
                });
            }
        },
    };

    for (const [event, handler] of Object.entries(fileMenuHandlers)) {
        registerIpcListener(event, handler);
    }

    registerIpcListener("set-fullscreen", (_event, flag) => {
        const win = browserWindowRef().getFocusedWindow();
        if (validateWindow(win, "set-fullscreen event")) {
            win.setFullScreen(Boolean(flag));
        }
    });

    registerIpcHandle("devtools-inject-menu", (event, theme, fitFilePath) => {
        const filePath = fitFilePath || null;
        const resolvedTheme = theme || CONSTANTS.DEFAULT_THEME;
        const win = browserWindowRef().fromWebContents(event.sender);
        logWithContext("info", "Manual menu injection requested", {
            fitFilePath: filePath,
            theme: resolvedTheme,
        });
        if (win) {
            safeCreateAppMenu(win, resolvedTheme, filePath);
        }
        return true;
    });
}

module.exports = { setupMenuAndEventHandlers };
