import { isObjectRecord } from "./renderChartModuleHelpers.js";
import { getRegisteredChartInstances } from "./chartInstanceRegistry.js";
import { isChartDebugLoggingEnabled } from "./chartDebugState.js";
import { getRegisteredChartActions } from "./chartActionsRegistry.js";
import { getRegisteredChartStateManager } from "./chartStateManagerRegistry.js";
import {
    isDevelopmentEnvironment as isDevelopmentRuntimeEnvironment,
    isNodeEnvironment,
    isTestEnvironment as isTestRuntimeEnvironment,
} from "../../runtime/processEnvironment.js";
import {
    getRenderChartRuntimeHelpersRuntime,
    type RenderChartRuntimeEnvironment,
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
const renderChartRuntimeHelpersRuntime = getRenderChartRuntimeHelpersRuntime();

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
 * Returns the mutable environment object used for chart dependency shims.
 */
export function getMutableChartRuntimeEnvironment(): RenderChartRuntimeEnvironment {
    return renderChartRuntimeHelpersRuntime.getMutableChartRuntimeEnvironment();
}

/**
 * Ensures Vitest/jsdom environments expose the process.nextTick shape expected
 * by renderer dependencies without spreading untyped global casts through the
 * renderer.
 */
export function ensureProcessNextTick(): void {
    const chartEnvironment = getMutableChartRuntimeEnvironment();
    chartEnvironment.process ??= {};

    if (typeof chartEnvironment.process.nextTick === "function") {
        return;
    }

    chartEnvironment.process.nextTick = (
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
export function isNodeEnv(expected: string): boolean {
    return isNodeEnvironment(expected);
}

/**
 * Returns true when development-only chart diagnostics should run.
 */
export function isDevelopmentEnvironment(): boolean {
    return isDevelopmentRuntimeEnvironment();
}

/**
 * Returns true when the current runtime is the test harness.
 */
export function isTestEnvironment(): boolean {
    return isTestRuntimeEnvironment();
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
 * Reads the chart debug flag from typed renderer state.
 */
export function isChartDebugEnabled(): boolean {
    return isChartDebugLoggingEnabled();
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
