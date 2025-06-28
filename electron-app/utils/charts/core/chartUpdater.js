/**
 * @fileoverview Chart Update Utility - Unified interface for triggering chart updates
 * @description Provides a consistent way to trigger chart re-renders across all modules
 * @author FitFileViewer Development Team
 * @version 1.0.0
 */

import { chartStateManager } from "./chartStateManager.js";
import { renderChartJS } from "./renderChartJS.js";

/**
 * Unified interface for triggering chart updates
 * @param {string} reason - Reason for the chart update (for logging)
 * @param {HTMLElement} [container] - Optional container element
 * @returns {Promise<void>}
 */
export async function updateCharts(reason, container = null) {
    try {
        console.log(`[ChartUpdate] Triggering chart update: ${reason}`);

        // Use modern state management if available
        if (chartStateManager && typeof chartStateManager.debouncedRender === "function") {
            return await chartStateManager.debouncedRender(reason);
        }

        // Fallback to direct renderChartJS call for compatibility
        console.warn("[ChartUpdate] chartStateManager not available, using fallback");

        if (container) {
            return await renderChartJS(container);
        } else {
            return await renderChartJS();
        }
    } catch (error) {
        console.error(`[ChartUpdate] Error updating charts for reason "${reason}":`, error);
        throw error;
    }
}

/**
 * Handle theme changes with proper chart updates
 * @param {string} newTheme - The new theme name
 * @returns {Promise<void>}
 */
export async function updateChartsForThemeChange(newTheme) {
    try {
        console.log(`[ChartUpdate] Handling theme change to: ${newTheme}`);

        if (chartStateManager && typeof chartStateManager.handleThemeChange === "function") {
            return await chartStateManager.handleThemeChange(newTheme);
        }

        // Fallback: destroy and re-render charts
        console.warn("[ChartUpdate] chartStateManager not available for theme change, using fallback");

        if (window._chartjsInstances && window._chartjsInstances.length > 0) {
            window._chartjsInstances.forEach((chart) => {
                if (chart && typeof chart.destroy === "function") {
                    try {
                        chart.destroy();
                    } catch (error) {
                        console.warn("[ChartUpdate] Error destroying chart:", error);
                    }
                }
            });
            window._chartjsInstances = [];
        }

        return await renderChartJS();
    } catch (error) {
        console.error(`[ChartUpdate] Error updating charts for theme change to "${newTheme}":`, error);
        throw error;
    }
}

/**
 * Handle setting changes with debounced chart updates
 * @param {string} settingName - Name of the setting that changed
 * @param {*} newValue - New value of the setting
 * @param {HTMLElement} [container] - Optional container element
 * @returns {Promise<void>}
 */
export async function updateChartsForSettingChange(settingName, newValue, container = null) {
    const reason = `Setting change: ${settingName} = ${newValue}`;
    return await updateCharts(reason, container);
}

/**
 * Handle data changes with proper chart updates
 * @param {Object} newData - New data object
 * @returns {Promise<void>}
 */
export async function updateChartsForDataChange(newData) {
    const reason = `Data change: ${newData ? "new data loaded" : "data cleared"}`;
    return await updateCharts(reason);
}

/**
 * Handle tab activation with proper chart updates
 * @returns {Promise<void>}
 */
export async function updateChartsForTabActivation() {
    const reason = "Chart tab activated";
    return await updateCharts(reason);
}

/**
 * Check if chart state manager is available and properly initialized
 * @returns {boolean}
 */
export function isModernChartSystemAvailable() {
    return (
        chartStateManager &&
        typeof chartStateManager.debouncedRender === "function" &&
        typeof chartStateManager.isInitialized === "function" &&
        chartStateManager.isInitialized
    );
}

/**
 * Get status information about the chart update system
 * @returns {Object}
 */
export function getChartUpdateSystemStatus() {
    return {
        modernSystemAvailable: isModernChartSystemAvailable(),
        chartStateManager: !!chartStateManager,
        renderChartJSAvailable: typeof renderChartJS === "function",
        globalRenderChartJS: typeof window.renderChartJS === "function",
        timestamp: new Date().toISOString(),
    };
}

// Export a simplified interface for common use cases
export const ChartUpdater = {
    update: updateCharts,
    themeChange: updateChartsForThemeChange,
    settingChange: updateChartsForSettingChange,
    dataChange: updateChartsForDataChange,
    tabActivation: updateChartsForTabActivation,
    isModernSystemAvailable: isModernChartSystemAvailable,
    getStatus: getChartUpdateSystemStatus,
};

// Expose globally for debugging and legacy compatibility
if (typeof window !== "undefined") {
    window.ChartUpdater = ChartUpdater;
    window.chartUpdater = ChartUpdater; // Lowercase alias for consistency
}

export default ChartUpdater;
