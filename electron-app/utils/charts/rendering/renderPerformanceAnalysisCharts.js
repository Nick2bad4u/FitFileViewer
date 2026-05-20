import { renderAltitudeProfileChart } from "./renderAltitudeProfileChart.js";
import { renderPowerVsHeartRateChart } from "./renderPowerVsHeartRateChart.js";
import { renderSpeedVsDistanceChart } from "./renderSpeedVsDistanceChart.js";

// Performance analysis charts renderer

/**
 * @typedef {Object} PerformanceAnalysisOptions
 *
 * @property {string} [animationStyle]
 * @property {string} [chartType]
 * @property {unknown} [customColors]
 * @property {string} [distanceUnits]
 * @property {string} [interpolation]
 * @property {number | "all"} maxPoints
 * @property {boolean} [showFill]
 * @property {boolean} [showGrid]
 * @property {boolean} [showLegend]
 * @property {boolean} [showPoints]
 * @property {boolean} [showTitle]
 * @property {number} [smoothing]
 * @property {string} [theme]
 * @property {string} [timeUnits]
 * @property {Record<string, unknown>} [zoomPluginConfig]
 */
/**
 * @typedef {Object} PerformanceAnalysisRuntimeGlobal
 *
 * @property {unknown} [__FFV_debugCharts]
 */

const chartGlobal = /** @type {PerformanceAnalysisRuntimeGlobal} */ (
    globalThis
);

/**
 * Render performance analysis charts.
 *
 * @param {HTMLElement} container
 * @param {Record<string, unknown>[]} data
 * @param {(string | number)[]} labels
 * @param {PerformanceAnalysisOptions} options
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
            Boolean(chartGlobal.__FFV_debugCharts);
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
