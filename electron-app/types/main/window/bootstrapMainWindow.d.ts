/**
 * Creates or restores the main BrowserWindow and wires up load-time handlers.
 *
 * @param {object} options
 * @param {() => any} options.browserWindowRef
 * @param {(key: string, value?: any) => any} options.getAppState
 * @param {(key: string, value: any) => void} options.setAppState
 * @param {(win: any, theme: string, loadedPath?: string) => void} options.safeCreateAppMenu
 * @param {{ DEFAULT_THEME: string }} options.CONSTANTS
 * @param {(win: any) => Promise<string>} options.getThemeFromRenderer
 * @param {(win: any, channel: string, ...args: any[]) => void} options.sendToRenderer
 * @param {() => Promise<any>} options.resolveAutoUpdaterAsync
 * @param {(mainWindow: any, autoUpdater: any) => void} options.setupAutoUpdater
 * @param {(
 *     level: "error" | "warn" | "info",
 *     message: string,
 *     context?: Record<string, any>
 * ) => void} options.logWithContext
 *
 * @returns {Promise<any>}
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
}: {
    browserWindowRef: () => any;
    getAppState: (key: string, value?: any) => any;
    setAppState: (key: string, value: any) => void;
    safeCreateAppMenu: (win: any, theme: string, loadedPath?: string) => void;
    CONSTANTS: {
        DEFAULT_THEME: string;
    };
    getThemeFromRenderer: (win: any) => Promise<string>;
    sendToRenderer: (win: any, channel: string, ...args: any[]) => void;
    resolveAutoUpdaterAsync: () => Promise<any>;
    setupAutoUpdater: (mainWindow: any, autoUpdater: any) => void;
    logWithContext: (
        level: "error" | "warn" | "info",
        message: string,
        context?: Record<string, any>
    ) => void;
}): Promise<any>;
