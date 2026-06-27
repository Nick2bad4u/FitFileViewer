import {
    approveFilePath,
    approveFilePaths,
} from "../security/fileAccessPolicy.js";
import {
    resolveFocusedMainWindowOrFallback,
    type MainWindowBrowserWindowApi,
} from "../window/mainWindowSelection.js";

type BrowserWindow = import("electron").BrowserWindow;
type DialogInvokeChannel = import("../../shared/ipc").DialogInvokeChannel;
type DialogOpenFileResponse = import("../../shared/ipc").DialogOpenFileResponse;
type DialogOpenOverlayFilesResponse =
    import("../../shared/ipc").DialogOpenOverlayFilesResponse;
type DialogResponsePayload = import("../../shared/ipc").DialogResponsePayload;
type OpenDialogOptions = import("electron").OpenDialogOptions;
type OpenDialogReturnValue = import("electron").OpenDialogReturnValue;

interface DialogApi {
    showOpenDialog: (
        options: OpenDialogOptions
    ) => Promise<OpenDialogReturnValue>;
}

type BrowserWindowApi = MainWindowBrowserWindowApi<BrowserWindow>;

interface DialogConstants {
    DIALOG_FILTERS: {
        FIT_FILES: NonNullable<OpenDialogOptions["filters"]>;
    };
}

type RegisterDialogIpcHandler = (
    event: unknown,
    ...args: unknown[]
) => DialogResponsePayload | Promise<DialogResponsePayload>;

type RegisterDialogIpcHandle = (
    channel: DialogInvokeChannel,
    handler: RegisterDialogIpcHandler
) => void;

type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;

interface RegisterDialogHandlersOptions {
    addRecentFile: (filePath: string) => void;
    browserWindowRef: () => BrowserWindowApi | null | undefined;
    CONSTANTS: DialogConstants;
    dialogRef: () => DialogApi | null | undefined;
    getPersistedThemePreference: () => Promise<string>;
    logWithContext?: LogWithContext;
    mainWindow?: BrowserWindow | null | undefined;
    registerIpcHandle: RegisterDialogIpcHandle;
    safeCreateAppMenu: (
        win: BrowserWindow,
        theme: string,
        loadedFitFilePath?: string | null
    ) => void;
}

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

/**
 * Registers dialog IPC handlers for opening FIT files and overlay selections.
 */
export function registerDialogHandlers({
    registerIpcHandle,
    dialogRef,
    CONSTANTS,
    addRecentFile,
    browserWindowRef,
    getPersistedThemePreference,
    safeCreateAppMenu,
    logWithContext,
    mainWindow,
}: RegisterDialogHandlersOptions): void {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    registerIpcHandle(
        "dialog:openFile",
        async (): Promise<DialogOpenFileResponse> => {
            try {
                const dialog =
                    typeof dialogRef === "function" ? dialogRef() : null;
                if (!dialog || typeof dialog.showOpenDialog !== "function") {
                    throw new Error("Dialog module unavailable");
                }

                const { canceled, filePaths } = await dialog.showOpenDialog({
                    filters: CONSTANTS.DIALOG_FILTERS.FIT_FILES,
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
                    approveFilePath(firstPath, {
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

                const win = resolveFocusedMainWindowOrFallback(
                    browserWindowRef,
                    mainWindow
                );
                if (
                    win &&
                    typeof getPersistedThemePreference === "function" &&
                    typeof safeCreateAppMenu === "function"
                ) {
                    try {
                        const theme = await getPersistedThemePreference();
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
        }
    );

    registerIpcHandle(
        "dialog:openOverlayFiles",
        async (): Promise<DialogOpenOverlayFilesResponse> => {
            try {
                const dialog =
                    typeof dialogRef === "function" ? dialogRef() : null;
                if (!dialog || typeof dialog.showOpenDialog !== "function") {
                    throw new Error("Dialog module unavailable");
                }

                const { canceled, filePaths } = await dialog.showOpenDialog({
                    filters: CONSTANTS.DIALOG_FILTERS.FIT_FILES,
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
                    (entry): entry is string =>
                        typeof entry === "string" && entry.trim().length > 0
                );

                try {
                    approveFilePaths(filtered, {
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
        }
    );
}
