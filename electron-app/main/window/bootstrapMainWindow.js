/**
 * @typedef {{
 *     executeJavaScript?: (script: string) => Promise<unknown>;
 *     isDestroyed?: () => boolean;
 *     on: (
 *         event: "did-finish-load",
 *         listener: () => void | Promise<void>
 *     ) => void;
 *     send?: (channel: string, ...args: unknown[]) => void;
 * }} WebContentsLike
 *
 * @typedef {{
 *     isDestroyed?: () => boolean;
 *     webContents: WebContentsLike;
 * }} MainWindowLike
 *
 * @typedef {{
 *     getAllWindows?: () => MainWindowLike[];
 * }} BrowserWindowApi
 *
 * @typedef {new (...args: never[]) => MainWindowLike} BrowserWindowConstructor
 *
 * @typedef {boolean | string | MainWindowLike | null | undefined} AppStateValue
 *
 * @typedef {{
 *     checkForUpdatesAndNotify: () => Promise<unknown> | unknown;
 * }} AutoUpdaterLike
 *
 * @typedef {(
 *     level: "error" | "warn" | "info",
 *     message: string,
 *     context?: Record<string, unknown>
 * ) => void} options.logWithContext
 *
 * @typedef {{
 *     browserWindowRef: () =>
 *         | BrowserWindowApi
 *         | BrowserWindowConstructor
 *         | null
 *         | undefined;
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
 *     resolveAutoUpdaterAsync: () => Promise<AutoUpdaterLike | null>;
 *     setupAutoUpdater: (
 *         mainWindow: MainWindowLike,
 *         autoUpdater: AutoUpdaterLike | null
 *     ) => void;
 *     logWithContext: LogWithContext;
 * }} BootstrapMainWindowOptions
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
 * Creates or restores the main BrowserWindow and wires up load-time handlers.
 *
 * @param {BootstrapMainWindowOptions} options
 *
 * @returns {Promise<MainWindowLike>}
 */
async function bootstrapMainWindow({
    browserWindowRef,
    getAppState,
    setAppState,
    safeCreateAppMenu,
    CONSTANTS,
    getThemeFromRenderer,
    sendToRenderer,
    resolveAutoUpdaterAsync,
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
        const { createWindow } = require("../../windowStateUtils");
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

    mainWindow.webContents.on("did-finish-load", async () => {
        logWithContext("info", "did-finish-load event fired, syncing theme");

        if (!getAppState("autoUpdaterInitialized")) {
            try {
                const autoUpdater = await resolveAutoUpdaterAsync();
                setupAutoUpdater(mainWindow, autoUpdater);
                if (
                    autoUpdater &&
                    typeof autoUpdater.checkForUpdatesAndNotify === "function"
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
            logWithContext("info", "Retrieved theme from renderer", { theme });
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
            sendToRenderer(mainWindow, "set-theme", CONSTANTS.DEFAULT_THEME);
        }
    });

    return mainWindow;
}

module.exports = { bootstrapMainWindow };
