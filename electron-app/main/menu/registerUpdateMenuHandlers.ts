import { CONSTANTS as DEFAULT_CONSTANTS } from "../constants.js";
import { sendToRenderer as defaultSendToRenderer } from "../ipc/sendToRenderer.js";
import { logWithContext as defaultLogWithContext } from "../logging/logWithContext.js";
import { dialogRef as electronDialogRef } from "../runtime/electronAccess.js";
import {
    isAutoUpdaterInitialized as defaultIsAutoUpdaterInitialized,
    isAutoUpdaterUpdateDownloaded as defaultIsAutoUpdaterUpdateDownloaded,
} from "../state/appState.js";
import { resolveAutoUpdaterAsync as defaultResolveAutoUpdaterAsync } from "../updater/autoUpdaterAccess.js";
import {
    getRegisterUpdateMenuHandlersRuntime,
    type RegisterUpdateMenuHandlersProcessStringName,
} from "./registerUpdateMenuHandlersRuntime.js";

type BrowserWindow = import("electron").BrowserWindow;
type MainProcessIpcEventChannel =
    import("../../shared/ipc").MainProcessIpcEventChannel;
type RendererIpcEventChannel =
    import("../../shared/ipc").RendererIpcEventChannel;
type MenuUpdateEventChannel = Extract<
    MainProcessIpcEventChannel,
    "install-update" | "menu-check-for-updates" | "menu-restart-update"
>;

interface AutoUpdaterLike {
    checkForUpdates?: () => unknown;
    quitAndInstall?: () => void;
}

interface BrowserWindowRefLike {
    fromWebContents: (webContents: unknown) => BrowserWindow | null;
}

interface DialogLike {
    showMessageBox: (options: {
        message: string;
        title: string;
        type: "info";
    }) => unknown;
}

interface IpcEventLike {
    sender: unknown;
}

interface UpdateMenuConstants {
    PLATFORMS: {
        LINUX: string;
    };
}

type MainProcessIpcListener = (event: unknown, ...args: unknown[]) => unknown;
type UpdateMenuIpcCallback = (event: IpcEventLike) => Promise<void> | void;
type RegisterUpdateMenuIpcListener = (
    channel: MainProcessIpcEventChannel,
    listener: MainProcessIpcListener
) => void;

interface RegisterUpdateMenuHandlersOptions {
    browserWindowRef: () => BrowserWindowRefLike | null | undefined;
    constants?: UpdateMenuConstants;
    dialogRef?: () => DialogLike | undefined;
    getProcessStringValue?: (
        property: RegisterUpdateMenuHandlersProcessStringName
    ) => string | undefined;
    isAutoUpdaterInitialized?: () => boolean;
    isAutoUpdaterUpdateDownloaded?: () => boolean;
    logWithContext?: (
        level: string,
        message: string,
        context?: Record<string, unknown>
    ) => void;
    registerIpcListener: RegisterUpdateMenuIpcListener;
    resolveAutoUpdaterAsync?: () => Promise<unknown>;
    sendToRenderer?: (
        win: BrowserWindow,
        channel: RendererIpcEventChannel,
        ...args: unknown[]
    ) => void;
}

const MENU_UPDATE_EVENTS = [
    "install-update",
    "menu-check-for-updates",
    "menu-restart-update",
] as const satisfies readonly MenuUpdateEventChannel[];

const defaultDialogRef = electronDialogRef as () => DialogLike | undefined;

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function hasPromiseCatch(
    value: unknown
): value is { catch: (onRejected: (error: unknown) => void) => unknown } {
    return (
        typeof value === "object" &&
        value !== null &&
        "catch" in value &&
        typeof value.catch === "function"
    );
}

function defaultGetProcessStringValue(
    property: RegisterUpdateMenuHandlersProcessStringName
): string | undefined {
    return getRegisterUpdateMenuHandlersRuntime().getProcessStringValue(
        property
    );
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

async function requireAutoUpdater(
    resolveAutoUpdaterAsync: () => Promise<unknown>
): Promise<AutoUpdaterLike> {
    const autoUpdater = await resolveAutoUpdaterAsync();
    if (
        !autoUpdater ||
        (typeof autoUpdater !== "object" && typeof autoUpdater !== "function")
    ) {
        throw new Error("electron-updater autoUpdater is unavailable");
    }
    return autoUpdater;
}

/**
 * Registers menu IPC listeners that proxy update actions to electron-updater.
 */
export function registerUpdateMenuHandlers({
    browserWindowRef,
    constants = DEFAULT_CONSTANTS,
    dialogRef = defaultDialogRef,
    getProcessStringValue = defaultGetProcessStringValue,
    isAutoUpdaterInitialized = defaultIsAutoUpdaterInitialized,
    isAutoUpdaterUpdateDownloaded = defaultIsAutoUpdaterUpdateDownloaded,
    logWithContext = defaultLogWithContext,
    registerIpcListener,
    resolveAutoUpdaterAsync = defaultResolveAutoUpdaterAsync,
    sendToRenderer = defaultSendToRenderer,
}: RegisterUpdateMenuHandlersOptions): void {
    if (typeof registerIpcListener !== "function") {
        return;
    }

    const showLinuxManualUpdateMessage = (): void => {
        if (getProcessStringValue("platform") !== constants.PLATFORMS.LINUX) {
            return;
        }

        const dialog = dialogRef();
        if (dialog && typeof dialog.showMessageBox === "function") {
            const messageBoxResult = dialog.showMessageBox({
                message:
                    "Your Linux Distro does not support auto-updating, please download and install the latest version manually from the website.",
                title: "Manual Update Required",
                type: "info",
            });
            if (hasPromiseCatch(messageBoxResult)) {
                messageBoxResult.catch((error: unknown) => {
                    logWithContext(
                        "error",
                        "Failed to show Linux manual update message:",
                        {
                            error: getErrorMessage(error),
                        }
                    );
                });
            }
        }
    };

    const logUpdaterError = (message: string, error: unknown): void => {
        logWithContext("error", message, {
            error: getErrorMessage(error),
        });
    };

    const notifyUpdaterUnavailable = (
        event: IpcEventLike,
        message: string
    ): void => {
        const win = getBrowserWindowFromEvent(browserWindowRef, event);
        if (win) {
            sendToRenderer(win, "show-notification", message, "error");
        }
    };

    const checkForUpdates = async (): Promise<void> => {
        try {
            const autoUpdater = await requireAutoUpdater(
                resolveAutoUpdaterAsync
            );
            await autoUpdater.checkForUpdates?.();
        } catch (error) {
            logUpdaterError("Failed to check for updates:", error);
        }
    };

    const quitAndInstallUpdate = async (errorMessage: string): Promise<void> => {
        try {
            const autoUpdater = await requireAutoUpdater(
                resolveAutoUpdaterAsync
            );
            autoUpdater.quitAndInstall?.();
        } catch (error) {
            logUpdaterError(errorMessage, error);
            showLinuxManualUpdateMessage();
        }
    };

    const updateHandlers: Record<MenuUpdateEventChannel, UpdateMenuIpcCallback> =
        {
            "install-update": (event) => {
                if (!isAutoUpdaterUpdateDownloaded()) {
                    notifyUpdaterUnavailable(
                        event,
                        "Update install is not available yet."
                    );
                    logWithContext(
                        "warn",
                        "Blocked update install before download completed"
                    );
                    return;
                }

                return quitAndInstallUpdate("Error during quitAndInstall:");
            },
            "menu-check-for-updates": (event) => {
                if (!isAutoUpdaterInitialized()) {
                    notifyUpdaterUnavailable(
                        event,
                        "Update checker is not ready yet."
                    );
                    logWithContext(
                        "warn",
                        "Blocked update check before updater initialization"
                    );
                    return;
                }

                return checkForUpdates();
            },
            "menu-restart-update": (event) => {
                if (!isAutoUpdaterUpdateDownloaded()) {
                    notifyUpdaterUnavailable(
                        event,
                        "Update install is not available yet."
                    );
                    logWithContext(
                        "warn",
                        "Blocked update restart before download completed"
                    );
                    return;
                }

                return quitAndInstallUpdate(
                    "Error during restart and install:"
                );
            },
        };

    for (const event of MENU_UPDATE_EVENTS) {
        const handler = updateHandlers[event];
        registerIpcListener(event, (ipcEvent) => {
            const eventLike = toIpcEventLike(ipcEvent);
            return eventLike ? handler(eventLike) : undefined;
        });
    }
}
