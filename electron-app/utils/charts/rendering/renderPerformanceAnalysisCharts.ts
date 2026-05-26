import { renderAltitudeProfileChart } from "./renderAltitudeProfileChart.js";
import { renderPowerVsHeartRateChart } from "./renderPowerVsHeartRateChart.js";
import { renderSpeedVsDistanceChart } from "./renderSpeedVsDistanceChart.js";
import { isDevelopmentEnvironment } from "../../runtime/processEnvironment.js";

interface PerformanceAnalysisOptions {
    animationStyle?: string;
    chartType?: string;
    customColors?: unknown;
    distanceUnits?: string;
    interpolation?: string;
    maxPoints: number | "all";
    showFill?: boolean;
    showGrid?: boolean;
    showLegend?: boolean;
    showPoints?: boolean;
    showTitle?: boolean;
    smoothing?: number;
    theme?: string;
    timeUnits?: string;
    zoomPluginConfig?: Record<string, unknown>;
    [key: string]: unknown;
}

type PerformanceAnalysisDatum = Record<string, unknown>;

interface PerformanceAnalysisRuntimeGlobal {
    __FFV_debugCharts?: unknown;
}

const chartGlobal = globalThis as PerformanceAnalysisRuntimeGlobal;

/**
 * Render performance analysis charts.
 */
export function renderPerformanceAnalysisCharts(
    container: HTMLElement,
    data: PerformanceAnalysisDatum[],
    labels: (number | string)[],
    options: PerformanceAnalysisOptions
): void {
    try {
        const isDebugLoggingEnabled =
            isDevelopmentEnvironment() &&
            Boolean(chartGlobal.__FFV_debugCharts);
        if (isDebugLoggingEnabled) {
            console.log("[ChartJS] renderPerformanceAnalysisCharts called");
        }

        // Render speed vs distance chart
        renderSpeedVsDistanceChart(container, data, options);

        // Render power vs heart rate chart
        renderPowerVsHeartRateChart(container, data, options);

        // Render altitude profile with gradient chart
        renderAltitudeProfileChart(container, data, labels, options);
    } catch (error) {
        console.error(
            "[ChartJS] Error rendering performance analysis charts:",
            error
        );
    }
}
