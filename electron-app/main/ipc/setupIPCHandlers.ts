import { CONSTANTS as MAIN_PROCESS_CONSTANTS } from "../constants.js";
import {
    startGyazoOAuthServer,
    stopGyazoOAuthServer,
} from "../oauth/gyazoOAuthServer.js";
import { assertFileReadAllowed } from "../security/fileAccessPolicy.js";
import { getAppState, setAppState } from "../state/appState.js";
import { getThemeFromRenderer } from "../theme/getThemeFromRenderer.js";
import { registerBrowserHandlers } from "./registerBrowserHandlers.js";
import { registerClipboardHandlers } from "./registerClipboardHandlers.js";
import { registerDialogHandlers } from "./registerDialogHandlers.js";
import { registerExternalHandlers } from "./registerExternalHandlers.js";
import { registerFileSystemHandlers } from "./registerFileSystemHandlers.js";
import { registerFitFileHandlers } from "./registerFitFileHandlers.js";
import { registerInfoHandlers } from "./registerInfoHandlers.js";
import { registerIpcHandle, registerIpcListener } from "./ipcRegistry.js";
import { registerRecentFileHandlers } from "./registerRecentFileHandlers.js";

type ConstantsLike = {
    DEFAULT_THEME: string;
    DIALOG_FILTERS: {
        FIT_FILES: NonNullable<import("electron").OpenDialogOptions["filters"]>;
    };
    SETTINGS_CONFIG_NAME: string;
    [key: string]: unknown;
};

const CONSTANTS = MAIN_PROCESS_CONSTANTS as unknown as ConstantsLike;

type BrowserWindow = import("electron").BrowserWindow;

interface BrowserWindowConstructorLike {
    fromWebContents: (webContents: unknown) => BrowserWindow | null;
    getFocusedWindow?: () => BrowserWindow | null;
}

interface DialogApi {
    showOpenDialog: (
        options: import("electron").OpenDialogOptions
    ) => Promise<import("electron").OpenDialogReturnValue>;
}

interface AppInfoProvider {
    getAppPath?: () => string;
    getVersion?: () => string;
}

interface ClipboardWriter {
    writeImage?: (image: unknown) => void;
    writeText?: (text: string) => void;
}

interface ExternalShell {
    openExternal: (url: string) => Promise<void>;
}

interface NativeImageFactory {
    createFromDataURL?: (dataUrl: string) => unknown;
}

type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;

const { addRecentFile, loadRecentFiles } =
    require("../../utils/files/recent/recentFiles") as {
        addRecentFile: (filePath: string) => void;
        loadRecentFiles: () => string[];
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
const {
    appRef,
    browserWindowRef,
    clipboardRef,
    dialogRef,
    nativeImageRef,
    shellRef,
} = require("../runtime/electronAccess") as {
    appRef: () => AppInfoProvider | null | undefined;
    browserWindowRef: () => BrowserWindowConstructorLike;
    clipboardRef: () => ClipboardWriter | null | undefined;
    dialogRef: () => DialogApi | null | undefined;
    nativeImageRef: () => NativeImageFactory | null | undefined;
    shellRef: () => ExternalShell | null | undefined;
};
const { ensureFitParserStateIntegration } =
    require("../runtime/fitParserIntegration") as {
        ensureFitParserStateIntegration: () => Promise<unknown>;
    };
const { fs, path } = require("../runtime/nodeModules") as {
    fs: typeof import("node:fs") | null;
    path: typeof import("node:path");
};
const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

const getLoadedFitFilePath = (): string | null | undefined => {
    const value = getAppState("loadedFitFilePath");
    return typeof value === "string" || value === null || value === undefined
        ? value
        : null;
};

/**
 * Registers all IPC handlers for the main process. The structure mirrors the
 * legacy implementation but lives in a dedicated module to keep main.js lean.
 */
export function setupIPCHandlers(mainWindow?: BrowserWindow | null): void {
    ensureFitParserStateIntegration().catch((error: unknown) => {
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

        const win = browserWindowRef().fromWebContents(
            (event as { sender: unknown }).sender
        );
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
export default { setupIPCHandlers };
