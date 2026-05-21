import { completeSuccessfulChartRender } from "./renderChartSuccessfulCompletion.js";
/**
 * Completes a successful chart data render pass with state, hover, and
 * notification updates.
 *
 * @param dependencies - Runtime completion dependencies and fallback accessors.
 * @param input - Render timing and visible chart count.
 *
 * @returns Final render duration and chart count.
 */
export async function completeChartDataRender(dependencies, input) {
    const completionDependencies = {
        addChartHoverEffects: dependencies.addChartHoverEffects,
        chartContainer: dependencies.chartContainer,
        chartInstances: dependencies.chartGlobal._chartjsInstances,
        CustomEventConstructor: dependencies.CustomEventConstructor,
        doc: dependencies.doc,
        getComputedStateManager: dependencies.getComputedStateManager,
        getState: dependencies.getState,
        getThemeConfig: () => {
            const globalGetThemeConfig = dependencies.chartGlobal.getThemeConfig;
            return typeof globalGetThemeConfig === "function"
                ? globalGetThemeConfig()
                : dependencies.getThemeConfig();
        },
        isTestRuntime: dependencies.isTestRuntime,
        notify: dependencies.notify,
        now: dependencies.now,
        nowPerformance: dependencies.nowPerformance,
        showRenderNotification: dependencies.showRenderNotification,
        updateChartControlsUI: (enabled) => dependencies.getUIStateManager()?.updateChartControlsUI?.(enabled),
        updatePreviousChartState: dependencies.updatePreviousChartState,
        updateState: dependencies.updateState,
    };
    if (dependencies.addHoverEffectsToExistingCharts !== undefined) {
        completionDependencies.addHoverEffectsToExistingCharts =
            dependencies.addHoverEffectsToExistingCharts;
    }
    return completeSuccessfulChartRender(completionDependencies, input);
}
