/**
 * @fileoverview Vanilla Zustand store for FitFileViewer application state.
 * @description Centralizes the creation of the zustand store and provides helpers
 * to obtain fresh initial state snapshots.
 */

import { createStore } from "zustand/vanilla";

/**
 * Create a fresh application state snapshot.
 * @returns {AppStateShape} Fresh initial application state
 */
export function createInitialAppState() {
    const defaultTitle =
        typeof document === "object" && typeof document?.title === "string" && document.title
            ? document.title
            : "Fit File Viewer";
    const hasPerfNow = typeof performance === "object" && typeof performance?.now === "function";

    return {
        app: {
            initialized: false,
            isOpeningFile: false,
            startTime: hasPerfNow ? performance.now() : 0,
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
            isLoading: false,
            loadingError: null,
            loadingProgress: 0,
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
        overlays: {
            highlightedOverlayIndex: null,
            loadedFitFiles: [],
            mapMarkerCount: 50,
            mapMarkerCountExplicit: false,
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
                title: defaultTitle,
            },
            isFullscreen: false,
            loadingIndicator: {
                active: false,
                progress: 0,
            },
            sidebarCollapsed: false,
            theme: "system",
            unloadButtonVisible: false,
            windowFocused: true,
            windowState: {
                height: 800,
                maximized: false,
                width: 1200,
                x: null,
                y: null,
            },
        },
        zones: {
            heartRate: [],
            power: [],
        },
    };
}

/**
 * Vanilla zustand store containing the entire application state tree.
 * The store exposes the raw state object so higher-level helpers can
 * provide path-based read/write utilities.
 */
export const appStateStore = createStore(createInitialAppState);

/**
 * Reset the zustand store back to a pristine initial snapshot.
 * @returns {void}
 */
export function resetAppStateStore() {
    appStateStore.setState(createInitialAppState(), true, "appStateStore.reset");
}

/**
 * @typedef {ReturnType<typeof createInitialAppState>} AppStateShape
 */
