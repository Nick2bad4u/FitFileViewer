/* eslint-disable import-x/max-dependencies -- main-ui is the legacy renderer composition root; migration keeps dependency cleanup scoped to extracted modules. */
/**
 * Handles UI interactions, file operations, and state management for the
 * FitFileViewer application
 *
 * @version 2.0.0
 *
 * @file Main UI Controller with State Management Integration
 *
 * @author FitFileViewer Development Team
 */

import { setupWindow } from "./utils/app/initialization/setupWindow.js";
import { AppActions } from "./utils/app/lifecycle/appActions.js";
import { resourceManager } from "./utils/app/lifecycle/resourceManager.js";
import { chartTabIntegration } from "./utils/charts/core/chartTabIntegration.js";
import { renderChartJS } from "./utils/charts/core/renderChartJS.js";
import { performanceMonitor } from "./utils/debug/stateDevTools.js";
import { showFitData } from "./utils/rendering/core/showFitData.js";
// State Management Integration
import { setState } from "./utils/state/core/stateManager.js";
import { fitFileStateManager } from "./utils/state/domain/fitFileState.js";
import { UIActions } from "./utils/state/domain/uiStateManager.js";
// This file is part of the Electron app that interacts with the main process and the UI.
import {
    applyTheme,
    listenForThemeChange,
    loadTheme,
} from "./utils/theming/core/theme.js";
import { setupFullscreenListeners } from "./utils/ui/controls/addFullScreenButton.js";
import { getElementByIdFlexible } from "./utils/ui/dom/elementIdUtils.js";
import { DragDropHandler } from "./utils/ui/dragDropHandler.js";
import {
    addEventListenerWithCleanup,
    cleanupEventListeners,
    validateElement,
} from "./utils/ui/mainUiDomUtils.js";
import {
    defineGlobalDataProperty,
    registerLegacyGlobals,
} from "./utils/ui/mainUiGlobals.js";
import { showNotification } from "./utils/ui/notifications/showNotification.js";
import { setupExternalLinkHandlers } from "./utils/ui/setupExternalLinkHandlers.js";
/* eslint-enable import-x/max-dependencies -- Keep the exception limited to the legacy composition imports above. */

/**
 * @typedef {import("./shared/preloadApi.js").ElectronAPIWithDevFlags} ElectronAPIWithDevFlags
 */
/**
 * @typedef {Object} StateChangeOptions
 *
 * @property {boolean} [silent]
 * @property {string} source
 */
/**
 * @typedef {Object} PerformanceMonitorLike
 *
 * @property {boolean | (() => boolean)} [isEnabled]
 * @property {(operationId: string) => void} [startTimer]
 * @property {(operationId: string) => void} [endTimer]
 */
/**
 * @typedef {typeof globalThis & {
 *     chartTabIntegration?: { destroy?: () => void };
 *     devCleanup?: () => void;
 *     dragDropHandler?: unknown;
 *     electronAPI?: ElectronAPIWithDevFlags;
 *     injectMenu?: (
 *         theme?: string | null,
 *         fitFilePath?: string | null
 *     ) => void;
 * }} MainUiGlobal
 */
/**
 * @typedef {(
 *     channel: "open-summary-column-selector" | "unload-fit-file",
 *     callback: (...args: unknown[]) => void
 * ) => (() => void) | undefined} MainUiIpcListener
 */

const mainUiConsole = globalThis.console;

/**
 * @returns {ElectronAPIWithDevFlags | undefined}
 */
function getElectronAPI() {
    const api = /** @type {unknown} */ (Reflect.get(globalThis, "electronAPI"));
    return typeof api === "object" && api !== null
        ? /** @type {ElectronAPIWithDevFlags} */ (api)
        : undefined;
}

/**
 * @returns {MainUiGlobal}
 */
function getMainUiGlobal() {
    return /** @type {MainUiGlobal} */ (globalThis);
}

/**
 * @param {PerformanceMonitorLike} monitor
 *
 * @returns {boolean}
 */
function isPerformanceMonitorEnabled(monitor) {
    return typeof monitor.isEnabled === "function"
        ? monitor.isEnabled()
        : Boolean(monitor.isEnabled);
}

/**
 * @param {"error" | "info" | "warn"} level
 * @param {string} message
 * @param {...unknown} args
 *
 * @returns {void}
 */
function logMainUi(level, message, ...args) {
    const log = mainUiConsole[level];
    if (typeof log === "function") {
        log.call(mainUiConsole, message, ...args);
    }
}

// Constants (add missing CONTENT_CHART used by clearContentAreas)
const CONSTANTS = {
    DOM_IDS: {
        ACTIVE_FILE_NAME: "active_file_name",
        ACTIVE_FILE_NAME_CONTAINER: "active_file_name_container",
        ALT_FIT_IFRAME: "altfit_iframe",
        CONTENT_CHART: "content_chart",
        CONTENT_DATA: "content_data",
        CONTENT_MAP: "content_map",
        CONTENT_SUMMARY: "content_summary",
        DROP_OVERLAY: "drop_overlay",
        TAB_CHART: "tab_chart",
        TAB_SUMMARY: "tab_summary",
        UNLOAD_FILE_BTN: "unload_file_btn",
        ZWIFT_IFRAME: "zwift_iframe",
    },
    IFRAME_PATHS: {
        ALT_FIT: "ffv/index.html",
    },
    SELECTORS: {
        SUMMARY_GEAR_BTN: ".summary-gear-btn",
    },
    SUMMARY_COLUMN_SELECTOR_DELAY: 100,
};

// Make globalData available on window for backwards compatibility
defineGlobalDataProperty();

function clearContentAreas() {
    const contentIds = [
        CONSTANTS.DOM_IDS.CONTENT_MAP,
        CONSTANTS.DOM_IDS.CONTENT_DATA,
        CONSTANTS.DOM_IDS.CONTENT_CHART,
        CONSTANTS.DOM_IDS.CONTENT_SUMMARY,
    ];

    for (const id of contentIds) {
        const element = getElementByIdFlexible(document, id);
        if (element) {
            element.replaceChildren();
        }
    }
}

function clearFitFileDomainState() {
    if (typeof fitFileStateManager.clearFileState !== "function") {
        return;
    }

    try {
        fitFileStateManager.clearFileState();
    } catch (error) {
        logMainUi(
            "warn",
            "[main-ui] Failed to clear fit file domain state",
            error
        );
    }
}

// Utility functions for file operations
function unloadFitFile() {
    const operationId = `unload_file_${Date.now()}`;

    // Start performance monitoring (tolerate differing impl shapes)
    {
        const pm = /** @type {PerformanceMonitorLike} */ (performanceMonitor);
        const startTimer = pm.startTimer;
        if (
            isPerformanceMonitorEnabled(pm) &&
            typeof startTimer === "function"
        ) {
            startTimer.call(pm, operationId);
        }
    }

    try {
        // Clear global data using state management
        // Prefer clearData for backward compatibility if clearGlobalData absent
        AppActions.clearData();

        // Ensure domain-level fit state is cleared as well
        clearFitFileDomainState();

        setState(
            "ui.fileInfo",
            {
                displayName: "",
                hasFile: false,
                title: "",
            },
            { silent: false, source: "main-ui.unloadFitFile" }
        );
        setState("ui.unloadButtonVisible", false, {
            silent: false,
            source: "main-ui.unloadFitFile",
        });
        setState("currentFile", null, {
            silent: false,
            source: "main-ui.unloadFitFile",
        });

        // Clear UI
        clearContentAreas();

        // Switch to map tab using UI actions
        UIActions.showTab("tab_map");

        // Notify main process to update menu
        const electronAPI = getElectronAPI();
        if (typeof electronAPI?.notifyFitFileLoaded === "function") {
            electronAPI.notifyFitFileLoaded(null);
        } else if (typeof electronAPI?.send === "function") {
            electronAPI.send("fit-file-loaded", null);
        }

        // Tab buttons will be disabled automatically by state management when globalData is cleared

        // Show success notification
        void showNotification("File unloaded successfully", "info");

        logMainUi("info", "[main-ui] File unloaded successfully");
    } catch (error) {
        logMainUi("error", "[main-ui] Error unloading file:", error);
        void showNotification("Error unloading file", "error");
    } finally {
        // End performance monitoring
        const pm2 = /** @type {PerformanceMonitorLike} */ (performanceMonitor);
        const endTimer = pm2.endTimer;
        if (
            isPerformanceMonitorEnabled(pm2) &&
            typeof endTimer === "function"
        ) {
            endTimer.call(pm2, operationId);
        }
    }
}

// Register legacy globals for backwards compatibility
registerLegacyGlobals({
    cleanupEventListeners,
    constants: CONSTANTS,
    renderChartJS: (data, filePath, options) => {
        void renderChartJS(data, filePath, options);
    },
    showFitData: (fitData, filePath) => {
        showFitData(fitData, filePath);
    },
    validateElement,
});

// Enhanced theme change handling with state management integration
const electronAPI = getElectronAPI();
if (
    typeof electronAPI?.onSetTheme === "function" &&
    typeof electronAPI.sendThemeChanged === "function"
) {
    // Clean theme change handling through state management
    listenForThemeChange((theme) => {
        applyTheme(theme);

        // Update theme in state management - this will trigger reactive chart updates
        UIActions.setTheme(theme);

        logMainUi("info", `[main-ui] Theme changed to: ${theme}`);
    });
}

// On load, apply theme
applyTheme(loadTheme());

// Register handler to show summary column selector from menu
if (typeof electronAPI?.onIpc === "function") {
    const onIpc = /** @type {MainUiIpcListener} */ (electronAPI.onIpc);
    onIpc("open-summary-column-selector", () => {
        try {
            // Switch to summary tab if not already active
            const tabSummary = validateElement(CONSTANTS.DOM_IDS.TAB_SUMMARY);
            if (tabSummary && !tabSummary.classList.contains("active")) {
                tabSummary.click();
            }

            // Wait for renderSummary to finish, then open the column selector
            setTimeout(() => {
                const gearBtn = document.querySelector(
                    CONSTANTS.SELECTORS.SUMMARY_GEAR_BTN
                );
                if (gearBtn instanceof HTMLElement) {
                    gearBtn.click();
                } else {
                    logMainUi("warn", "Summary gear button not found");
                }
            }, CONSTANTS.SUMMARY_COLUMN_SELECTOR_DELAY);
        } catch (error) {
            logMainUi(
                "error",
                "Error handling summary column selector:",
                error
            );
        }
    });
}

// Listen for unload-fit-file event from main process
if (typeof electronAPI?.onIpc === "function") {
    const onIpc = /** @type {MainUiIpcListener} */ (electronAPI.onIpc);
    onIpc("unload-fit-file", unloadFitFile);
}

// Unload file when the red X is clicked
const unloadBtn = validateElement(CONSTANTS.DOM_IDS.UNLOAD_FILE_BTN);
if (unloadBtn) {
    addEventListenerWithCleanup(unloadBtn, "click", unloadFitFile);
}

// Tab button state is now managed automatically by the state management system
// In utils/ui/controls/enableTabButtons.js

// Initialize drag and drop handler
const dragDropHandler = new DragDropHandler();

// Expose dragDropHandler for cleanup if needed
getMainUiGlobal().dragDropHandler = dragDropHandler;

// Move event listener setup to utility functions
// Sets up event listeners to handle fullscreen mode toggling for the application.
setupFullscreenListeners();

// Initialize the application window with modern state management
void setupWindow();

// Register cleanup hooks with resource manager
/** @type {null | (() => void)} */
let cleanupExternalLinkHandlers = null;

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
const initializeExternalLinkHandlers = () => {
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

// Enhanced development helper function with better error handling
getMainUiGlobal().injectMenu = function injectMenu(
    theme = null,
    fitFilePath = null
) {
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
};

// Add cleanup function to development helpers with state management integration
getMainUiGlobal().devCleanup = function devCleanup() {
    cleanupEventListeners();

    // Clear state using the new system
    AppActions.clearData();
    setState("charts.isRendered", false, {
        silent: false,
        source: "devCleanup",
    });
    setState("ui.dragCounter", 0, { silent: false, source: "devCleanup" });

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
};

logMainUi("info", "[DEV] Development helpers available:");
logMainUi(
    "info",
    "- window.injectMenu(theme, fitFilePath) - Inject menu with specified theme and file path"
);
logMainUi(
    "info",
    "- window.devCleanup() - Clean up application state and event listeners"
);
logMainUi(
    "info",
    "- window.cleanupEventListeners() - Clean up all event listeners"
);

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
