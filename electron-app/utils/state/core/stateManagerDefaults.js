function getStartTime() {
    return globalThis.performance?.now() ?? Date.now();
}
/**
 * Resolve the default document title when running in a browser context.
 *
 * @returns Default application document title.
 */
function getDefaultDocumentTitle() {
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
export function createDefaultAppState() {
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
export function createResetAppState() {
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
export const AppState = createDefaultAppState();
