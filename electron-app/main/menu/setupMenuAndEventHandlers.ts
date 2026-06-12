import { validateDevtoolsInjectMenuPayload } from "../../shared/devtoolsMenuPolicy.js";

{
    type BrowserWindow = import("electron").BrowserWindow;
    type DevtoolsInjectMenuFitFilePath =
        import("../../shared/ipc").DevtoolsInjectMenuFitFilePath;
    type DevtoolsInjectMenuResponse =
        import("../../shared/ipc").DevtoolsInjectMenuResponse;
    type DevtoolsInjectMenuTheme =
        import("../../shared/ipc").DevtoolsInjectMenuTheme;
    type DevtoolsInvokeChannel =
        import("../../shared/ipc").DevtoolsInvokeChannel;
    type ValidatedDevtoolsInjectMenuPayload = {
        fitFilePath: DevtoolsInjectMenuFitFilePath;
        theme: DevtoolsInjectMenuTheme;
    };
    type FileFilter = import("electron").FileFilter;
    type MainProcessIpcEventChannel =
        import("../../shared/ipc").MainProcessIpcEventChannel;
    type RendererIpcEventChannel =
        import("../../shared/ipc").RendererIpcEventChannel;
    type SaveDialogOptions = import("electron").SaveDialogOptions;

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

    interface ElectronConfModuleLike {
        Conf?: new (options: { name: string }) => ConfStore;
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
    type DevtoolsIpcHandler = (
        event: unknown,
        theme?: DevtoolsInjectMenuTheme,
        fitFilePath?: DevtoolsInjectMenuFitFilePath
    ) => DevtoolsInjectMenuResponse;

    const MENU_FILE_EVENTS = [
        "menu-export",
        "menu-save-as",
    ] as const satisfies readonly MenuFileEventChannel[];
    const MENU_UPDATE_EVENTS = [
        "install-update",
        "menu-check-for-updates",
        "menu-restart-update",
    ] as const satisfies readonly MenuUpdateEventChannel[];

    const { CONSTANTS } = require("../constants") as {
        CONSTANTS: {
            DEFAULT_THEME: string;
            DIALOG_FILTERS: {
                ALL_FILES: FileFilter[];
                EXPORT_FILES: FileFilter[];
            };
            PLATFORMS: {
                LINUX: NodeJS.Platform;
            };
            SETTINGS_CONFIG_NAME: string;
        };
    };
    const { registerIpcHandle, registerIpcListener } =
        require("../ipc/ipcRegistry") as {
            registerIpcHandle: (
                channel: DevtoolsInvokeChannel,
                handler: DevtoolsIpcHandler
            ) => void;
            registerIpcListener: (
                channel: MainProcessIpcEventChannel,
                listener: IpcCallback
            ) => void;
        };
    const { sendToRenderer } = require("../ipc/sendToRenderer") as {
        sendToRenderer: (
            win: BrowserWindow | null | undefined,
            channel: RendererIpcEventChannel,
            ...args: unknown[]
        ) => void;
    };
    const { logWithContext } = require("../logging/logWithContext") as {
        logWithContext: (
            level: string,
            message: string,
            context?: Record<string, unknown>
        ) => void;
    };
    const { browserWindowRef, dialogRef } =
        require("../runtime/electronAccess") as {
            browserWindowRef: () => BrowserWindowRefLike;
            dialogRef: () => DialogLike | undefined;
        };
    const { fs } = require("../runtime/nodeModules") as {
        fs: typeof import("node:fs") | null;
    };
    const fileAccessPolicy = require("../security/fileAccessPolicy") as {
        isApprovedFilePath: (filePath: unknown) => boolean;
    };
    const { getAppState } = require("../state/appState") as {
        getAppState: (key: string) => unknown;
    };
    const { validateWindow } = require("../window/windowValidation") as {
        validateWindow: (
            win?: BrowserWindow | null,
            context?: string
        ) => boolean;
    };
    const { resolveAutoUpdaterSync: resolveAutoUpdaterFallback } =
        require("../updater/autoUpdaterAccess") as {
            resolveAutoUpdaterSync: () => AutoUpdaterLike | null;
        };
    const { safeCreateAppMenu } = require("./safeCreateAppMenu") as {
        safeCreateAppMenu: (
            win: BrowserWindow,
            theme: string,
            loadedPath?: null | string
        ) => void;
    };

    function getErrorMessage(error: unknown): string {
        return error instanceof Error ? error.message : String(error);
    }

    function getBrowserWindowFromEvent(
        event: IpcEventLike
    ): BrowserWindow | null {
        return browserWindowRef().fromWebContents(event.sender);
    }

    function getLoadedFitFilePath(): string | undefined {
        const loadedFilePath = getAppState("loadedFitFilePath");
        return typeof loadedFilePath === "string" ? loadedFilePath : undefined;
    }

    function getThemeFromPayload(theme: unknown): string {
        return typeof theme === "string" && theme
            ? theme
            : CONSTANTS.DEFAULT_THEME;
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

        const { Conf } = require("electron-conf") as ElectronConfModuleLike;
        if (typeof Conf !== "function") {
            return;
        }

        const conf = new Conf({
            name: CONSTANTS.SETTINGS_CONFIG_NAME,
        });
        conf.set("theme", normalized);
    }

    function requireAutoUpdater(): AutoUpdaterLike {
        const autoUpdater = resolveAutoUpdaterFallback();
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
        return getAppState("autoUpdaterInitialized") === true;
    }

    function isUpdateDownloaded(): boolean {
        return getAppState("autoUpdater.updateDownloaded") === true;
    }

    function notifyUpdaterUnavailable(
        event: IpcEventLike,
        message: string
    ): void {
        const win = getBrowserWindowFromEvent(event);
        if (win) {
            sendToRenderer(win, "show-notification", message, "error");
        }
    }

    function isDevtoolsMenuInjectionAllowed(): boolean {
        return (
            process.env?.["NODE_ENV"] === "development" ||
            process.env?.["NODE_ENV"] === "test"
        );
    }

    /**
     * Registers menu-related IPC handlers and listeners.
     */
    function setupMenuAndEventHandlers(): void {
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

                try {
                    requireAutoUpdater().quitAndInstall?.();
                } catch (error) {
                    logUpdaterError("Error during quitAndInstall:", error);
                    showLinuxManualUpdateMessage();
                }
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

                try {
                    void requireAutoUpdater().checkForUpdates?.();
                } catch (error) {
                    logUpdaterError("Failed to check for updates:", error);
                }
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

                try {
                    requireAutoUpdater().quitAndInstall?.();
                } catch (error) {
                    logUpdaterError("Error during restart and install:", error);
                    showLinuxManualUpdateMessage();
                }
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

                        const { canceled, filePath } =
                            await dialog.showSaveDialog(win, {
                                defaultPath: loadedFilePath.replace(
                                    /\.fit$/i,
                                    ".csv"
                                ),
                                filters: CONSTANTS.DIALOG_FILTERS.EXPORT_FILES,
                                title: "Export As",
                            });

                        if (!canceled && filePath) {
                            sendToRenderer(win, "export-file", filePath);
                        }
                    } catch (error) {
                        logWithContext(
                            "error",
                            "Failed to show export dialog:",
                            {
                                error: getErrorMessage(error),
                            }
                        );
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
                        if (
                            !fileAccessPolicy.isApprovedFilePath(loadedFilePath)
                        ) {
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

                        const { canceled, filePath } =
                            await dialog.showSaveDialog(win, {
                                defaultPath: loadedFilePath,
                                filters: CONSTANTS.DIALOG_FILTERS.ALL_FILES,
                                title: "Save As",
                            });

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
                    payload = validateDevtoolsInjectMenuPayload(
                        theme,
                        fitFilePath
                    );
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

    module.exports = { setupMenuAndEventHandlers };
}
