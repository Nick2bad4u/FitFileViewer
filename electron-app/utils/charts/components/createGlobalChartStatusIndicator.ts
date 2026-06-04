import { getChartCounts } from "../core/getChartCounts.js";
import { getChartContentContainer } from "../dom/chartDomUtils.js";
import { createGlobalChartStatusIndicatorFromCounts } from "./createGlobalChartStatusIndicatorFromCounts.js";

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
    const timestamp = new Date().toISOString();
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

function getExistingIndicator(): HTMLElement | null {
    const existingIndicator = document.querySelector(
        `#${GLOBAL_CHART_STATUS_ID}`
    );
    return existingIndicator instanceof HTMLElement ? existingIndicator : null;
}

function getChartContainer(): HTMLElement | null {
    const snakeCaseElement = document.querySelector(
        "#chartjs_chart_container"
    );
    if (snakeCaseElement instanceof HTMLElement) {
        return snakeCaseElement;
    }

    const kebabCaseElement = document.querySelector(
        "#chartjs-chart-container"
    );
    return kebabCaseElement instanceof HTMLElement ? kebabCaseElement : null;
}

function insertIndicatorIntoDom(
    globalIndicator: HTMLElement,
    chartTabContent: HTMLElement
): void {
    try {
        const chartContainer = getChartContainer();

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

        const chartTabContent = getChartContentContainer(document);
        if (!chartTabContent) {
            logWithContext("warn", "Chart tab content not found", {
                id: "content_chartjs",
            });
            return null;
        }

        const existingIndicator = getExistingIndicator();
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

        insertIndicatorIntoDom(globalIndicator, chartTabContent);

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
