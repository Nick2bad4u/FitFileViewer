import {
    getStateManagerDefaultsRuntime,
    type StateManagerDefaultsRuntime,
} from "./stateManagerDefaultsRuntime.js";
import type { RendererTabName } from "../domain/rendererActiveTabContract.js";

function stateManagerDefaultsRuntime(): StateManagerDefaultsRuntime {
    return getStateManagerDefaultsRuntime();
}

/**
 * Persisted window geometry and maximized state.
 */
export type WindowState = {
    height: number;
    maximized: boolean;
    width: number;
    x: number | null;
    y: number | null;
};

/**
 * Drag-and-drop overlay visibility state.
 */
export type DropOverlayState = {
    visible: boolean;
};

/**
 * File information shown in the UI chrome.
 */
export type UIFileInfo = {
    displayName: string;
    hasFile: boolean;
    title: string;
};

/**
 * Loading indicator progress state.
 */
export type LoadingIndicatorState = {
    active: boolean;
    progress: number;
};

/**
 * Explicit tab activation lifecycle phase.
 */
export type TabReadinessStatus =
    | "blocked"
    | "error"
    | "idle"
    | "loading"
    | "ready";

/**
 * Readiness metadata for one tab content area.
 */
export type TabReadinessEntry = {
    error: null | string;
    status: TabReadinessStatus;
    updatedAt: null | number;
};

/**
 * Renderer tab readiness branch keyed by tab name.
 */
export type TabReadinessState = Record<RendererTabName, TabReadinessEntry>;

/**
 * Renderer UI state branch.
 */
export type UIState = {
    activeTab: string;
    activeTabContent: string;
    dragCounter: number;
    dropOverlay: DropOverlayState;
    fileInfo: UIFileInfo;
    isFullscreen: boolean;
    loadingIndicator: LoadingIndicatorState;
    sidebarCollapsed: boolean;
    tabReadiness: TabReadinessState;
    theme: string;
    unloadButtonVisible: boolean;
    windowState: WindowState;
};

/**
 * Chart rendering and selection state branch.
 */
export type ChartsState = {
    chartData: unknown;
    chartOptions: Record<string, unknown>;
    controlsVisible: boolean;
    isRendered: boolean;
    selectedChart: string;
    zoomLevel: number;
};

/**
 * Map view and track display state branch.
 */
export type MapState = {
    baseLayer: string;
    center: unknown;
    isRendered: boolean;
    measurementMode: boolean;
    selectedLap: number;
    showElevationProfile: boolean;
    trackVisible: boolean;
    zoom: number;
};

/**
 * Data table rendering and paging state branch.
 */
export type TablesState = {
    currentPage: number;
    filters: Record<string, unknown>;
    isRendered: boolean;
    pageSize: number;
    sortColumn: string | null;
    sortDirection: string;
};

/**
 * Browser folder listing lifecycle phase.
 */
export type BrowserListingStatus =
    | "empty"
    | "error"
    | "idle"
    | "loaded"
    | "loading"
    | "unselected";

/**
 * Folder listing metadata for the Browser tab.
 */
export type BrowserListingState = {
    error: null | string;
    fileCount: number;
    folderCount: number;
    itemCount: number;
    loadedAt: null | number;
    relPath: string;
    root: null | string;
    status: BrowserListingStatus;
};

/**
 * Browser folder scan lifecycle phase.
 */
export type BrowserScanStatus =
    | "completed"
    | "decoding"
    | "error"
    | "idle"
    | "listing"
    | "unavailable";

/**
 * Folder scan metadata for the Browser tab Library and Calendar views.
 */
export type BrowserScanState = {
    decodedActivityCount: number;
    error: null | string;
    fileCount: number;
    processedFileCount: number;
    root: null | string;
    scannedAt: null | number;
    status: BrowserScanStatus;
};

/**
 * Folder Browser tab state branch.
 */
export type BrowserState = {
    listing: BrowserListingState;
    relPath: string;
    scan: BrowserScanState;
    view: "calendar" | "files" | "library";
};

/**
 * Runtime performance metrics state branch.
 */
export type PerformanceMetricsState = {
    lastLoadTime: number | null;
    memoryUsage: number | null;
    renderTimes: Record<string, number>;
};

/**
 * Application system metadata state branch.
 */
export type SystemState = {
    initialized: boolean;
    mode: string;
    startupTime: number | null;
    version: string | null;
};

/**
 * Application lifecycle state branch.
 */
export type AppLifecycleState = {
    initialized: boolean;
    isOpeningFile: boolean;
    startTime: number;
};

/**
 * Explicit FIT-file load lifecycle phase.
 */
export type FitFileLoadingPhase =
    | "error"
    | "idle"
    | "loaded"
    | "parsing"
    | "reading"
    | "rendering"
    | "selecting"
    | "validating";

/**
 * Detailed FIT-file load lifecycle metadata.
 */
export type FitFileLoadingState = {
    error: null | string;
    filePath: null | string;
    phase: FitFileLoadingPhase;
    progress: number;
    startedAt: null | number;
    updatedAt: null | number;
};

/**
 * FIT-file domain state branch.
 */
export type FitFileState = {
    currentFile: null | string;
    isLoading: boolean;
    loaded: unknown;
    loadedFiles: unknown[];
    loadingError: null | string;
    loadingPhase: FitFileLoadingPhase;
    loadingProgress: number;
    loadingState: FitFileLoadingState;
    metrics: unknown;
    processedData: unknown;
    processingError: null | string;
    rawData: unknown;
    validation: unknown;
};

/**
 * Root application state shape managed by the state manager.
 */
export type AppStateShape = {
    app: AppLifecycleState;
    browser: BrowserState;
    charts: ChartsState;
    fitFile: FitFileState;
    isLoading: boolean;
    map: MapState;
    performance: PerformanceMetricsState;
    system: SystemState;
    tables: TablesState;
    ui: UIState;
};

/**
 * State shape used when resetting user-facing state branches.
 */
export type ResetAppStateShape = Omit<AppStateShape, "app" | "system">;

/**
 * Creates a fresh default application state.
 *
 * @returns Default application state.
 */
export function createDefaultAppState(): AppStateShape {
    return {
        app: {
            initialized: false,
            isOpeningFile: false,
            startTime: stateManagerDefaultsRuntime().getStartTime(),
        },
        browser: {
            listing: {
                error: null,
                fileCount: 0,
                folderCount: 0,
                itemCount: 0,
                loadedAt: null,
                relPath: "",
                root: null,
                status: "idle",
            },
            relPath: "",
            scan: {
                decodedActivityCount: 0,
                error: null,
                fileCount: 0,
                processedFileCount: 0,
                root: null,
                scannedAt: null,
                status: "idle",
            },
            view: "files",
        },
        charts: {
            chartData: null,
            chartOptions: {},
            controlsVisible: true,
            isRendered: false,
            selectedChart: "elevation",
            zoomLevel: 1,
        },
        fitFile: {
            currentFile: null,
            isLoading: false,
            loaded: null,
            loadedFiles: [],
            loadingError: null,
            loadingPhase: "idle",
            loadingProgress: 0,
            loadingState: {
                error: null,
                filePath: null,
                phase: "idle",
                progress: 0,
                startedAt: null,
                updatedAt: null,
            },
            metrics: null,
            processedData: null,
            processingError: null,
            rawData: null,
            validation: null,
        },
        isLoading: false,
        map: {
            baseLayer: "openstreetmap",
            center: null,
            isRendered: false,
            measurementMode: false,
            selectedLap: 0,
            showElevationProfile: true,
            trackVisible: true,
            zoom: 13,
        },
        performance: {
            lastLoadTime: null,
            memoryUsage: null,
            renderTimes: {},
        },
        system: {
            initialized: false,
            mode: "production",
            startupTime: null,
            version: null,
        },
        tables: {
            currentPage: 1,
            filters: {},
            isRendered: false,
            pageSize: 50,
            sortColumn: null,
            sortDirection: "asc",
        },
        ui: {
            activeTab: "summary",
            activeTabContent: "summary",
            dragCounter: 0,
            dropOverlay: {
                visible: false,
            },
            fileInfo: {
                displayName: "",
                hasFile: false,
                title: stateManagerDefaultsRuntime().getDefaultDocumentTitle(),
            },
            isFullscreen: false,
            loadingIndicator: {
                active: false,
                progress: 0,
            },
            sidebarCollapsed: false,
            tabReadiness: {
                altfit: {
                    error: null,
                    status: "idle",
                    updatedAt: null,
                },
                browser: {
                    error: null,
                    status: "idle",
                    updatedAt: null,
                },
                chart: {
                    error: null,
                    status: "idle",
                    updatedAt: null,
                },
                chartjs: {
                    error: null,
                    status: "idle",
                    updatedAt: null,
                },
                data: {
                    error: null,
                    status: "idle",
                    updatedAt: null,
                },
                map: {
                    error: null,
                    status: "idle",
                    updatedAt: null,
                },
                summary: {
                    error: null,
                    status: "idle",
                    updatedAt: null,
                },
                zwift: {
                    error: null,
                    status: "idle",
                    updatedAt: null,
                },
            },
            theme: "system",
            unloadButtonVisible: false,
            windowState: {
                height: 800,
                maximized: false,
                width: 1200,
                x: null,
                y: null,
            },
        },
    };
}

/**
 * Creates the reset state shape used by resetState to preserve legacy reset
 * behavior.
 *
 * @returns Default state without lifecycle-only branches.
 */
export function createResetAppState(): ResetAppStateShape {
    const {
        app: _app,
        system: _system,
        ...resetState
    } = createDefaultAppState();

    return resetState;
}
