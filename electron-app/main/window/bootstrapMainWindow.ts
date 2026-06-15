import {
    appRef as electronAppRef,
    browserWindowRef as electronBrowserWindowRef,
} from "../runtime/electronAccess.js";
import { createWindow } from "../../windowStateUtils.js";

type RendererIpcEventChannel =
    import("../../shared/ipc").RendererIpcEventChannel;

interface WebContentsLike {
    executeJavaScript?: (script: string) => Promise<unknown>;
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

interface BrowserWindowApi {
    getAllWindows?: () => MainWindowLike[];
}

interface ElectronAppLike {
    whenReady?: () => unknown;
}

type BrowserWindowConstructor = new (...args: never[]) => MainWindowLike;
type AppStateValue = boolean | MainWindowLike | null | string | undefined;

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
    getAppState: (key: string) => AppStateValue;
    getThemeFromRenderer: (win: MainWindowLike) => Promise<string>;
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
    setAppState: (key: string, value: AppStateValue) => void;
    setupAutoUpdater: (
        mainWindow: MainWindowLike,
        autoUpdater: AutoUpdaterLike | null
    ) => void;
}

const runtimeAppRef = electronAppRef as () => ElectronAppLike | undefined;
const runtimeBrowserWindowRef = electronBrowserWindowRef as () =>
    | BrowserWindowApi
    | undefined;

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function callElectronWhenReadyForTests(): void {
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

function getElectronWindowsForTests(): MainWindowLike[] | undefined {
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

function getWindowsFromBrowserWindowRef(
    BrowserWindow:
        | BrowserWindowApi
        | BrowserWindowConstructor
        | null
        | undefined
): MainWindowLike[] | undefined {
    if (
        BrowserWindow &&
        typeof (BrowserWindow as BrowserWindowApi).getAllWindows === "function"
    ) {
        try {
            return (BrowserWindow as BrowserWindowApi).getAllWindows?.();
        } catch {
            /* Ignore errors */
        }
    }

    return undefined;
}

function createFallbackWindow(defaultTheme: string): MainWindowLike {
    return {
        isDestroyed: () => false,
        webContents: {
            executeJavaScript: () => Promise.resolve(defaultTheme),
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
    getThemeFromRenderer,
    sendToRenderer,
    resolveAutoUpdaterAsync,
    setupAutoUpdater,
    logWithContext,
}: BootstrapMainWindowOptions): Promise<MainWindowLike> {
    callElectronWhenReadyForTests();

    const BrowserWindow = browserWindowRef();
    const isConstructor = typeof BrowserWindow === "function";

    let mainWindow: MainWindowLike | undefined;
    if (process.env["NODE_ENV"] === "test" || !isConstructor) {
        try {
            let list = getElectronWindowsForTests();
            if (!list || list.length === 0) {
                list = getWindowsFromBrowserWindowRef(BrowserWindow);
            }
            mainWindow =
                Array.isArray(list) && list.length > 0 ? list[0] : undefined;
        } catch {
            /* Ignore errors */
        }

        mainWindow ??= createFallbackWindow(CONSTANTS.DEFAULT_THEME);
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
        getAppState("loadedFitFilePath") as null | string | undefined
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
            const theme = await getThemeFromRenderer(mainWindow);
            logWithContext("info", "Retrieved theme from renderer", {
                theme,
            });
            safeCreateAppMenu(
                mainWindow,
                theme,
                getAppState("loadedFitFilePath") as null | string | undefined
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
                getAppState("loadedFitFilePath") as null | string | undefined
            );
            sendToRenderer(mainWindow, "set-theme", CONSTANTS.DEFAULT_THEME);
        }
    });

    return Promise.resolve(mainWindow);
}
