import { getChartCounts } from "../core/getChartCounts.js";
import { getChartContentContainer } from "../dom/chartDomUtils.js";
import { createGlobalChartStatusIndicatorFromCounts } from "./createGlobalChartStatusIndicatorFromCounts.js";
import {
    type ChartStatusIndicatorRuntime,
    getChartStatusIndicatorRuntime,
} from "./chartStatusIndicatorRuntime.js";
import { globalChartStatusLogRuntime } from "./globalChartStatusLogRuntime.js";

const GLOBAL_CHART_STATUS_ID = "global-chart-status";
const LOG_PREFIX = "[GlobalChartStatus]";

type LogLevel = "error" | "info" | "log" | "warn";
type LogContext = Record<string, unknown>;

function getErrorContext(error: unknown): LogContext {
    return {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
    };
}

function logWithContext(
    level: LogLevel,
    message: string,
    context: LogContext = {}
): void {
    const timestamp = globalChartStatusLogRuntime().isoNow();
    const logMessage = `${timestamp} ${LOG_PREFIX} ${message}`;
    const hasContext = Object.keys(context).length > 0;
    const logArgs = hasContext ? [logMessage, context] : [logMessage];

    switch (level) {
        case "error": {
            console.error(...logArgs);
            break;
        }
        case "info": {
            console.info(...logArgs);
            break;
        }
        case "log": {
            console.log(...logArgs);
            break;
        }
        case "warn": {
            console.warn(...logArgs);
            break;
        }
        default: {
            console.log(...logArgs);
        }
    }
}

function getExistingIndicator(
    runtime: ChartStatusIndicatorRuntime
): HTMLElement | null {
    return runtime.querySelector(`#${GLOBAL_CHART_STATUS_ID}`);
}

function getChartContainer(
    runtime: ChartStatusIndicatorRuntime
): HTMLElement | null {
    const snakeCaseElement = runtime.querySelector("#chartjs_chart_container");
    if (snakeCaseElement) {
        return snakeCaseElement;
    }

    return runtime.querySelector("#chartjs-chart-container");
}

function insertIndicatorIntoDom(
    globalIndicator: HTMLElement,
    chartTabContent: HTMLElement,
    runtime: ChartStatusIndicatorRuntime
): void {
    try {
        const chartContainer = getChartContainer(runtime);

        if (chartContainer) {
            chartContainer.before(globalIndicator);
        } else {
            chartTabContent.append(globalIndicator);
            logWithContext("warn", "Chart container not found", {
                id: "chartjs_chart_container",
            });
        }

        logWithContext(
            "info",
            "Global chart status indicator inserted into DOM"
        );
    } catch (error) {
        logWithContext("error", "Failed to insert indicator into DOM", {
            ...getErrorContext(error),
        });
    }
}

/**
 * Creates a persistent global chart status indicator for the chart tab.
 *
 * @returns The created or existing indicator element, or null when chart
 *   content is unavailable.
 */
export function createGlobalChartStatusIndicator(): HTMLElement | null {
    try {
        logWithContext("info", "Creating global chart status indicator");
        const runtime = getChartStatusIndicatorRuntime();

        const chartTabContent = getChartContentContainer(
            runtime.getDocument()
        );
        if (!chartTabContent) {
            logWithContext("warn", "Chart tab content not found", {
                id: "content_chartjs",
            });
            return null;
        }

        const existingIndicator = getExistingIndicator(runtime);
        if (existingIndicator) {
            logWithContext(
                "info",
                "Global chart status indicator already exists"
            );
            return existingIndicator;
        }

        const counts = getChartCounts();
        logWithContext("info", "Chart status calculated", { counts });

        const globalIndicator =
            createGlobalChartStatusIndicatorFromCounts(counts);
        if (!globalIndicator) {
            return null;
        }

        insertIndicatorIntoDom(globalIndicator, chartTabContent, runtime);

        logWithContext(
            "info",
            "Global chart status indicator created successfully",
            {
                available: counts.available,
                visible: counts.visible,
            }
        );

        return globalIndicator;
    } catch (error) {
        logWithContext(
            "error",
            "Failed to create global chart status indicator",
            getErrorContext(error)
        );
        return null;
    }
}
