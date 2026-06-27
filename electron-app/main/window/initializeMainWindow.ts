import { createWindow } from "../../windowStateUtils.js";
import { isTestEnvironment } from "../../utils/runtime/processEnvironment.js";
import type { MainAppStateWindowLike } from "../state/appState.js";
import {
    callElectronWhenReadyForTests,
    resolveExistingMainWindow,
    type MainWindowBrowserWindowApi,
    type MainWindowBrowserWindowConstructor,
} from "./mainWindowSelection.js";

type RendererIpcEventChannel =
    import("../../shared/ipc").RendererIpcEventChannel;

interface WebContentsLike {
    isDestroyed?: () => boolean;
    on?: (
        event: "did-finish-load",
        listener: () => Promise<void> | void
    ) => void;
    send?: (channel: RendererIpcEventChannel, ...args: unknown[]) => void;
}

interface MainWindowLike {
    isDestroyed?: () => boolean;
    webContents?: WebContentsLike;
}

type BrowserWindowApi = MainWindowBrowserWindowApi<MainWindowLike>;
type BrowserWindowConstructor =
    MainWindowBrowserWindowConstructor<MainWindowLike>;
type InitializeMainWindowIsAutoUpdaterInitialized = () => boolean;
type InitializeMainWindowGetLoadedFitFilePath = () => null | string;
type InitializeMainWindowSetAutoUpdaterInitialized = (
    isInitialized: boolean
) => void;
type InitializeMainWindowSetMainWindow = (
    mainWindow: MainAppStateWindowLike
) => void;

interface AutoUpdaterLike {
    checkForUpdatesAndNotify?: () => unknown;
}

type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;

interface InitializeMainWindowOptions {
    browserWindowRef: () =>
        | BrowserWindowApi
        | BrowserWindowConstructor
        | null
        | undefined;
    CONSTANTS: { DEFAULT_THEME: string };
    getLoadedFitFilePath: InitializeMainWindowGetLoadedFitFilePath;
    getPersistedThemePreference: () => Promise<string>;
    isAutoUpdaterInitialized: InitializeMainWindowIsAutoUpdaterInitialized;
    logWithContext: LogWithContext;
    resolveAutoUpdater: () => Promise<AutoUpdaterLike | null>;
    safeCreateAppMenu: (
        win: MainWindowLike,
        theme: string,
        loadedPath?: null | string
    ) => void;
    sendToRenderer: (
        win: MainWindowLike,
        channel: RendererIpcEventChannel,
        ...args: unknown[]
    ) => void;
    setAutoUpdaterInitialized: InitializeMainWindowSetAutoUpdaterInitialized;
    setMainWindow: InitializeMainWindowSetMainWindow;
    setupAutoUpdater: (
        mainWindow: MainWindowLike,
        autoUpdater: AutoUpdaterLike | null
    ) => void;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function createFallbackWindow(): MainWindowLike {
    return {
        isDestroyed: () => false,
        webContents: {
            isDestroyed: () => false,
            on: () => {},
            send: () => {},
        },
    };
}

/**
 * Create or reuse the main application window and wire core lifecycle handlers.
 */
export function initializeMainWindow({
    browserWindowRef,
    getLoadedFitFilePath,
    isAutoUpdaterInitialized,
    setAutoUpdaterInitialized,
    setMainWindow,
    safeCreateAppMenu,
    CONSTANTS,
    getPersistedThemePreference,
    sendToRenderer,
    resolveAutoUpdater,
    setupAutoUpdater,
    logWithContext,
}: InitializeMainWindowOptions): Promise<MainWindowLike> {
    callElectronWhenReadyForTests();

    const BrowserWindow = browserWindowRef();
    const isConstructor = typeof BrowserWindow === "function";

    let mainWindow: MainWindowLike | undefined;
    if (isTestEnvironment() || !isConstructor) {
        try {
            mainWindow = resolveExistingMainWindow(BrowserWindow);
        } catch {
            /* Ignore errors */
        }

        mainWindow ??= createFallbackWindow();
    } else {
        mainWindow = createWindow();
    }

    setMainWindow(mainWindow);

    logWithContext(
        "info",
        "Calling createAppMenu after window selection/creation"
    );
    safeCreateAppMenu(
        mainWindow,
        CONSTANTS.DEFAULT_THEME,
        getLoadedFitFilePath()
    );

    if (typeof mainWindow.webContents?.on === "function") {
        mainWindow.webContents.on("did-finish-load", async () => {
            logWithContext(
                "info",
                "did-finish-load event fired, syncing theme"
            );

            if (!isAutoUpdaterInitialized()) {
                try {
                    const autoUpdater = await resolveAutoUpdater();
                    setupAutoUpdater(mainWindow, autoUpdater);
                    if (
                        autoUpdater &&
                        typeof autoUpdater.checkForUpdatesAndNotify ===
                            "function"
                    ) {
                        await autoUpdater.checkForUpdatesAndNotify();
                        setAutoUpdaterInitialized(true);
                    }
                } catch (error) {
                    logWithContext("error", "Failed to setup auto-updater:", {
                        error: getErrorMessage(error),
                    });
                }
            }

            try {
                const theme = await getPersistedThemePreference();
                logWithContext("info", "Retrieved persisted theme preference", {
                    theme,
                });
                safeCreateAppMenu(
                    mainWindow,
                    theme,
                    getLoadedFitFilePath()
                );
                sendToRenderer(mainWindow, "set-theme", theme);
            } catch (error) {
                logWithContext(
                    "warn",
                    "Failed to get persisted theme preference, using fallback",
                    {
                        error: getErrorMessage(error),
                    }
                );
                safeCreateAppMenu(
                    mainWindow,
                    CONSTANTS.DEFAULT_THEME,
                    getLoadedFitFilePath()
                );
                sendToRenderer(
                    mainWindow,
                    "set-theme",
                    CONSTANTS.DEFAULT_THEME
                );
            }
        });
    }

    return Promise.resolve(mainWindow);
}
