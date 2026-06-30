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
import {
    renderMap,
    waitForMapLeafletRuntime,
} from "../../maps/core/renderMap.js";
import { fitFileStateManager } from "../../state/domain/fitFileState.js";
import { getActiveFitTableData } from "../../state/domain/fitTableDataState.js";
import {
    setRendererFileInfo,
    setRendererUnloadButtonVisible,
} from "../../state/domain/rendererActiveFileState.js";
import {
    isRendererMapRendered,
    setRendererMapRendered,
} from "../../state/domain/rendererMapRenderState.js";
import { setTabButtonsEnabled } from "../../ui/controls/enableTabButtons.js";
import { setTabReadiness } from "../../ui/tabs/tabReadinessState.js";
import { updateActiveTab } from "../../ui/tabs/updateActiveTab.js";
import { updateTabVisibility } from "../../ui/tabs/updateTabVisibility.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import type { ElectronPreloadEventApi } from "../../../shared/preloadApi.js";
import { ensureRendererVendorBundle } from "../../../renderer/vendorBundleLoader.js";
import { createTables } from "../components/createTables.js";
import { renderSummary } from "./renderSummary.js";
import {
    getShowFitDataRuntime,
    type ShowFitDataRuntime,
} from "./showFitDataRuntime.js";

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
    TITLE_PREFIX: "Fit File Viewer",
} as const;

const log = createRendererLogger(DISPLAY_CONSTANTS.LOG_PREFIX);

function showFitDataRuntime(): ShowFitDataRuntime {
    return getShowFitDataRuntime();
}

type FitRecord = Record<string, unknown>;

type FitDataObject = {
    cachedFileName?: string;
    cachedFilePath?: string;
    recordMesgs?: FitRecord[];
    sessionMesgs?: FitRecord[];
} & Record<string, unknown>;

/** Display options accepted by the FIT data renderer. */
export type ShowFitDataOptions = {
    electronApiScope?: RendererElectronApiScope | undefined;
    updateUI?: boolean;
};

type ShowFitDataElectronApi = {
    readonly notifyFitFileLoaded?: ElectronPreloadEventApi["notifyFitFileLoaded"];
};

type ShowFitDataElectronApiMethods = Readonly<{
    readonly notifyFitFileLoaded?: ElectronPreloadEventApi["notifyFitFileLoaded"];
}>;

type EstimatedPowerInput = Parameters<typeof applyEstimatedPowerToRecords>[0];

function getShowFitDataElectronApi(
    electronApiScope: RendererElectronApiScope | undefined
): ShowFitDataElectronApi | null {
    return getRendererElectronApi(isShowFitDataElectronApi, electronApiScope);
}

function isShowFitDataElectronApi(
    value: unknown
): value is ShowFitDataElectronApi {
    if (!isShowFitDataElectronApiMethods(value)) {
        return false;
    }

    const notifyFitFileLoaded = readElectronApiValue(
        () => value.notifyFitFileLoaded
    );
    return (
        notifyFitFileLoaded === undefined ||
        typeof notifyFitFileLoaded === "function"
    );
}

function isShowFitDataElectronApiMethods(
    value: unknown
): value is ShowFitDataElectronApiMethods {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readElectronApiValue(readValue: () => unknown): unknown {
    try {
        return readValue();
    } catch {
        return undefined;
    }
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

        // Apply estimated power early so Charts/Summary/Tables can consume it immediately.
        // This only applies to cycling-like activities that lack real power, and only when enabled.
        try {
            if (Array.isArray(data.recordMesgs)) {
                const powerInput: EstimatedPowerInput = {
                    recordMesgs: data.recordMesgs,
                    settings: getPowerEstimationSettings(),
                };
                if (Array.isArray(data.sessionMesgs)) {
                    powerInput.sessionMesgs = data.sessionMesgs;
                }
                applyEstimatedPowerToRecords(powerInput);
            }
        } catch {
            /* ignore */
        }

        // Normalize auxiliary heart rate fields so charts/map/tables can render them.
        try {
            if (Array.isArray(data.recordMesgs)) {
                applyAuxHeartRateToRecords({
                    fieldDescriptionMesgs:
                        resolveFieldDescriptionMessages(data),
                    recordMesgs: data.recordMesgs,
                });
            }
        } catch {
            /* ignore */
        }

        // Handle file path and UI updates
        if (filePath && config.updateUI) {
            const fileName = getCachedFileName(data, filePath);

            // Update file display state
            updateFileState(fileName);

            // Enable tabs and send notifications
            enableTabsAndNotify(filePath, config.electronApiScope);

            // Switch to map tab early to avoid a brief summary flash during load.
            switchToMapTabOnLoad();

            try {
                if (showFitDataRuntime().canScrollTo()) {
                    const prefersReducedMotion =
                        showFitDataRuntime().prefersReducedMotion();

                    showFitDataRuntime().queueMicrotask(() => {
                        showFitDataRuntime().scrollTo({
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

    renderDataTablesWithReadiness(data);

    // Pre-render summary data so it's ready when user switches to summary tab
    // This ensures all tabs have their data ready, even though we default to map
    renderSummaryWithReadiness(data);

    // Charts are rendered on-demand when the user activates the Charts tab.
    // Background pre-rendering was removed because it can freeze the UI.

    // Default map tab switching happens earlier in the flow via switchToMapTabOnLoad.
}

/**
 * Switch to the Map tab immediately after a file is loaded. Keeps map rendering
 * in sync while avoiding a summary tab flash.
 */
function switchToMapTabOnLoad(): void {
    updateTabVisibility("content_map");
    updateActiveTab("tab_map");

    void renderMapIfReady();
}

async function renderMapIfReady(): Promise<void> {
    if (isRendererMapRendered()) {
        markTabReadiness("map", "ready", "showFitData.renderMapIfReady");
        return;
    }

    markTabReadiness("map", "loading", "showFitData.renderMapIfReady");

    try {
        await ensureRendererVendorBundle("map");
        if (!(await waitForMapLeafletRuntime())) {
            throw new Error("Leaflet runtime is unavailable");
        }
        if (showFitDataRuntime().hasRenderedMapContainer()) {
            setMapRenderedFlag(true);
            markTabReadiness("map", "ready", "showFitData.renderMapIfReady");
            return;
        }
        renderMap();
        setMapRenderedFlag(true);
        markTabReadiness("map", "ready", "showFitData.renderMapIfReady");
    } catch (error) {
        setMapRenderedFlag(false);
        markTabReadiness(
            "map",
            "error",
            "showFitData.renderMapIfReady",
            error
        );
        console.error("[ShowFitData] Failed to render map on load:", error);
    }
}

function setMapRenderedFlag(isRendered: boolean): void {
    setRendererMapRendered(isRendered, {
        source: "showFitData.renderMapIfReady",
    });
}

function renderDataTablesWithReadiness(data: FitDataObject): void {
    markTabReadiness("data", "loading", "showFitData.renderDataTables");
    try {
        createTables(getActiveFitTableData(data).tables);
        markTabReadiness("data", "ready", "showFitData.renderDataTables");
    } catch (error) {
        markTabReadiness(
            "data",
            "error",
            "showFitData.renderDataTables",
            error
        );
        throw error;
    }
}

function renderSummaryWithReadiness(data: FitDataObject): void {
    markTabReadiness("summary", "loading", "showFitData.renderSummary");
    try {
        renderSummary(data);
        markTabReadiness("summary", "ready", "showFitData.renderSummary");
    } catch (error) {
        markTabReadiness(
            "summary",
            "error",
            "showFitData.renderSummary",
            error
        );
        throw error;
    }
}

function markTabReadiness(
    tabName: "data" | "map" | "summary",
    status: "error" | "loading" | "ready",
    source: string,
    error?: unknown
): void {
    try {
        setTabReadiness(tabName, status, source, error);
    } catch (readinessError) {
        log("warn", "Failed to update tab readiness state", {
            error:
                readinessError instanceof Error
                    ? readinessError.message
                    : String(readinessError),
            source,
            status,
            tabName,
        });
    }
}

/** Enables tab buttons and notifies the main process. */
function enableTabsAndNotify(
    filePath: string,
    electronApiScope: RendererElectronApiScope | undefined
): void {
    try {
        // Enable tab buttons when a file is loaded
        setTabButtonsEnabled(true);

        // Notify main process via IPC
        getShowFitDataElectronApi(electronApiScope)?.notifyFitFileLoaded?.(
            filePath
        );

        // Dispatch custom event for other components
        const event = showFitDataRuntime().createCustomEvent(
            DISPLAY_CONSTANTS.EVENTS.FIT_FILE_LOADED,
            {
                detail: { filePath },
            }
        );
        showFitDataRuntime().dispatchEvent(event);

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
        const isAlreadyLoading = fitFileStateManager.isLoading();
        if (filePath && !isAlreadyLoading) {
            try {
                fitFileStateManager.startFileLoading(filePath);
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error);
                log("warn", "Unable to start file loading state", {
                    error: message,
                    filePath,
                });
            }
        }

        fitFileStateManager.handleFileLoaded(data, {
            filePath: filePath ?? null,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log("error", "Failed to integrate FIT state", {
            error: message,
            filePath,
        });
        AppActions.loadFile(data, filePath ?? null);
    }
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

        setRendererFileInfo(
            {
                displayName: sanitizedName,
                hasFile,
                title,
            },
            { source: "showFitData.updateFileState" }
        );
        setRendererUnloadButtonVisible(hasFile, {
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
