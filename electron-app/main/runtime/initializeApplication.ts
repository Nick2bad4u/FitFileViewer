import { sendToRenderer } from "../ipc/sendToRenderer.js";

{
    type BrowserWindow = import("electron").BrowserWindow;
    type RendererIpcEventChannel =
        import("../../shared/ipc").RendererIpcEventChannel;

    interface BootstrapMainWindowDependencies {
        browserWindowRef: () => unknown;
        CONSTANTS: Record<string, unknown>;
        getAppState: (key: string) => unknown;
        getThemeFromRenderer: (win: BrowserWindow) => Promise<string>;
        logWithContext: (
            level: "error" | "info" | "warn",
            message: string,
            context?: Record<string, unknown>
        ) => void;
        resolveAutoUpdaterAsync: () => Promise<unknown>;
        safeCreateAppMenu: (
            win: BrowserWindow,
            theme: string,
            loadedFitFilePath?: string | null
        ) => void;
        sendToRenderer: (
            win: BrowserWindow,
            channel: RendererIpcEventChannel,
            ...args: unknown[]
        ) => void;
        setAppState: (key: string, value: unknown) => void;
        setupAutoUpdater: (options: Record<string, unknown>) => unknown;
    }

    const { CONSTANTS } = require("../constants") as {
        CONSTANTS: Record<string, unknown>;
    };
    const { logWithContext } = require("../logging/logWithContext") as {
        logWithContext: BootstrapMainWindowDependencies["logWithContext"];
    };
    const { safeCreateAppMenu } = require("../menu/safeCreateAppMenu") as {
        safeCreateAppMenu: BootstrapMainWindowDependencies["safeCreateAppMenu"];
    };
    const { browserWindowRef } = require("../runtime/electronAccess") as {
        browserWindowRef: () => unknown;
    };
    const { getAppState, setAppState } = require("../state/appState") as {
        getAppState: (key: string) => unknown;
        setAppState: (key: string, value: unknown) => void;
    };
    const { getThemeFromRenderer } =
        require("../theme/getThemeFromRenderer") as {
            getThemeFromRenderer: BootstrapMainWindowDependencies["getThemeFromRenderer"];
        };
    const { resolveAutoUpdaterAsync } =
        require("../updater/autoUpdaterAccess") as {
            resolveAutoUpdaterAsync: () => Promise<unknown>;
        };
    const { setupAutoUpdater } = require("../updater/setupAutoUpdater") as {
        setupAutoUpdater: BootstrapMainWindowDependencies["setupAutoUpdater"];
    };
    const { bootstrapMainWindow } =
        require("../window/bootstrapMainWindow") as {
            bootstrapMainWindow: (
                options: BootstrapMainWindowDependencies
            ) => Promise<unknown>;
        };

    /**
     * Bootstraps the main application window and wires up auto-updater
     * integration. Extracted from the monolithic main.js to make the
     * orchestration easier to comprehend.
     */
    async function initializeApplication(): Promise<unknown> {
        return bootstrapMainWindow({
            browserWindowRef,
            CONSTANTS,
            getAppState,
            getThemeFromRenderer,
            logWithContext,
            resolveAutoUpdaterAsync,
            safeCreateAppMenu,
            sendToRenderer,
            setAppState,
            setupAutoUpdater,
        });
    }

    module.exports = { initializeApplication };
}
