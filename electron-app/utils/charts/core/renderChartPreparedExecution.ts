import { runChartRender } from "./renderChartExecution.js";
import { completeChartRendering } from "./renderChartLifecycle.js";
import { touchRendererModulesForTest } from "./renderChartTestRendererTouches.js";

interface PreparedChartRenderOptions {
    allowInactiveTab: boolean;
    skipControls: boolean;
    skipTabAbort: boolean;
}

type RenderChartsWithData = (
    targetContainer: unknown,
    recordMesgs: readonly unknown[],
    activityStartTime: unknown,
    options: {
        skipControls: boolean;
        skipTabAbort: boolean;
    }
) => Promise<unknown>;

type RendererProbe = (...args: unknown[]) => unknown;

interface RendererProbeModules {
    renderEventMessagesChart?: RendererProbe;
    renderGPSTrackChart?: RendererProbe;
    renderLapZoneCharts?: RendererProbe;
    renderPerformanceAnalysisCharts?: RendererProbe;
    renderTimeInZoneCharts?: RendererProbe;
}

interface ChartLifecycleActions {
    completeRendering?: (
        success: boolean,
        chartCount?: number,
        renderTime?: number
    ) => void;
}

interface ChartRuntimeGlobal {
    _chartjsInstances?: unknown[];
}

interface PreparedChartRenderDependencies {
    chartGlobal: ChartRuntimeGlobal;
    createElement(tagName: string): HTMLElement;
    getGlobalChartActions(): ChartLifecycleActions | null;
    getRendererModules(): RendererProbeModules;
    isTestEnvironment(): boolean;
    now(): number;
    renderChartsWithData: RenderChartsWithData;
    safeCompleteRendering(success: boolean): void;
    warn(message: string, error: unknown): void;
}

interface PreparedChartRenderInput {
    activityStartTime: unknown;
    performanceStart: number;
    recordMesgs: readonly unknown[];
    targetContainer: unknown;
}

interface PreparedChartRenderResult {
    renderTime: number;
    success: boolean;
}

function getChartInstanceCount(chartGlobal: ChartRuntimeGlobal): number {
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
 * @returns Render success and elapsed render time.
 */
export async function executePreparedChartRender(
    dependencies: PreparedChartRenderDependencies,
    input: PreparedChartRenderInput,
    options: PreparedChartRenderOptions
): Promise<PreparedChartRenderResult> {
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
