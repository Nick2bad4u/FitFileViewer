import { getRegisteredChartInstances } from "./chartInstanceRegistry.js";
import { touchStringTargetContainer } from "./renderChartPreflight.js";
import {
    clearExistingCharts,
    startChartRendering,
} from "./renderChartLifecycle.js";
import type { ChartStateUpdateOptions } from "./renderChartStateAccess.js";

type SetStateFunction = (
    loading: boolean,
    options?: ChartStateUpdateOptions
) => void;
type SetChartRenderingFunction = (
    rendering: boolean,
    options?: ChartStateUpdateOptions
) => void;
type ClearChartRenderStateFunction = (
    options?: ChartStateUpdateOptions
) => void;

interface ChartLifecycleActions {
    clearCharts?: () => void;
    startRendering?: () => void;
}

interface ChartRenderSessionStartDependencies {
    clearChartRenderState: ClearChartRenderStateFunction;
    doc: Document;
    getChartLifecycleActions(): ChartLifecycleActions | null;
    isLoadingStateSuppressed(): boolean;
    now(): number;
    setChartRendering: SetChartRenderingFunction;
    setLoadingState: SetStateFunction;
    waitIfRapidRender(): Promise<void>;
}

interface ChartRenderSessionStartInput {
    targetContainer: unknown;
}

type ChartRenderSessionStartResult =
    | {
          ready: false;
      }
    | {
          performanceStart: number;
          ready: true;
      };

/**
 * Starts a chart render session and validates runtime availability.
 *
 * @param dependencies - DOM, state, lifecycle, and notification dependencies.
 * @param input - Render target input.
 *
 * @returns Session timing when chart rendering can continue.
 */
export async function beginChartRenderSession(
    dependencies: ChartRenderSessionStartDependencies,
    input: ChartRenderSessionStartInput
): Promise<ChartRenderSessionStartResult> {
    touchStringTargetContainer(dependencies.doc, input.targetContainer);

    startChartRendering({
        getChartLifecycleActions: () => dependencies.getChartLifecycleActions(),
        isLoadingStateSuppressed: () => dependencies.isLoadingStateSuppressed(),
        setChartRendering: (rendering, options) =>
            dependencies.setChartRendering(
                rendering,
                options as ChartStateUpdateOptions | undefined
            ),
        setLoadingState: (loading, options) =>
            dependencies.setLoadingState(
                loading,
                options as ChartStateUpdateOptions | undefined
            ),
    });

    await dependencies.waitIfRapidRender();

    const performanceStart = dependencies.now();

    getRegisteredChartInstances();

    clearExistingCharts({
        clearChartRenderState: (options) =>
            dependencies.clearChartRenderState(
                options as ChartStateUpdateOptions | undefined
            ),
        getChartLifecycleActions: () => dependencies.getChartLifecycleActions(),
    });

    return { performanceStart, ready: true };
}
