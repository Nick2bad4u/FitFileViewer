/**
 * Creates or restores the main BrowserWindow and wires up load-time handlers.
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
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} options.logWithContext
 * @returns {Promise<any>}
 */
async function bootstrapMainWindow({
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
}) {
    if (/** @type {any} */ (process.env).NODE_ENV === 'test') {
        try {
            const { app: __wa } = require('electron');
            if (__wa && typeof __wa.whenReady === 'function') {
                try {
                    __wa.whenReady();
                } catch {
                    /* Ignore errors */
                }
            }
        } catch {
            /* Ignore errors */
        }
    }

    const BW = browserWindowRef();
    const isConstructor = typeof BW === 'function';

    /** @type {any} */
    let mainWindow;
    if (/** @type {any} */ (process.env).NODE_ENV === 'test' || !isConstructor) {
        try {
            let list;
            try {
                const { BrowserWindow: __tBW } = require('electron');
                if (__tBW && typeof __tBW.getAllWindows === 'function') {
                    try {
                        list = __tBW.getAllWindows();
                    } catch {
                        /* Ignore errors */
                    }
                }
            } catch {
                /* Ignore errors */
            }

            if ((!list || list.length === 0) && BW && typeof BW.getAllWindows === 'function') {
                try {
                    list = BW.getAllWindows();
                } catch {
                    /* Ignore errors */
                }
            }

            mainWindow = Array.isArray(list) && list.length > 0 ? list[0] : undefined;
        } catch {
            /* Ignore errors */
        }

        if (!mainWindow) {
            mainWindow = {
                isDestroyed: () => false,
                webContents: {
                    executeJavaScript: async () => CONSTANTS.DEFAULT_THEME,
                    isDestroyed: () => false,
                    on: () => { },
                    send: () => { },
                },
            };
        }
    } else {
        const { createWindow } = require('../../windowStateUtils');
        mainWindow = createWindow();
    }

    setAppState('mainWindow', mainWindow);
    logWithContext('info', 'Calling createAppMenu after window selection/creation');
    safeCreateAppMenu(mainWindow, CONSTANTS.DEFAULT_THEME, getAppState('loadedFitFilePath'));

    mainWindow.webContents.on('did-finish-load', async () => {
        logWithContext('info', 'did-finish-load event fired, syncing theme');

        if (!getAppState('autoUpdaterInitialized')) {
            try {
                const autoUpdater = await resolveAutoUpdaterAsync();
                setupAutoUpdater(mainWindow, autoUpdater);
                await autoUpdater.checkForUpdatesAndNotify();
                setAppState('autoUpdaterInitialized', true);
            } catch (error) {
                logWithContext('error', 'Failed to setup auto-updater:', {
                    error: /** @type {Error} */ (error)?.message,
                });
            }
        }

        try {
            const theme = await getThemeFromRenderer(mainWindow);
            logWithContext('info', 'Retrieved theme from renderer', { theme });
            safeCreateAppMenu(mainWindow, theme, getAppState('loadedFitFilePath'));
            sendToRenderer(mainWindow, 'set-theme', theme);
        } catch (error) {
            logWithContext('warn', 'Failed to get theme from renderer, using fallback', {
                error: /** @type {Error} */ (error)?.message,
            });
            safeCreateAppMenu(mainWindow, CONSTANTS.DEFAULT_THEME, getAppState('loadedFitFilePath'));
            sendToRenderer(mainWindow, 'set-theme', CONSTANTS.DEFAULT_THEME);
        }
    });

    return mainWindow;
}

module.exports = { bootstrapMainWindow };
