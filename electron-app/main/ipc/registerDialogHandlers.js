/**
 * Ensures a valid dialog module is available and exposes showOpenDialog.
 * @param {unknown} dialogRef
 * @returns {{ showOpenDialog: Function }}
 */
function ensureDialogModule(dialogRef) {
    const dialog = typeof dialogRef === 'function' ? dialogRef() : null;
    if (!dialog || typeof dialog.showOpenDialog !== 'function') {
        throw new Error('Dialog module unavailable');
    }

    return dialog;
}

/**
 * Resolves a sensible target window for menu updates.
 * @param {() => any} browserWindowRef
 * @param {any} fallback
 */
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
function registerDialogHandlers({
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
}) {
    if (typeof registerIpcHandle !== 'function') {
        return;
    }

    registerIpcHandle('dialog:openFile', async () => {
        try {
            const dialog = ensureDialogModule(dialogRef);

            const { canceled, filePaths } = await dialog.showOpenDialog({
                filters: CONSTANTS?.DIALOG_FILTERS?.FIT_FILES,
                properties: ['openFile'],
            });

            if (canceled || !Array.isArray(filePaths) || filePaths.length === 0) {
                return null;
            }

            const [firstPath] = filePaths;
            if (!firstPath) {
                return null;
            }

            if (typeof addRecentFile === 'function') {
                addRecentFile(firstPath);
            }

            if (typeof setAppState === 'function') {
                setAppState('loadedFitFilePath', firstPath);
            }

            const win = resolveTargetWindow(browserWindowRef, mainWindow);
            if (win && typeof getThemeFromRenderer === 'function' && typeof safeCreateAppMenu === 'function') {
                try {
                    const theme = await getThemeFromRenderer(win);
                    safeCreateAppMenu(win, theme, firstPath);
                } catch (menuError) {
                    logWithContext?.('warn', 'Failed to refresh menu after file dialog selection', {
                        error: /** @type {Error} */ (menuError)?.message,
                    });
                }
            }

            return firstPath;
        } catch (error) {
            logWithContext?.('error', 'Error in dialog:openFile', {
                error: /** @type {Error} */ (error)?.message,
            });
            throw error;
        }
    });

    registerIpcHandle('dialog:openOverlayFiles', async () => {
        try {
            const dialog = ensureDialogModule(dialogRef);

            const { canceled, filePaths } = await dialog.showOpenDialog({
                filters: CONSTANTS?.DIALOG_FILTERS?.FIT_FILES,
                properties: ['openFile', 'multiSelections'],
            });

            if (canceled || !Array.isArray(filePaths) || filePaths.length === 0) {
                return [];
            }

            return filePaths.filter((entry) => typeof entry === 'string' && entry.trim().length > 0);
        } catch (error) {
            logWithContext?.('error', 'Error in dialog:openOverlayFiles', {
                error: /** @type {Error} */ (error)?.message,
            });
            throw error;
        }
    });
}

/**
 * Resolves a sensible target window for menu updates.
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
        // Ignore lookup issues and fall back to provided window
    }

    return fallback || null;
}

module.exports = { registerDialogHandlers, ensureDialogModule, resolveTargetWindow };
