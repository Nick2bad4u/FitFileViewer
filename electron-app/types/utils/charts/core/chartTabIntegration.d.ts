export const chartTabIntegration: ChartTabIntegration;
export default chartTabIntegration;
/**
 * Chart Tab Integration - manages the interaction between chart rendering and tab system
 */
declare class ChartTabIntegration {
    isInitialized: boolean;
    /**
     * Check if charts should be rendered and do so if needed
     */
    checkAndRenderCharts(): void;
    /**
     * Cleanup method for compatibility
     */
    cleanup(): void;
    /**
     * Clean up integration
     */
    destroy(): void;
    /**
     * Disable the chart tab
     */
    disableChartTab(): void;
    /**
     * Enable the chart tab
     */
    enableChartTab(): void;
    /**
     * Get the chart tab button element
     * @returns {HTMLElement|null} Chart tab button or null if not found
     */
    getChartTabButton(): HTMLElement | null;
    /**
     * Get integration status information
     * @returns {Object} Status information
     */
    getStatus(): Object;
    /**
     * Handle new data being loaded
     * @param {Object} newData - The new global data
     */
    handleDataChange(newData: Object): void;
    /**
     * Initialize the chart tab integration
     */
    initialize(): void;
    /**
     * Check if chart tab is currently active
     * @returns {boolean} True if chart tab is active
     */
    isChartTabActive(): boolean;
    /**
     * Force chart refresh (for external calls)
     * @param {string} reason - Reason for the refresh
     */
    refreshCharts(reason?: string): boolean;
    /**
     * Set up integration between chart and tab systems
     */
    setupIntegration(): void;
    /**
     * Switch to chart tab
     * @returns {boolean} True if switch was successful
     */
    switchToChartTab(): boolean;
}
