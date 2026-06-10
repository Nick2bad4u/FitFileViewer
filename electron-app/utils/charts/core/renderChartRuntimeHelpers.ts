import { isObjectRecord } from "./renderChartModuleHelpers.js";
import { getRegisteredChartInstances } from "./chartInstanceRegistry.js";
import { isChartDebugLoggingEnabled } from "./chartDebugState.js";
import {
    isDevelopmentEnvironment as isDevelopmentRuntimeEnvironment,
    isNodeEnvironment,
    isTestEnvironment as isTestRuntimeEnvironment,
} from "../../runtime/processEnvironment.js";

type UnknownFunction = (...args: unknown[]) => unknown;
type ChartRenderCompleteNotifier = (chartCount: number) => unknown;

interface ProcessShim {
    env?: NodeJS.ProcessEnv;
    nextTick?: unknown;
}

interface RenderChartRuntimeGlobal {
    __chartjs_dev?: unknown;
    _fitFileViewerChartListener?: unknown;
    _fitFileViewerSharedConfigurationAbortController?: AbortController;
    _fitFileViewerSharedConfigurationListener?: unknown;
    chartStateManager?: unknown;
    process?: ProcessShim;
    chartActions?: unknown;
    chartjsPluginZoom?: unknown;
    Chart?: unknown;
    ChartZoom?: unknown;
    addHoverEffectsToExistingCharts?: unknown;
    getThemeConfig?: unknown;
    uiStateManager?: unknown;
    window?: unknown;
}

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

interface PanelVisibilityBridge {
    updatePanelVisibility(panelId: string, visible: boolean): void;
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

function hasUpdatePanelVisibility(
    value: unknown
): value is PanelVisibilityBridge {
    return (
        isObjectRecord(value) &&
        typeof value["updatePanelVisibility"] === "function"
    );
}

function isChartRenderCompleteNotifier(
    value: unknown
): value is ChartRenderCompleteNotifier {
    return typeof value === "function";
}

/**
 * Returns the renderer global through the local chart-runtime boundary.
 */
export function getMutableChartRuntimeGlobal(): RenderChartRuntimeGlobal {
    return globalThis;
}

/**
 * Ensures Vitest/jsdom environments expose the process.nextTick shape expected
 * by renderer dependencies without spreading untyped global casts through the
 * renderer.
 */
export function ensureProcessNextTick(): void {
    const chartGlobal = getMutableChartRuntimeGlobal();
    chartGlobal.process ??= {};

    if (typeof chartGlobal.process.nextTick === "function") {
        return;
    }

    chartGlobal.process.nextTick = (
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
 * Returns the global chart state manager when it exposes debounced rendering.
 */
export function getDebouncedChartStateManager(): DebouncedChartStateManager | null {
    const chartGlobal = getMutableChartRuntimeGlobal();
    return hasDebouncedRender(chartGlobal.chartStateManager)
        ? chartGlobal.chartStateManager
        : null;
}

/**
 * Returns globally exposed chart actions when the legacy bridge is available.
 */
export function getGlobalChartActions(): ChartActionsBridge | null {
    const chartGlobal = getMutableChartRuntimeGlobal();
    return hasChartAction(chartGlobal.chartActions)
        ? chartGlobal.chartActions
        : null;
}

/**
 * Exposes chart actions for legacy event paths that still resolve them through
 * globalThis.
 */
export function setGlobalChartActions(actions: unknown): void {
    const chartGlobal = getMutableChartRuntimeGlobal();
    chartGlobal.chartActions = actions;
}

/**
 * Returns a globally exposed UI state manager when it can update panel
 * visibility.
 */
export function getGlobalPanelVisibilityManager(): PanelVisibilityBridge | null {
    const chartGlobal = getMutableChartRuntimeGlobal();
    return hasUpdatePanelVisibility(chartGlobal.uiStateManager)
        ? chartGlobal.uiStateManager
        : null;
}

/**
 * Returns Chart.js instances from either the renderer global or window mirror.
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
