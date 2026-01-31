/**
 * @typedef {Object} WindowState
 *
 * @property {number} width
 * @property {number} height
 * @property {number | null} x
 * @property {number | null} y
 * @property {boolean} maximized
 */
/**
 * @typedef {Object} DropOverlayState
 *
 * @property {boolean} visible
 */
/**
 * @typedef {Object} UIFileInfo
 *
 * @property {boolean} hasFile
 * @property {string} displayName
 * @property {string} title
 */
/**
 * @typedef {Object} LoadingIndicatorState
 *
 * @property {number} progress
 * @property {boolean} active
 */
/**
 * @typedef {Object} UIState
 *
 * @property {string} activeTab
 * @property {number} dragCounter
 * @property {DropOverlayState} dropOverlay
 * @property {UIFileInfo} fileInfo
 * @property {LoadingIndicatorState} loadingIndicator
 * @property {boolean} sidebarCollapsed
 * @property {string} theme
 * @property {boolean} isFullscreen
 * @property {boolean} unloadButtonVisible
 * @property {WindowState} windowState
 */
/**
 * @typedef {Object} ChartsState
 *
 * @property {boolean} isRendered
 * @property {boolean} controlsVisible
 * @property {string} selectedChart
 * @property {number} zoomLevel
 * @property {any} chartData
 * @property {Object<string, any>} chartOptions
 */
/**
 * @typedef {Object} MapState
 *
 * @property {boolean} isRendered
 * @property {any} center
 * @property {number} zoom
 * @property {number} selectedLap
 * @property {boolean} showElevationProfile
 * @property {boolean} trackVisible
 * @property {string} baseLayer
 * @property {boolean} measurementMode
 */
/**
 * @typedef {Object} TablesState
 *
 * @property {boolean} isRendered
 * @property {string | null} sortColumn
 * @property {string} sortDirection
 * @property {number} pageSize
 * @property {number} currentPage
 * @property {Object<string, any>} filters
 */
/**
 * @typedef {Object} PerformanceState
 *
 * @property {number | null} lastLoadTime
 * @property {Object<string, number>} renderTimes
 * @property {number | null} memoryUsage
 */
/**
 * @typedef {Object} SystemState
 *
 * @property {string | null} version
 * @property {number | null} startupTime
 * @property {string} mode
 * @property {boolean} initialized
 */
/**
 * @typedef {Object} AppStateShape
 *
 * @property {{
 *     initialized: boolean;
 *     isOpeningFile: boolean;
 *     startTime: number;
 * }} app
 * @property {any} globalData
 * @property {any} currentFile
 * @property {boolean} isLoading
 * @property {UIState} ui
 * @property {ChartsState} charts
 * @property {MapState} map
 * @property {TablesState} tables
 * @property {PerformanceState} performance
 * @property {SystemState} system
 */

/**
 * Resolve the default document title when running in a browser context.
 *
 * @returns {string}
 */
function getDefaultDocumentTitle() {
    if (typeof document === "undefined") {
        return "Fit File Viewer";
    }

    if (document?.title) {
        return document.title;
    }

    return "Fit File Viewer";
}

/**
 * Create a fresh default application state.
 *
 * @returns {AppStateShape}
 */
function createDefaultAppState() {
    return {
        // Application lifecycle state
        app: {
            initialized: false,
            isOpeningFile: false,
            startTime: performance.now(),
        },

        // Chart state
        charts: {
            chartData: null,
            chartOptions: {},
            controlsVisible: true,
            isRendered: false,
            selectedChart: "elevation",
            zoomLevel: 1,
        },
        currentFile: null,
        // Core application data
        globalData: null,

        isLoading: false,

        // Map state
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

        // Performance metrics
        performance: {
            lastLoadTime: null,
            memoryUsage: null,
            renderTimes: {},
        },

        // System information
        system: {
            initialized: false,
            mode: "production",
            startupTime: null,
            version: null,
        },
        // Table state
        tables: {
            currentPage: 1,
            filters: {},
            isRendered: false,
            pageSize: 50,
            sortColumn: null,
            sortDirection: "asc",
        },

        // UI state
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
 * Create the AppState structure used by resetState to preserve legacy reset
 * behavior.
 *
 * @returns {Omit<AppStateShape, "app" | "system">}
 */
function createResetAppState() {
    const {
        app: _app,
        system: _system,
        ...resetState
    } = createDefaultAppState();

    return resetState;
}

/**
 * Central application state container.
 *
 * @type {AppStateShape}
 */
const AppState = createDefaultAppState();

export { AppState, createDefaultAppState, createResetAppState };
