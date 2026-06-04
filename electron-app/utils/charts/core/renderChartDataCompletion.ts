import { completeSuccessfulChartRender } from "./renderChartSuccessfulCompletion.js";

type CompletionDependencies = Parameters<
    typeof completeSuccessfulChartRender
>[0];
type CompletionInput = Parameters<typeof completeSuccessfulChartRender>[1];

interface ChartCompletionGlobal {
    readonly _chartjsInstances: unknown;
    readonly getThemeConfig?: unknown;
}

interface ChartControlsStateManager {
    updateChartControlsUI?(enabled: boolean): unknown;
}

interface CompleteChartDataRenderDependencies extends Omit<
    CompletionDependencies,
    "chartInstances" | "getThemeConfig" | "updateChartControlsUI"
> {
    readonly chartGlobal: ChartCompletionGlobal;
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
        chartInstances: dependencies.chartGlobal._chartjsInstances,
        CustomEventConstructor: dependencies.CustomEventConstructor,
        doc: dependencies.doc,
        getComputedStateManager: dependencies.getComputedStateManager,
        getState: dependencies.getState,
        getThemeConfig: () => {
            const globalGetThemeConfig =
                dependencies.chartGlobal.getThemeConfig;
            return isGetThemeConfigFunction(globalGetThemeConfig)
                ? globalGetThemeConfig()
                : dependencies.getThemeConfig();
        },
        isTestRuntime: dependencies.isTestRuntime,
        notify: dependencies.notify,
        now: dependencies.now,
        nowPerformance: dependencies.nowPerformance,
        showRenderNotification: dependencies.showRenderNotification,
        updateChartControlsUI: (enabled) =>
            dependencies.getUIStateManager()?.updateChartControlsUI?.(enabled),
        updatePreviousChartState: dependencies.updatePreviousChartState,
        updateState: dependencies.updateState,
    };
    if (dependencies.addHoverEffectsToExistingCharts !== undefined) {
        completionDependencies.addHoverEffectsToExistingCharts =
            dependencies.addHoverEffectsToExistingCharts;
    }

    return completeSuccessfulChartRender(completionDependencies, input);
}

function isGetThemeConfigFunction(
    value: unknown
): value is CompletionDependencies["getThemeConfig"] {
    return typeof value === "function";
}
