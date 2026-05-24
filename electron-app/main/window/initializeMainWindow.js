"use strict";
{
    const {
        appRef: runtimeAppRef,
        browserWindowRef: runtimeBrowserWindowRef,
    } = require("../runtime/electronAccess");
    function getErrorMessage(error) {
        return error instanceof Error ? error.message : String(error);
    }
    function callElectronWhenReadyForTests() {
        if (process.env["NODE_ENV"] !== "test") {
            return;
        }
        try {
            const app = runtimeAppRef();
            if (app && typeof app.whenReady === "function") {
                try {
                    app.whenReady();
                } catch {
                    /* Ignore errors */
                }
            }
        } catch {
            /* Ignore errors */
        }
    }
    function getElectronWindowsForTests() {
        try {
            const BrowserWindow = runtimeBrowserWindowRef();
            if (
                BrowserWindow &&
                typeof BrowserWindow.getAllWindows === "function"
            ) {
                try {
                    return BrowserWindow.getAllWindows();
                } catch {
                    /* Ignore errors */
                }
            }
        } catch {
            /* Ignore errors */
        }
        return undefined;
    }
    function getWindowsFromBrowserWindowRef(BrowserWindow) {
        if (
            BrowserWindow &&
            typeof BrowserWindow.getAllWindows === "function"
        ) {
            try {
                return BrowserWindow.getAllWindows?.();
            } catch {
                /* Ignore errors */
            }
        }
        return undefined;
    }
    function createFallbackWindow(defaultTheme) {
        return {
            isDestroyed: () => false,
            webContents: {
                executeJavaScript: async () => defaultTheme,
                isDestroyed: () => false,
                on: () => {},
                send: () => {},
            },
        };
    }
    /**
     * Create or reuse the main application window and wire core lifecycle
     * handlers.
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
        callElectronWhenReadyForTests();
        const BrowserWindow = browserWindowRef();
        const isConstructor = typeof BrowserWindow === "function";
        let mainWindow;
        if (process.env["NODE_ENV"] === "test" || !isConstructor) {
            try {
                let list = getElectronWindowsForTests();
                if (!list || list.length === 0) {
                    list = getWindowsFromBrowserWindowRef(BrowserWindow);
                }
                mainWindow =
                    Array.isArray(list) && list.length > 0
                        ? list[0]
                        : undefined;
            } catch {
                /* Ignore errors */
            }
            mainWindow ??= createFallbackWindow(CONSTANTS.DEFAULT_THEME);
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
        if (typeof mainWindow.webContents?.on === "function") {
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
                        logWithContext(
                            "error",
                            "Failed to setup auto-updater:",
                            {
                                error: getErrorMessage(error),
                            }
                        );
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
}
