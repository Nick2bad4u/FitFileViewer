export type StateUpdateOptions = {
    /**
     * If true, don't notify listeners of this update
     */
    silent?: boolean;
    /**
     * Source tag for debugging / history
     */
    source?: string;
    /**
     * If true and both old & new values are plain objects, perform a shallow merge
     */
    merge?: boolean;
};
export type WindowState = {
    width: number;
    height: number;
    x: number | null;
    y: number | null;
    maximized: boolean;
};
export type DropOverlayState = {
    visible: boolean;
};
export type UIFileInfo = {
    hasFile: boolean;
    displayName: string;
    title: string;
};
export type LoadingIndicatorState = {
    progress: number;
    active: boolean;
};
export type UIState = {
    activeTab: string;
    dragCounter: number;
    dropOverlay: DropOverlayState;
    fileInfo: UIFileInfo;
    loadingIndicator: LoadingIndicatorState;
    sidebarCollapsed: boolean;
    theme: string;
    isFullscreen: boolean;
    unloadButtonVisible: boolean;
    windowState: WindowState;
};
export type ChartsState = {
    isRendered: boolean;
    controlsVisible: boolean;
    selectedChart: string;
    zoomLevel: number;
    chartData: any;
    chartOptions: {
        [x: string]: any;
    };
};
export type MapState = {
    isRendered: boolean;
    center: any;
    zoom: number;
    selectedLap: number;
    showElevationProfile: boolean;
    trackVisible: boolean;
    baseLayer: string;
    measurementMode: boolean;
};
export type TablesState = {
    isRendered: boolean;
    sortColumn: string | null;
    sortDirection: string;
    pageSize: number;
    currentPage: number;
    filters: {
        [x: string]: any;
    };
};
export type PerformanceState = {
    lastLoadTime: number | null;
    renderTimes: {
        [x: string]: number;
    };
    memoryUsage: number | null;
};
export type SystemState = {
    version: string | null;
    startupTime: number | null;
    mode: string;
    initialized: boolean;
};
export type AppStateShape = {
    app: {
        initialized: boolean;
        isOpeningFile: boolean;
        startTime: number;
    };
    globalData: any;
    currentFile: any;
    isLoading: boolean;
    ui: UIState;
    charts: ChartsState;
    map: MapState;
    tables: TablesState;
    performance: PerformanceState;
    system: SystemState;
};
/**
 * TEST-ONLY: Clear all registered state listeners.
 * This helps ensure unit tests don't leak subscriptions across suites.
 */
export function __clearAllListenersForTests(): void;
export namespace __debugState {
    let app: {
        initialized: boolean;
        isOpeningFile: boolean;
        startTime: number;
    };
    let globalData: any;
    let currentFile: any;
    let isLoading: boolean;
    let ui: UIState;
    let charts: ChartsState;
    let map: MapState;
    let tables: TablesState;
    let performance: PerformanceState;
    let system: SystemState;
}
/**
 * TEST-ONLY: Fully reset the state manager.
 * - Clears all listeners
 * - Clears history
 * - Resets AppState to initial values
 */
export function __resetStateManagerForTests(): void;
/**
 * @typedef {Object} StateUpdateOptions
 * @property {boolean} [silent=false] If true, don't notify listeners of this update
 * @property {string} [source="unknown"] Source tag for debugging / history
 * @property {boolean} [merge=false] If true and both old & new values are plain objects, perform a shallow merge
 */
/**
 * Clear state change history
 */
export function clearStateHistory(): void;
/**
 * Create reactive property on window object for backward compatibility
 * @param {string} propertyName - Name of the property to create
 * @param {string} statePath - Path in state to bind to
 */
export function createReactiveProperty(propertyName: string, statePath: string): void;
/**
 * Get state value by path
 * @param {string} path - Dot notation path to state property
 * @returns {*} State value
 */
export function getState(path: string): any;
/**
 * Get state change history for debugging
 * @returns {Array<Object>} Array of state changes
 */
export function getStateHistory(): Array<Object>;
/**
 * Get subscription information for debugging
 * @returns {Object} Subscription information
 */
export function getSubscriptions(): Object;
/**
 * Initialize state manager with default reactive properties
 */
export function initializeStateManager(): void;
/**
 * Load persisted state from localStorage
 * @param {Array<string>} paths - Array of state paths to load
 */
export function loadPersistedState(paths?: Array<string>): void;
/**
 * Persist state to localStorage
 * @param {Array<string>} paths - Array of state paths to persist
 */
export function persistState(paths?: Array<string>): void;
/**
 * Reset state to initial values
 * @param {string} [path] - Optional path to reset only part of state
 */
export function resetState(path?: string): void;
/**
 * Set state value by path and notify listeners
 * @param {string} path - Dot notation path to state property
 * @param {*} value - New value to set
 * @param {StateUpdateOptions} [options] - Optional update options
 */
export function setState(path: string, value: any, options?: StateUpdateOptions): void;
/**
 * Subscribe to state changes for a specific path
 * @param {string} path - Dot notation path to state property (e.g., 'ui.activeTab')
 * @param {Function} callback - Function to call when state changes
 * @returns {Function} Unsubscribe function
 */
export function subscribe(path: string, callback: Function): Function;
/**
 * Subscribe to state changes ensuring there is only one active subscription for a given id.
 *
 * This is intended for UI initializers that may run multiple times due to re-renders.
 * It prevents leaking subscriptions across map/tab rebuilds.
 *
 * @param {string} path - Dot notation path to state property (e.g., 'ui.activeTab')
 * @param {string} id - Unique identifier for this subscription (e.g., 'tabs:activeTab')
 * @param {Function} callback - Function to call when state changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeSingleton(path: string, id: string, callback: Function): Function;
/**
 * Update state by merging with existing object
 * @param {string} path - Dot notation path to state property
 * @param {Object} updates - Object to merge with existing state
 * @param {StateUpdateOptions} [options] - Optional update options
 */
export function updateState(path: string, updates: Object, options?: StateUpdateOptions): void;
//# sourceMappingURL=stateManager.d.ts.map
