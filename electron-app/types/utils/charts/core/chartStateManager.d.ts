export const chartStateManager: ChartStateManager;
export default chartStateManager;
export type FitGlobalData = {
    recordMesgs?: Array<Object>;
};
export type ChartInfo = {
    isRendered: boolean;
    isRendering: boolean;
    tabActive: boolean;
    selectedChart: string;
    lastRenderTime?: number | undefined;
    instanceCount: number;
};
/**
 * @typedef {Object} FitGlobalData
 *
 * @property {Object[]} [recordMesgs]
 */
/**
 * @typedef {Object} ChartInfo
 *
 * @property {boolean} isRendered
 * @property {boolean} isRendering
 * @property {boolean} tabActive
 * @property {string} selectedChart
 * @property {number | undefined} [lastRenderTime]
 * @property {number} instanceCount
 */
/**
 * Chart State Manager - handles all chart-related state and reactive updates
 */
declare class ChartStateManager {
    isInitialized: boolean;
    renderDebounceTime: number;
    renderTimeout: null;
    /**
     * Backwards compatibility alias expected by legacy code (setupWindow
     * cleanup calls)
     */
    cleanup(): void;
    /**
     * Clear chart state when new data is loaded or charts are unloaded
     */
    clearChartState(): void;
    /**
     * Debounced chart rendering to prevent excessive re-renders
     *
     * @param {string} reason - Reason for the render request
     */
    debouncedRender(reason?: string): void;
    /**
     * Cleanup method for removing subscriptions and clearing timers
     */
    destroy(): void;
    /**
     * Properly destroy existing chart instances
     */
    destroyExistingCharts(): void;
    /**
     * Force immediate chart re-render (for external calls)
     *
     * @param {string} reason - Reason for the render
     */
    forceRender(reason?: string): void;
    /**
     * Get current chart state information
     *
     * @returns {Object} Chart state information
     */
    getChartInfo(): Object;
    /**
     * Handle new data being loaded
     *
     * @param {Object} newData - The new global data
     */
    handleDataChange(newData: FitGlobalData | null | undefined): void;
    /**
     * Handle chart tab activation
     */
    handleTabActivation(): void;
    /**
     * Handle theme changes with proper chart re-rendering
     *
     * @param {string} [newTheme] - The new theme name (optional for legacy
     *   callers)
     */
    handleThemeChange(newTheme?: string | undefined): void;
    /**
     * Initialize reactive subscriptions for chart updates
     */
    initializeSubscriptions(): void;
    /**
     * Check if chart tab is currently active
     *
     * @returns {boolean} True if chart tab is active
     */
    isChartTabActive(): boolean;
    /**
     * Perform actual chart rendering
     *
     * @param {string} reason - Reason for rendering
     */
    performChartRender(reason: string): Promise<void>;
    /**
     * Update chart controls visibility
     *
     * @param {boolean} visible - Whether controls should be visible
     */
    updateControlsVisibility(visible: boolean): void;
}
