/* eslint-disable import-x/max-dependencies -- main-ui is the legacy renderer composition root; migration keeps dependency cleanup scoped to extracted modules. */
/** Main renderer UI composition root with state-management integration. */
import type { ElectronAPI } from "./shared/preloadApi.js";

import { getMainUiRuntimeEnvironment } from "./renderer/mainUiRuntimeEnvironment.js";
import { createMainUiSummaryColumnSelectorHandler } from "./renderer/mainUiSummaryColumnSelector.js";
import { setupWindow } from "./utils/app/initialization/setupWindow.js";
import { AppActions } from "./utils/app/lifecycle/appActions.js";
import { resourceManager } from "./utils/app/lifecycle/resourceManager.js";
import { chartTabIntegration } from "./utils/charts/core/chartTabIntegration.js";
import { UI_CONSTANTS } from "./utils/config/constants.js";
import { performanceMonitor } from "./utils/debug/stateDevTools.js";
import { fitFileStateManager } from "./utils/state/domain/fitFileState.js";
import { clearRendererActiveFileState } from "./utils/state/domain/rendererActiveFileState.js";
import { setRendererChartsRendered } from "./utils/state/domain/rendererChartRenderState.js";
import { setRendererDragCounter } from "./utils/state/domain/rendererDragDropState.js";
import { getRendererElectronApi } from "./utils/runtime/electronApiRuntime.js";
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
import { showNotification } from "./utils/ui/notifications/showNotification.js";
import { setupExternalLinkHandlers } from "./utils/ui/setupExternalLinkHandlers.js";
/* eslint-enable import-x/max-dependencies -- Keep the exception limited to the legacy composition imports above. */

interface PerformanceMonitorLike {
    readonly endTimer?: (operationId: string) => void;
    readonly isEnabled?: (() => boolean) | boolean;
    readonly startTimer?: (operationId: string) => void;
}

type MainUiElectronApi = Partial<
    Pick<
        ElectronAPI,
        | "injectMenu"
        | "notifyFitFileLoaded"
        | "onOpenSummaryColumnSelector"
        | "onSetTheme"
        | "onUnloadFitFile"
        | "sendThemeChanged"
    >
>;

const mainUiConsole = getMainUiRuntimeEnvironment().consoleRef;

function hasOptionalFunction(
    record: Readonly<Record<string, unknown>>,
    key: keyof MainUiElectronApi
): boolean {
    const value = record[key];
    return value === undefined || typeof value === "function";
}

function isMainUiElectronApi(value: unknown): value is MainUiElectronApi {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const api = value as Readonly<Record<string, unknown>>;
    return [
        "injectMenu",
        "notifyFitFileLoaded",
        "onOpenSummaryColumnSelector",
        "onSetTheme",
        "onUnloadFitFile",
        "sendThemeChanged",
    ].every((key) => hasOptionalFunction(api, key as keyof MainUiElectronApi));
}

function getElectronAPI(): MainUiElectronApi | null {
    return getRendererElectronApi(isMainUiElectronApi);
}

function isPerformanceMonitorEnabled(monitor: PerformanceMonitorLike): boolean {
    return typeof monitor.isEnabled === "function"
        ? monitor.isEnabled()
        : Boolean(monitor.isEnabled);
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

        clearRendererActiveFileState({
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

        // Tab buttons are disabled by state management when active FIT data is cleared.

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
