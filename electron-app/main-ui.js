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
import {
    setupDOMContentLoaded,
    setupFullscreenListeners,
} from "./utils/ui/controls/addFullScreenButton.js";
import { DragDropHandler } from "./utils/ui/dragDropHandler.js";
import {
    cleanupEventListeners,
    validateElement,
} from "./utils/ui/mainUiDomUtils.js";
import {
    defineGlobalDataProperty,
    registerLegacyGlobals,
} from "./utils/ui/mainUiGlobals.js";
import { showNotification } from "./utils/ui/notifications/showNotification.js";
import { setupExternalLinkHandlers } from "./utils/ui/setupExternalLinkHandlers.js";

/**
 * @typedef {Object} StateChangeOptions
 *
 * @property {boolean} [silent]
 * @property {string} source
 */

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

/**
 * @type {{
 *     element: EventTarget;
 *     type: string;
 *     handler: Function;
 *     options?: any;
 * }[]}
 */

/**
 * Register an event listener and track it for cleanup.
 *
 * @param {EventTarget & {
 *     addEventListener: Function;
 *     removeEventListener: Function;
 * }} element
 * @param {string} type
 * @param {Function} handler
 * @param {AddEventListenerOptions | boolean} [options]
 *
 * @returns {void}
 */

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
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = "";
        }
    }
}

function clearFitFileDomainState() {
    if (
        !fitFileStateManager ||
        typeof fitFileStateManager.clearFileState !== "function"
    ) {
        return;
    }

    try {
        fitFileStateManager.clearFileState();
    } catch (error) {
        console.warn("[main-ui] Failed to clear fit file domain state", error);
    }
}

// Utility functions for file operations
function unloadFitFile() {
    const operationId = `unload_file_${Date.now()}`;

    // Start performance monitoring (tolerate differing impl shapes)
    {
        const pm = /** @type {any} */ (performanceMonitor);
        if (
            pm &&
            (typeof pm.isEnabled === "function"
                ? pm.isEnabled()
                : Boolean(pm.isEnabled)) &&
            typeof pm.startTimer === "function"
        ) {
            pm.startTimer(operationId);
        }
    }

    try {
        // Clear global data using state management
        // Prefer clearData for backward compatibility if clearGlobalData absent
        if (AppActions.clearData) {
            AppActions.clearData();
        }

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
        if (globalThis.electronAPI?.notifyFitFileLoaded) {
            globalThis.electronAPI.notifyFitFileLoaded(null);
        } else if (globalThis.electronAPI?.send) {
            globalThis.electronAPI.send("fit-file-loaded", null);
        }

        // Tab buttons will be disabled automatically by state management when globalData is cleared

        // Show success notification
        showNotification("File unloaded successfully", "info");

        console.log("[main-ui] File unloaded successfully");
    } catch (error) {
        console.error("[main-ui] Error unloading file:", error);
        showNotification("Error unloading file", "error");
    } finally {
        // End performance monitoring
        {
            const pm2 = /** @type {any} */ (performanceMonitor);
            if (
                pm2 &&
                (typeof pm2.isEnabled === "function"
                    ? pm2.isEnabled()
                    : Boolean(pm2.isEnabled)) &&
                typeof pm2.endTimer === "function"
            ) {
                pm2.endTimer(operationId);
            }
        }
    }
}

// Register legacy globals for backwards compatibility
registerLegacyGlobals({
    showFitData,
    renderChartJS,
    cleanupEventListeners,
    validateElement,
    constants: CONSTANTS,
});

// Enhanced theme change handling with state management integration
if (
    globalThis.electronAPI &&
    typeof globalThis.electronAPI.onSetTheme === "function" &&
    typeof globalThis.electronAPI.sendThemeChanged === "function"
) {
    // Clean theme change handling through state management
    listenForThemeChange((theme) => {
        applyTheme(theme);

        // Update theme in state management - this will trigger reactive chart updates
        UIActions.setTheme(theme);

        console.log(`[main-ui] Theme changed to: ${theme}`);
    });
}

// On load, apply theme
applyTheme(loadTheme());

// Enhanced menu event handling with better error checking
if (
    globalThis.electronAPI &&
    globalThis.electronAPI.onOpenSummaryColumnSelector === undefined
) {
    globalThis.electronAPI.onOpenSummaryColumnSelector = (callback) => {
        if (
            globalThis.electronAPI &&
            /** @type {any} */ (globalThis.electronAPI)
                ._summaryColListenerAdded !== true
        ) {
            /** @type {any} */ (
                globalThis.electronAPI
            )._summaryColListenerAdded = true;
            globalThis.electronAPI.onIpc(
                "open-summary-column-selector",
                callback
            );
        }
    };
}

// Register handler to show summary column selector from menu
if (globalThis.electronAPI && globalThis.electronAPI.onIpc) {
    globalThis.electronAPI.onIpc("open-summary-column-selector", () => {
        try {
            // Switch to summary tab if not already active
            const tabSummary = validateElement(CONSTANTS.DOM_IDS.TAB_SUMMARY);
            if (tabSummary && !tabSummary.classList.contains("active")) {
                (tabSummary instanceof HTMLElement
                    ? tabSummary
                    : /** @type {any} */ (tabSummary)
                ).click();
            }

            // Wait for renderSummary to finish, then open the column selector
            setTimeout(() => {
                const gearBtn = document.querySelector(
                    CONSTANTS.SELECTORS.SUMMARY_GEAR_BTN
                );
                if (gearBtn) {
                    (gearBtn instanceof HTMLElement
                        ? gearBtn
                        : /** @type {any} */ (gearBtn)
                    ).click();
                } else {
                    console.warn("Summary gear button not found");
                }
            }, CONSTANTS.SUMMARY_COLUMN_SELECTOR_DELAY);
        } catch (error) {
            console.error("Error handling summary column selector:", error);
        }
    });
}

// Listen for unload-fit-file event from main process
if (globalThis.electronAPI && globalThis.electronAPI.onIpc) {
    globalThis.electronAPI.onIpc("unload-fit-file", unloadFitFile);
}

// Unload file when the red X is clicked
const unloadBtn = validateElement(CONSTANTS.DOM_IDS.UNLOAD_FILE_BTN);
if (unloadBtn) {
    unloadBtn.addEventListener("click", unloadFitFile);
}

// Tab button state is now managed automatically by the state management system
// In utils/ui/controls/enableTabButtons.js

// Initialize drag and drop handler
const dragDropHandler = new DragDropHandler();

// Expose dragDropHandler for cleanup if needed
// @ts-ignore legacy global
globalThis.dragDropHandler = dragDropHandler;

// Move event listener setup to utility functions
// Sets up event listeners to handle fullscreen mode toggling for the application.
setupFullscreenListeners();

// Sets up event listeners to handle DOMContentLoaded events for initializing UI components.
setupDOMContentLoaded();

// Initialize the application window with modern state management
setupWindow();

// Register cleanup hooks with resource manager
/** @type {null | (() => void)} */
let cleanupExternalLinkHandlers = null;

resourceManager.addShutdownHook(() => {
    console.log("[ResourceManager] Executing main-ui cleanup...");
    try {
        if (typeof cleanupExternalLinkHandlers === "function") {
            cleanupExternalLinkHandlers();
        }
    } catch {
        /* ignore */
    } finally {
        cleanupExternalLinkHandlers = null;
    }
    cleanupEventListeners();
    if (AppActions.clearData) {
        AppActions.clearData();
    }
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
    document.addEventListener(
        "DOMContentLoaded",
        initializeExternalLinkHandlers
    );
} else {
    initializeExternalLinkHandlers();
}

// Enhanced development helper function with better error handling
// @ts-ignore legacy global
globalThis.injectMenu = function (theme = null, fitFilePath = null) {
    try {
        if (
            globalThis.electronAPI &&
            typeof globalThis.electronAPI.injectMenu === "function"
        ) {
            globalThis.electronAPI.injectMenu(theme, fitFilePath);
            console.log(
                "[injectMenu] Requested menu injection with theme:",
                theme,
                "fitFilePath:",
                fitFilePath
            );
        } else {
            console.warn(
                "[injectMenu] electronAPI.injectMenu is not available."
            );
        }
    } catch (error) {
        console.error("[injectMenu] Error during menu injection:", error);
    }
};

// Add cleanup function to development helpers with state management integration
// @ts-ignore legacy global
globalThis.devCleanup = function () {
    cleanupEventListeners();

    // Clear state using the new system
    if (AppActions.clearData) {
        AppActions.clearData();
    }
    setState("charts.isRendered", false, {
        silent: false,
        source: "devCleanup",
    });
    setState("ui.dragCounter", 0, { silent: false, source: "devCleanup" });

    // Clean up our new state managers
    if (/** @type {any} */ (globalThis).chartTabIntegration) {
        // @ts-ignore legacy
        globalThis.chartTabIntegration.destroy();
    }

    // Cleanup all resources via resource manager
    resourceManager.cleanupAll();

    console.log(
        "[devCleanup] Application state and event listeners cleaned up"
    );
};

console.log("[DEV] Development helpers available:");
console.log(
    "- window.injectMenu(theme, fitFilePath) - Inject menu with specified theme and file path"
);
console.log(
    "- window.devCleanup() - Clean up application state and event listeners"
);
console.log("- window.cleanupEventListeners() - Clean up all event listeners");

// Initialize state managers
console.log("[main-ui] Initializing state managers...");

// The imports automatically initialize the state managers
// ChartTabIntegration is a singleton that self-initializes and brings in the other managers
console.log(
    "[main-ui] Chart tab integration:",
    chartTabIntegration?.getStatus?.() || "Not available"
);

console.log("[main-ui] State managers initialized successfully");
