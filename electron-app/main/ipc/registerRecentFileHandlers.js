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
function registerRecentFileHandlers({
    registerIpcHandle,
    addRecentFile,
    loadRecentFiles,
    browserWindowRef,
    mainWindow,
    getThemeFromRenderer,
    safeCreateAppMenu,
    getAppState,
    logWithContext,
}) {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    /**
     * Main-process file read policy (best-effort).
     * If unavailable, we fall back to legacy behavior.
     *
     * @type {null | { approveFilePaths: (paths: unknown, options?: { source?: string }) => void, isApprovedFilePath: (path: unknown) => boolean }}
     */
    let fileAccessPolicy = null;
    try {
        fileAccessPolicy = require("../security/fileAccessPolicy");
    } catch {
        fileAccessPolicy = null;
    }

    registerIpcHandle("recentFiles:get", async () => {
        try {
            const list = loadRecentFiles();
            // Allow reading recent files (these are user-selected historically).
            // NOTE: This does NOT allow adding arbitrary new paths; see recentFiles:add below.
            try {
                fileAccessPolicy?.approveFilePaths(list, { source: "recentFiles:get" });
            } catch {
                /* ignore policy seeding errors */
            }

            return list;
        } catch (error) {
            logWithContext?.("error", "Error in recentFiles:get:", {
                error: /** @type {Error} */ (error)?.message,
            });
            throw error;
        }
    });

    registerIpcHandle("recentFiles:add", async (_event, filePath) => {
        try {
            if (typeof filePath !== "string" || filePath.trim().length === 0) {
                logWithContext?.("warn", "Rejected recentFiles:add for invalid path", {
                    filePath,
                });
                return loadRecentFiles();
            }

            // Security boundary:
            // recentFiles:get seeds approved file paths for file:read. If we allowed adding
            // arbitrary paths here (especially when the policy module is missing), a compromised
            // renderer could escalate into arbitrary local file reads.
            if (!fileAccessPolicy) {
                logWithContext?.("warn", "Rejected recentFiles:add because file access policy is unavailable", {
                    filePath,
                });
                return loadRecentFiles();
            }

            // Security hardening: do not allow the renderer to arbitrarily add new file paths
            // unless they've already been approved via a trusted flow (e.g., dialog selection).
            if (!fileAccessPolicy.isApprovedFilePath(filePath)) {
                logWithContext?.("warn", "Rejected recentFiles:add for unapproved path", {
                    filePath,
                });
                return loadRecentFiles();
            }

            addRecentFile(filePath);
            const win = resolveTargetWindow(browserWindowRef, mainWindow);
            if (!win) {
                return loadRecentFiles();
            }

            try {
                const theme = await getThemeFromRenderer(win);
                safeCreateAppMenu(win, theme, getAppState("loadedFitFilePath"));
            } catch (menuError) {
                logWithContext?.("warn", "Failed to refresh menu after recent file add", {
                    error: /** @type {Error} */ (menuError)?.message,
                });
            }

            return loadRecentFiles();
        } catch (error) {
            logWithContext?.("error", "Error in recentFiles:add:", {
                error: /** @type {Error} */ (error)?.message,
            });
            throw error;
        }
    });
}

/**
 * Resolves a BrowserWindow instance suitable for menu updates.
 * @param {() => any} browserWindowRef
 * @param {any} fallback
 */
function resolveTargetWindow(browserWindowRef, fallback) {
    try {
        const api = typeof browserWindowRef === "function" ? browserWindowRef() : null;
        if (api && typeof api.getFocusedWindow === "function") {
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

module.exports = { registerRecentFileHandlers };
