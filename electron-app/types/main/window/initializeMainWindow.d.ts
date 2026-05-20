import type {
    AppStateValue,
    AutoUpdaterLike,
    BrowserWindowApi,
    BrowserWindowConstructor,
    LogWithContext,
    MainWindowLike,
} from "./bootstrapMainWindow";

export interface InitializeMainWindowOptions {
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
    resolveAutoUpdater: () => Promise<AutoUpdaterLike | null>;
    setupAutoUpdater: (
        mainWindow: MainWindowLike,
        autoUpdater: AutoUpdaterLike | null
    ) => void;
    logWithContext: LogWithContext;
}

/**
 * Create or reuse the main application window and wire core lifecycle handlers.
 */
export function initializeMainWindow(
    options: InitializeMainWindowOptions
): Promise<MainWindowLike>;
