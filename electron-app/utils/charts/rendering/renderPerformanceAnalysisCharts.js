import { renderAltitudeProfileChart } from "./renderAltitudeProfileChart.js";
import { renderPowerVsHeartRateChart } from "./renderPowerVsHeartRateChart.js";
import { renderSpeedVsDistanceChart } from "./renderSpeedVsDistanceChart.js";

// Performance analysis charts renderer

/**
 * Render performance analysis charts.
 *
 * @param {HTMLElement} container
 * @param {any} data
 * @param {(string | number)[]} labels
 * @param {any} options
 */
export function renderPerformanceAnalysisCharts(
    container,
    data,
    labels,
    options
) {
    try {
        const isDevEnvironment =
            typeof process !== "undefined" &&
            process.env?.NODE_ENV === "development";
        const isDebugLoggingEnabled =
            isDevEnvironment &&
            Boolean(/** @type {any} */ (globalThis).__FFV_debugCharts);
        if (isDebugLoggingEnabled) {
            console.log("[ChartJS] renderPerformanceAnalysisCharts called");
        }

        // Render speed vs distance chart
        renderSpeedVsDistanceChart(container, data, options);

        // Render power vs heart rate chart
        renderPowerVsHeartRateChart(container, data, options);

        // Render altitude profile with gradient chart
        renderAltitudeProfileChart(
            container,
            data,
            /** @type {number[]} */ (labels),
            options
        );
    } catch (error) {
        console.error(
            "[ChartJS] Error rendering performance analysis charts:",
            error
        );
    }
}
