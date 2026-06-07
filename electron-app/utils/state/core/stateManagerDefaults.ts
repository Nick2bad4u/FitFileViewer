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
 * Renderer UI state branch.
 */
export type UIState = {
    activeTab: string;
    dragCounter: number;
    dropOverlay: DropOverlayState;
    fileInfo: UIFileInfo;
    isFullscreen: boolean;
    loadingIndicator: LoadingIndicatorState;
    sidebarCollapsed: boolean;
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
    charts: ChartsState;
    currentFile: unknown;
    fitFile: FitFileState;
    globalData: unknown;
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

function getStartTime(): number {
    return globalThis.performance?.now() ?? Date.now();
}

/**
 * Resolve the default document title when running in a browser context.
 *
 * @returns Default application document title.
 */
function getDefaultDocumentTitle(): string {
    if (typeof document === "undefined") {
        return "Fit File Viewer";
    }

    if (document.title) {
        return document.title;
    }

    return "Fit File Viewer";
}

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
            startTime: getStartTime(),
        },
        charts: {
            chartData: null,
            chartOptions: {},
            controlsVisible: true,
            isRendered: false,
            selectedChart: "elevation",
            zoomLevel: 1,
        },
        currentFile: null,
        fitFile: {
            currentFile: null,
            isLoading: false,
            loaded: null,
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
        globalData: null,
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
            dragCounter: 0,
            dropOverlay: {
                visible: false,
            },
            fileInfo: {
                displayName: "",
                hasFile: false,
                title: getDefaultDocumentTitle(),
            },
            isFullscreen: false,
            loadingIndicator: {
                active: false,
                progress: 0,
            },
            sidebarCollapsed: false,
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

/**
 * Central application state container.
 */
export const AppState: AppStateShape = createDefaultAppState();
