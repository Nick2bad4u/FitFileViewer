import { getRegisteredChartStateManager } from "../../charts/core/chartStateManagerRegistry.js";
import {
    destroyRegisteredChartInstances,
    getRegisteredChartInstanceCount,
} from "../../charts/core/chartInstanceRegistry.js";
import { getChartRenderContainer } from "../../charts/dom/chartDomUtils.js";
import { queryAll } from "../../dom/index.js";
import { hasActiveFitChartData } from "../../state/domain/fitChartDataState.js";
import { clearCachedChartSettings } from "../../state/domain/settingsStateManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import {
    getChartSettingsRenderRuntime,
    type ChartSettingsRenderRuntime,
} from "./chartSettingsRenderRuntime.js";

type ChartRenderManagerLike = {
    debouncedRender: (reason: string) => unknown;
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

function hasChartData(): boolean {
    return hasActiveFitChartData();
}

function isChartRenderManagerLike(
    value: unknown
): value is ChartRenderManagerLike {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    return hasFunctionProperty(value, "debouncedRender");
}

function hasFunctionProperty(value: object, key: "debouncedRender"): boolean {
    if (!(key in value)) {
        return false;
    }

    return typeof value[key as keyof typeof value] === "function";
}

function getPreferredRenderManager(): ChartRenderManagerLike | undefined {
    const managerCandidate: unknown = getRegisteredChartStateManager();

    return isChartRenderManagerLike(managerCandidate)
        ? managerCandidate
        : undefined;
}

function requestRerenderViaManager(reason: string): boolean {
    const manager = getPreferredRenderManager();
    if (!manager) {
        return false;
    }

    manager.debouncedRender(reason);
    console.log(`${LOG_PREFIX} Delegated re-render to chartStateManager`);
    return true;
}

function clearLegacyChartRenderState(): void {
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

function dispatchChartRenderRequest(
    runtime: ChartSettingsRenderRuntime,
    reason: string
): void {
    runtime.eventTarget.dispatchEvent(runtime.createRenderRequestEvent(reason));
}

function runDirectRenderFallback(
    runtime: ChartSettingsRenderRuntime,
    reason: string,
    target?: Element | null
): void {
    const runtimeDocument = runtime.documentRef;
    const container = getChartRenderContainer(runtimeDocument);
    console.log(
        `${LOG_PREFIX} Using container: ${container ? container.id : "none found"}`
    );

    const renderTarget =
        target ||
        container ||
        getChartRenderContainer(runtimeDocument) ||
        runtimeDocument.body;
    void import("../../charts/core/renderChartJS.js")
        .then(({ renderChartJS }) => {
            void renderChartJS(renderTarget);
        })
        .catch((error: unknown) => {
            console.warn(
                `${LOG_PREFIX} Direct chart render import failed; dispatching render request event`,
                error
            );
            dispatchChartRenderRequest(runtime, reason);
        });
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
        const runtime = getChartSettingsRenderRuntime();
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

        clearCachedChartSettings({
            source: "reRenderChartsAfterSettingChange",
        });
        console.log(`${LOG_PREFIX} Cleared cached chart settings from state`);

        const reason = `Setting change: ${settingName}`;
        if (requestRerenderViaManager(reason)) {
            return;
        }

        clearLegacyChartRenderState();
        removeExistingChartCanvases();
        runDirectRenderFallback(runtime, `setting-change:${settingName}`);

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
        const runtime = getChartSettingsRenderRuntime();
        // Check if chart data is available
        if (!hasChartData()) {
            console.log(
                `${LOG_PREFIX} No chart data available for re-rendering`
            );
            return;
        }

        console.log(`${LOG_PREFIX} Re-rendering charts after settings reset`);

        clearCachedChartSettings({
            source: "reRenderChartsAfterReset",
        });

        // Get the charts container
        const chartsContainer = getChartRenderContainer(runtime.documentRef);

        // Clear existing chart instances
        destroyRegisteredChartInstances((index, error) => {
            console.warn(
                `${LOG_PREFIX} Error destroying chart ${index}:`,
                error
            );
        });

        // Force a complete re-render through modern state management
        const manager = getPreferredRenderManager();
        if (manager) {
            manager.debouncedRender("Settings reset");
        } else {
            runDirectRenderFallback(
                runtime,
                "settings-reset",
                chartsContainer || getChartRenderContainer(runtime.documentRef)
            );
        }
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error re-rendering charts:`,
            getErrorMessage(error)
        );
    }
}
