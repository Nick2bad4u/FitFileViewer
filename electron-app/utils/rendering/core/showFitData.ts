/**
 * FIT data display utility for FitFileViewer Handles the display and management
 * of loaded FIT file data with state management integration
 */

import { AppActions } from "../../app/lifecycle/appActions.js";
import { createGlobalChartStatusIndicator } from "../../charts/components/createGlobalChartStatusIndicator.js";
import {
    applyAuxHeartRateToRecords,
    resolveFieldDescriptionMessages,
} from "../../data/processing/auxHeartRateUtils.js";
import { applyEstimatedPowerToRecords } from "../../data/processing/estimateCyclingPower.js";
import { getPowerEstimationSettings } from "../../data/processing/powerEstimationSettings.js";
import { createRendererLogger } from "../../logging/rendererLogger.js";
import { setState } from "../../state/core/stateManager.js";
import type { ElectronAPI } from "../../../shared/preloadApi.js";

// Constants for better maintainability
const DISPLAY_CONSTANTS = {
    CSS_CLASSES: {
        HAS_FILE: "has-file",
        MARQUEE: "marquee",
    },
    EVENTS: {
        FIT_FILE_LOADED: "fitfile-loaded",
    },
    LOG_PREFIX: "ShowFitData",
    SELECTORS: {
        ACTIVE_FILE_NAME: "active_file_name",
        FILE_NAME_CONTAINER: "active_file_name_container",
        UNLOAD_BUTTON: "unload_file_btn",
    },
    MAP_RENDER_RETRY_DELAY_MS: 50,
    MAP_RENDER_RETRY_LIMIT: 200,
    TITLE_PREFIX: "Fit File Viewer",
} as const;

const log = createRendererLogger(DISPLAY_CONSTANTS.LOG_PREFIX);
let pendingMapRenderRetryTimerId: ReturnType<typeof setTimeout> | undefined;

type FitRecord = Record<string, unknown>;

type FitDataObject = {
    cachedFileName?: string;
    cachedFilePath?: string;
    recordMesgs?: FitRecord[];
    sessionMesgs?: FitRecord[];
} & Record<string, unknown>;

/** Display options accepted by the FIT data renderer. */
export type ShowFitDataOptions = {
    resetRenderStates?: boolean;
    updateUI?: boolean;
};

type ElectronApiLike = Partial<Pick<ElectronAPI, "notifyFitFileLoaded">>;

type FitFileStateManagerLike = {
    handleFileLoaded: (
        data: FitDataObject,
        context: { filePath: null | string }
    ) => void;
    isLoading?: () => boolean;
    startFileLoading?: (filePath: string) => void;
};

type EstimatedPowerInput = Parameters<typeof applyEstimatedPowerToRecords>[0];

type ShowFitDataGlobal = typeof globalThis & {
    __FFV_fitFileStateManager?: unknown;
    createTables?: (data: FitDataObject) => void;
    electronAPI?: ElectronApiLike;
    globalData?: FitDataObject;
    isMapRendered?: boolean;
    renderMap?: () => void;
    renderSummary?: (data: FitDataObject) => void;
    setTabButtonsEnabled?: (enabled: boolean) => void;
    updateActiveTab?: (tabId: string) => void;
    updateTabVisibility?: (contentId: string) => void;
};

function getShowFitDataGlobal(): ShowFitDataGlobal {
    return globalThis;
}

/**
 * Shows FIT data in the UI and updates application state.
 *
 * @param data - Parsed FIT file data.
 * @param filePath - Path to the FIT file.
 * @param options - Display options.
 *
 * @throws When the supplied data is not a valid object or state integration
 *   fails.
 */
export function showFitData(
    data: FitDataObject,
    filePath?: string,
    options: ShowFitDataOptions = {}
): void {
    const config = {
        resetRenderStates: true,
        updateUI: true,
        ...options,
    };

    try {
        // Validate input
        if (!data || typeof data !== "object") {
            throw new Error("Invalid data: expected object");
        }

        log("info", "Displaying FIT data", {
            filePath,
            hasData: Boolean(data),
        });

        integrateFitState(data, filePath);

        // Set global data for legacy compatibility
        const showFitGlobal = getShowFitDataGlobal();
        showFitGlobal.globalData = data;

        // Apply estimated power early so Charts/Summary/Tables can consume it immediately.
        // This only applies to cycling-like activities that lack real power, and only when enabled.
        try {
            if (
                showFitGlobal.globalData &&
                Array.isArray(showFitGlobal.globalData.recordMesgs)
            ) {
                const powerInput: EstimatedPowerInput = {
                    recordMesgs: showFitGlobal.globalData.recordMesgs,
                    settings: getPowerEstimationSettings(),
                };
                if (Array.isArray(showFitGlobal.globalData.sessionMesgs)) {
                    powerInput.sessionMesgs =
                        showFitGlobal.globalData.sessionMesgs;
                }
                applyEstimatedPowerToRecords(powerInput);
            }
        } catch {
            /* ignore */
        }

        // Normalize auxiliary heart rate fields so charts/map/tables can render them.
        try {
            if (
                showFitGlobal.globalData &&
                Array.isArray(showFitGlobal.globalData.recordMesgs)
            ) {
                applyAuxHeartRateToRecords({
                    fieldDescriptionMesgs: resolveFieldDescriptionMessages(
                        showFitGlobal.globalData
                    ),
                    recordMesgs: showFitGlobal.globalData.recordMesgs,
                });
            }
        } catch {
            /* ignore */
        }

        // Reset rendering states if requested
        if (config.resetRenderStates) {
            log(
                "info",
                "resetRenderStates option is deprecated and now handled by AppActions"
            );
        }

        // Handle file path and UI updates
        if (filePath && config.updateUI) {
            const fileName = getCachedFileName(data, filePath);

            // Update file display state
            updateFileState(fileName);

            // Enable tabs and send notifications
            enableTabsAndNotify(filePath);

            // Switch to map tab early to avoid a brief summary flash during load.
            switchToMapTabOnLoad();

            try {
                if (typeof globalThis.scrollTo === "function") {
                    const prefersReducedMotion =
                        typeof globalThis.matchMedia === "function" &&
                        globalThis.matchMedia(
                            "(prefers-reduced-motion: reduce)"
                        ).matches;

                    queueMicrotask(() => {
                        globalThis.scrollTo({
                            top: 0,
                            behavior: prefersReducedMotion ? "auto" : "smooth",
                        });
                    });
                }
            } catch {
                /* no-op */
            }
        }

        // Create global chart status indicator if available
        if (typeof createGlobalChartStatusIndicator === "function") {
            try {
                createGlobalChartStatusIndicator();
            } catch (indicatorError) {
                const errorMessage =
                    indicatorError instanceof Error
                        ? indicatorError.message
                        : "Unknown error creating chart status indicator";
                log("warn", "Error creating chart status indicator", {
                    error: errorMessage,
                });
            }
        }

        log("info", "FIT data displayed successfully", {
            filePath,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Unknown error showing FIT data";
        log("error", "Error showing FIT data", {
            error: errorMessage,
            filePath,
        });

        // Let the central error handling system manage this error
        // instead of writing directly to state
        console.error("[ShowFitData] Error:", error);

        throw error;
    } finally {
        try {
            AppActions.setFileOpening(false);
        } catch {
            /* ignore */
        }
    }

    // Create tables if available
    const showFitGlobal = getShowFitDataGlobal();

    if (showFitGlobal.createTables && showFitGlobal.globalData) {
        showFitGlobal.createTables(showFitGlobal.globalData);
    }

    // Pre-render summary data so it's ready when user switches to summary tab
    // This ensures all tabs have their data ready, even though we default to map
    if (showFitGlobal.renderSummary && showFitGlobal.globalData) {
        showFitGlobal.renderSummary(showFitGlobal.globalData);
    }

    // Charts are rendered on-demand when the user activates the Charts tab.
    // Background pre-rendering was removed because it can freeze the UI.

    // Default map tab switching happens earlier in the flow via switchToMapTabOnLoad.
}

/**
 * Switch to the Map tab immediately after a file is loaded. Keeps map rendering
 * in sync while avoiding a summary tab flash.
 */
function switchToMapTabOnLoad(): void {
    const windowExt = getShowFitDataGlobal();

    if (!windowExt.updateTabVisibility || !windowExt.updateActiveTab) {
        return;
    }

    windowExt.updateTabVisibility("content_map");
    windowExt.updateActiveTab("tab_map");

    // Manually trigger map rendering since we're programmatically switching tabs
    if (!renderMapIfReady(windowExt)) {
        retryMapRenderWhenReady(1);
    }
}

function renderMapIfReady(windowExt: ShowFitDataGlobal): boolean {
    if (windowExt.isMapRendered) {
        clearPendingMapRenderRetryTimer();
        return true;
    }

    const renderMap = windowExt.renderMap;
    if (typeof renderMap !== "function") {
        return false;
    }

    renderMap();
    windowExt.isMapRendered = true;
    clearPendingMapRenderRetryTimer();
    return true;
}

function retryMapRenderWhenReady(attempt: number): void {
    const windowExt = getShowFitDataGlobal();

    if (renderMapIfReady(windowExt)) {
        return;
    }

    if (attempt >= DISPLAY_CONSTANTS.MAP_RENDER_RETRY_LIMIT) {
        log("warn", "Map render skipped because renderMap was unavailable", {
            attempts: attempt,
        });
        return;
    }

    clearPendingMapRenderRetryTimer();
    pendingMapRenderRetryTimerId = globalThis.setTimeout(() => {
        pendingMapRenderRetryTimerId = undefined;
        retryMapRenderWhenReady(attempt + 1);
    }, DISPLAY_CONSTANTS.MAP_RENDER_RETRY_DELAY_MS);
}

function clearPendingMapRenderRetryTimer(): void {
    if (pendingMapRenderRetryTimerId === undefined) {
        return;
    }

    clearTimeout(pendingMapRenderRetryTimerId);
    pendingMapRenderRetryTimerId = undefined;
}

/** Enables tab buttons and notifies the main process. */
function enableTabsAndNotify(filePath: string): void {
    try {
        // Enable tab buttons when a file is loaded
        const showFitGlobal = getShowFitDataGlobal();
        if (showFitGlobal.setTabButtonsEnabled) {
            showFitGlobal.setTabButtonsEnabled(true);
        }

        // Notify main process via IPC
        if (showFitGlobal.electronAPI?.notifyFitFileLoaded) {
            showFitGlobal.electronAPI.notifyFitFileLoaded(filePath);
        }

        // Dispatch custom event for other components
        const event = new CustomEvent(
            DISPLAY_CONSTANTS.EVENTS.FIT_FILE_LOADED,
            {
                detail: { filePath },
            }
        );
        globalThis.dispatchEvent(event);

        log("info", "Tabs enabled and notifications sent", { filePath });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Unknown error enabling tabs and notifications";
        log("error", "Error enabling tabs and notifications", {
            error: errorMessage,
            filePath,
        });
    }
}

/** Extracts the filename portion from a file path. */
function extractFileName(filePath: string): string {
    if (!filePath || typeof filePath !== "string") {
        return "";
    }
    return filePath.split(/[/\\]/).pop() || "";
}

/** Returns a cached or newly computed display filename. */
function getCachedFileName(data: FitDataObject, filePath: string): string {
    try {
        // Check if we can use cached filename
        if (data.cachedFileName && data.cachedFilePath === filePath) {
            return data.cachedFileName;
        }

        // Extract and cache new filename
        const fileName = extractFileName(filePath);
        data.cachedFileName = fileName;
        data.cachedFilePath = filePath;

        return fileName;
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Unknown error managing file name cache";
        log("error", "Error managing file name cache", {
            error: errorMessage,
            filePath,
        });
        return extractFileName(filePath);
    }
}

function integrateFitState(data: FitDataObject, filePath?: string): void {
    try {
        const manager = resolveFitFileStateManager();

        if (manager && typeof manager.handleFileLoaded === "function") {
            const isAlreadyLoading =
                typeof manager.isLoading === "function" &&
                manager.isLoading();
            if (
                filePath &&
                typeof manager.startFileLoading === "function" &&
                !isAlreadyLoading
            ) {
                try {
                    manager.startFileLoading(filePath);
                } catch (error) {
                    const message =
                        error instanceof Error ? error.message : String(error);
                    log("warn", "Unable to start file loading state", {
                        error: message,
                        filePath,
                    });
                }
            }

            manager.handleFileLoaded(data, { filePath: filePath ?? null });
            return;
        }

        AppActions.loadFile(data, filePath ?? null);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log("error", "Failed to integrate FIT state", {
            error: message,
            filePath,
        });
        AppActions.loadFile(data, filePath ?? null);
    }
}

function resolveFitFileStateManager(): FitFileStateManagerLike | null {
    const candidate = getShowFitDataGlobal().__FFV_fitFileStateManager;

    if (
        candidate &&
        typeof candidate === "object" &&
        "handleFileLoaded" in candidate &&
        typeof (candidate as { handleFileLoaded?: unknown })
            .handleFileLoaded === "function"
    ) {
        return candidate as FitFileStateManagerLike;
    }

    return null;
}

/** Updates state-backed UI fields for the active file. */
function updateFileState(fileName: string): void {
    try {
        const { TITLE_PREFIX } = DISPLAY_CONSTANTS,
            hasFile = Boolean(fileName),
            sanitizedName = hasFile ? fileName : "",
            title = hasFile
                ? `${TITLE_PREFIX} - ${sanitizedName}`
                : TITLE_PREFIX;

        setState(
            "ui.fileInfo",
            {
                displayName: sanitizedName,
                hasFile,
                title,
            },
            { source: "showFitData.updateFileState" }
        );
        setState("ui.unloadButtonVisible", hasFile, {
            source: "showFitData.updateFileState",
        });

        log("info", "File state updated for display", {
            fileName: sanitizedName,
            hasFile,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Unknown error updating file display";
        log("error", "Error updating file display", {
            error: errorMessage,
            fileName,
        });
    }
}
