const fs = require('node:fs');
const path = require('node:path');

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

    const resolveSelectedPath = async (candidatePath) => {
        if (!candidatePath) {
            return null;
        }

        const normalizedPath = path.normalize(candidatePath);

        if (typeof addRecentFile === 'function') {
            addRecentFile(normalizedPath);
        }

        if (typeof setAppState === 'function') {
            setAppState('loadedFitFilePath', normalizedPath);
        }

        const win = resolveTargetWindow(browserWindowRef, mainWindow);
        if (win && typeof getThemeFromRenderer === 'function' && typeof safeCreateAppMenu === 'function') {
            try {
                const theme = await getThemeFromRenderer(win);
                safeCreateAppMenu(win, theme, normalizedPath);
            } catch (menuError) {
                logWithContext?.('warn', 'Failed to refresh menu after file dialog selection', {
                    error: /** @type {Error} */ (menuError)?.message,
                });
            }
        }

        return normalizedPath;
    };

    registerIpcHandle('dialog:openFile', async () => {
        try {
            const forcedPath = resolveForcedOpenFilePath(logWithContext);
            if (forcedPath) {
                logWithContext?.('info', 'Using forced file path from environment variable', {
                    forcedPath,
                    envVar: 'FFV_E2E_OPEN_FILE_PATH',
                });
                return resolveSelectedPath(forcedPath);
            }

            const dialog = ensureDialogModule(dialogRef);

            logWithContext?.('info', 'Showing file open dialog');
            const { canceled, filePaths } = await dialog.showOpenDialog({
                filters: CONSTANTS?.DIALOG_FILTERS?.FIT_FILES,
                properties: ['openFile'],
            });

            if (canceled || !Array.isArray(filePaths) || filePaths.length === 0) {
                logWithContext?.('info', 'File dialog canceled or no files selected');
                return null;
            }

            const [firstPath] = filePaths;
            if (!firstPath) {
                return null;
            }

            logWithContext?.('info', 'File selected from dialog', { filePath: firstPath });
            return resolveSelectedPath(firstPath);
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

/**
 * Resolves an environment-provided file path for automated smoke tests.
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void | undefined} logWithContext
 * @returns {string|null}
 */
function resolveForcedOpenFilePath(logWithContext) {
    const rawPath = process.env.FFV_E2E_OPEN_FILE_PATH;
    if (!rawPath) {
        logWithContext?.('info', 'No forced file path specified (FFV_E2E_OPEN_FILE_PATH not set)');
        return null;
    }

    logWithContext?.('info', 'Attempting to resolve forced file path', {
        rawPath,
        cwd: process.cwd(),
    });

    try {
        const candidate = path.resolve(rawPath);
        
        logWithContext?.('info', 'Resolved absolute path', {
            candidate,
        });
        
        if (!fs.existsSync(candidate)) {
            logWithContext?.('warn', 'Forced open file path does not exist', {
                candidate,
                rawPath,
            });
            return null;
        }

        logWithContext?.('info', 'Using forced file path for dialog:openFile handler', {
            candidate,
        });

        return candidate;
    } catch (error) {
        logWithContext?.('warn', 'Failed to resolve forced open file path', {
            error: /** @type {Error} */ (error)?.message,
            rawPath,
        });
        return null;
    }
}
