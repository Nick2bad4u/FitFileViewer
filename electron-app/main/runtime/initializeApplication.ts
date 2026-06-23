import { CONSTANTS } from "../constants.js";
import { sendToRenderer } from "../ipc/sendToRenderer.js";
import { logWithContext } from "../logging/logWithContext.js";
import { safeCreateAppMenu } from "../menu/safeCreateAppMenu.js";
import { browserWindowRef } from "../runtime/electronAccess.js";
import { getAppState, setAppState } from "../state/appState.js";
import { getThemeFromRenderer } from "../theme/getThemeFromRenderer.js";
import { resolveAutoUpdaterAsync } from "../updater/autoUpdaterAccess.js";
import { setupAutoUpdater } from "../updater/setupAutoUpdater.js";
import { bootstrapMainWindow } from "../window/bootstrapMainWindow.js";

type BootstrapMainWindowDependencies = Parameters<
    typeof bootstrapMainWindow
>[0];

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
        getThemeFromRenderer:
            getThemeFromRenderer as BootstrapMainWindowDependencies["getThemeFromRenderer"],
        logWithContext,
        resolveAutoUpdaterAsync,
        safeCreateAppMenu,
        sendToRenderer,
        setAppState,
        setupAutoUpdater,
    });
}
export default { initializeApplication };
