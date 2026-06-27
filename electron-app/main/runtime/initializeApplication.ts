import { CONSTANTS } from "../constants.js";
import { sendToRenderer } from "../ipc/sendToRenderer.js";
import { logWithContext } from "../logging/logWithContext.js";
import { safeCreateAppMenu } from "../menu/safeCreateAppMenu.js";
import { browserWindowRef } from "../runtime/electronAccess.js";
import {
    getLoadedFitFilePath,
    isAutoUpdaterInitialized,
    setAutoUpdaterInitialized,
    setMainWindow,
} from "../state/appState.js";
import { getPersistedThemePreference } from "../theme/getPersistedThemePreference.js";
import { resolveAutoUpdaterAsync } from "../updater/autoUpdaterAccess.js";
import { setupAutoUpdater } from "../updater/setupAutoUpdater.js";
import { bootstrapMainWindow } from "../window/bootstrapMainWindow.js";

/**
 * Bootstraps the main application window and wires up auto-updater integration.
 * Extracted from the monolithic main.js to make the orchestration easier to
 * comprehend.
 */
export async function initializeApplication(): Promise<unknown> {
    return bootstrapMainWindow({
        browserWindowRef,
        CONSTANTS,
        getLoadedFitFilePath,
        isAutoUpdaterInitialized,
        getPersistedThemePreference,
        logWithContext,
        resolveAutoUpdaterAsync,
        safeCreateAppMenu,
        sendToRenderer,
        setAutoUpdaterInitialized,
        setMainWindow,
        setupAutoUpdater,
    });
}
export default { initializeApplication };
