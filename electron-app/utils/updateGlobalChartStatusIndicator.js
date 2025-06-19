import { createGlobalChartStatusIndicator } from "./createGlobalChartStatusIndicator.js";

/**
 * Updates the global chart status indicator in the UI.
 * @returns {void}
 */
export function updateGlobalChartStatusIndicator() {
    try {
        const newIndicator = createGlobalChartStatusIndicator();
        if (!newIndicator) {
            console.warn("[ChartStatus] Failed to create global chart status indicator.");
            return;
        }
        const existingIndicator = document.getElementById("global-chart-status");
        if (existingIndicator && existingIndicator.parentNode) {
            existingIndicator.parentNode.replaceChild(newIndicator, existingIndicator);
        } else {
            // Append to a suitable container; fallback to body if not specified
            const container = document.getElementById("global-chart-status-container") || document.body;
            container.appendChild(newIndicator);
        }
    } catch (error) {
        console.error("[ChartStatus] Error updating global chart status indicator:", error);
    }
}
