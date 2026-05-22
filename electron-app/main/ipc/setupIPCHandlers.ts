{
    type BrowserWindow = import("electron").BrowserWindow;

    interface BrowserWindowConstructorLike {
        fromWebContents: (webContents: unknown) => BrowserWindow | null;
    }

    interface BrowserConfStore {
        get: (key: string, fallback?: unknown) => unknown;
        set: (key: string, value: unknown) => void;
    }

    interface BrowserConfModule {
        Conf?: new (options: { name: string }) => BrowserConfStore;
    }

    type ConstantsLike = {
        SETTINGS_CONFIG_NAME: string;
        [key: string]: unknown;
    };

    type LogWithContext = (
        level: "error" | "info" | "warn",
        message: string,
        context?: Record<string, unknown>
    ) => void;

    type RegisterDependency = (options: Record<string, unknown>) => unknown;

    type IpcListener = (
        event: { sender: unknown },
        ...args: unknown[]
    ) => unknown;

    const { addRecentFile, loadRecentFiles } =
        require("../../utils/files/recent/recentFiles") as {
            addRecentFile: (filePath: string) => void;
            loadRecentFiles: () => string[];
        };
    const { CONSTANTS } = require("../constants") as {
        CONSTANTS: ConstantsLike;
    };
    const { logWithContext } = require("../logging/logWithContext") as {
        logWithContext: LogWithContext;
    };
    const { safeCreateAppMenu } = require("../menu/safeCreateAppMenu") as {
        safeCreateAppMenu: (
            win: BrowserWindow,
            theme: string,
            loadedFitFilePath?: string | null
        ) => void;
    };
    const { startGyazoOAuthServer, stopGyazoOAuthServer } =
        require("../oauth/gyazoOAuthServer") as {
            startGyazoOAuthServer: (...args: unknown[]) => unknown;
            stopGyazoOAuthServer: (...args: unknown[]) => unknown;
        };
    const {
        appRef,
        browserWindowRef,
        clipboardRef,
        dialogRef,
        nativeImageRef,
        shellRef,
    } = require("../runtime/electronAccess") as {
        appRef: () => unknown;
        browserWindowRef: () => BrowserWindowConstructorLike;
        clipboardRef: () => unknown;
        dialogRef: () => unknown;
        nativeImageRef: () => unknown;
        shellRef: () => unknown;
    };
    const { ensureFitParserStateIntegration } =
        require("../runtime/fitParserIntegration") as {
            ensureFitParserStateIntegration: () => Promise<unknown>;
        };
    const { fs, path } = require("../runtime/nodeModules") as {
        fs: typeof import("node:fs") | null;
        path: typeof import("node:path");
    };
    const { assertFileReadAllowed } =
        require("../security/fileAccessPolicy") as {
            assertFileReadAllowed: (filePath: unknown) => string;
        };
    const { getAppState, setAppState } = require("../state/appState") as {
        getAppState: (key: string) => unknown;
        setAppState: (key: string, value: unknown) => void;
    };
    const { getThemeFromRenderer } =
        require("../theme/getThemeFromRenderer") as {
            getThemeFromRenderer: (win: BrowserWindow) => Promise<string>;
        };
    const { registerIpcHandle, registerIpcListener } =
        require("./ipcRegistry") as {
            registerIpcHandle: (
                channel: string,
                handler: (event: unknown, ...args: unknown[]) => unknown
            ) => void;
            registerIpcListener: (
                channel: string,
                listener: IpcListener
            ) => void;
        };
    const { registerBrowserHandlers } =
        require("./registerBrowserHandlers") as {
            registerBrowserHandlers: RegisterDependency;
        };
    const { registerClipboardHandlers } =
        require("./registerClipboardHandlers") as {
            registerClipboardHandlers: RegisterDependency;
        };
    const { registerDialogHandlers } = require("./registerDialogHandlers") as {
        registerDialogHandlers: RegisterDependency;
    };
    const { registerExternalHandlers } =
        require("./registerExternalHandlers") as {
            registerExternalHandlers: RegisterDependency;
        };
    const { registerFileSystemHandlers } =
        require("./registerFileSystemHandlers") as {
            registerFileSystemHandlers: RegisterDependency;
        };
    const { registerFitFileHandlers } =
        require("./registerFitFileHandlers") as {
            registerFitFileHandlers: RegisterDependency;
        };
    const { registerInfoHandlers } = require("./registerInfoHandlers") as {
        registerInfoHandlers: RegisterDependency;
    };
    const { registerRecentFileHandlers } =
        require("./registerRecentFileHandlers") as {
            registerRecentFileHandlers: RegisterDependency;
        };

    const getErrorMessage = (error: unknown): string =>
        error instanceof Error ? error.message : String(error);

    const getLoadedFitFilePath = (): string | null | undefined => {
        const value = getAppState("loadedFitFilePath");
        return typeof value === "string" ||
            value === null ||
            value === undefined
            ? value
            : null;
    };

    /**
     * Registers all IPC handlers for the main process. The structure mirrors
     * the legacy implementation but lives in a dedicated module to keep main.js
     * lean.
     */
    function setupIPCHandlers(mainWindow?: BrowserWindow | null): void {
        ensureFitParserStateIntegration().catch((error) => {
            logWithContext(
                "warn",
                "Fit parser state integration failed to initialize",
                {
                    error: getErrorMessage(error),
                }
            );
        });

        registerDialogHandlers({
            addRecentFile,
            browserWindowRef,
            CONSTANTS,
            dialogRef,
            getThemeFromRenderer,
            logWithContext,
            mainWindow,
            registerIpcHandle,
            safeCreateAppMenu,
        });

        registerRecentFileHandlers({
            addRecentFile,
            browserWindowRef,
            getAppState: getLoadedFitFilePath,
            getThemeFromRenderer,
            loadRecentFiles,
            logWithContext,
            mainWindow,
            registerIpcHandle,
            safeCreateAppMenu,
        });

        registerBrowserHandlers({
            CONSTANTS,
            dialogRef,
            fs,
            logWithContext,
            path,
            registerIpcHandle,
        });

        // Consolidated IPC registrations.
        // These helpers are unit-tested individually and avoid handler duplication.
        registerFileSystemHandlers({ fs, logWithContext, registerIpcHandle });
        registerFitFileHandlers({
            ensureFitParserStateIntegration,
            logWithContext,
            registerIpcHandle,
        });
        registerInfoHandlers({
            appRef,
            CONSTANTS,
            fs,
            logWithContext,
            path,
            registerIpcHandle,
        });
        registerExternalHandlers({
            logWithContext,
            registerIpcHandle,
            shellRef,
            startGyazoOAuthServer,
            stopGyazoOAuthServer,
        });

        registerClipboardHandlers({
            clipboardRef,
            logWithContext,
            nativeImageRef,
            registerIpcHandle,
        });

        registerIpcListener("fit-file-loaded", async (event, filePath) => {
            if (
                filePath === null ||
                filePath === undefined ||
                (typeof filePath === "string" && filePath.trim() === "")
            ) {
                setAppState("loadedFitFilePath", null);
            } else {
                try {
                    // Don't trust renderer-provided paths blindly; only persist if it is an approved FIT path.
                    const approvedPath = assertFileReadAllowed(filePath);
                    setAppState("loadedFitFilePath", approvedPath);

                    // Default the Browser tab folder to the currently loaded file's directory.
                    // We only do this when the user has not explicitly chosen a browser folder.
                    try {
                        const confMod =
                            require("electron-conf") as BrowserConfModule;
                        const ConfCtor = confMod && confMod.Conf;
                        if (typeof ConfCtor === "function") {
                            const conf = new ConfCtor({
                                name: CONSTANTS.SETTINGS_CONFIG_NAME,
                            });
                            const modeRaw = conf.get(
                                "fitBrowser.rootFolderMode",
                                "auto"
                            );
                            const mode =
                                typeof modeRaw === "string"
                                    ? modeRaw.trim().toLowerCase()
                                    : "auto";
                            if (mode !== "manual") {
                                const dir =
                                    typeof path.dirname === "function"
                                        ? path.dirname(approvedPath)
                                        : "";
                                if (
                                    typeof dir === "string" &&
                                    dir.trim().length > 0
                                ) {
                                    conf.set("fitBrowser.rootFolder", dir);
                                    conf.set(
                                        "fitBrowser.rootFolderMode",
                                        "auto"
                                    );
                                }
                            }
                        }
                    } catch (error) {
                        logWithContext(
                            "warn",
                            "Failed to auto-default fitBrowser folder",
                            {
                                error: getErrorMessage(error),
                            }
                        );
                    }
                } catch (error) {
                    logWithContext(
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
                    const theme = await getThemeFromRenderer(win);
                    safeCreateAppMenu(win, theme, getLoadedFitFilePath());
                } catch (error) {
                    logWithContext(
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

    module.exports = { setupIPCHandlers };
}
