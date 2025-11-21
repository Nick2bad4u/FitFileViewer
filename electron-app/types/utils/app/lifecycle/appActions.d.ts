/**
 * Create a computed state value that updates when dependencies change
 * @param {Function} computeFn - Function to compute the value
 * @param {Array<string>} dependencies - Array of state paths to watch
 * @returns {Function} Function that returns the computed value
 */
/**
 * Create a lazily evaluated memoized computed value invalidated by dependencies.
 * @template T
 * @param {() => T} computeFn
 * @param {string[]} [dependencies]
 * @returns {(() => T) & { cleanup: () => void }}
 */
export function useComputed<T>(
    computeFn: () => T,
    dependencies?: string[]
): (() => T) & {
    cleanup: () => void;
};
/**
 * Create a hook-like function for components to use state
 * @param {string} path - State path to watch
 * @param {*} defaultValue - Default value if state is undefined
 * @returns {Array} [value, setter] tuple
 */
/**
 * Hook-like accessor for state values with a setter.
 * @template T
 * @param {string} path
 * @param {T} [defaultValue]
 * @returns {[T, (newValue: T) => void]}
 */
export function useState<T>(path: string, defaultValue?: T): [T, (newValue: T) => void];
export namespace AppActions {
    /**
     * Clear all data and reset to initial state
     */
    function clearData(): void;
    /**
     * Load a new FIT file and update related state
     * @param {Object} fileData - Parsed FIT file data
     * @param {string} filePath - Path to the loaded file
     */
    function loadFile(fileData: Object, filePath: string): Promise<void>;
    /**
     * Update chart rendering state and options
     * @param {Object} chartData - Chart data
     * @param {Object} options - Chart options
     */
    function renderChart(chartData: Object, options?: Object): void;
    /**
     * Update map rendering state and center
     * @param {MapCenter} center - [lat, lng] coordinates for map center
     * @param {number} zoom - Zoom level
     */
    function renderMap(center: MapCenter, zoom?: number): void;
    /**
     * Update table rendering state
     * @param {Object} tableConfig - Table configuration
     */
    function renderTable(tableConfig?: Object): void;
    /**
     * Select a lap on the map
     * @param {number} lapNumber - Lap number to select (0-based)
     */
    function selectLap(lapNumber: number): void;
    /**
     * Set file opening state
     * @param {boolean} isOpening - Whether a file is being opened
     */
    function setFileOpening(isOpening: boolean): void;
    /**
     * Set application initialization state
     * @param {boolean} initialized - Whether the app is initialized
     */
    function setInitialized(initialized: boolean): void;
    /**
     * Switch to a different tab
     * @param {string} tabName - Name of the tab to switch to
     */
    function switchTab(tabName: string): void;
    /**
     * Toggle theme between light, dark, and system
     * @param {string} theme - Theme to switch to ('light', 'dark', 'system')
     */
    function switchTheme(theme: string): void;
    /**
     * Toggle chart controls visibility
     */
    function toggleChartControls(): void;
    /**
     * Toggle map measurement mode
     */
    function toggleMeasurementMode(): void;
    /**
     * Update window state
     * @param {Object} windowState - Window state object
     */
    function updateWindowState(windowState: Object): void;
}
export namespace AppSelectors {
    /**
     * Get the current active tab
     * @returns {string} Active tab name
     */
    function activeTab(): string;
    /**
     * Check if charts are rendered
     * @returns {boolean} True if charts are rendered
     */
    function areChartsRendered(): boolean;
    /**
     * Check if tables are rendered
     * @returns {boolean} True if tables are rendered
     */
    function areTablesRendered(): boolean;
    /**
     * Get current theme
     * @returns {string} Current theme
     */
    function currentTheme(): string;
    /**
     * Get chart configuration
     * @returns {Object} Chart configuration
     */
    function getChartConfig(): Object;
    /**
     * Get current file path
     * @returns {string|null} Current file path
     */
    function getCurrentFile(): string | null;
    /**
     * Get map configuration
     * @returns {Object} Map configuration
     */
    function getMapConfig(): Object;
    /**
     * Get performance metrics
     * @returns {Object} Performance data
     */
    function getPerformanceMetrics(): Object;
    /**
     * Check if any data is loaded
     * @returns {boolean} True if data is loaded
     */
    function hasData(): boolean;
    /**
     * Check if app is currently loading
     * @returns {boolean} True if loading
     */
    function isLoading(): boolean;
    /**
     * Check if map is rendered
     * @returns {boolean} True if map is rendered
     */
    function isMapRendered(): boolean;
    /**
     * Check if a specific tab is active
     * @param {string} tabName - Tab name to check
     * @returns {boolean} True if tab is active
     */
    function isTabActive(tabName: string): boolean;
}
/**
 * State middleware - functions that can intercept and modify state changes
 */
export class StateMiddleware {
    /** @type {MiddlewareFn[]} */
    middlewares: MiddlewareFn[];
    /**
     * Apply all middlewares to a state change
     * @param {string} path - State path
     * @param {*} value - New value
     * @param {*} oldValue - Old value
     * @param {Object} options - Options
     * @returns {*} Potentially modified value
     */
    /**
     * @param {string} path
     * @param {any} value
     * @param {any} oldValue
     * @param {Record<string, any>} options
     * @returns {any}
     */
    apply(path: string, value: any, oldValue: any, options: Record<string, any>): any;
    /**
     * Add middleware function
     * @param {Function} middleware - Middleware function
     */
    /**
     * @param {MiddlewareFn} middleware
     */
    use(middleware: MiddlewareFn): void;
}
export const stateMiddleware: StateMiddleware;
export type ChartData = {
    /**
     * - Underlying chart dataset collection (library specific)
     */
    datasets: any;
    /**
     * - Optional metadata about the chart
     */
    meta?: any;
};
export type ChartOptions = {
    [x: string]: any;
};
/**
 * Tuple of [latitude, longitude]
 */
export type MapCenter = [number, number];
export type TableConfig = {
    isRendered?: boolean;
    data?: any;
    columns?: any;
    options?: {
        [x: string]: any;
    };
};
export type MiddlewareFn = (path: string, value: any, oldValue: any, options: Record<string, any>) => any;
export type PerformanceMetrics = {
    lastLoadTime?: number;
    renderTimes?: {
        chart?: number;
        map?: number;
        table?: number;
    };
};
//# sourceMappingURL=appActions.d.ts.map
