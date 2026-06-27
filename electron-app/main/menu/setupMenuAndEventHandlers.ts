import { CONSTANTS } from "../constants.js";
import { registerIpcHandle, registerIpcListener } from "../ipc/ipcRegistry.js";
import { sendToRenderer } from "../ipc/sendToRenderer.js";
import { logWithContext } from "../logging/logWithContext.js";
import {
    browserWindowRef as electronBrowserWindowRef,
    dialogRef as electronDialogRef,
} from "../runtime/electronAccess.js";
import { fs } from "../runtime/nodeModules.js";
import { isApprovedFilePath } from "../security/fileAccessPolicy.js";
import { getLoadedFitFilePath } from "../state/appState.js";
import { validateWindow } from "../window/windowValidation.js";
import {
    isDevelopmentEnvironment,
    isTestEnvironment,
} from "../../utils/runtime/processEnvironment.js";
import { registerDevtoolsInjectMenuHandler } from "./registerDevtoolsInjectMenuHandler.js";
import { registerFullscreenHandler } from "./registerFullscreenHandler.js";
import { registerThemeChangedHandler } from "./registerThemeChangedHandler.js";
import { registerUpdateMenuHandlers } from "./registerUpdateMenuHandlers.js";
import { safeCreateAppMenu } from "./safeCreateAppMenu.js";

type BrowserWindow = import("electron").BrowserWindow;
type FileFilter = import("electron").FileFilter;
type MainProcessIpcEventChannel =
    import("../../shared/ipc").MainProcessIpcEventChannel;
type SaveDialogOptions = import("electron").SaveDialogOptions;

interface IpcEventLike {
    sender: unknown;
}

interface BrowserWindowRefLike {
    fromWebContents: (webContents: unknown) => BrowserWindow | null;
    getFocusedWindow?: () => BrowserWindow | null | undefined;
}

interface DialogLike {
    showSaveDialog: (
        window: BrowserWindow,
        options: SaveDialogOptions
    ) => Promise<{ canceled: boolean; filePath?: string }>;
}

type IpcCallback = (...args: unknown[]) => unknown;
type MenuFileEventChannel = Extract<
    MainProcessIpcEventChannel,
    "menu-export" | "menu-save-as"
>;

const MENU_FILE_EVENTS = [
    "menu-export",
    "menu-save-as",
] as const satisfies readonly MenuFileEventChannel[];

const browserWindowRef = electronBrowserWindowRef as () =>
    | BrowserWindowRefLike
    | null
    | undefined;
const dialogRef = electronDialogRef as () => DialogLike | undefined;

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

function getBrowserWindowFromEvent(event: IpcEventLike): BrowserWindow | null {
    return browserWindowRef()?.fromWebContents(event.sender) ?? null;
}

function isDevtoolsMenuInjectionAllowed(): boolean {
    return isDevelopmentEnvironment() || isTestEnvironment();
}

/**
 * Registers menu-related IPC handlers and listeners.
 */
export function setupMenuAndEventHandlers(): void {
    registerThemeChangedHandler({
        browserWindowRef,
        registerIpcListener,
        safeCreateAppMenu,
        validateWindow,
    });

    registerUpdateMenuHandlers({
        browserWindowRef,
        registerIpcListener,
    });

    const fileMenuHandlers: Record<MenuFileEventChannel, IpcCallback> = {
        "menu-export": (event) => {
            const ipcEvent = event as IpcEventLike;
            return (async (): Promise<void> => {
                const loadedFilePath = getLoadedFitFilePath();
                const win = getBrowserWindowFromEvent(ipcEvent);
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
                                CONSTANTS.DIALOG_FILTERS.EXPORT_FILES
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
            })();
        },
        "menu-save-as": (event) => {
            const ipcEvent = event as IpcEventLike;
            return (async (): Promise<void> => {
                const loadedFilePath = getLoadedFitFilePath();
                const win = getBrowserWindowFromEvent(ipcEvent);
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
                                CONSTANTS.DIALOG_FILTERS.ALL_FILES
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
            })();
        },
    };

    for (const event of MENU_FILE_EVENTS) {
        const handler = fileMenuHandlers[event];
        registerIpcListener(event, handler);
    }

    registerFullscreenHandler({
        browserWindowRef,
        registerIpcListener,
        validateWindow,
    });

    registerDevtoolsInjectMenuHandler({
        browserWindowRef,
        isDevtoolsMenuInjectionAllowed,
        registerIpcHandle,
        safeCreateAppMenu,
    });
}
