export interface WebContentsLike {
    executeJavaScript?: (script: string) => Promise<unknown>;
    isDestroyed?: () => boolean;
    on: (
        event: "did-finish-load",
        listener: () => void | Promise<void>
    ) => void;
    send?: (channel: string, ...args: unknown[]) => void;
}

export interface MainWindowLike {
    isDestroyed?: () => boolean;
    webContents: WebContentsLike;
}

export interface BrowserWindowApi {
    getAllWindows?: () => MainWindowLike[];
}

export type BrowserWindowConstructor = new (
    ...args: never[]
) => MainWindowLike;

export type AppStateValue = boolean | string | MainWindowLike | null | undefined;

export interface AutoUpdaterLike {
    checkForUpdatesAndNotify: () => Promise<unknown> | unknown;
}

export type LogWithContext = (
    level: "error" | "warn" | "info",
    message: string,
    context?: Record<string, unknown>
) => void;

export interface BootstrapMainWindowOptions {
    browserWindowRef: () =>
        | BrowserWindowApi
        | BrowserWindowConstructor
        | null
        | undefined;
    getAppState: (key: string) => AppStateValue;
    setAppState: (key: string, value: AppStateValue) => void;
    safeCreateAppMenu: (
        win: MainWindowLike,
        theme: string,
        loadedPath?: string | null
    ) => void;
    CONSTANTS: {
        DEFAULT_THEME: string;
    };
    getThemeFromRenderer: (win: MainWindowLike) => Promise<string>;
    sendToRenderer: (
        win: MainWindowLike,
        channel: string,
        ...args: unknown[]
    ) => void;
    resolveAutoUpdaterAsync: () => Promise<AutoUpdaterLike>;
    setupAutoUpdater: (
        mainWindow: MainWindowLike,
        autoUpdater: AutoUpdaterLike
    ) => void;
    logWithContext: LogWithContext;
}

/**
 * Creates or restores the main BrowserWindow and wires up load-time handlers.
 */
export function bootstrapMainWindow(
    options: BootstrapMainWindowOptions
): Promise<MainWindowLike>;
