import { runChartRender } from "./renderChartExecution.js";
import { completeChartRendering } from "./renderChartLifecycle.js";
import { touchRendererModulesForTest } from "./renderChartTestRendererTouches.js";
function getChartInstanceCount(chartGlobal) {
    return Array.isArray(chartGlobal._chartjsInstances)
        ? chartGlobal._chartjsInstances.length
        : 0;
}
/**
 * Executes a prepared chart render and completes lifecycle state.
 *
 * @param dependencies - Runtime, renderer, and lifecycle dependencies.
 * @param input - Prepared render data and timing inputs.
 * @param options - Normalized render options.
 *
 * @returns Render success and elapsed render time.
 */
export async function executePreparedChartRender(dependencies, input, options) {
    touchRendererModulesForTest(
        {
            createElement: dependencies.createElement,
            getRendererModules: dependencies.getRendererModules,
            isTestEnvironment: dependencies.isTestEnvironment,
        },
        input.recordMesgs,
        input.activityStartTime
    );
    const success = await runChartRender(
        {
            renderChartsWithData: dependencies.renderChartsWithData,
            warn: dependencies.warn,
        },
        input.targetContainer,
        input.recordMesgs,
        input.activityStartTime,
        {
            skipControls: options.skipControls,
            skipTabAbort: options.skipTabAbort || options.allowInactiveTab,
        }
    );
    const renderTime = dependencies.now() - input.performanceStart;
    console.log(
        `[ChartJS] Chart rendering completed in ${renderTime.toFixed(2)}ms`
    );
    completeChartRendering(
        {
            getGlobalChartActions: dependencies.getGlobalChartActions,
            safeCompleteRendering: dependencies.safeCompleteRendering,
        },
        success,
        getChartInstanceCount(dependencies.chartGlobal),
        renderTime
    );
    return { renderTime, success };
}
