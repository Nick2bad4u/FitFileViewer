const { CONSTANTS } = require("../constants");
const { logWithContext } = require("../logging/logWithContext");
const { safeCreateAppMenu } = require("../menu/safeCreateAppMenu");
const { browserWindowRef } = require("../runtime/electronAccess");
const {
    cleanupEventHandlers,
    getAppState,
    mainProcessState,
} = require("../state/appState");
const { validateWindow } = require("../window/windowValidation");

/**
 * Attaches debugging helpers to the global object for development builds.
 * Mirroring the legacy behaviour keeps the devtools workflow untouched while
 * allowing the logic to live outside main.js.
 */
function exposeDevHelpers() {
    /** @type {any} */ (globalThis).devHelpers = {
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
            const win = browserWindowRef().getFocusedWindow();
            if (validateWindow(win, "dev helper rebuild menu")) {
                safeCreateAppMenu(
                    /** @type {any} */ (win),
                    theme || CONSTANTS.DEFAULT_THEME,
                    filePath || getAppState("loadedFitFilePath")
                );
            }
        },
    };

    logWithContext("info", "Development helpers exposed on global.devHelpers");
}

module.exports = { exposeDevHelpers };
