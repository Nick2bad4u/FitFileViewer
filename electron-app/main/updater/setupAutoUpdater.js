const { CONSTANTS } = require("../constants");
const { sendToRenderer } = require("../ipc/sendToRenderer");
const { logWithContext } = require("../logging/logWithContext");
const { menuRef } = require("../runtime/electronAccess");
const { mainProcessState } = require("../state/appState");
const { isWindowUsable } = require("../window/windowValidation");
const { resolveAutoUpdaterSync } = require("./autoUpdaterAccess");

/**
 * Configures electron-updater for the application, wiring all event handlers to relay progress to
 * the renderer. The logic matches the historic main.js implementation so behaviour and logging stay
 * consistent.
 *
 * @param {any} mainWindow - BrowserWindow receiving updater events.
 * @param {any} [providedAutoUpdater] - Optional pre-resolved autoUpdater (used by tests).
 */
function setupAutoUpdater(mainWindow, providedAutoUpdater) {
    const autoUpdater = providedAutoUpdater || resolveAutoUpdaterSync();
    if (!isWindowUsable(mainWindow)) {
        console.warn("Cannot setup auto-updater: main window is not usable");
        return;
    }

    autoUpdater.autoDownload = true;

    try {
        const log = require("electron-log");
        if (log) {
            autoUpdater.logger = log;
        } else {
            logWithContext("warn", "Logger initialization failed. Falling back to console logging.");
            autoUpdater.logger = console;
        }
    } catch (error) {
        logWithContext("error", "Error initializing logger:", { error: /** @type {Error} */ (error).message });
        autoUpdater.logger = console;
    }

    /** @type {any} */ (autoUpdater.logger).transports.file.level = CONSTANTS.LOG_LEVELS.INFO;

    if (/** @type {any} */ (autoUpdater).feedURL !== undefined && /** @type {any} */ (autoUpdater).feedURL !== null) {
        const feedInfo = { feedURL: /** @type {any} */ (autoUpdater).feedURL };
        autoUpdater.logger.info(`AutoUpdater feed URL: ${/** @type {any} */ (autoUpdater).feedURL}`);
        logWithContext("info", "AutoUpdater feed URL configured", feedInfo);
    } else {
        autoUpdater.logger.info("AutoUpdater using default feed (likely GitHub releases)");
        logWithContext("info", "AutoUpdater using default feed (likely GitHub releases)");
    }

    const updateEventHandlers = {
        "checking-for-update": () => {
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.CHECKING);
        },
        "download-progress": (progressObj) => {
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.DOWNLOAD_PROGRESS, progressObj);
        },
        error: (err) => {
            const errorMessage = err == null ? "unknown" : err.message || err.toString();
            if (autoUpdater.logger) {
                autoUpdater.logger.error(`AutoUpdater Error: ${errorMessage}`);
            }
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.ERROR, errorMessage);
        },
        "update-available": (info) => {
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.AVAILABLE, info);
        },
        "update-downloaded": (info) => {
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.DOWNLOADED, info);
            const menu = menuRef() && menuRef().getApplicationMenu ? menuRef().getApplicationMenu() : null;
            if (menu) {
                const restartItem = menu.getMenuItemById("restart-update");
                if (restartItem && restartItem.enabled !== undefined) {
                    restartItem.enabled = true;
                }
            }
        },
        "update-not-available": (info) => {
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.NOT_AVAILABLE, info);
        },
    };

    for (const [event, handler] of Object.entries(updateEventHandlers)) {
        const handlerId = `autoUpdater:${event}`;
        if (typeof mainProcessState.unregisterEventHandler === "function") {
            mainProcessState.unregisterEventHandler(handlerId);
        }
        if (typeof mainProcessState.registerEventHandler === "function") {
            mainProcessState.registerEventHandler(autoUpdater, event, handler, handlerId);
        }
    }
}

module.exports = { setupAutoUpdater };
