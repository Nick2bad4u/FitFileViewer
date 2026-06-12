import { getRegisteredChartInstanceCount } from "./chartInstanceRegistry.js";
import { runChartRender } from "./renderChartExecution.js";
import { completeChartRendering } from "./renderChartLifecycle.js";
import { touchRendererModulesForTest } from "./renderChartTestRendererTouches.js";
import type {
    ActivityStartTime,
    ChartDataRecord,
} from "./renderChartDataPreparation.js";
import type { getRendererModulesSafe } from "./renderChartDependencyAccessors.js";

interface PreparedChartRenderOptions {
    allowInactiveTab: boolean;
    skipControls: boolean;
    skipTabAbort: boolean;
}

type RenderChartsWithData = (
    targetContainer: unknown,
    recordMesgs: readonly ChartDataRecord[],
    activityStartTime: ActivityStartTime,
    options: {
        skipControls: boolean;
        skipTabAbort: boolean;
    }
) => Promise<unknown>;

type RendererProbeModules = ReturnType<typeof getRendererModulesSafe>;

interface ChartLifecycleActions {
    completeRendering?: (
        success: boolean,
        chartCount?: number,
        renderTime?: number
    ) => void;
}

interface PreparedChartRenderDependencies {
    createElement(tagName: string): HTMLElement;
    getChartLifecycleActions(): ChartLifecycleActions | null;
    getRendererModules(): RendererProbeModules;
    isTestEnvironment(): boolean;
    now(): number;
    renderChartsWithData: RenderChartsWithData;
    safeCompleteRendering(success: boolean): void;
    warn(message: string, error: unknown): void;
}

interface PreparedChartRenderInput {
    activityStartTime: ActivityStartTime;
    performanceStart: number;
    recordMesgs: readonly ChartDataRecord[];
    targetContainer: unknown;
}

interface PreparedChartRenderResult {
    renderTime: number;
    success: boolean;
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
export async function executePreparedChartRender(
    dependencies: PreparedChartRenderDependencies,
    input: PreparedChartRenderInput,
    options: PreparedChartRenderOptions
): Promise<PreparedChartRenderResult> {
    touchRendererModulesForTest(
        {
            createElement: (tagName) => dependencies.createElement(tagName),
            getRendererModules: () => dependencies.getRendererModules(),
            isTestEnvironment: () => dependencies.isTestEnvironment(),
        },
        input.recordMesgs,
        input.activityStartTime
    );

    const success = await runChartRender(
        {
            renderChartsWithData: (
                targetContainer,
                recordMesgs,
                activityStartTime,
                renderOptions
            ) =>
                dependencies.renderChartsWithData(
                    targetContainer,
                    recordMesgs,
                    activityStartTime,
                    renderOptions
                ),
            warn: (message, error) => dependencies.warn(message, error),
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
            getChartLifecycleActions: () =>
                dependencies.getChartLifecycleActions(),
            safeCompleteRendering: (wasSuccessful) =>
                dependencies.safeCompleteRendering(wasSuccessful),
        },
        success,
        getRegisteredChartInstanceCount(),
        renderTime
    );

    return { renderTime, success };
}
