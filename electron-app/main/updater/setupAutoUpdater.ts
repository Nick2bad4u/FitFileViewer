{
    interface AutoUpdaterLike {
        autoDownload?: boolean;
        checkForUpdatesAndNotify?: () => Promise<unknown> | unknown;
        feedURL?: unknown;
        logger?: unknown;
        on?: (event: string, listener: (...args: unknown[]) => void) => unknown;
    }

    interface FileTransportLike {
        level?: string;
    }

    interface UpdaterLoggerLike {
        error?: (message: string) => void;
        info?: (message: string) => void;
        transports?: { file?: FileTransportLike };
    }

    type ConfigurableAutoUpdater = AutoUpdaterLike & {
        autoDownload: boolean;
        feedURL?: unknown;
        logger?: UpdaterLoggerLike;
        on: (event: string, listener: (...args: unknown[]) => void) => unknown;
    };

    interface MainWindowLike {
        isDestroyed?: () => boolean;
        webContents?: {
            isDestroyed?: () => boolean;
            send?: (channel: string, ...args: unknown[]) => void;
        };
    }

    interface MainProcessConstants {
        LOG_LEVELS: {
            INFO: string;
        };
        UPDATE_EVENTS: {
            AVAILABLE: string;
            CHECKING: string;
            DOWNLOAD_PROGRESS: string;
            DOWNLOADED: string;
            ERROR: string;
            NOT_AVAILABLE: string;
        };
    }

    interface MenuLike {
        getMenuItemById?: (id: string) => { enabled?: boolean } | null;
    }

    interface MenuModuleLike {
        getApplicationMenu?: () => MenuLike | null;
    }

    interface MainProcessStateLike {
        registerEventHandler?: (
            emitter: unknown,
            event: string,
            handler: (...args: unknown[]) => void,
            handlerId: string
        ) => void;
        unregisterEventHandler?: (handlerId: string) => void;
    }

    const { CONSTANTS } = require("../constants") as {
        CONSTANTS: MainProcessConstants;
    };
    const { sendToRenderer } = require("../ipc/sendToRenderer") as {
        sendToRenderer: (
            win: MainWindowLike | null | undefined,
            channel: string,
            ...args: unknown[]
        ) => void;
    };
    const { logWithContext } = require("../logging/logWithContext") as {
        logWithContext: (
            level: "error" | "info" | "warn",
            message: string,
            context?: Record<string, unknown>
        ) => void;
    };
    const { menuRef } = require("../runtime/electronAccess") as {
        menuRef: () => MenuModuleLike | undefined;
    };
    const { mainProcessState } = require("../state/appState") as {
        mainProcessState: MainProcessStateLike;
    };
    const { isWindowUsable } = require("../window/windowValidation") as {
        isWindowUsable: (win?: MainWindowLike | null) => boolean;
    };
    const { resolveAutoUpdaterSync } = require("./autoUpdaterAccess") as {
        resolveAutoUpdaterSync: () => AutoUpdaterLike | null;
    };

    function getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return error == null ? "unknown" : String(error);
    }

    /**
     * Redact credentials from a URL-like string for logging.
     *
     * This is intentionally best-effort and must never throw.
     */
    function redactUrlCredentials(value: string): string {
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

    function asUpdaterLoggerLike(value: unknown): UpdaterLoggerLike | null {
        return value &&
            (typeof value === "object" || typeof value === "function")
            ? (value as UpdaterLoggerLike)
            : null;
    }

    function resolveLogger(): UpdaterLoggerLike {
        try {
            const log = asUpdaterLoggerLike(require("electron-log"));
            if (log) {
                return log;
            }

            logWithContext(
                "warn",
                "Logger initialization failed. Falling back to console logging."
            );
        } catch (error) {
            logWithContext("error", "Error initializing logger:", {
                error: getErrorMessage(error),
            });
        }

        return console;
    }

    function enableRestartMenuItem(): void {
        const menuModule = menuRef();
        const menu =
            typeof menuModule?.getApplicationMenu === "function"
                ? menuModule.getApplicationMenu()
                : null;
        const restartItem = menu?.getMenuItemById?.("restart-update");
        if (restartItem && restartItem.enabled !== undefined) {
            restartItem.enabled = true;
        }
    }

    /**
     * Configures electron-updater for the application, wiring all event
     * handlers to relay progress to the renderer. The logic matches the
     * historic main.js implementation so behaviour and logging stay
     * consistent.
     */
    function setupAutoUpdater(
        mainWindow?: MainWindowLike | null,
        providedAutoUpdater?: AutoUpdaterLike | null
    ): void {
        // Allow tests to explicitly pass `null` to exercise the "no updater available" path.
        const autoUpdater =
            providedAutoUpdater === undefined
                ? resolveAutoUpdaterSync()
                : providedAutoUpdater;
        if (!isWindowUsable(mainWindow)) {
            console.warn(
                "Cannot setup auto-updater: main window is not usable"
            );
            return;
        }

        if (
            !autoUpdater ||
            (typeof autoUpdater !== "object" &&
                typeof autoUpdater !== "function")
        ) {
            console.warn(
                "Cannot setup auto-updater: autoUpdater is unavailable"
            );
            return;
        }

        // Electron-updater instances are EventEmitters. If it can't register handlers, it's unusable.
        if (typeof autoUpdater.on !== "function") {
            console.warn(
                "Cannot setup auto-updater: autoUpdater.on is not a function"
            );
            return;
        }

        const updater = autoUpdater as ConfigurableAutoUpdater;
        updater.autoDownload = true;
        updater.logger = resolveLogger();

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

        const updateEventHandlers: Record<
            string,
            (...args: unknown[]) => void
        > = {
            "checking-for-update": () => {
                sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.CHECKING);
            },
            "download-progress": (progressObj: unknown) => {
                sendToRenderer(
                    mainWindow,
                    CONSTANTS.UPDATE_EVENTS.DOWNLOAD_PROGRESS,
                    progressObj
                );
            },
            error: (err: unknown) => {
                const errorMessage = getErrorMessage(err);
                updater.logger?.error?.(`AutoUpdater Error: ${errorMessage}`);
                sendToRenderer(
                    mainWindow,
                    CONSTANTS.UPDATE_EVENTS.ERROR,
                    errorMessage
                );
            },
            "update-available": (info: unknown) => {
                sendToRenderer(
                    mainWindow,
                    CONSTANTS.UPDATE_EVENTS.AVAILABLE,
                    info
                );
            },
            "update-downloaded": (info: unknown) => {
                sendToRenderer(
                    mainWindow,
                    CONSTANTS.UPDATE_EVENTS.DOWNLOADED,
                    info
                );
                enableRestartMenuItem();
            },
            "update-not-available": (info: unknown) => {
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
}
