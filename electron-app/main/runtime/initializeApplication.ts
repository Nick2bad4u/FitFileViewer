import { CONSTANTS } from "../constants.js";
import { sendToRenderer } from "../ipc/sendToRenderer.js";
import { logWithContext } from "../logging/logWithContext.js";
import { safeCreateAppMenu } from "../menu/safeCreateAppMenu.js";
import { browserWindowRef } from "../runtime/electronAccess.js";
import { getAppState, setAppState } from "../state/appState.js";
import { getThemeFromRenderer } from "../theme/getThemeFromRenderer.js";
import { resolveAutoUpdaterAsync } from "../updater/autoUpdaterAccess.js";
import { setupAutoUpdater } from "../updater/setupAutoUpdater.js";

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

const { bootstrapMainWindow } = require("../window/bootstrapMainWindow") as {
    bootstrapMainWindow: (
        options: BootstrapMainWindowDependencies
    ) => Promise<unknown>;
};

/**
 * Bootstraps the main application window and wires up auto-updater integration.
 * Extracted from the monolithic main.js to make the orchestration easier to
 * comprehend.
 */
export async function initializeApplication(): Promise<unknown> {
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
export default { initializeApplication };
