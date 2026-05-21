/**
 * @typedef {import("electron").BrowserWindow} BrowserWindow
 *
 * @typedef {import("electron").OpenDialogOptions} OpenDialogOptions
 *
 * @typedef {import("electron").OpenDialogReturnValue} OpenDialogReturnValue
 *
 * @typedef {{
 *     showOpenDialog: (
 *         options: OpenDialogOptions
 *     ) => Promise<OpenDialogReturnValue>;
 * }} DialogApi
 *
 * @typedef {{ getFocusedWindow?: () => BrowserWindow | null }} BrowserWindowApi
 *
 * @typedef {{
 *     DIALOG_FILTERS: {
 *         FIT_FILES: OpenDialogOptions["filters"];
 *     };
 * }} DialogConstants
 *
 * @typedef {(
 *     channel: string,
 *     handler: (event: unknown, ...args: unknown[]) => unknown
 * ) => void} RegisterIpcHandle
 *
 * @typedef {(
 *     level: "error" | "warn" | "info",
 *     message: string,
 *     context?: Record<string, unknown>
 * ) => void} LogWithContext
 *
 * @typedef {{
 *     registerIpcHandle: RegisterIpcHandle;
 *     dialogRef: () => DialogApi | null | undefined;
 *     CONSTANTS: DialogConstants;
 *     addRecentFile: (filePath: string) => void;
 *     browserWindowRef: () => BrowserWindowApi | null | undefined;
 *     getThemeFromRenderer: (win: BrowserWindow) => Promise<string>;
 *     safeCreateAppMenu: (
 *         win: BrowserWindow,
 *         theme: string,
 *         loadedFitFilePath?: string | null
 *     ) => void;
 *     logWithContext?: LogWithContext;
 *     mainWindow?: BrowserWindow | null;
 * }} RegisterDialogHandlersOptions
 */

/**
 * @param {unknown} error
 *
 * @returns {string}
 */
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Registers dialog IPC handlers for opening FIT files and overlay selections.
 *
 * @param {RegisterDialogHandlersOptions} options
 */
function registerDialogHandlers({
    registerIpcHandle,
    dialogRef,
    CONSTANTS,
    addRecentFile,
    browserWindowRef,
    getThemeFromRenderer,
    safeCreateAppMenu,
    logWithContext,
    mainWindow,
}) {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    // Main-process allowlist for renderer-initiated file reads.
    // This prevents arbitrary file disclosure via IPC if the renderer is compromised.
    /**
     * @type {null | {
     *     approveFilePath: (
     *         p: unknown,
     *         options?: { source?: string }
     *     ) => string;
     *     approveFilePaths: (
     *         p: unknown,
     *         options?: { source?: string }
     *     ) => void;
     * }}
     */
    let fileAccessPolicy = null;
    try {
        fileAccessPolicy = require("../security/fileAccessPolicy");
    } catch {
        fileAccessPolicy = null;
    }

    registerIpcHandle("dialog:openFile", async () => {
        try {
            const dialog = typeof dialogRef === "function" ? dialogRef() : null;
            if (!dialog || typeof dialog.showOpenDialog !== "function") {
                throw new Error("Dialog module unavailable");
            }

            const { canceled, filePaths } = await dialog.showOpenDialog({
                filters: CONSTANTS?.DIALOG_FILTERS?.FIT_FILES,
                properties: ["openFile"],
            });

            if (
                canceled ||
                !Array.isArray(filePaths) ||
                filePaths.length === 0
            ) {
                return null;
            }

            const [firstPath] = filePaths;
            if (!firstPath) {
                return null;
            }

            try {
                fileAccessPolicy?.approveFilePath(firstPath, {
                    source: "dialog:openFile",
                });
            } catch (policyError) {
                logWithContext?.(
                    "warn",
                    "Failed to approve file path for reading",
                    {
                        error: getErrorMessage(policyError),
                        filePath: firstPath,
                    }
                );
            }

            if (typeof addRecentFile === "function") {
                addRecentFile(firstPath);
            }

            const win = resolveTargetWindow(browserWindowRef, mainWindow);
            if (
                win &&
                typeof getThemeFromRenderer === "function" &&
                typeof safeCreateAppMenu === "function"
            ) {
                try {
                    const theme = await getThemeFromRenderer(win);
                    // Do NOT treat a dialog selection as a "loaded" file.
                    // We only set loadedFitFilePath when the renderer confirms
                    // a successful load via the "fit-file-loaded" IPC event.
                    // This keeps file-dependent actions (e.g. Summary Columns)
                    // correctly disabled until data is actually available.
                    safeCreateAppMenu(win, theme, null);
                } catch (menuError) {
                    logWithContext?.(
                        "warn",
                        "Failed to refresh menu after file dialog selection",
                        {
                            error: getErrorMessage(menuError),
                        }
                    );
                }
            }

            return firstPath;
        } catch (error) {
            logWithContext?.("error", "Error in dialog:openFile", {
                error: getErrorMessage(error),
            });
            throw error;
        }
    });

    registerIpcHandle("dialog:openOverlayFiles", async () => {
        try {
            const dialog = typeof dialogRef === "function" ? dialogRef() : null;
            if (!dialog || typeof dialog.showOpenDialog !== "function") {
                throw new Error("Dialog module unavailable");
            }

            const { canceled, filePaths } = await dialog.showOpenDialog({
                filters: CONSTANTS?.DIALOG_FILTERS?.FIT_FILES,
                properties: ["openFile", "multiSelections"],
            });

            if (
                canceled ||
                !Array.isArray(filePaths) ||
                filePaths.length === 0
            ) {
                return [];
            }

            const filtered = filePaths.filter(
                (entry) => typeof entry === "string" && entry.trim().length > 0
            );

            try {
                fileAccessPolicy?.approveFilePaths(filtered, {
                    source: "dialog:openOverlayFiles",
                });
            } catch (policyError) {
                logWithContext?.(
                    "warn",
                    "Failed to approve overlay file paths for reading",
                    {
                        error: getErrorMessage(policyError),
                    }
                );
            }

            return filtered;
        } catch (error) {
            logWithContext?.("error", "Error in dialog:openOverlayFiles", {
                error: getErrorMessage(error),
            });
            throw error;
        }
    });
}

/**
 * Resolves a sensible target window for menu updates.
 *
 * @param {() => BrowserWindowApi | null | undefined} browserWindowRef
 * @param {BrowserWindow | null | undefined} fallback
 *
 * @returns {BrowserWindow | null}
 */
function resolveTargetWindow(browserWindowRef, fallback) {
    try {
        const api =
            typeof browserWindowRef === "function" ? browserWindowRef() : null;
        if (api && typeof api.getFocusedWindow === "function") {
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

module.exports = { registerDialogHandlers };
