export function addInvalidateChartRenderCacheListener(listener: any): () => void;
export function getChartSeriesCacheStats(): {
    hits: number;
    misses: number;
};
export function invalidateChartRenderCache(reason?: string): void;
export function resetChartNotificationState(): void;
export function updatePreviousChartState(chartCount: any, visibleFields: any, timestamp: any): void;
/**
 * State-aware chart export function
 * @param {string} format - Export format (png, csv, json)
 * @returns {Promise<boolean>} Success status
 */
export function exportChartsWithState(format?: string): Promise<boolean>;
/**
 * Get comprehensive chart status from state
 * @returns {Object} Chart status information
 */
export function getChartStatus(): Object;
/**
 * @param {string} hex - Hex color code
 * @param {number} alpha - Alpha transparency value
 * @returns {string} RGBA color string
 */
export function hexToRgba(hex: string, alpha: number): string;
/**
 * Initialize chart state management integration
 * Sets up reactive subscriptions and state synchronization
 * Call this during application startup
 */
export function initializeChartStateManagement(): void;
/**
 * State-aware chart refresh function
 * Triggers re-render only if conditions are met
 */
export function refreshChartsIfNeeded(): boolean;
/**
 * Process and set up zone data from FIT file for chart rendering
 * Extracts time in zone data from session messages and sets global variables
 */
/**
 * Main chart rendering function with state management integration and comprehensive error handling
 * @param {Element|string} [targetContainer] - Optional container element or ID for chart rendering. If omitted, defaults to '#content-chart'.
 * @returns {Promise<boolean>} Success status of the rendering operation
 */
export function renderChartJS(targetContainer?: Element | string): Promise<boolean>;
export namespace chartSettingsManager {
    /**
     * Get field visibility setting with state management
     * @param {string} field - Field name
     * @returns {string} Visibility setting ("visible", "hidden")
     */
    function getFieldVisibility(field: string): string;
    /**
     * Get chart settings with state management integration
     * @returns {Object} Complete chart settings
     */
    function getSettings(): Object;
    /**
     * Set field visibility and trigger updates
     * @param {string} field - Field name
     * @param {string} visibility - Visibility setting
     */
    function setFieldVisibility(field: string, visibility: string): void;
    /**
     * Update chart settings and trigger reactive updates
     * @param {Object} newSettings - Settings to update
     */
    function updateSettings(newSettings: Object): void;
}
export const previousChartState: {
    chartCount: number;
    fieldsRendered: never[];
    lastRenderTimestamp: number;
};
export namespace chartState {
    const chartData: any;
    const chartOptions: any;
    const controlsVisible: boolean;
    const hasValidData: boolean | null;
    const isRendered: any;
    const isRendering: any;
    const renderableFields: any[];
    const selectedChart: any;
}
export namespace chartActions {
    /**
     * Clear all chart data and reset state
     */
    function clearCharts(): void;
    /**
     * Complete chart rendering process
     * @param {boolean} success - Whether rendering succeeded
     * @param {number} chartCount - Number of charts rendered
     * @param {number} renderTime - Time taken to render
     */
    function completeRendering(success: boolean, chartCount?: number, renderTime?: number): void;
    /**
     * Request chart re-render with debouncing
     * @param {string} reason - Reason for re-render
     */
    function requestRerender(reason?: string): void;
    /**
     * Update chart selection
     * @param {string} chartType - New chart type selection
     */
    function selectChart(chartType: string): void;
    /**
     * Start chart rendering process
     */
    function startRendering(): void;
    /**
     * Toggle chart controls visibility
     */
    function toggleControls(): void;
}
export namespace chartPerformanceMonitor {
    /**
     * End performance tracking and record metrics
     * @param {string} trackingId - Tracking ID from startTracking
     * @param {Object} additionalData - Additional performance data
     */
    function endTracking(trackingId: string, additionalData?: Object): void;
    /**
     * Get performance summary for charts
     * @returns {Object} Performance metrics summary
     */
    function getSummary(): Object;
    /**
     * Start performance tracking for a chart operation
     * @param {string} operation - Operation name
     * @returns {string} Performance tracking ID
     */
    function startTracking(operation: string): string;
}
export type ChartJS = {
    /**
     * - Chart.js plugin registration
     */
    register: Function;
    /**
     * - Chart.js zoom plugin
     */
    Zoom: Object;
};
export type ChartSettings = {
    /**
     * - Maximum data points to display
     */
    maxpoints: string | number;
    /**
     * - Type of chart (line, bar, etc.)
     */
    chartType: string;
    /**
     * - Data interpolation method
     */
    interpolation: string;
    /**
     * - Animation style preference
     */
    animation: string;
    /**
     * - Whether to show grid lines
     */
    showGrid: boolean;
    /**
     * - Whether to show chart legend
     */
    showLegend: boolean;
    /**
     * - Whether to show chart title
     */
    showTitle: boolean;
    /**
     * - Whether to show data points
     */
    showPoints: boolean;
    /**
     * - Whether to fill areas under lines
     */
    showFill: boolean;
    /**
     * - Line smoothing factor
     */
    smoothing: number;
    /**
     * - Custom color palette
     */
    colors: Array<string>;
};
export type ThemeConfig = {
    /**
     * - Theme color configuration
     */
    colors: {
        text: string;
        textPrimary: string;
        backgroundAlt: string;
        border: string;
        error: string;
        primary: string;
        primaryAlpha: string;
    };
};
export type RenderResult = {
    /**
     * - Whether rendering succeeded
     */
    success: boolean;
    /**
     * - Number of charts rendered
     */
    chartCount: number;
    /**
     * - Time taken to render in milliseconds
     */
    renderTime: number;
    /**
     * - List of fields that were rendered
     */
    fieldsRendered: Array<string>;
};
export type ChartData = {
    /**
     * - Chart x-axis labels
     */
    labels: Array<any>;
    /**
     * - Chart dataset configurations
     */
    datasets: Array<Object>;
};
export type ChartPoint = {
    /**
     * - X coordinate value
     */
    x: number;
    /**
     * - Y coordinate value (nullable)
     */
    y: number | null;
};
export type PerformanceRecord = {
    /**
     * - Duration in milliseconds
     */
    duration: number;
    /**
     * - Timestamp of the record
     */
    timestamp: number;
    /**
     * - Number of charts rendered
     */
    chartCount: number;
};
//# sourceMappingURL=renderChartJS.d.ts.map