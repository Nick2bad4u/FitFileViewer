import { getRegisteredChartInstances } from "./chartInstanceRegistry.js";
import { completeSuccessfulChartRender } from "./renderChartSuccessfulCompletion.js";

type CompletionDependencies = Parameters<
    typeof completeSuccessfulChartRender
>[0];
type CompletionInput = Parameters<typeof completeSuccessfulChartRender>[1];

interface ChartControlsStateManager {
    updateChartControlsUI?(enabled: boolean): unknown;
}

interface CompleteChartDataRenderDependencies extends Omit<
    CompletionDependencies,
    "chartInstances" | "getThemeConfig" | "updateChartControlsUI"
> {
    readonly getThemeConfig: CompletionDependencies["getThemeConfig"];
    readonly getUIStateManager: () =>
        | ChartControlsStateManager
        | null
        | undefined;
}

/**
 * Completes a successful chart data render pass with state, hover, and
 * notification updates.
 *
 * @param dependencies - Runtime completion dependencies and fallback accessors.
 * @param input - Render timing and visible chart count.
 *
 * @returns Final render duration and chart count.
 */
export async function completeChartDataRender(
    dependencies: CompleteChartDataRenderDependencies,
    input: CompletionInput
): ReturnType<typeof completeSuccessfulChartRender> {
    const completionDependencies: CompletionDependencies = {
        addChartHoverEffects: dependencies.addChartHoverEffects,
        chartContainer: dependencies.chartContainer,
        chartInstances: getRegisteredChartInstances(),
        CustomEventConstructor: dependencies.CustomEventConstructor,
        doc: dependencies.doc,
        getChartOptions: dependencies.getChartOptions,
        getComputedStateManager: dependencies.getComputedStateManager,
        getThemeConfig: dependencies.getThemeConfig,
        isTestRuntime: dependencies.isTestRuntime,
        notify: dependencies.notify,
        now: dependencies.now,
        nowPerformance: dependencies.nowPerformance,
        showRenderNotification: dependencies.showRenderNotification,
        updateChartControlsUI: (enabled) =>
            dependencies.getUIStateManager()?.updateChartControlsUI?.(enabled),
        updatePerformanceSummary: dependencies.updatePerformanceSummary,
        updatePreviousChartState: dependencies.updatePreviousChartState,
        updateState: dependencies.updateState,
    };
    if (dependencies.addHoverEffectsToExistingCharts !== undefined) {
        completionDependencies.addHoverEffectsToExistingCharts =
            dependencies.addHoverEffectsToExistingCharts;
    }

    return completeSuccessfulChartRender(completionDependencies, input);
}
