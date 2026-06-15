import {
    isApprovedFilePath,
    isValidFitFilePathCandidate,
} from "../security/fileAccessPolicy.js";

type BrowserWindow = import("electron").BrowserWindow;
type RecentFilesApprovalResponse =
    import("../../shared/ipc").RecentFilesApprovalResponse;
type RecentFilesInvokeChannel =
    import("../../shared/ipc").RecentFilesInvokeChannel;
type RecentFilesListResponse =
    import("../../shared/ipc").RecentFilesListResponse;
type RecentFilesResponsePayload =
    import("../../shared/ipc").RecentFilesResponsePayload;

interface BrowserWindowApi {
    getFocusedWindow?: () => BrowserWindow | null;
}

type RegisterRecentFileIpcHandler = (
    event: unknown,
    ...args: unknown[]
) => Promise<RecentFilesResponsePayload> | RecentFilesResponsePayload;

type RegisterRecentFileIpcHandle = (
    channel: RecentFilesInvokeChannel,
    handler: RegisterRecentFileIpcHandler
) => void;

type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;

interface RegisterRecentFileHandlersOptions {
    addRecentFile: (filePath: string) => void;
    browserWindowRef: () => BrowserWindowApi | null | undefined;
    getAppState: (key: "loadedFitFilePath") => string | null | undefined;
    getThemeFromRenderer: (win: BrowserWindow) => Promise<string>;
    loadRecentFiles: () => string[];
    logWithContext?: LogWithContext;
    mainWindow?: BrowserWindow | null | undefined;
    registerIpcHandle: RegisterRecentFileIpcHandle;
    safeCreateAppMenu: (
        win: BrowserWindow,
        theme: string,
        loadedFitFilePath?: string | null
    ) => void;
}

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

/**
 * Registers IPC handlers for managing recent FIT files.
 */
export function registerRecentFileHandlers({
    registerIpcHandle,
    addRecentFile,
    loadRecentFiles,
    browserWindowRef,
    mainWindow,
    getThemeFromRenderer,
    safeCreateAppMenu,
    getAppState,
    logWithContext,
}: RegisterRecentFileHandlersOptions): void {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    registerIpcHandle("recentFiles:get", (): RecentFilesListResponse => {
        try {
            // Important: This handler is intentionally side-effect free.
            // Do NOT seed file read approvals here, otherwise a compromised renderer can
            // escalate immediately into reading *all* persisted recent paths.
            return sanitizeRecentFilesList(loadRecentFiles());
        } catch (error) {
            logWithContext?.("error", "Error in recentFiles:get:", {
                error: getErrorMessage(error),
            });
            throw error;
        }
    });

    registerIpcHandle(
        "recentFiles:approve",
        (_event, filePath): RecentFilesApprovalResponse => {
            try {
                logWithContext?.(
                    "warn",
                    "Denied renderer recentFiles:approve request",
                    {
                        filePath,
                    }
                );
                return false;
            } catch (error) {
                logWithContext?.("error", "Error in recentFiles:approve:", {
                    error: getErrorMessage(error),
                });
                throw error;
            }
        }
    );

    registerIpcHandle(
        "recentFiles:add",
        async (_event, filePath): Promise<RecentFilesListResponse> => {
            try {
                if (
                    typeof filePath !== "string" ||
                    filePath.trim().length === 0
                ) {
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
                // file:read only accepts paths approved by trusted main-process flows.
                // If we allowed arbitrary renderer paths here, a compromised renderer
                // could turn the recent list into a path-confusion surface.
                if (!isApprovedFilePath(filePath)) {
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
                    safeCreateAppMenu(
                        win,
                        theme,
                        getAppState("loadedFitFilePath")
                    );
                } catch (menuError) {
                    logWithContext?.(
                        "warn",
                        "Failed to refresh menu after recent file add",
                        {
                            error: getErrorMessage(menuError),
                        }
                    );
                }

                return sanitizeRecentFilesList(loadRecentFiles());
            } catch (error) {
                logWithContext?.("error", "Error in recentFiles:add:", {
                    error: getErrorMessage(error),
                });
                throw error;
            }
        }
    );
}

/**
 * Sanitize a persisted recent-files list.
 */
function sanitizeRecentFilesList(list: unknown): string[] {
    if (!Array.isArray(list)) {
        return [];
    }

    const out: string[] = [];
    for (const entry of list) {
        if (typeof entry !== "string") {
            continue;
        }

        const trimmed = entry.trim();
        if (trimmed.length === 0) {
            continue;
        }

        if (!isValidFitFilePathCandidate(trimmed)) {
            continue;
        }

        out.push(trimmed);
    }

    return out;
}

/**
 * Resolves a BrowserWindow instance suitable for menu updates.
 */
function resolveTargetWindow(
    browserWindowRef: () => BrowserWindowApi | null | undefined,
    fallback?: BrowserWindow | null
): BrowserWindow | null {
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
        // Ignore lookup issues and use fallback.
    }

    return fallback || null;
}

export default { registerRecentFileHandlers };
