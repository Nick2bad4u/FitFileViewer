import { isObjectRecord } from "./renderChartModuleHelpers.js";
import { getRegisteredChartInstances } from "./chartInstanceRegistry.js";
import { getRegisteredChartActions } from "./chartActionsRegistry.js";
import { getRegisteredChartStateManager } from "./chartStateManagerRegistry.js";
import {
    getRenderChartRuntimeHelpersRuntime,
    type ProcessShim,
    type RenderChartRuntimeHelpersRuntime,
} from "./renderChartRuntimeHelpersRuntime.js";

type UnknownFunction = (...args: unknown[]) => unknown;
type ChartRenderCompleteNotifier = (chartCount: number) => unknown;

interface DebouncedChartStateManager {
    debouncedRender(reason: string): void;
}

interface ChartActionsBridge {
    clearCharts?: () => void;
    completeRendering?: (
        success: boolean,
        chartCount?: number,
        renderTime?: number
    ) => void;
    startRendering?: () => void;
}

let loadingStateSuppressed = false;

function hasDebouncedRender(
    value: unknown
): value is DebouncedChartStateManager {
    return (
        isObjectRecord(value) && typeof value["debouncedRender"] === "function"
    );
}

function hasChartAction(value: unknown): value is ChartActionsBridge {
    return (
        isObjectRecord(value) &&
        (typeof value["clearCharts"] === "function" ||
            typeof value["completeRendering"] === "function" ||
            typeof value["startRendering"] === "function")
    );
}

function isChartRenderCompleteNotifier(
    value: unknown
): value is ChartRenderCompleteNotifier {
    return typeof value === "function";
}

/**
 * Ensures Vitest/jsdom environments expose the process.nextTick shape expected
 * by renderer dependencies without spreading untyped global casts through the
 * renderer.
 */
export function ensureProcessNextTick(
    runtime: RenderChartRuntimeHelpersRuntime = getRenderChartRuntimeHelpersRuntime()
): void {
    const processShim: ProcessShim = runtime.ensureProcessShim();

    if (typeof processShim.nextTick === "function") {
        return;
    }

    processShim.nextTick = (
        callback: UnknownFunction,
        ...args: unknown[]
    ): void => {
        void Promise.resolve().then(() => {
            callback(...args);
            return undefined;
        });
    };
}

/**
 * Reads NODE_ENV defensively for browser-like renderer test environments.
 */
export function isNodeEnv(
    expected: string,
    runtime: RenderChartRuntimeHelpersRuntime = getRenderChartRuntimeHelpersRuntime()
): boolean {
    return runtime.getProcessEnvironmentValue("NODE_ENV") === expected;
}

/**
 * Returns true when development-only chart diagnostics should run.
 */
export function isDevelopmentEnvironment(
    runtime: RenderChartRuntimeHelpersRuntime = getRenderChartRuntimeHelpersRuntime()
): boolean {
    return isNodeEnv("development", runtime);
}

/**
 * Returns true when the current runtime is the test harness.
 */
export function isTestEnvironment(
    runtime: RenderChartRuntimeHelpersRuntime = getRenderChartRuntimeHelpersRuntime()
): boolean {
    return isNodeEnv("test", runtime);
}

/**
 * Reads the background-render loading suppression flag.
 */
export function isLoadingStateSuppressed(): boolean {
    return loadingStateSuppressed;
}

/**
 * Sets the background-render loading suppression flag.
 */
export function setLoadingStateSuppressed(value: boolean): void {
    loadingStateSuppressed = value;
}

/**
 * Returns the registered chart state manager when it exposes debounced
 * rendering.
 */
export function getDebouncedChartStateManager(): DebouncedChartStateManager | null {
    const chartStateManager = getRegisteredChartStateManager();
    return hasDebouncedRender(chartStateManager) ? chartStateManager : null;
}

/** Returns registered chart actions for render lifecycle helpers. */
export function getChartLifecycleActions(): ChartActionsBridge | null {
    const chartActions = getRegisteredChartActions();
    return hasChartAction(chartActions) ? chartActions : null;
}

/**
 * Returns registered Chart.js instances, falling back to caller-provided
 * values.
 */
export function getGlobalChartInstances(fallbackInstances: unknown): unknown[] {
    const instances = getRegisteredChartInstances();
    if (instances.length > 0) {
        return instances;
    }

    return Array.isArray(fallbackInstances) ? fallbackInstances : [];
}

/**
 * Calls the optional AppActions chart-render completion hook.
 */
export function notifyChartRenderComplete(
    appActions: unknown,
    chartCount: number
): void {
    if (!isObjectRecord(appActions)) {
        return;
    }

    const notifier = appActions["notifyChartRenderComplete"];
    if (isChartRenderCompleteNotifier(notifier)) {
        notifier(chartCount);
    }
}
