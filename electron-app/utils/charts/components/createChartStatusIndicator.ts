import { getChartCounts } from "../core/getChartCounts.js";
import { getChartStatusIndicatorRuntime } from "./chartStatusIndicatorRuntime.js";
import { createChartStatusIndicatorFromCounts } from "./createChartStatusIndicatorFromCounts.js";

function createFallbackIndicator(): HTMLElement {
    const fallback = getChartStatusIndicatorRuntime().createElement("div");
    fallback.className = "chart-status-indicator";
    fallback.id = "chart-status-indicator";
    fallback.textContent = "Chart status unavailable";
    return fallback;
}

/**
 * Creates the settings-panel chart status indicator element.
 *
 * @returns The chart status indicator element.
 */
export function createChartStatusIndicator(): HTMLElement | null {
    try {
        return createChartStatusIndicatorFromCounts(getChartCounts());
    } catch (error) {
        console.error(
            "[ChartStatus] Error creating chart status indicator:",
            error
        );
        return createFallbackIndicator();
    }
}
