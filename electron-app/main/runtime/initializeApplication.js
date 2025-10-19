const { CONSTANTS } = require("../constants");
const { sendToRenderer } = require("../ipc/sendToRenderer");
const { logWithContext } = require("../logging/logWithContext");
const { safeCreateAppMenu } = require("../menu/safeCreateAppMenu");
const { browserWindowRef } = require("../runtime/electronAccess");
const { getAppState, setAppState } = require("../state/appState");
const { getThemeFromRenderer } = require("../theme/getThemeFromRenderer");
const { resolveAutoUpdaterAsync } = require("../updater/autoUpdaterAccess");
const { setupAutoUpdater } = require("../updater/setupAutoUpdater");
const { bootstrapMainWindow } = require("../window/bootstrapMainWindow");

/**
 * Bootstraps the main application window and wires up auto-updater integration. Extracted from the
 * monolithic main.js to make the orchestration easier to comprehend.
 *
 * @returns {Promise<any>} Resolves with the created BrowserWindow instance.
 */
async function initializeApplication() {
    return bootstrapMainWindow({
        browserWindowRef,
        CONSTANTS,
        getAppState,
        getThemeFromRenderer,
        logWithContext,
        resolveAutoUpdaterAsync,
        safeCreateAppMenu,
        sendToRenderer,
        setAppState,
        setupAutoUpdater,
    });
}

module.exports = { initializeApplication };
