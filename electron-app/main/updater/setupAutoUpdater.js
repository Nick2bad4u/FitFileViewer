const { CONSTANTS } = require("../constants");
const { sendToRenderer } = require("../ipc/sendToRenderer");
const { logWithContext } = require("../logging/logWithContext");
const { menuRef } = require("../runtime/electronAccess");
const { mainProcessState } = require("../state/appState");
const { isWindowUsable } = require("../window/windowValidation");
const { resolveAutoUpdaterSync } = require("./autoUpdaterAccess");

/**
 * @typedef {import("../../types/main/updater/autoUpdaterAccess").AutoUpdaterLike} AutoUpdaterLike
 * @typedef {import("../../types/main/window/bootstrapMainWindow").MainWindowLike} MainWindowLike
 *
 * @typedef {{ level?: string }} FileTransportLike
 *
 * @typedef {{
 *     error?: (message: string) => void;
 *     info?: (message: string) => void;
 *     transports?: { file?: FileTransportLike };
 * }} UpdaterLoggerLike
 *
 * @typedef {AutoUpdaterLike & {
 *     autoDownload: boolean;
 *     feedURL?: unknown;
 *     logger?: UpdaterLoggerLike;
 *     on: (event: string, listener: (...args: unknown[]) => void) => unknown;
 * }} ConfigurableAutoUpdater
 */

/**
 * @param {unknown} error
 *
 * @returns {string}
 */
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return error == null ? "unknown" : String(error);
}

/**
 * Redact credentials from a URL-like string for logging.
 *
 * This is intentionally best-effort and must never throw.
 *
 * @param {string} value
 *
 * @returns {string}
 */
function redactUrlCredentials(value) {
    try {
        const parsed = new URL(value);
        if (!parsed.username && !parsed.password) return value;
        parsed.username = "";
        parsed.password = "";
        // This will canonicalize the URL. That's fine for logs.
        return parsed.toString();
    } catch {
        return value;
    }
}

/**
 * Configures electron-updater for the application, wiring all event handlers to
 * relay progress to the renderer. The logic matches the historic main.js
 * implementation so behaviour and logging stay consistent.
 *
 * @param {MainWindowLike | null | undefined} mainWindow - BrowserWindow
 *   receiving updater events.
 * @param {AutoUpdaterLike | null} [providedAutoUpdater] - Optional
 *   pre-resolved autoUpdater (used by tests).
 */
function setupAutoUpdater(mainWindow, providedAutoUpdater) {
    // Allow tests to explicitly pass `null` to exercise the "no updater available" path.
    const autoUpdater =
        providedAutoUpdater === undefined
            ? resolveAutoUpdaterSync()
            : providedAutoUpdater;
    if (!isWindowUsable(mainWindow)) {
        console.warn("Cannot setup auto-updater: main window is not usable");
        return;
    }

    if (
        !autoUpdater ||
        (typeof autoUpdater !== "object" && typeof autoUpdater !== "function")
    ) {
        console.warn("Cannot setup auto-updater: autoUpdater is unavailable");
        return;
    }

    // Electron-updater instances are EventEmitters. If it can't register handlers, it's unusable.
    if (typeof autoUpdater.on !== "function") {
        console.warn(
            "Cannot setup auto-updater: autoUpdater.on is not a function"
        );
        return;
    }

    const updater = /** @type {ConfigurableAutoUpdater} */ (autoUpdater);
    updater.autoDownload = true;

    try {
        const log = require("electron-log");
        if (log) {
            updater.logger = log;
        } else {
            logWithContext(
                "warn",
                "Logger initialization failed. Falling back to console logging."
            );
            updater.logger = console;
        }
    } catch (error) {
        logWithContext("error", "Error initializing logger:", {
            error: getErrorMessage(error),
        });
        updater.logger = console;
    }

    try {
        const transportsFile = updater.logger?.transports?.file;
        if (transportsFile && "level" in transportsFile) {
            transportsFile.level = CONSTANTS.LOG_LEVELS.INFO;
        }
    } catch {
        // Non-fatal; logger implementations differ between environments.
    }

    const rawFeedUrl = updater.feedURL;
    if (rawFeedUrl !== undefined && rawFeedUrl !== null) {
        const safeFeedUrl = redactUrlCredentials(String(rawFeedUrl));
        const feedInfo = { feedURL: safeFeedUrl };
        updater.logger?.info?.(`AutoUpdater feed URL: ${safeFeedUrl}`);
        logWithContext("info", "AutoUpdater feed URL configured", feedInfo);
    } else {
        updater.logger?.info?.(
            "AutoUpdater using default feed (likely GitHub releases)"
        );
        logWithContext(
            "info",
            "AutoUpdater using default feed (likely GitHub releases)"
        );
    }

    const updateEventHandlers = {
        "checking-for-update": () => {
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.CHECKING);
        },
        "download-progress": (progressObj) => {
            sendToRenderer(
                mainWindow,
                CONSTANTS.UPDATE_EVENTS.DOWNLOAD_PROGRESS,
                progressObj
            );
        },
        error: (err) => {
            const errorMessage = getErrorMessage(err);
            updater.logger?.error?.(`AutoUpdater Error: ${errorMessage}`);
            sendToRenderer(
                mainWindow,
                CONSTANTS.UPDATE_EVENTS.ERROR,
                errorMessage
            );
        },
        "update-available": (info) => {
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.AVAILABLE, info);
        },
        "update-downloaded": (info) => {
            sendToRenderer(
                mainWindow,
                CONSTANTS.UPDATE_EVENTS.DOWNLOADED,
                info
            );
            const menu =
                menuRef() && menuRef().getApplicationMenu
                    ? menuRef().getApplicationMenu()
                    : null;
            if (menu) {
                const restartItem = menu.getMenuItemById("restart-update");
                if (restartItem && restartItem.enabled !== undefined) {
                    restartItem.enabled = true;
                }
            }
        },
        "update-not-available": (info) => {
            sendToRenderer(
                mainWindow,
                CONSTANTS.UPDATE_EVENTS.NOT_AVAILABLE,
                info
            );
        },
    };

    for (const [event, handler] of Object.entries(updateEventHandlers)) {
        const handlerId = `autoUpdater:${event}`;
        if (typeof mainProcessState.unregisterEventHandler === "function") {
            mainProcessState.unregisterEventHandler(handlerId);
        }
        if (typeof mainProcessState.registerEventHandler === "function") {
            mainProcessState.registerEventHandler(
                updater,
                event,
                handler,
                handlerId
            );
        }
    }
}

module.exports = { setupAutoUpdater };
