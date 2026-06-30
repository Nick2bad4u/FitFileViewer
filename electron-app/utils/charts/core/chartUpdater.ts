import { destroyRegisteredChartInstances } from "./chartInstanceRegistry.js";
import { renderChartJS } from "./renderChartJS.js";
import { getRegisteredChartStateManager } from "./chartStateManagerRegistry.js";
import { chartUpdaterRuntime } from "./chartUpdaterRuntime.js";

/**
 * Snapshot of chart updater availability and runtime wiring.
 */
export type ChartUpdateSystemStatus = {
    readonly chartStateManager: boolean;
    readonly globalRenderChartJS: boolean;
    readonly modernSystemAvailable: boolean;
    readonly renderChartJSAvailable: boolean;
    readonly timestamp: string;
};

/**
 * Get status information about the chart update system.
 *
 * @returns Current chart update system status.
 */
export function getChartUpdateSystemStatus(): ChartUpdateSystemStatus {
    const chartStateManager = getRegisteredChartStateManager();

    return {
        chartStateManager: Boolean(chartStateManager),
        globalRenderChartJS: false,
        modernSystemAvailable: isModernChartSystemAvailable(),
        renderChartJSAvailable: typeof renderChartJS === "function",
        timestamp: chartUpdaterRuntime().isoNow(),
    };
}

/**
 * Check if chart state manager is available and initialized.
 *
 * @returns Whether the modern chart state manager can accept render requests.
 */
export function isModernChartSystemAvailable(): boolean {
    const chartStateManager = getRegisteredChartStateManager();

    return (
        chartStateManager !== null &&
        chartStateManager.isInitialized === true
    );
}

/**
 * Unified interface for triggering chart updates.
 *
 * @param reason - Reason for the chart update.
 * @param container - Optional chart container element.
 *
 * @returns Whether the update request was accepted or rendered.
 *
 * @throws Re-throws chart state manager or fallback render failures.
 */
export async function updateCharts(
    reason: string,
    container?: HTMLElement | null
): Promise<boolean> {
    try {
        console.log(`[ChartUpdate] Triggering chart update: ${reason}`);

        const chartStateManager = getRegisteredChartStateManager();
        if (chartStateManager) {
            chartStateManager.debouncedRender(reason);
            return true;
        }

        console.warn(
            "[ChartUpdate] chartStateManager not available, using fallback"
        );

        return await renderChartJS(container);
    } catch (error) {
        console.error(
            `[ChartUpdate] Error updating charts for reason "${reason}":`,
            error
        );
        throw error;
    }
}

/**
 * Handle data changes with proper chart updates.
 *
 * @param newData - New data object.
 *
 * @returns Whether the update request was accepted.
 */
export async function updateChartsForDataChange(
    newData: unknown
): Promise<boolean> {
    const reason = `Data change: ${newData ? "new data loaded" : "data cleared"}`;
    return await updateCharts(reason);
}

/**
 * Handle setting changes with debounced chart updates.
 *
 * @param settingName - Name of the changed setting.
 * @param newValue - New setting value.
 * @param container - Optional chart container element.
 *
 * @returns Whether the update request was accepted.
 */
export async function updateChartsForSettingChange(
    settingName: string,
    newValue: unknown,
    container?: HTMLElement | null
): Promise<boolean> {
    const reason = `Setting change: ${settingName} = ${String(newValue)}`;
    return await updateCharts(reason, container);
}

/**
 * Handle tab activation with proper chart updates.
 *
 * @returns Whether the update request was accepted.
 */
export async function updateChartsForTabActivation(): Promise<boolean> {
    return await updateCharts("Chart tab activated");
}

/**
 * Handle theme changes with proper chart updates.
 *
 * @param newTheme - The new theme name.
 *
 * @returns Whether the update request was accepted or rendered.
 *
 * @throws Re-throws chart state manager or fallback render failures.
 */
export async function updateChartsForThemeChange(
    newTheme: string
): Promise<boolean> {
    try {
        console.log(`[ChartUpdate] Handling theme change to: ${newTheme}`);

        const chartStateManager = getRegisteredChartStateManager();
        if (
            chartStateManager &&
            typeof chartStateManager.handleThemeChange === "function"
        ) {
            chartStateManager.handleThemeChange(newTheme);
            return true;
        }

        console.warn(
            "[ChartUpdate] chartStateManager not available for theme change, using fallback"
        );

        destroyLegacyChartInstances();

        return await renderChartJS();
    } catch (error) {
        console.error(
            `[ChartUpdate] Error updating charts for theme change to "${newTheme}":`,
            error
        );
        throw error;
    }
}

function destroyLegacyChartInstances(): void {
    destroyRegisteredChartInstances((_index, error) => {
        console.warn("[ChartUpdate] Error destroying chart:", error);
    });
}

/**
 * Convenience API for common chart update triggers.
 */
export const ChartUpdater = {
    dataChange: updateChartsForDataChange,
    getStatus: getChartUpdateSystemStatus,
    isModernSystemAvailable: isModernChartSystemAvailable,
    settingChange: updateChartsForSettingChange,
    tabActivation: updateChartsForTabActivation,
    themeChange: updateChartsForThemeChange,
    update: updateCharts,
};

export default ChartUpdater;
