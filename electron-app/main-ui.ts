/** Main renderer UI composition root with state-management integration. */
import {
    createMainUiDevelopmentCleanup,
    createMainUiMenuInjectionRequester,
} from "./renderer/mainUiDevelopmentActions.js";
import { createMainUiDragDropHandler } from "./renderer/mainUiDragDropStartup.js";
import { getMainUiElectronApi } from "./renderer/mainUiElectronApi.js";
import { createMainUiExternalLinkLifecycle } from "./renderer/mainUiExternalLinks.js";
import { getMainUiRuntimeEnvironment } from "./renderer/mainUiRuntimeEnvironment.js";
import { registerMainUiShutdownHook } from "./renderer/mainUiShutdown.js";
import { logMainUiStateStartup } from "./renderer/mainUiStateStartup.js";
import { registerMainUiSummaryColumnSelector } from "./renderer/mainUiSummarySelectorRegistration.js";
import { initializeMainUiThemeSync } from "./renderer/mainUiThemeSync.js";
import {
    createMainUiUnloadFitFile,
    registerMainUiUnloadHandlers,
} from "./renderer/mainUiUnloadFlow.js";
import { initializeMainUiVendorStartup } from "./renderer/mainUiVendorStartup.js";
import { setupWindow } from "./utils/app/initialization/setupWindow.js";
import { UI_CONSTANTS } from "./utils/config/constants.js";

const mainUiConsole = getMainUiRuntimeEnvironment().consoleRef;

function logMainUi(
    level: "error" | "info" | "warn",
    message: string,
    ...args: unknown[]
): void {
    const log = mainUiConsole[level];
    if (typeof log === "function") {
        log.call(mainUiConsole, message, ...args);
    }
}

const CONSTANTS = {
    DOM_IDS: UI_CONSTANTS.DOM_IDS,
    SUMMARY_COLUMN_SELECTOR_DELAY: UI_CONSTANTS.SUMMARY_COLUMN_SELECTOR_DELAY,
} as const;

const getElectronAPI = getMainUiElectronApi;
const unloadFitFile = createMainUiUnloadFitFile({
    contentIds: [
        CONSTANTS.DOM_IDS.CONTENT_MAP,
        CONSTANTS.DOM_IDS.CONTENT_DATA,
        CONSTANTS.DOM_IDS.CONTENT_CHART,
        CONSTANTS.DOM_IDS.CONTENT_SUMMARY,
    ],
    getElectronAPI,
    logMainUi,
});
initializeMainUiThemeSync({ getElectronAPI, logMainUi });

// Register handler to show summary column selector from menu
const electronAPI = getElectronAPI();
registerMainUiSummaryColumnSelector({
    delay: CONSTANTS.SUMMARY_COLUMN_SELECTOR_DELAY,
    electronAPI,
    gearButtonSelector: ".summary-gear-btn",
    logMainUi,
    summaryTabId: CONSTANTS.DOM_IDS.TAB_SUMMARY,
});
registerMainUiUnloadHandlers({
    electronAPI,
    unloadButtonId: CONSTANTS.DOM_IDS.UNLOAD_FILE_BTN,
    unloadFitFile,
});

// Tab button state is now managed automatically by the state management system
// In utils/ui/controls/enableTabButtons.js

// Initialize drag and drop handler
export const mainUiDragDropHandler = createMainUiDragDropHandler();

// Initialize the application window with modern state management
void setupWindow();

// Register cleanup hooks with resource manager
const externalLinks = createMainUiExternalLinkLifecycle();
registerMainUiShutdownHook({
    cleanupExternalLinks: externalLinks.cleanup,
    logMainUi,
});
externalLinks.install();

export const requestMainUiMenuInjection = createMainUiMenuInjectionRequester({
    getElectronAPI,
    logMainUi,
});
export const runMainUiDevelopmentCleanup = createMainUiDevelopmentCleanup({
    logMainUi,
});

// Initialize state managers
logMainUiStateStartup({ logMainUi });

await initializeMainUiVendorStartup({ logMainUi });
