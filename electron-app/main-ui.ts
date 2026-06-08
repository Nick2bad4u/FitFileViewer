/* eslint-disable import-x/max-dependencies -- main-ui is the legacy renderer composition root; migration keeps dependency cleanup scoped to extracted modules. */
/** Main renderer UI composition root with state-management integration. */
import type { ElectronAPIWithDevFlags } from "./shared/preloadApi.js";

import { setupWindow } from "./utils/app/initialization/setupWindow.js";
import { AppActions } from "./utils/app/lifecycle/appActions.js";
import { resourceManager } from "./utils/app/lifecycle/resourceManager.js";
import { chartTabIntegration } from "./utils/charts/core/chartTabIntegration.js";
import { renderChartJS } from "./utils/charts/core/renderChartJS.js";
import { FILE_CONSTANTS, UI_CONSTANTS } from "./utils/config/constants.js";
import { performanceMonitor } from "./utils/debug/stateDevTools.js";
import { showFitData } from "./utils/rendering/core/showFitData.js";
import {
    isDevelopmentEnvironment,
    isTestEnvironment,
} from "./utils/runtime/processEnvironment.js";
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
import { registerLegacyGlobals } from "./utils/ui/mainUiGlobals.js";
import { showNotification } from "./utils/ui/notifications/showNotification.js";
import { setupExternalLinkHandlers } from "./utils/ui/setupExternalLinkHandlers.js";
/* eslint-enable import-x/max-dependencies -- Keep the exception limited to the legacy composition imports above. */

type MainUiGlobal = typeof globalThis & {
    chartTabIntegration?: { destroy?: () => void };
    devCleanup?: () => void;
    dragDropHandler?: unknown;
    electronAPI?: ElectronAPIWithDevFlags;
    injectMenu?: (theme?: null | string, fitFilePath?: null | string) => void;
};

interface PerformanceMonitorLike {
    readonly endTimer?: (operationId: string) => void;
    readonly isEnabled?: (() => boolean) | boolean;
    readonly startTimer?: (operationId: string) => void;
}

type ShowFitDataInput = Parameters<typeof showFitData>[0];

const mainUiConsole = globalThis.console;

function getElectronAPI(): ElectronAPIWithDevFlags | undefined {
    const api: unknown = Reflect.get(globalThis, "electronAPI");
    return typeof api === "object" && api !== null
        ? (api as ElectronAPIWithDevFlags)
        : undefined;
}

function getMainUiGlobal(): MainUiGlobal {
    return globalThis;
}

function isPerformanceMonitorEnabled(monitor: PerformanceMonitorLike): boolean {
    return typeof monitor.isEnabled === "function"
        ? monitor.isEnabled()
        : Boolean(monitor.isEnabled);
}

function isShowFitDataInput(value: unknown): value is ShowFitDataInput {
    return typeof value === "object" && value !== null;
}

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
    IFRAME_PATHS: FILE_CONSTANTS.IFRAME_PATHS,
    SELECTORS: {
        SUMMARY_GEAR_BTN: ".summary-gear-btn",
    },
    SUMMARY_COLUMN_SELECTOR_DELAY: UI_CONSTANTS.SUMMARY_COLUMN_SELECTOR_DELAY,
} as const;

function clearContentAreas(): void {
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

function clearFitFileDomainState(): void {
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
function unloadFitFile(): void {
    const operationId = `unload_file_${Date.now()}`;

    // Start performance monitoring (tolerate differing impl shapes)
    {
        const pm = performanceMonitor as PerformanceMonitorLike;
        const startTimer = pm.startTimer;
        if (
            isPerformanceMonitorEnabled(pm) &&
            typeof startTimer === "function"
        ) {
            startTimer.call(pm, operationId);
        }
    }

    try {
        // Keep managed state and legacy globals in sync through AppActions.
        AppActions.clearData({
            notificationMessage: "File unloaded successfully",
        });

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
        UIActions.showTab("map");

        // Notify main process to update menu
        const electronAPI = getElectronAPI();
        if (typeof electronAPI?.notifyFitFileLoaded === "function") {
            electronAPI.notifyFitFileLoaded(null);
        }

        // Tab buttons will be disabled automatically by state management when globalData is cleared

        logMainUi("info", "[main-ui] File unloaded successfully");
    } catch (error) {
        logMainUi("error", "[main-ui] Error unloading file:", error);
        void showNotification("Error unloading file", "error");
    } finally {
        // End performance monitoring
        const pm2 = performanceMonitor as PerformanceMonitorLike;
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
    renderChartJS: (targetContainer) => {
        void renderChartJS(targetContainer);
    },
    showFitData: (fitData, filePath) => {
        if (!isShowFitDataInput(fitData)) {
            logMainUi(
                "error",
                "[main-ui] Ignoring invalid FIT data passed to legacy showFitData global"
            );
            return;
        }

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
if (typeof electronAPI?.onOpenSummaryColumnSelector === "function") {
    electronAPI.onOpenSummaryColumnSelector(() => {
        try {
            // Switch to summary tab if not already active
            const tabSummary = validateElement(CONSTANTS.DOM_IDS.TAB_SUMMARY);
            if (tabSummary && !tabSummary.classList.contains("active")) {
                tabSummary.click();
            }

            // Wait for renderSummary to finish, then open the column selector
            const summarySelectorTimer = setTimeout(() => {
                const gearBtn = document.querySelector(
                    CONSTANTS.SELECTORS.SUMMARY_GEAR_BTN
                );
                if (gearBtn instanceof HTMLElement) {
                    gearBtn.click();
                } else {
                    logMainUi("warn", "Summary gear button not found");
                }
            }, CONSTANTS.SUMMARY_COLUMN_SELECTOR_DELAY);
            resourceManager.registerTimer(summarySelectorTimer, {
                owner: "main-ui.summary-column-selector",
            });
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
const dragDropHandler = new DragDropHandler();

// Expose dragDropHandler for cleanup if needed
getMainUiGlobal().dragDropHandler = dragDropHandler;

// Move event listener setup to utility functions
// Sets up event listeners to handle fullscreen mode toggling for the application.
setupFullscreenListeners();

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

function installDevelopmentHelpers(): void {
    // Enhanced development helper function with better error handling
    getMainUiGlobal().injectMenu = function injectMenu(
        theme: null | string = null,
        fitFilePath: null | string = null
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
            logMainUi(
                "error",
                "[injectMenu] Error during menu injection:",
                error
            );
        }
    };

    // Add cleanup function to development helpers with state management integration
    getMainUiGlobal().devCleanup = function devCleanup(): void {
        cleanupEventListeners();

        // Clear state using the new system
        AppActions.clearData();
        setState("charts.isRendered", false, {
            silent: false,
            source: "devCleanup",
        });
        setState("ui.dragCounter", 0, {
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
}

if (isDevelopmentEnvironment() || isTestEnvironment()) {
    installDevelopmentHelpers();
} else {
    const mainUiGlobal = getMainUiGlobal();
    if ("injectMenu" in mainUiGlobal) {
        delete mainUiGlobal.injectMenu;
    }
    if ("devCleanup" in mainUiGlobal) {
        delete mainUiGlobal.devCleanup;
    }
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
