type BrowserWindow = import("electron").BrowserWindow;
type MainProcessIpcEventChannel =
    import("../../shared/ipc").MainProcessIpcEventChannel;

interface BrowserWindowConstructorLike {
    fromWebContents: (webContents: unknown) => BrowserWindow | null;
}

interface IpcEventLike {
    sender: unknown;
}

type MainProcessIpcListener = (event: unknown, ...args: unknown[]) => unknown;
type FitFileLoadedIpcCallback = (
    event: IpcEventLike,
    filePath: unknown
) => Promise<void>;
type RegisterFitFileLoadedIpcListener = (
    channel: MainProcessIpcEventChannel,
    listener: MainProcessIpcListener
) => void;

type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;

interface RegisterFitFileLoadedHandlersOptions {
    assertFileReadAllowed: (filePath: unknown) => string;
    browserWindowRef: () => BrowserWindowConstructorLike;
    getLoadedFitFilePath: () => string | null | undefined;
    getPersistedThemePreference: () => Promise<string>;
    logWithContext?: LogWithContext;
    registerIpcListener: RegisterFitFileLoadedIpcListener;
    safeCreateAppMenu: (
        win: BrowserWindow,
        theme: string,
        loadedFitFilePath?: string | null
    ) => void;
    setLoadedFitFilePath: (filePath: null | string) => void;
}

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

function toIpcEventLike(event: unknown): IpcEventLike | null {
    return event && typeof event === "object" && "sender" in event
        ? { sender: event.sender }
        : null;
}

/**
 * Registers IPC listeners for confirmed renderer FIT-file load state.
 */
export function registerFitFileLoadedHandlers({
    assertFileReadAllowed,
    browserWindowRef,
    getLoadedFitFilePath,
    getPersistedThemePreference,
    logWithContext,
    registerIpcListener,
    safeCreateAppMenu,
    setLoadedFitFilePath,
}: RegisterFitFileLoadedHandlersOptions): void {
    if (typeof registerIpcListener !== "function") {
        return;
    }

    const handleFitFileLoaded: FitFileLoadedIpcCallback = async (
        event,
        filePath
    ) => {
        if (
            filePath === null ||
            filePath === undefined ||
            (typeof filePath === "string" && filePath.trim() === "")
        ) {
            setLoadedFitFilePath(null);
        } else {
            try {
                // Don't trust renderer-provided paths blindly; only persist if it is an approved FIT path.
                const approvedPath = assertFileReadAllowed(filePath);
                setLoadedFitFilePath(approvedPath);
            } catch (error) {
                logWithContext?.(
                    "warn",
                    "Rejected fit-file-loaded with unapproved path",
                    {
                        error: getErrorMessage(error),
                        filePath,
                    }
                );
                return;
            }
        }

        const win = browserWindowRef().fromWebContents(event.sender);
        if (win) {
            try {
                const theme = await getPersistedThemePreference();
                safeCreateAppMenu(win, theme, getLoadedFitFilePath());
            } catch (error) {
                logWithContext?.(
                    "error",
                    "Failed to update menu after fit file loaded:",
                    {
                        error: getErrorMessage(error),
                    }
                );
            }
        }
    };

    registerIpcListener("fit-file-loaded", (event, filePath) => {
        const eventLike = toIpcEventLike(event);
        return eventLike
            ? handleFitFileLoaded(eventLike, filePath)
            : undefined;
    });
}
