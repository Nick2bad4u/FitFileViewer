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
    on: (
        event: "did-finish-load",
        listener: () => Promise<void> | void
    ) => void;
    send?: (channel: RendererIpcEventChannel, ...args: unknown[]) => void;
}

interface MainWindowLike {
    isDestroyed?: () => boolean;
    webContents: WebContentsLike;
}

type BrowserWindowApi = MainWindowBrowserWindowApi<MainWindowLike>;
type BrowserWindowConstructor =
    MainWindowBrowserWindowConstructor<MainWindowLike>;
type BootstrapMainWindowGetAppState = {
    (key: "autoUpdaterInitialized"): boolean;
    (key: "loadedFitFilePath"): null | string;
};
type BootstrapMainWindowSetAppState = {
    (key: "autoUpdaterInitialized", value: boolean): void;
    (key: "mainWindow", value: MainAppStateWindowLike): void;
};

interface AutoUpdaterLike {
    checkForUpdatesAndNotify?: () => unknown;
}

type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;

interface BootstrapMainWindowOptions {
    browserWindowRef: () =>
        | BrowserWindowApi
        | BrowserWindowConstructor
        | null
        | undefined;
    CONSTANTS: { DEFAULT_THEME: string };
    getAppState: BootstrapMainWindowGetAppState;
    getPersistedThemePreference: () => Promise<string>;
    logWithContext: LogWithContext;
    resolveAutoUpdaterAsync: () => Promise<AutoUpdaterLike | null>;
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
    setAppState: BootstrapMainWindowSetAppState;
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
 * Creates or restores the main BrowserWindow and wires up load-time handlers.
 */
export function bootstrapMainWindow({
    browserWindowRef,
    getAppState,
    setAppState,
    safeCreateAppMenu,
    CONSTANTS,
    getPersistedThemePreference,
    sendToRenderer,
    resolveAutoUpdaterAsync,
    setupAutoUpdater,
    logWithContext,
}: BootstrapMainWindowOptions): Promise<MainWindowLike> {
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
            const theme = await getPersistedThemePreference();
            logWithContext("info", "Retrieved persisted theme preference", {
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
                "Failed to get persisted theme preference, using fallback",
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

    return Promise.resolve(mainWindow);
}
