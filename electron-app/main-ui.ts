/** Main renderer UI composition root with state-management integration. */
import { getMainUiElectronApi } from "./renderer/mainUiElectronApi.js";
import { getMainUiRuntimeEnvironment } from "./renderer/mainUiRuntimeEnvironment.js";
import { createMainUiSummaryColumnSelectorHandler } from "./renderer/mainUiSummaryColumnSelector.js";
import { initializeMainUiThemeSync } from "./renderer/mainUiThemeSync.js";
import { createMainUiUnloadFitFile } from "./renderer/mainUiUnloadFlow.js";
import { ensureRendererVendorBundle } from "./renderer/vendorBundleLoader.js";
import { setupWindow } from "./utils/app/initialization/setupWindow.js";
import { AppActions } from "./utils/app/lifecycle/appActions.js";
import { resourceManager } from "./utils/app/lifecycle/resourceManager.js";
import { chartTabIntegration } from "./utils/charts/core/chartTabIntegration.js";
import { UI_CONSTANTS } from "./utils/config/constants.js";
import { setRendererChartsRendered } from "./utils/state/domain/rendererChartRenderState.js";
import { setRendererDragCounter } from "./utils/state/domain/rendererDragDropState.js";
import { setupFullscreenListeners } from "./utils/ui/controls/addFullScreenButton.js";
import { DragDropHandler } from "./utils/ui/dragDropHandler.js";
import {
    addEventListenerWithCleanup,
    cleanupEventListeners,
    validateElement,
} from "./utils/ui/mainUiDomUtils.js";
import { setupExternalLinkHandlers } from "./utils/ui/setupExternalLinkHandlers.js";

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
if (typeof electronAPI?.onOpenSummaryColumnSelector === "function") {
    electronAPI.onOpenSummaryColumnSelector(
        createMainUiSummaryColumnSelectorHandler({
            delay: CONSTANTS.SUMMARY_COLUMN_SELECTOR_DELAY,
            gearButtonSelector: ".summary-gear-btn",
            logMainUi,
            registerTimer: (timer, options) =>
                resourceManager.registerTimer(timer, options),
            summaryTabId: CONSTANTS.DOM_IDS.TAB_SUMMARY,
        })
    );
}

// Listen for unload-fit-file event from main process
if (typeof electronAPI?.onUnloadFitFile === "function") {
    electronAPI.onUnloadFitFile(unloadFitFile);
}

// Unload file when the red X is clicked
const unloadBtn = validateElement(CONSTANTS.DOM_IDS.UNLOAD_FILE_BTN);
if (unloadBtn) {
    addEventListenerWithCleanup(unloadBtn, "click", unloadFitFile);
}

// Tab button state is now managed automatically by the state management system
// In utils/ui/controls/enableTabButtons.js

// Initialize drag and drop handler
export const mainUiDragDropHandler = new DragDropHandler();

// Initialize the application window with modern state management
void setupWindow();

// Register cleanup hooks with resource manager
let cleanupExternalLinkHandlers: (() => void) | null = null;

resourceManager.addShutdownHook(() => {
    logMainUi("info", "[ResourceManager] Executing main-ui cleanup...");
    try {
        if (typeof cleanupExternalLinkHandlers === "function") {
            cleanupExternalLinkHandlers();
        }
    } catch {
        /* Ignore cleanup errors during shutdown. */
    } finally {
        cleanupExternalLinkHandlers = null;
    }
    cleanupEventListeners();
    AppActions.clearData();
});

// External link handler for opening links in default browser
const initializeExternalLinkHandlers = (): void => {
    setupExternalLinkHandlers({
        cleanupExternalLinkHandlers,
        setCleanup: (cleanup) => {
            cleanupExternalLinkHandlers = cleanup;
        },
    });
};

// Initialize external link handlers after DOM is loaded
if (document.readyState === "loading") {
    addEventListenerWithCleanup(
        document,
        "DOMContentLoaded",
        initializeExternalLinkHandlers,
        { once: true }
    );
} else {
    initializeExternalLinkHandlers();
}

export function requestMainUiMenuInjection(
    theme: null | string = null,
    fitFilePath: null | string = null
): void {
    try {
        const api = getElectronAPI();
        if (typeof api?.injectMenu === "function") {
            void api.injectMenu(theme, fitFilePath);
            logMainUi(
                "info",
                "[injectMenu] Requested menu injection with theme:",
                theme,
                "fitFilePath:",
                fitFilePath
            );
        } else {
            logMainUi(
                "warn",
                "[injectMenu] electronAPI.injectMenu is not available."
            );
        }
    } catch (error) {
        logMainUi("error", "[injectMenu] Error during menu injection:", error);
    }
}

export function runMainUiDevelopmentCleanup(): void {
    cleanupEventListeners();

    // Clear state using the new system
    AppActions.clearData();
    setRendererChartsRendered(false, {
        silent: false,
        source: "devCleanup",
    });
    setRendererDragCounter(0, {
        silent: false,
        source: "devCleanup",
    });

    // Clean up our new state managers
    if (typeof chartTabIntegration.destroy === "function") {
        chartTabIntegration.destroy();
    }

    // Cleanup all resources via resource manager
    resourceManager.cleanupAll();

    logMainUi(
        "info",
        "[devCleanup] Application state and event listeners cleaned up"
    );
}

// Initialize state managers
logMainUi("info", "[main-ui] Initializing state managers...");

// The imports automatically initialize the state managers
// ChartTabIntegration is a singleton that self-initializes and brings in the other managers
logMainUi(
    "info",
    "[main-ui] Chart tab integration:",
    chartTabIntegration.getStatus()
);

logMainUi("info", "[main-ui] State managers initialized successfully");

// Move event listener setup to utility functions
// Sets up event listeners to handle fullscreen mode toggling for the application.
try {
    await ensureRendererVendorBundle("core");
} catch (error: unknown) {
    logMainUi("warn", "[main-ui] Core vendor bundle failed to load", error);
} finally {
    setupFullscreenListeners();
}
