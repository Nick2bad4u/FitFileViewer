import { validateDevtoolsInjectMenuPayload } from "../../shared/devtoolsMenuPolicy.js";
import { CONSTANTS } from "../constants.js";
import { registerIpcHandle, registerIpcListener } from "../ipc/ipcRegistry.js";
import { sendToRenderer } from "../ipc/sendToRenderer.js";
import { logWithContext } from "../logging/logWithContext.js";
import {
    browserWindowRef as electronBrowserWindowRef,
    dialogRef as electronDialogRef,
} from "../runtime/electronAccess.js";
import { createElectronConf } from "../runtime/electronConfAccess.js";
import { fs } from "../runtime/nodeModules.js";
import { isApprovedFilePath } from "../security/fileAccessPolicy.js";
import { getAppState } from "../state/appState.js";
import { resolveAutoUpdaterAsync } from "../updater/autoUpdaterAccess.js";
import { validateWindow } from "../window/windowValidation.js";
import {
    isDevelopmentEnvironment,
    isTestEnvironment,
} from "../../utils/runtime/processEnvironment.js";
import { safeCreateAppMenu } from "./safeCreateAppMenu.js";

type BrowserWindow = import("electron").BrowserWindow;
type DevtoolsInjectMenuFitFilePath =
    import("../../shared/ipc").DevtoolsInjectMenuFitFilePath;
type DevtoolsInjectMenuResponse =
    import("../../shared/ipc").DevtoolsInjectMenuResponse;
type DevtoolsInjectMenuTheme =
    import("../../shared/ipc").DevtoolsInjectMenuTheme;
type FileFilter = import("electron").FileFilter;
type MainProcessIpcEventChannel =
    import("../../shared/ipc").MainProcessIpcEventChannel;
type SaveDialogOptions = import("electron").SaveDialogOptions;

type ValidatedDevtoolsInjectMenuPayload = {
    fitFilePath: DevtoolsInjectMenuFitFilePath;
    theme: DevtoolsInjectMenuTheme;
};

interface IpcEventLike {
    sender: unknown;
}

interface BrowserWindowRefLike {
    fromWebContents: (webContents: unknown) => BrowserWindow | null;
    getFocusedWindow: () => BrowserWindow | null;
}

interface DialogLike {
    showMessageBox: (options: {
        message: string;
        title: string;
        type: "info";
    }) => unknown;
    showSaveDialog: (
        window: BrowserWindow,
        options: SaveDialogOptions
    ) => Promise<{ canceled: boolean; filePath?: string }>;
}

interface AutoUpdaterLike {
    checkForUpdates?: () => unknown;
    quitAndInstall?: () => void;
}

interface ConfStore {
    set: (key: string, value: unknown) => void;
}

type IpcCallback = (...args: unknown[]) => unknown;
type MenuFileEventChannel = Extract<
    MainProcessIpcEventChannel,
    "menu-export" | "menu-save-as"
>;
type MenuUpdateEventChannel = Extract<
    MainProcessIpcEventChannel,
    "install-update" | "menu-check-for-updates" | "menu-restart-update"
>;

const MENU_FILE_EVENTS = [
    "menu-export",
    "menu-save-as",
] as const satisfies readonly MenuFileEventChannel[];
const MENU_UPDATE_EVENTS = [
    "install-update",
    "menu-check-for-updates",
    "menu-restart-update",
] as const satisfies readonly MenuUpdateEventChannel[];

const browserWindowRef = electronBrowserWindowRef as () => BrowserWindowRefLike;
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
    return browserWindowRef().fromWebContents(event.sender);
}

function getLoadedFitFilePath(): string | undefined {
    const loadedFilePath = getAppState("loadedFitFilePath");
    return typeof loadedFilePath === "string" ? loadedFilePath : undefined;
}

function getThemeFromPayload(theme: unknown): string {
    return typeof theme === "string" && theme ? theme : CONSTANTS.DEFAULT_THEME;
}

function normalizePersistedTheme(theme: unknown): string | null {
    const raw = typeof theme === "string" ? theme.trim().toLowerCase() : "";
    const normalized = raw === "system" ? "auto" : raw;
    return normalized === "dark" ||
        normalized === "light" ||
        normalized === "auto"
        ? normalized
        : null;
}

function persistThemeForMenu(theme: unknown): void {
    const normalized = normalizePersistedTheme(theme);
    if (!normalized) {
        return;
    }

    const conf = createElectronConf<ConfStore>({
        name: CONSTANTS.SETTINGS_CONFIG_NAME,
    });
    if (!conf) {
        return;
    }
    conf.set("theme", normalized);
}

async function requireAutoUpdater(): Promise<AutoUpdaterLike> {
    const autoUpdater = (await resolveAutoUpdaterAsync()) as AutoUpdaterLike | null;
    if (!autoUpdater) {
        throw new Error("electron-updater autoUpdater is unavailable");
    }
    return autoUpdater;
}

function showLinuxManualUpdateMessage(): void {
    if (process.platform !== CONSTANTS.PLATFORMS.LINUX) {
        return;
    }

    const dialog = dialogRef();
    if (dialog && typeof dialog.showMessageBox === "function") {
        void dialog.showMessageBox({
            message:
                "Your Linux Distro does not support auto-updating, please download and install the latest version manually from the website.",
            title: "Manual Update Required",
            type: "info",
        });
    }
}

function logUpdaterError(message: string, error: unknown): void {
    logWithContext("error", message, {
        error: getErrorMessage(error),
    });
}

function isAutoUpdaterInitialized(): boolean {
    return getAppState("autoUpdaterInitialized");
}

function isUpdateDownloaded(): boolean {
    return getAppState("autoUpdater.updateDownloaded");
}

function notifyUpdaterUnavailable(event: IpcEventLike, message: string): void {
    const win = getBrowserWindowFromEvent(event);
    if (win) {
        sendToRenderer(win, "show-notification", message, "error");
    }
}

function isDevtoolsMenuInjectionAllowed(): boolean {
    return isDevelopmentEnvironment() || isTestEnvironment();
}

/**
 * Registers menu-related IPC handlers and listeners.
 */
export function setupMenuAndEventHandlers(): void {
    registerIpcListener("theme-changed", (event, theme) => {
        const win = getBrowserWindowFromEvent(event as IpcEventLike);
        if (win && validateWindow(win, "theme-changed event")) {
            // Persist the theme in main-process settings so `theme:get`
            // stays in sync with renderer localStorage.
            try {
                persistThemeForMenu(theme);
            } catch {
                // Best-effort persistence; menu creation should still proceed.
            }

            safeCreateAppMenu(
                win,
                getThemeFromPayload(theme),
                getLoadedFitFilePath()
            );
        }
    });

    const updateHandlers: Record<MenuUpdateEventChannel, IpcCallback> = {
        "install-update": (event) => {
            const ipcEvent = event as IpcEventLike;
            if (!isUpdateDownloaded()) {
                notifyUpdaterUnavailable(
                    ipcEvent,
                    "Update install is not available yet."
                );
                logWithContext(
                    "warn",
                    "Blocked update install before download completed"
                );
                return;
            }

            return (async (): Promise<void> => {
                try {
                    const autoUpdater = await requireAutoUpdater();
                    autoUpdater.quitAndInstall?.();
                } catch (error) {
                    logUpdaterError("Error during quitAndInstall:", error);
                    showLinuxManualUpdateMessage();
                }
            })();
        },
        "menu-check-for-updates": (event) => {
            const ipcEvent = event as IpcEventLike;
            if (!isAutoUpdaterInitialized()) {
                notifyUpdaterUnavailable(
                    ipcEvent,
                    "Update checker is not ready yet."
                );
                logWithContext(
                    "warn",
                    "Blocked update check before updater initialization"
                );
                return;
            }

            return (async (): Promise<void> => {
                try {
                    const autoUpdater = await requireAutoUpdater();
                    void autoUpdater.checkForUpdates?.();
                } catch (error) {
                    logUpdaterError("Failed to check for updates:", error);
                }
            })();
        },
        "menu-restart-update": (event) => {
            const ipcEvent = event as IpcEventLike;
            if (!isUpdateDownloaded()) {
                notifyUpdaterUnavailable(
                    ipcEvent,
                    "Update install is not available yet."
                );
                logWithContext(
                    "warn",
                    "Blocked update restart before download completed"
                );
                return;
            }

            return (async (): Promise<void> => {
                try {
                    const autoUpdater = await requireAutoUpdater();
                    autoUpdater.quitAndInstall?.();
                } catch (error) {
                    logUpdaterError("Error during restart and install:", error);
                    showLinuxManualUpdateMessage();
                }
            })();
        },
    };

    for (const event of MENU_UPDATE_EVENTS) {
        const handler = updateHandlers[event];
        registerIpcListener(event, handler);
    }

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

    registerIpcListener("set-fullscreen", (_event, flag) => {
        const win = browserWindowRef().getFocusedWindow();
        if (win && validateWindow(win, "set-fullscreen event")) {
            win.setFullScreen(Boolean(flag));
        }
    });

    registerIpcHandle(
        "devtools-inject-menu",
        (event, theme, fitFilePath): DevtoolsInjectMenuResponse => {
            if (!isDevtoolsMenuInjectionAllowed()) {
                logWithContext(
                    "warn",
                    "Blocked devtools menu injection outside development"
                );
                return false;
            }

            let payload: ValidatedDevtoolsInjectMenuPayload;
            try {
                payload = validateDevtoolsInjectMenuPayload(theme, fitFilePath);
            } catch (error) {
                logWithContext(
                    "warn",
                    "Blocked devtools menu injection with invalid payload",
                    { error: getErrorMessage(error) }
                );
                return false;
            }

            const filePath = payload.fitFilePath;
            const resolvedTheme = payload.theme ?? CONSTANTS.DEFAULT_THEME;
            const win = getBrowserWindowFromEvent(event as IpcEventLike);
            logWithContext("info", "Manual menu injection requested", {
                fitFilePath: filePath,
                theme: resolvedTheme,
            });
            if (win) {
                safeCreateAppMenu(win, resolvedTheme, filePath);
            }
            return true;
        }
    );
}
