import { CONSTANTS as DEFAULT_CONSTANTS } from "../constants.js";
import { sendToRenderer as defaultSendToRenderer } from "../ipc/sendToRenderer.js";
import { logWithContext as defaultLogWithContext } from "../logging/logWithContext.js";
import { dialogRef as electronDialogRef } from "../runtime/electronAccess.js";
import { fs as defaultFs } from "../runtime/nodeModules.js";
import { isApprovedFilePath as defaultIsApprovedFilePath } from "../security/fileAccessPolicy.js";
import { getLoadedFitFilePath as defaultGetLoadedFitFilePath } from "../state/appState.js";

type BrowserWindow = import("electron").BrowserWindow;
type FileFilter = import("electron").FileFilter;
type MainProcessIpcEventChannel =
    import("../../shared/ipc").MainProcessIpcEventChannel;
type RendererIpcEventChannel =
    import("../../shared/ipc").RendererIpcEventChannel;
type SaveDialogOptions = import("electron").SaveDialogOptions;
type MenuFileEventChannel = Extract<
    MainProcessIpcEventChannel,
    "menu-export" | "menu-save-as"
>;

interface BrowserWindowRefLike {
    fromWebContents: (webContents: unknown) => BrowserWindow | null;
}

interface DialogLike {
    showSaveDialog: (
        window: BrowserWindow,
        options: SaveDialogOptions
    ) => Promise<{ canceled: boolean; filePath?: string }>;
}

interface FileMenuConstants {
    DIALOG_FILTERS: {
        ALL_FILES: readonly {
            extensions: readonly string[];
            name: string;
        }[];
        EXPORT_FILES: readonly {
            extensions: readonly string[];
            name: string;
        }[];
    };
}

interface FileSystemLike {
    promises?: {
        copyFile?: (source: string, destination: string) => Promise<unknown>;
    };
}

interface IpcEventLike {
    sender: unknown;
}

type MainProcessIpcListener = (event: unknown, ...args: unknown[]) => unknown;
type FileMenuIpcCallback = (event: IpcEventLike) => Promise<void> | void;
type RegisterFileMenuIpcListener = (
    channel: MainProcessIpcEventChannel,
    listener: MainProcessIpcListener
) => void;

interface RegisterFileMenuHandlersOptions {
    browserWindowRef: () => BrowserWindowRefLike | null | undefined;
    constants?: FileMenuConstants;
    dialogRef?: () => DialogLike | undefined;
    fs?: FileSystemLike;
    getLoadedFitFilePath?: () => string | null | undefined;
    isApprovedFilePath?: (filePath: unknown) => boolean;
    logWithContext?: (
        level: string,
        message: string,
        context?: Record<string, unknown>
    ) => void;
    registerIpcListener: RegisterFileMenuIpcListener;
    sendToRenderer?: (
        win: BrowserWindow,
        channel: RendererIpcEventChannel,
        ...args: unknown[]
    ) => void;
}

const MENU_FILE_EVENTS = [
    "menu-export",
    "menu-save-as",
] as const satisfies readonly MenuFileEventChannel[];

const defaultDialogRef = electronDialogRef as () => DialogLike | undefined;

function toElectronFileFilters(
    filters: readonly { extensions: readonly string[]; name: string }[]
): FileFilter[] {
    return filters.map(({ extensions, name }) => ({
        extensions: [...extensions],
        name,
    }));
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function getBrowserWindowFromEvent(
    browserWindowRef: () => BrowserWindowRefLike | null | undefined,
    event: IpcEventLike
): BrowserWindow | null {
    return browserWindowRef()?.fromWebContents(event.sender) ?? null;
}

function toIpcEventLike(event: unknown): IpcEventLike | null {
    return event && typeof event === "object" && "sender" in event
        ? { sender: event.sender }
        : null;
}

/**
 * Registers menu IPC listeners for exporting and saving the loaded FIT file.
 */
export function registerFileMenuHandlers({
    browserWindowRef,
    constants = DEFAULT_CONSTANTS,
    dialogRef = defaultDialogRef,
    fs = defaultFs,
    getLoadedFitFilePath = defaultGetLoadedFitFilePath,
    isApprovedFilePath = defaultIsApprovedFilePath,
    logWithContext = defaultLogWithContext,
    registerIpcListener,
    sendToRenderer = defaultSendToRenderer,
}: RegisterFileMenuHandlersOptions): void {
    if (typeof registerIpcListener !== "function") {
        return;
    }

    const fileMenuHandlers: Record<MenuFileEventChannel, FileMenuIpcCallback> =
        {
            "menu-export": async (event) => {
                const loadedFilePath = getLoadedFitFilePath(),
                    win = getBrowserWindowFromEvent(browserWindowRef, event);
                if (!loadedFilePath || !win) {
                    return;
                }

                try {
                    const dialog = dialogRef();
                    if (
                        !dialog ||
                        typeof dialog.showSaveDialog !== "function"
                    ) {
                        throw new Error("Save dialog is unavailable");
                    }

                    const { canceled, filePath } = await dialog.showSaveDialog(
                        win,
                        {
                            defaultPath: loadedFilePath.replace(
                                /\.fit$/i,
                                ".csv"
                            ),
                            filters: toElectronFileFilters(
                                constants.DIALOG_FILTERS.EXPORT_FILES
                            ),
                            title: "Export As",
                        }
                    );

                    if (!canceled && filePath) {
                        sendToRenderer(win, "export-file", filePath);
                    }
                } catch (error) {
                    logWithContext("error", "Failed to show export dialog:", {
                        error: getErrorMessage(error),
                    });
                }
            },
            "menu-save-as": async (event) => {
                const loadedFilePath = getLoadedFitFilePath(),
                    win = getBrowserWindowFromEvent(browserWindowRef, event);
                if (!loadedFilePath || !win) {
                    return;
                }

                try {
                    if (!isApprovedFilePath(loadedFilePath)) {
                        sendToRenderer(
                            win,
                            "show-notification",
                            "Save failed: File access denied",
                            "error"
                        );
                        logWithContext(
                            "warn",
                            "Blocked Save As for unapproved source path",
                            { path: loadedFilePath }
                        );
                        return;
                    }

                    const dialog = dialogRef();
                    if (
                        !dialog ||
                        typeof dialog.showSaveDialog !== "function"
                    ) {
                        throw new Error("Save dialog is unavailable");
                    }
                    const copyFile = fs?.promises?.copyFile;
                    if (typeof copyFile !== "function") {
                        throw new TypeError(
                            "fs.promises.copyFile is unavailable"
                        );
                    }

                    const { canceled, filePath } = await dialog.showSaveDialog(
                        win,
                        {
                            defaultPath: loadedFilePath,
                            filters: toElectronFileFilters(
                                constants.DIALOG_FILTERS.ALL_FILES
                            ),
                            title: "Save As",
                        }
                    );

                    if (!canceled && filePath) {
                        await copyFile(loadedFilePath, filePath);
                        sendToRenderer(
                            win,
                            "show-notification",
                            "File saved successfully.",
                            "success"
                        );
                    }
                } catch (error) {
                    sendToRenderer(
                        win,
                        "show-notification",
                        `Save failed: ${getErrorMessage(error)}`,
                        "error"
                    );
                    logWithContext("error", "Failed to save file:", {
                        error: getErrorMessage(error),
                    });
                }
            },
        };

    for (const event of MENU_FILE_EVENTS) {
        const handler = fileMenuHandlers[event];
        registerIpcListener(event, (ipcEvent) => {
            const eventLike = toIpcEventLike(ipcEvent);
            return eventLike ? handler(eventLike) : undefined;
        });
    }
}
