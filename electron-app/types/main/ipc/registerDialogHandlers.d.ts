import type {
    BrowserWindow,
    OpenDialogOptions,
    OpenDialogReturnValue,
} from "electron";

export interface DialogApi {
    showOpenDialog: (
        options: OpenDialogOptions
    ) => Promise<OpenDialogReturnValue>;
}

export interface BrowserWindowApi {
    getFocusedWindow?: () => BrowserWindow | null;
}

export interface DialogConstants {
    DIALOG_FILTERS: {
        FIT_FILES: OpenDialogOptions["filters"];
    };
}

export type RegisterDialogIpcHandler = (
    event: unknown,
    ...args: unknown[]
) => unknown;

export type RegisterDialogIpcHandle = (
    channel: string,
    handler: RegisterDialogIpcHandler
) => void;

export type LogWithContext = (
    level: "error" | "warn" | "info",
    message: string,
    context?: Record<string, unknown>
) => void;

export interface RegisterDialogHandlersOptions {
    registerIpcHandle: RegisterDialogIpcHandle;
    dialogRef: () => DialogApi | null | undefined;
    CONSTANTS: DialogConstants;
    addRecentFile: (filePath: string) => void;
    browserWindowRef: () => BrowserWindowApi | null | undefined;
    getThemeFromRenderer: (win: BrowserWindow) => Promise<string>;
    safeCreateAppMenu: (
        win: BrowserWindow,
        theme: string,
        loadedFitFilePath?: string | null
    ) => void;
    logWithContext?: LogWithContext;
    mainWindow?: BrowserWindow | null;
}

/**
 * Registers dialog IPC handlers for opening FIT files and overlay selections.
 */
export function registerDialogHandlers(
    options: RegisterDialogHandlersOptions
): void;
