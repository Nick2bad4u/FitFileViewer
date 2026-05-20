import type { BrowserWindow } from "electron";

export interface BrowserWindowApi {
    getFocusedWindow?: () => BrowserWindow | null;
}

export type RegisterRecentFileIpcHandler = (
    event: unknown,
    ...args: unknown[]
) => unknown;

export type RegisterRecentFileIpcHandle = (
    channel: string,
    handler: RegisterRecentFileIpcHandler
) => void;

export type LogWithContext = (
    level: "error" | "warn" | "info",
    message: string,
    context?: Record<string, unknown>
) => void;

export interface RegisterRecentFileHandlersOptions {
    registerIpcHandle: RegisterRecentFileIpcHandle;
    addRecentFile: (filePath: string) => void;
    loadRecentFiles: () => string[];
    browserWindowRef: () => BrowserWindowApi | null | undefined;
    mainWindow?: BrowserWindow | null;
    getThemeFromRenderer: (win: BrowserWindow) => Promise<string>;
    safeCreateAppMenu: (
        win: BrowserWindow,
        theme: string,
        loadedFitFilePath?: string | null
    ) => void;
    getAppState: (key: "loadedFitFilePath") => string | null | undefined;
    logWithContext?: LogWithContext;
}

/**
 * Registers IPC handlers for managing recent FIT files.
 */
export function registerRecentFileHandlers(
    options: RegisterRecentFileHandlersOptions
): void;
