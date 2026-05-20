/**
 * @typedef {import("../../types/main/window/bootstrapMainWindow").AppStateValue} AppStateValue
 * @typedef {import("../../types/main/window/bootstrapMainWindow").AutoUpdaterLike} AutoUpdaterLike
 * @typedef {import("../../types/main/window/bootstrapMainWindow").BrowserWindowApi} BrowserWindowApi
 * @typedef {import("../../types/main/window/bootstrapMainWindow").BrowserWindowConstructor} BrowserWindowConstructor
 * @typedef {import("../../types/main/window/bootstrapMainWindow").LogWithContext} LogWithContext
 * @typedef {import("../../types/main/window/bootstrapMainWindow").MainWindowLike} MainWindowLike
 *
 * @typedef {{
 *     browserWindowRef: () => BrowserWindowApi | BrowserWindowConstructor | null | undefined;
 *     getAppState: (key: string) => AppStateValue;
 *     setAppState: (key: string, value: AppStateValue) => void;
 *     safeCreateAppMenu: (
 *         win: MainWindowLike,
 *         theme: string,
 *         loadedPath?: string | null
 *     ) => void;
 *     CONSTANTS: { DEFAULT_THEME: string };
 *     getThemeFromRenderer: (win: MainWindowLike) => Promise<string>;
 *     sendToRenderer: (
 *         win: MainWindowLike,
 *         channel: string,
 *         ...args: unknown[]
 *     ) => void;
 *     resolveAutoUpdater: () => Promise<AutoUpdaterLike | null>;
 *     setupAutoUpdater: (
 *         mainWindow: MainWindowLike,
 *         autoUpdater: AutoUpdaterLike | null
 *     ) => void;
 *     logWithContext: LogWithContext;
 * }} InitializeMainWindowOptions
 */

/**
 * @param {unknown} error
 *
 * @returns {string}
 */
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Create or reuse the main application window and wire core lifecycle handlers.
 *
 * @param {InitializeMainWindowOptions} options
 *
 * @returns {Promise<MainWindowLike>}
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

    /** @type {MainWindowLike | undefined} */
    let mainWindow;
    if (process.env.NODE_ENV === "test" || !isConstructor) {
        try {
            /** @type {MainWindowLike[] | undefined} */
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
            if (
                (!list || list.length === 0) &&
                BW &&
                typeof BW.getAllWindows === "function"
            ) {
                try {
                    list = BW.getAllWindows();
                } catch {
                    /* Ignore errors */
                }
            }
            mainWindow =
                Array.isArray(list) && list.length > 0 ? list[0] : undefined;
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

    logWithContext(
        "info",
        "Calling createAppMenu after window selection/creation"
    );
    safeCreateAppMenu(
        mainWindow,
        CONSTANTS.DEFAULT_THEME,
        getAppState("loadedFitFilePath")
    );

    if (
        mainWindow &&
        mainWindow.webContents &&
        typeof mainWindow.webContents.on === "function"
    ) {
        mainWindow.webContents.on("did-finish-load", async () => {
            logWithContext(
                "info",
                "did-finish-load event fired, syncing theme"
            );

            if (!getAppState("autoUpdaterInitialized")) {
                try {
                    const autoUpdater = await resolveAutoUpdater();
                    setupAutoUpdater(mainWindow, autoUpdater);
                    if (
                        autoUpdater &&
                        typeof autoUpdater.checkForUpdatesAndNotify ===
                            "function"
                    ) {
                        await autoUpdater.checkForUpdatesAndNotify();
                        setAppState("autoUpdaterInitialized", true);
                    }
                } catch (error) {
                    logWithContext("error", "Failed to setup auto-updater:", {
                        error: getErrorMessage(error),
                    });
                }
            }

            try {
                const theme = await getThemeFromRenderer(mainWindow);
                logWithContext("info", "Retrieved theme from renderer", {
                    theme,
                });
                safeCreateAppMenu(
                    mainWindow,
                    theme,
                    getAppState("loadedFitFilePath")
                );
                sendToRenderer(mainWindow, "set-theme", theme);
            } catch (error) {
                logWithContext(
                    "warn",
                    "Failed to get theme from renderer, using fallback",
                    {
                        error: getErrorMessage(error),
                    }
                );
                safeCreateAppMenu(
                    mainWindow,
                    CONSTANTS.DEFAULT_THEME,
                    getAppState("loadedFitFilePath")
                );
                sendToRenderer(
                    mainWindow,
                    "set-theme",
                    CONSTANTS.DEFAULT_THEME
                );
            }
        });
    }

    return mainWindow;
}

module.exports = {
    initializeMainWindow,
};
