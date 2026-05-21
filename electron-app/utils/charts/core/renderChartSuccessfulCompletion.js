import { renderNoDataMessage } from "./renderChartDomHelpers.js";
import { applyCompletedChartHoverEffects } from "./renderChartHoverCompletion.js";
import { handleChartRenderNotification } from "./renderChartNotificationFlow.js";
import { updateChartRenderPerformanceState } from "./renderChartPerformanceState.js";
import { completeChartRenderState } from "./renderChartCompletionState.js";
import { emitChartsRenderedEvent } from "./renderChartRenderedEvent.js";
import { resolveChartRenderResultState } from "./renderChartResultState.js";
function renderNoDataForContainer(chartContainer, message) {
    if (chartContainer !== null && chartContainer !== undefined) {
        renderNoDataMessage(chartContainer, message);
    }
}
/**
 * Runs the success side effects that follow chart construction.
 *
 * @param dependencies - Runtime, state, notification, and DOM dependencies.
 * @param input - Render timing and visible field summary.
 *
 * @returns Final render duration and chart count.
 */
export async function completeSuccessfulChartRender(dependencies, input) {
    const hoverDependencies = {
        addChartHoverEffects: dependencies.addChartHoverEffects,
        chartContainer: dependencies.chartContainer,
        getThemeConfig: dependencies.getThemeConfig,
        isTestRuntime: dependencies.isTestRuntime,
    };
    if (dependencies.addHoverEffectsToExistingCharts !== undefined) {
        hoverDependencies.addHoverEffectsToExistingCharts =
            dependencies.addHoverEffectsToExistingCharts;
    }
    if (dependencies.updateChartControlsUI !== undefined) {
        hoverDependencies.updateChartControlsUI =
            dependencies.updateChartControlsUI;
    }
    const { totalChartsRendered } = resolveChartRenderResultState(
        {
            chartContainer: dependencies.chartContainer,
            chartInstances: dependencies.chartInstances,
            renderNoDataMessage: renderNoDataForContainer,
        },
        { visibleFieldCount: input.visibleFieldCount }
    );
    const renderTime = dependencies.nowPerformance() - input.renderStartTime;
    console.log(
        `[ChartJS] Rendered ${totalChartsRendered} charts (sync) in ${renderTime.toFixed(2)}ms`
    );
    updateChartRenderPerformanceState(
        {
            getState: dependencies.getState,
            updateState: dependencies.updateState,
        },
        { renderTime, totalChartsRendered }
    );
    handleChartRenderNotification(
        {
            getState: dependencies.getState,
            isTestRuntime: dependencies.isTestRuntime,
            notify: dependencies.notify,
            showRenderNotification: dependencies.showRenderNotification,
            updateState: dependencies.updateState,
        },
        {
            totalChartsRendered,
            visibleFieldCount: input.visibleFieldCount,
        }
    );
    await applyCompletedChartHoverEffects(hoverDependencies, {
        totalChartsRendered,
    });
    completeChartRenderState(
        {
            CustomEventConstructor: dependencies.CustomEventConstructor,
            doc: dependencies.doc,
            emitChartsRenderedEvent,
            getComputedStateManager: dependencies.getComputedStateManager,
            getState: dependencies.getState,
            now: dependencies.now,
            updatePreviousChartState: dependencies.updatePreviousChartState,
        },
        {
            renderTime,
            totalChartsRendered,
            visibleFieldCount: input.visibleFieldCount,
        }
    );
    return { renderTime, totalChartsRendered };
}
