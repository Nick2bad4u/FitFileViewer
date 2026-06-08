import { chartStateManager } from "../../charts/core/chartStateManager.js";
import {
    destroyRegisteredChartInstances,
    getRegisteredChartInstanceCount,
} from "../../charts/core/chartInstanceRegistry.js";
import { getChartRenderContainer } from "../../charts/dom/chartDomUtils.js";
import { queryAll } from "../../dom/index.js";
import { setState } from "../../state/core/stateManager.js";
import { hasActiveFitChartData } from "../../state/domain/fitChartDataState.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

type ChartActionsLike = {
    clearCharts?: () => unknown;
    requestRerender?: (reason: string) => unknown;
};

type ChartRenderManagerLike = {
    debouncedRender: (reason: string) => unknown;
};

type ChartSettingsGlobal = typeof globalThis & {
    chartActions?: unknown;
    chartStateManager?: unknown;
    renderChartJS?: (target?: Element | null) => unknown;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function formatLogValue(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }

    if (
        typeof value === "boolean" ||
        typeof value === "bigint" ||
        typeof value === "number"
    ) {
        return String(value);
    }

    if (value === null) {
        return "null";
    }

    if (value === undefined) {
        return "undefined";
    }

    if (value instanceof Error) {
        return value.message;
    }

    return "[object]";
}

const LOG_PREFIX = "[ChartSettings]";

function getChartSettingsGlobal(): ChartSettingsGlobal {
    return globalThis;
}

function hasChartData(): boolean {
    return hasActiveFitChartData();
}

function isChartActionsLike(value: unknown): value is ChartActionsLike {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    return (
        hasFunctionProperty(value, "clearCharts") ||
        hasFunctionProperty(value, "requestRerender")
    );
}

function isChartRenderManagerLike(
    value: unknown
): value is ChartRenderManagerLike {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    return hasFunctionProperty(value, "debouncedRender");
}

function hasFunctionProperty(
    value: object,
    key: "clearCharts" | "debouncedRender" | "requestRerender"
): boolean {
    if (!(key in value)) {
        return false;
    }

    return typeof value[key as keyof typeof value] === "function";
}

function getPreferredRenderManager(
    chartGlobal: ChartSettingsGlobal
): ChartRenderManagerLike | undefined {
    const managerCandidate = isChartRenderManagerLike(chartStateManager)
        ? chartStateManager
        : chartGlobal.chartStateManager;

    return isChartRenderManagerLike(managerCandidate)
        ? managerCandidate
        : undefined;
}

function requestRerenderViaManager(reason: string): boolean {
    const chartGlobal = getChartSettingsGlobal();
    const manager = getPreferredRenderManager(chartGlobal);
    if (!manager) {
        return false;
    }

    manager.debouncedRender(reason);
    console.log(`${LOG_PREFIX} Delegated re-render to chartStateManager`);
    return true;
}

function requestRerenderViaActions(
    actions: ChartActionsLike | undefined,
    reason: string
): boolean {
    if (typeof actions?.requestRerender !== "function") {
        return false;
    }

    actions.requestRerender(reason);
    console.log(
        `${LOG_PREFIX} Delegated re-render via chartActions.requestRerender`
    );
    return true;
}

function clearLegacyChartRenderState(
    actions: ChartActionsLike | undefined
): void {
    if (typeof actions?.clearCharts === "function") {
        actions.clearCharts();
        return;
    }

    const chartCount = getRegisteredChartInstanceCount();
    if (chartCount === 0) {
        return;
    }

    console.log(
        `${LOG_PREFIX} Destroying ${chartCount} existing chart instances`
    );
    destroyRegisteredChartInstances((index, error) => {
        console.warn(`${LOG_PREFIX} Error destroying chart ${index}:`, error);
    });
}

function removeExistingChartCanvases(): void {
    const existingCanvases = queryAll(
        'canvas[id^="chart-"], canvas[id^="chartjs-canvas-"]'
    );
    console.log(
        `${LOG_PREFIX} Removing ${existingCanvases.length} existing chart canvases`
    );
    for (const canvas of existingCanvases) {
        canvas.remove();
    }
}

function runGlobalRenderFallback(
    chartGlobal: ChartSettingsGlobal,
    settingName: string
): void {
    const container = getChartRenderContainer(document);
    console.log(
        `${LOG_PREFIX} Using container: ${container ? container.id : "none found"}`
    );

    if (typeof chartGlobal.renderChartJS === "function") {
        const target =
            container || getChartRenderContainer(document) || document.body;
        chartGlobal.renderChartJS(target);
        return;
    }

    console.log(`${LOG_PREFIX} Dispatching render request event fallback`);
    chartGlobal.dispatchEvent(
        new CustomEvent("ffv:request-render-charts", {
            detail: { reason: `setting-change:${settingName}` },
        })
    );
}

/**
 * Re-renders charts after a setting change
 *
 * @param settingName - Name of the setting that changed.
 * @param newValue - New value of the setting.
 */
export function reRenderChartsAfterSettingChange(
    settingName: string,
    newValue: unknown
): void {
    try {
        const chartGlobal = getChartSettingsGlobal();
        // Check if chart data is available
        if (!hasChartData()) {
            console.log(
                `${LOG_PREFIX} No chart data available for re-rendering after ${settingName} change`
            );
            return;
        }

        console.log(
            `${LOG_PREFIX} Re-rendering charts after ${settingName} changed to ${formatLogValue(newValue)}`
        );

        // CRITICAL: Clear cached settings from state management
        // This ensures the chart rendering will read fresh settings from state manager
        if (typeof setState === "function") {
            setState("settings.charts", null, {
                source: "reRenderChartsAfterSettingChange",
            });
            console.log(
                `${LOG_PREFIX} Cleared cached chart settings from state`
            );
        }

        const reason = `Setting change: ${settingName}`;
        if (requestRerenderViaManager(reason)) {
            return;
        }

        const actions = isChartActionsLike(chartGlobal.chartActions)
            ? chartGlobal.chartActions
            : undefined;
        if (requestRerenderViaActions(actions, reason)) {
            return;
        }

        clearLegacyChartRenderState(actions);
        removeExistingChartCanvases();
        runGlobalRenderFallback(chartGlobal, settingName);

        console.log(
            `${LOG_PREFIX} Chart re-render completed for ${settingName} change (fallback path)`
        );
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        console.error(
            `${LOG_PREFIX} Error re-rendering charts after ${settingName} change:`,
            errorMessage
        );
        if (typeof showNotification === "function") {
            void showNotification(
                `Failed to update chart setting: ${errorMessage}`,
                "error"
            );
        }
    }
}

/**
 * Re-renders charts after settings reset
 */
export function reRenderChartsAfterReset(): void {
    try {
        const chartGlobal = getChartSettingsGlobal();
        // Check if chart data is available
        if (!hasChartData()) {
            console.log(
                `${LOG_PREFIX} No chart data available for re-rendering`
            );
            return;
        }

        console.log(`${LOG_PREFIX} Re-rendering charts after settings reset`);

        // CRITICAL: Clear cached settings so chart rendering re-reads fresh defaults from state manager.
        // This mirrors the behavior of reRenderChartsAfterSettingChange.
        if (typeof setState === "function") {
            setState("settings.charts", null, {
                source: "reRenderChartsAfterReset",
            });
        }

        // Get the charts container
        const chartsContainer = getChartRenderContainer(document);

        // Clear existing chart instances
        destroyRegisteredChartInstances((index, error) => {
            console.warn(
                `${LOG_PREFIX} Error destroying chart ${index}:`,
                error
            );
        });

        // Force a complete re-render through modern state management
        if (isChartRenderManagerLike(chartStateManager)) {
            chartStateManager.debouncedRender("Settings reset");
        } else if (typeof chartGlobal.renderChartJS === "function") {
            const target =
                chartsContainer ||
                getChartRenderContainer(document) ||
                document.body;
            chartGlobal.renderChartJS(target);
        } else {
            chartGlobal.dispatchEvent(
                new CustomEvent("ffv:request-render-charts", {
                    detail: { reason: "settings-reset" },
                })
            );
        }
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error re-rendering charts:`,
            getErrorMessage(error)
        );
    }
}
