import {
    isChartLibraryUnavailable,
    touchStringTargetContainer,
} from "./renderChartPreflight.js";
import {
    clearExistingCharts,
    startChartRendering,
} from "./renderChartLifecycle.js";

type NotifyErrorFunction = (
    message: string,
    type: "error"
) => Promise<unknown> | unknown;
type SetStateFunction = (
    path: string,
    value: unknown,
    options: unknown
) => void;
type UpdateStateFunction = (
    path: string,
    value: unknown,
    options: unknown
) => void;

interface ChartLifecycleActions {
    clearCharts?: () => void;
    startRendering?: () => void;
}

interface ChartRuntimeGlobal {
    Chart?: unknown;
    _chartjsInstances?: unknown[];
}

interface ChartRenderSessionStartDependencies {
    chartGlobal: ChartRuntimeGlobal;
    doc: Document;
    getGlobalChartActions(): ChartLifecycleActions | null;
    isLoadingStateSuppressed(): boolean;
    notify: NotifyErrorFunction;
    now(): number;
    safeCompleteRendering(success: boolean): void;
    setState: SetStateFunction;
    updateState: UpdateStateFunction;
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
 * @returns Session timing when chart rendering can continue.
 */
export async function beginChartRenderSession(
    dependencies: ChartRenderSessionStartDependencies,
    input: ChartRenderSessionStartInput
): Promise<ChartRenderSessionStartResult> {
    touchStringTargetContainer(dependencies.doc, input.targetContainer);

    startChartRendering({
        getGlobalChartActions: dependencies.getGlobalChartActions,
        isLoadingStateSuppressed: dependencies.isLoadingStateSuppressed,
        setState: dependencies.setState,
    });

    await dependencies.waitIfRapidRender();

    const performanceStart = dependencies.now();

    if (!dependencies.chartGlobal._chartjsInstances) {
        dependencies.chartGlobal._chartjsInstances = [];
    }

    clearExistingCharts({
        chartGlobal: dependencies.chartGlobal,
        getGlobalChartActions: dependencies.getGlobalChartActions,
        updateState: dependencies.updateState,
    });

    if (isChartLibraryUnavailable(dependencies.chartGlobal)) {
        const error = "Chart.js library is not loaded or not available";
        console.error(`[ChartJS] ${error}`);
        await dependencies.notify("Chart library not available", "error");
        dependencies.safeCompleteRendering(false);
        return { ready: false };
    }

    return { performanceStart, ready: true };
}
