/**
 * Registers IPC handlers for managing recent FIT files.
 *
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {(filePath: string) => void} options.addRecentFile
 * @param {() => string[]} options.loadRecentFiles
 * @param {() => any} options.browserWindowRef
 * @param {any} options.mainWindow
 * @param {(win: any) => Promise<string>} options.getThemeFromRenderer
 * @param {(win: any, theme: string, loadedFitFilePath?: string) => void} options.safeCreateAppMenu
 * @param {(key: string) => any} options.getAppState
 * @param {(
 *     level: "error" | "warn" | "info",
 *     message: string,
 *     context?: Record<string, any>
 * ) => void} options.logWithContext
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
     * Main-process file read policy (best-effort). If unavailable, we fall back
     * to legacy behavior.
     *
     * @type {null | {
     *     approveFilePath: (path: unknown, options?: { source?: string }) => string;
     *     isApprovedFilePath: (path: unknown) => boolean;
     *     isValidFitFilePathCandidate?: (path: unknown) => path is string;
     * }}
     */
    let fileAccessPolicy = null;
    try {
        fileAccessPolicy = require("../security/fileAccessPolicy");
    } catch {
        fileAccessPolicy = null;
    }

    /**
     * Sanitize a persisted recent-files list.
     *
     * The recent files JSON is a persistence layer, not a trust boundary. We
     * therefore:
     *
     * - Enforce strings only
     * - Trim whitespace
     * - Require well-formed absolute .fit paths when the policy module is
     *   available
     *
     * @param {unknown} list
     *
     * @returns {string[]}
     */
    function sanitizeRecentFilesList(list) {
        if (!Array.isArray(list)) {
            return [];
        }

        /** @type {string[]} */
        const out = [];
        for (const entry of list) {
            if (typeof entry !== "string") {
                continue;
            }
            const trimmed = entry.trim();
            if (trimmed.length === 0) {
                continue;
            }

            // Prefer the policy module's validation, since it matches the read allowlist semantics.
            if (fileAccessPolicy?.isValidFitFilePathCandidate) {
                if (!fileAccessPolicy.isValidFitFilePathCandidate(trimmed)) {
                    continue;
                }
            } else {
                // Best-effort fallback if the policy module is missing.
                if (!/\.fit$/iu.test(trimmed)) {
                    continue;
                }
            }

            out.push(trimmed);
        }

        return out;
    }

    registerIpcHandle("recentFiles:get", async () => {
        try {
            const list = sanitizeRecentFilesList(loadRecentFiles());

            // Important: This handler is intentionally side-effect free.
            // Do NOT seed file read approvals here, otherwise a compromised renderer can
            // escalate immediately into reading *all* persisted recent paths.
            return list;
        } catch (error) {
            logWithContext?.("error", "Error in recentFiles:get:", {
                error: /** @type {Error} */ (error)?.message,
            });
            throw error;
        }
    });

    registerIpcHandle("recentFiles:approve", async (_event, filePath) => {
        try {
            if (!fileAccessPolicy) {
                logWithContext?.(
                    "warn",
                    "Rejected recentFiles:approve because file access policy is unavailable",
                    {
                        filePath,
                    }
                );
                return false;
            }

            if (typeof filePath !== "string" || filePath.trim().length === 0) {
                logWithContext?.(
                    "warn",
                    "Rejected recentFiles:approve for invalid path",
                    {
                        filePath,
                    }
                );
                return false;
            }

            const trimmed = filePath.trim();
            const list = sanitizeRecentFilesList(loadRecentFiles());
            if (!list.includes(trimmed)) {
                logWithContext?.(
                    "warn",
                    "Rejected recentFiles:approve for path not in recent list",
                    {
                        filePath: trimmed,
                    }
                );
                return false;
            }

            try {
                fileAccessPolicy.approveFilePath(trimmed, {
                    source: "recentFiles:approve",
                });
                return true;
            } catch (policyError) {
                logWithContext?.(
                    "warn",
                    "Rejected recentFiles:approve due to policy validation",
                    {
                        error: /** @type {Error} */ (policyError)?.message,
                        filePath: trimmed,
                    }
                );
                return false;
            }
        } catch (error) {
            logWithContext?.("error", "Error in recentFiles:approve:", {
                error: /** @type {Error} */ (error)?.message,
            });
            throw error;
        }
    });

    registerIpcHandle("recentFiles:add", async (_event, filePath) => {
        try {
            if (typeof filePath !== "string" || filePath.trim().length === 0) {
                logWithContext?.(
                    "warn",
                    "Rejected recentFiles:add for invalid path",
                    {
                        filePath,
                    }
                );
                return sanitizeRecentFilesList(loadRecentFiles());
            }

            // Security boundary:
            // recentFiles:get seeds approved file paths for file:read. If we allowed adding
            // arbitrary paths here (especially when the policy module is missing), a compromised
            // renderer could escalate into arbitrary local file reads.
            if (!fileAccessPolicy) {
                logWithContext?.(
                    "warn",
                    "Rejected recentFiles:add because file access policy is unavailable",
                    {
                        filePath,
                    }
                );
                return sanitizeRecentFilesList(loadRecentFiles());
            }

            // Security hardening: do not allow the renderer to arbitrarily add new file paths
            // unless they've already been approved via a trusted flow (e.g., dialog selection).
            if (!fileAccessPolicy.isApprovedFilePath(filePath)) {
                logWithContext?.(
                    "warn",
                    "Rejected recentFiles:add for unapproved path",
                    {
                        filePath,
                    }
                );
                return sanitizeRecentFilesList(loadRecentFiles());
            }

            addRecentFile(filePath);
            const win = resolveTargetWindow(browserWindowRef, mainWindow);
            if (!win) {
                return sanitizeRecentFilesList(loadRecentFiles());
            }

            try {
                const theme = await getThemeFromRenderer(win);
                safeCreateAppMenu(win, theme, getAppState("loadedFitFilePath"));
            } catch (menuError) {
                logWithContext?.(
                    "warn",
                    "Failed to refresh menu after recent file add",
                    {
                        error: /** @type {Error} */ (menuError)?.message,
                    }
                );
            }

            return sanitizeRecentFilesList(loadRecentFiles());
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
 *
 * @param {() => any} browserWindowRef
 * @param {any} fallback
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
        // Ignore lookup issues and use fallback
    }

    return fallback || null;
}

module.exports = { registerRecentFileHandlers };
