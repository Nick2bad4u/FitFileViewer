"use strict";
{
    const { CONSTANTS } = require("../constants");
    const { logWithContext } = require("../logging/logWithContext");
    const { safeCreateAppMenu } = require("../menu/safeCreateAppMenu");
    const { browserWindowRef } = require("../runtime/electronAccess");
    const { cleanupEventHandlers, getAppState, mainProcessState, } = require("../state/appState");
    const { validateWindow } = require("../window/windowValidation");
    const hasFocusedWindowApi = (value) => Boolean(value &&
        typeof value === "function" &&
        typeof Reflect.get(value, "getFocusedWindow") === "function");
    const getLoadedFitFilePath = () => {
        const loadedFitFilePath = getAppState("loadedFitFilePath");
        return typeof loadedFitFilePath === "string"
            ? loadedFitFilePath
            : null;
    };
    /**
     * Attaches debugging helpers to the global object for development builds.
     * Mirroring the legacy behaviour keeps the devtools workflow untouched while
     * allowing the logic to live outside main.js.
     */
    function exposeDevHelpers() {
        const devHelpers = {
            cleanupEventHandlers,
            getAppState: () => mainProcessState.data,
            logState: () => {
                logWithContext("info", "Current application state:", {
                    eventHandlersCount: mainProcessState.data.eventHandlers.size,
                    hasMainWindow: Boolean(getAppState("mainWindow")),
                    loadedFitFilePath: getAppState("loadedFitFilePath"),
                });
            },
            rebuildMenu: (theme, filePath) => {
                const BrowserWindow = browserWindowRef();
                const win = hasFocusedWindowApi(BrowserWindow)
                    ? BrowserWindow.getFocusedWindow()
                    : null;
                if (validateWindow(win, "dev helper rebuild menu")) {
                    safeCreateAppMenu(win, theme || CONSTANTS.DEFAULT_THEME, filePath || getLoadedFitFilePath());
                }
            },
        };
        Object.defineProperty(globalThis, "devHelpers", {
            configurable: true,
            enumerable: false,
            value: devHelpers,
            writable: true,
        });
        logWithContext("info", "Development helpers exposed on global.devHelpers");
    }
    module.exports = { exposeDevHelpers };
}
