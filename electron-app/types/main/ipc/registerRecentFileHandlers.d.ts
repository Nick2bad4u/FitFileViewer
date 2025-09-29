/**
 * Registers IPC handlers for managing recent FIT files.
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {(filePath: string) => void} options.addRecentFile
 * @param {() => string[]} options.loadRecentFiles
 * @param {() => any} options.browserWindowRef
 * @param {any} options.mainWindow
 * @param {(win: any) => Promise<string>} options.getThemeFromRenderer
 * @param {(win: any, theme: string, loadedFitFilePath?: string) => void} options.safeCreateAppMenu
 * @param {(key: string) => any} options.getAppState
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} options.logWithContext
 */
export function registerRecentFileHandlers({ registerIpcHandle, addRecentFile, loadRecentFiles, browserWindowRef, mainWindow, getThemeFromRenderer, safeCreateAppMenu, getAppState, logWithContext, }: {
    registerIpcHandle: (channel: string, handler: Function) => void;
    addRecentFile: (filePath: string) => void;
    loadRecentFiles: () => string[];
    browserWindowRef: () => any;
    mainWindow: any;
    getThemeFromRenderer: (win: any) => Promise<string>;
    safeCreateAppMenu: (win: any, theme: string, loadedFitFilePath?: string) => void;
    getAppState: (key: string) => any;
    logWithContext: (level: "error" | "warn" | "info", message: string, context?: Record<string, any>) => void;
}): void;
//# sourceMappingURL=registerRecentFileHandlers.d.ts.map