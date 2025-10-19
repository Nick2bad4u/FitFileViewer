/**
 * Create or reuse the main application window and wire core lifecycle handlers.
 * @param {Object} options
 * @param {Function} options.browserWindowRef
 * @param {Function} options.getAppState
 * @param {Function} options.setAppState
 * @param {Function} options.safeCreateAppMenu
 * @param {any} options.CONSTANTS
 * @param {Function} options.getThemeFromRenderer
 * @param {Function} options.sendToRenderer
 * @param {Function} options.resolveAutoUpdater
 * @param {Function} options.setupAutoUpdater
 * @param {Function} options.logWithContext
 * @returns {Promise<any>}
 */
async function initializeMainWindow({
    browserWindowRef,
    getAppState,
    setAppState,
    safeCreateAppMenu,
    CONSTANTS,
    getThemeFromRenderer,
    sendToRenderer,
    resolveAutoUpdater,
    setupAutoUpdater,
    logWithContext,
}) {
    if (process.env.NODE_ENV === "test") {
        try {
            const { app: __wa } = require("electron");
            if (__wa && typeof __wa.whenReady === "function") {
                try {
                    __wa.whenReady();
                } catch {
                    /* Ignore errors */
                }
            }
        } catch {
            /* Ignore errors */
        }
    }

    const BW = browserWindowRef();
    const isConstructor = typeof BW === "function";

    let mainWindow;
    if (process.env.NODE_ENV === "test" || !isConstructor) {
        try {
            let list;
            try {
                const { BrowserWindow: __tBW } = require("electron");
                if (__tBW && typeof __tBW.getAllWindows === "function") {
                    try {
                        list = __tBW.getAllWindows();
                    } catch {
                        /* Ignore errors */
                    }
                }
            } catch {
                /* Ignore errors */
            }
            if ((!list || list.length === 0) && BW && typeof BW.getAllWindows === "function") {
                try {
                    list = BW.getAllWindows();
                } catch {
                    /* Ignore errors */
                }
            }
            mainWindow = Array.isArray(list) && list.length > 0 ? list[0] : undefined;
        } catch {
            /* Ignore errors */
        }

        if (!mainWindow) {
            mainWindow = {
                isDestroyed: () => false,
                webContents: {
                    executeJavaScript: async () => CONSTANTS.DEFAULT_THEME,
                    isDestroyed: () => false,
                    on: () => {},
                    send: () => {},
                },
            };
        }
    } else {
        const { createWindow } = require("../windowStateUtils");
        mainWindow = createWindow();
    }

    setAppState("mainWindow", mainWindow);

    logWithContext("info", "Calling createAppMenu after window selection/creation");
    safeCreateAppMenu(mainWindow, CONSTANTS.DEFAULT_THEME, getAppState("loadedFitFilePath"));

    if (mainWindow && mainWindow.webContents && typeof mainWindow.webContents.on === "function") {
        mainWindow.webContents.on("did-finish-load", async () => {
            logWithContext("info", "did-finish-load event fired, syncing theme");

            if (!getAppState("autoUpdaterInitialized")) {
                try {
                    const autoUpdater = await resolveAutoUpdater();
                    setupAutoUpdater(mainWindow, autoUpdater);
                    await autoUpdater.checkForUpdatesAndNotify();
                    setAppState("autoUpdaterInitialized", true);
                } catch (error) {
                    logWithContext("error", "Failed to setup auto-updater:", {
                        error: /** @type {Error} */ (error).message,
                    });
                }
            }

            try {
                const theme = await getThemeFromRenderer(mainWindow);
                logWithContext("info", "Retrieved theme from renderer", { theme });
                safeCreateAppMenu(mainWindow, theme, getAppState("loadedFitFilePath"));
                sendToRenderer(mainWindow, "set-theme", theme);
            } catch (error) {
                logWithContext("warn", "Failed to get theme from renderer, using fallback", {
                    error: /** @type {Error} */ (error).message,
                });
                safeCreateAppMenu(mainWindow, CONSTANTS.DEFAULT_THEME, getAppState("loadedFitFilePath"));
                sendToRenderer(mainWindow, "set-theme", CONSTANTS.DEFAULT_THEME);
            }
        });
    }

    return mainWindow;
}

module.exports = {
    initializeMainWindow,
};
