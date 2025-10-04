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
const wireRecentFileHandlers = ({
    registerIpcHandle,
    addRecentFile,
    loadRecentFiles,
    browserWindowRef,
    mainWindow,
    getThemeFromRenderer,
    safeCreateAppMenu,
    getAppState,
    logWithContext,
} = {}) => {
    if (typeof registerIpcHandle !== 'function') {
        return;
    }

    registerIpcHandle('recentFiles:get', async () => {
        try {
            return loadRecentFiles();
        } catch (error) {
            logWithContext?.('error', 'Error in recentFiles:get:', {
                error: /** @type {Error} */ (error)?.message,
            });
            throw error;
        }
    });

    registerIpcHandle('recentFiles:add', async (_event, filePath) => {
        try {
            addRecentFile(filePath);
            const win = resolveTargetWindow(browserWindowRef, mainWindow);
            if (!win) {
                return loadRecentFiles();
            }

            try {
                const theme = await getThemeFromRenderer(win);
                safeCreateAppMenu(win, theme, getAppState('loadedFitFilePath'));
            } catch (menuError) {
                logWithContext?.('warn', 'Failed to refresh menu after recent file add', {
                    error: /** @type {Error} */ (menuError)?.message,
                });
            }

            return loadRecentFiles();
        } catch (error) {
            logWithContext?.('error', 'Error in recentFiles:add:', {
                error: /** @type {Error} */ (error)?.message,
            });
            throw error;
        }
    });
};

/**
 * Resolves a BrowserWindow instance suitable for menu updates.
 * @param {() => any} browserWindowRef
 * @param {any} fallback
 */
function resolveTargetWindow(browserWindowRef, fallback) {
    try {
        const api = typeof browserWindowRef === 'function' ? browserWindowRef() : null;
        if (api && typeof api.getFocusedWindow === 'function') {
            const focused = api.getFocusedWindow();
            if (focused) {
                return focused;
            }
        }
    } catch {
        // Ignore lookup issues and use fallback
    }

    return fallback || null;
}

const registerRecentFileHandlers = (options) => {
    wireRecentFileHandlers(options ?? {});
};

module.exports = { registerRecentFileHandlers, wireRecentFileHandlers };
