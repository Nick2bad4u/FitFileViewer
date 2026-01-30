/**
 * Provides a consistent way to trigger chart re-renders across all modules
 *
 * @version 1.0.0
 *
 * @file Chart Update Utility - Unified interface for triggering chart updates
 *
 * @author FitFileViewer Development Team
 */

import { chartStateManager } from "./chartStateManager.js";
import { renderChartJS } from "./renderChartJS.js";

/**
 * Get status information about the chart update system
 *
 * @returns {Object}
 */
export function getChartUpdateSystemStatus() {
    return {
        chartStateManager: Boolean(chartStateManager),
        globalRenderChartJS: typeof globalThis.renderChartJS === "function",
        modernSystemAvailable: isModernChartSystemAvailable(),
        renderChartJSAvailable: typeof renderChartJS === "function",
        timestamp: new Date().toISOString(),
    };
}

/**
 * Check if chart state manager is available and properly initialized
 *
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
 * Unified interface for triggering chart updates
 *
 * @param {string} reason - Reason for the chart update (for logging)
 * @param {HTMLElement} [container] - Optional container element
 *
 * @returns {Promise<boolean>}
 */
export async function updateCharts(reason, container) {
    try {
        console.log(`[ChartUpdate] Triggering chart update: ${reason}`);

        // Use modern state management if available
        if (
            chartStateManager &&
            typeof chartStateManager.debouncedRender === "function"
        ) {
            await chartStateManager.debouncedRender(reason);
            return true;
        }

        // Fallback to direct renderChartJS call for compatibility
        console.warn(
            "[ChartUpdate] chartStateManager not available, using fallback"
        );

        return await renderChartJS(container);
    } catch (error) {
        console.error(
            `[ChartUpdate] Error updating charts for reason "${reason}":`,
            error
        );
        throw error;
    }
}

/**
 * Handle data changes with proper chart updates
 *
 * @param {Object} newData - New data object
 *
 * @returns {Promise<boolean>}
 */
export async function updateChartsForDataChange(newData) {
    const reason = `Data change: ${newData ? "new data loaded" : "data cleared"}`;
    return await updateCharts(reason);
}

/**
 * Handle setting changes with debounced chart updates
 *
 * @param {string} settingName - Name of the setting that changed
 * @param {any} newValue - New value of the setting
 * @param {HTMLElement} [container] - Optional container element
 *
 * @returns {Promise<boolean>}
 */
export async function updateChartsForSettingChange(
    settingName,
    newValue,
    container
) {
    const reason = `Setting change: ${settingName} = ${newValue}`;
    return await updateCharts(reason, container);
}

/**
 * Handle tab activation with proper chart updates
 *
 * @returns {Promise<boolean>}
 */
export async function updateChartsForTabActivation() {
    const reason = "Chart tab activated";
    return await updateCharts(reason);
}

/**
 * Handle theme changes with proper chart updates
 *
 * @param {string} newTheme - The new theme name
 *
 * @returns {Promise<boolean>}
 */
export async function updateChartsForThemeChange(newTheme) {
    try {
        console.log(`[ChartUpdate] Handling theme change to: ${newTheme}`);

        if (
            chartStateManager &&
            typeof chartStateManager.handleThemeChange === "function"
        ) {
            await chartStateManager.handleThemeChange(newTheme);
            return true;
        }

        // Fallback: destroy and re-render charts
        console.warn(
            "[ChartUpdate] chartStateManager not available for theme change, using fallback"
        );

        if (
            globalThis._chartjsInstances &&
            globalThis._chartjsInstances.length > 0
        ) {
            for (const chart of globalThis._chartjsInstances) {
                if (chart && typeof chart.destroy === "function") {
                    try {
                        chart.destroy();
                    } catch (error) {
                        console.warn(
                            "[ChartUpdate] Error destroying chart:",
                            error
                        );
                    }
                }
            }
            globalThis._chartjsInstances = [];
        }

        return await renderChartJS();
    } catch (error) {
        console.error(
            `[ChartUpdate] Error updating charts for theme change to "${newTheme}":`,
            error
        );
        throw error;
    }
}

// Export a simplified interface for common use cases
export const ChartUpdater = {
    dataChange: updateChartsForDataChange,
    getStatus: getChartUpdateSystemStatus,
    isModernSystemAvailable: isModernChartSystemAvailable,
    settingChange: updateChartsForSettingChange,
    tabActivation: updateChartsForTabActivation,
    themeChange: updateChartsForThemeChange,
    update: updateCharts,
};

// Expose globally for debugging and legacy compatibility
if (globalThis.window !== undefined) {
    globalThis.ChartUpdater = ChartUpdater;
    globalThis.chartUpdater = ChartUpdater; // Lowercase alias for consistency
}

export default ChartUpdater;
