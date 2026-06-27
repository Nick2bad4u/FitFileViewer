import { CONSTANTS } from "../constants.js";
import { sendToRenderer } from "../ipc/sendToRenderer.js";
import { logWithContext } from "../logging/logWithContext.js";
import { menuRef } from "../runtime/electronAccess.js";
import { mainProcessState, setAutoUpdaterState } from "../state/appState.js";
import { isWindowUsable } from "../window/windowValidation.js";
import electronLog from "electron-log";

type RendererIpcEventChannel =
    import("../../shared/ipc").RendererIpcEventChannel;
interface AutoUpdaterLike {
    autoDownload?: boolean;
    checkForUpdatesAndNotify?: () => unknown;
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
        send?: (channel: RendererIpcEventChannel, ...args: unknown[]) => void;
    };
}

interface MenuLike {
    getMenuItemById?: (id: string) => { enabled?: boolean } | null;
}

interface MenuModuleLike {
    getApplicationMenu?: () => MenuLike | null;
}

const runtimeMenuRef = menuRef as () => MenuModuleLike | undefined;
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (error === null || error === undefined) {
        return "unknown";
    }
    if (
        typeof error === "string" ||
        typeof error === "number" ||
        typeof error === "boolean" ||
        typeof error === "bigint" ||
        typeof error === "symbol"
    ) {
        return String(error);
    }
    try {
        return JSON.stringify(error) ?? "unknown";
    } catch {
        return "unknown";
    }
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
    return value && (typeof value === "object" || typeof value === "function")
        ? value
        : null;
}

function resolveLogger(): UpdaterLoggerLike {
    try {
        const log = asUpdaterLoggerLike(electronLog);
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
    const menuModule = runtimeMenuRef();
    const menu =
        typeof menuModule?.getApplicationMenu === "function"
            ? menuModule.getApplicationMenu()
            : null;
    const restartItem = menu?.getMenuItemById?.("restart-update");
    if (restartItem && restartItem.enabled !== undefined) {
        restartItem.enabled = true;
    }
}

function applyLoggerFileLevel(logger?: UpdaterLoggerLike): void {
    try {
        const transportsFile = logger?.transports?.file;
        if (transportsFile && "level" in transportsFile) {
            transportsFile.level = CONSTANTS.LOG_LEVELS.INFO;
        }
    } catch {
        // Non-fatal; logger implementations differ between environments.
    }
}

function stringifyFeedUrl(value: unknown): string | null {
    if (typeof value === "string") {
        return value;
    }
    if (value instanceof URL) {
        return value.toString();
    }
    return null;
}

function logFeedUrl(updater: ConfigurableAutoUpdater): void {
    const feedUrl = stringifyFeedUrl(updater.feedURL);
    if (feedUrl) {
        const safeFeedUrl = redactUrlCredentials(feedUrl);
        const feedInfo = { feedURL: safeFeedUrl };
        updater.logger?.info?.(`AutoUpdater feed URL: ${safeFeedUrl}`);
        logWithContext("info", "AutoUpdater feed URL configured", feedInfo);
        return;
    }

    updater.logger?.info?.(
        "AutoUpdater using default feed (likely GitHub releases)"
    );
    logWithContext(
        "info",
        "AutoUpdater using default feed (likely GitHub releases)"
    );
}

/**
 * Configures electron-updater for the application, wiring all event handlers to
 * relay progress to the renderer. The logic matches the historic main.js
 * implementation so behaviour and logging stay consistent.
 */
export function setupAutoUpdater(
    mainWindow?: MainWindowLike | null,
    providedAutoUpdater?: AutoUpdaterLike | null
): void {
    // Allow tests to explicitly pass `null` to exercise the "no updater available" path.
    const autoUpdater = providedAutoUpdater;
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

    const updater = autoUpdater as ConfigurableAutoUpdater;
    updater.autoDownload = true;
    updater.logger = resolveLogger();
    applyLoggerFileLevel(updater.logger);
    logFeedUrl(updater);

    const updateEventHandlers: Record<string, (...args: unknown[]) => void> = {
        "checking-for-update": () => {
            setAutoUpdaterState("checking", false);
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.CHECKING);
        },
        "download-progress": (progressObj: unknown) => {
            setAutoUpdaterState("downloading", false);
            sendToRenderer(
                mainWindow,
                CONSTANTS.UPDATE_EVENTS.DOWNLOAD_PROGRESS,
                progressObj
            );
        },
        error: (err: unknown) => {
            const errorMessage = getErrorMessage(err);
            setAutoUpdaterState("error", false);
            updater.logger?.error?.(`AutoUpdater Error: ${errorMessage}`);
            sendToRenderer(
                mainWindow,
                CONSTANTS.UPDATE_EVENTS.ERROR,
                errorMessage
            );
        },
        "update-available": (info: unknown) => {
            setAutoUpdaterState("available", false);
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.AVAILABLE, info);
        },
        "update-downloaded": (info: unknown) => {
            setAutoUpdaterState("downloaded", true);
            sendToRenderer(
                mainWindow,
                CONSTANTS.UPDATE_EVENTS.DOWNLOADED,
                info
            );
            enableRestartMenuItem();
        },
        "update-not-available": (info: unknown) => {
            setAutoUpdaterState("idle", false);
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
