/**
 * Registers dialog IPC handlers for opening FIT files and overlay selections.
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {() => any} options.dialogRef
 * @param {{ DIALOG_FILTERS: { FIT_FILES: any } }} options.CONSTANTS
 * @param {(filePath: string) => void} options.addRecentFile
 * @param {(key: string, value: any) => void} options.setAppState
 * @param {() => any} options.browserWindowRef
 * @param {(win: any) => Promise<string>} options.getThemeFromRenderer
 * @param {(win: any, theme: string, loadedFitFilePath?: string) => void} options.safeCreateAppMenu
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} options.logWithContext
 * @param {any} options.mainWindow
 */
export function registerDialogHandlers({
    registerIpcHandle,
    dialogRef,
    CONSTANTS,
    addRecentFile,
    setAppState,
    browserWindowRef,
    getThemeFromRenderer,
    safeCreateAppMenu,
    logWithContext,
    mainWindow,
}: {
    registerIpcHandle: (channel: string, handler: Function) => void;
    dialogRef: () => any;
    CONSTANTS: {
        DIALOG_FILTERS: {
            FIT_FILES: any;
        };
    };
    addRecentFile: (filePath: string) => void;
    setAppState: (key: string, value: any) => void;
    browserWindowRef: () => any;
    getThemeFromRenderer: (win: any) => Promise<string>;
    safeCreateAppMenu: (win: any, theme: string, loadedFitFilePath?: string) => void;
    logWithContext: (level: "error" | "warn" | "info", message: string, context?: Record<string, any>) => void;
    mainWindow: any;
}): void;
