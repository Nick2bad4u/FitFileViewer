type BrowserWindow = import("electron").BrowserWindow;
type MainProcessIpcEventChannel =
    import("../../shared/ipc").MainProcessIpcEventChannel;

interface BrowserWindowConstructorLike {
    fromWebContents: (webContents: unknown) => BrowserWindow | null;
}

type RegisterFitFileLoadedIpcListener = (
    channel: MainProcessIpcEventChannel,
    listener: (event: unknown, ...args: unknown[]) => unknown
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

    registerIpcListener("fit-file-loaded", async (event, filePath) => {
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

        const win = browserWindowRef().fromWebContents(
            (event as { sender: unknown }).sender
        );
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
    });
}
