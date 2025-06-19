import { createGlobalChartStatusIndicator } from "./createGlobalChartStatusIndicator.js";

/**
 * Updates the global chart status indicator
 */

export function updateGlobalChartStatusIndicator() {
    try {
        const globalIndicator = document.getElementById("global-chart-status");
        if (globalIndicator) {
            // Replace with updated version
            const newIndicator = createGlobalChartStatusIndicator();
            if (newIndicator) {
                globalIndicator.parentNode.replaceChild(newIndicator, globalIndicator);
            }
        } else {
            // Create if it doesn't exist
            createGlobalChartStatusIndicator();
        }
    } catch (error) {
        console.error("[ChartStatus] Error updating global chart status indicator:", error);
    }
}
