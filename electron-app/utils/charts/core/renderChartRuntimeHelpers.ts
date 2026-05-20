type UnknownFunction = (...args: unknown[]) => unknown;

interface ProcessShim {
    env?: NodeJS.ProcessEnv;
    nextTick?: unknown;
}

interface RenderChartRuntimeGlobal {
    __FFV_debugCharts?: unknown;
    __FFV_suppressLoadingState?: unknown;
    chartStateManager?: unknown;
    process?: ProcessShim;
    chartActions?: unknown;
    uiStateManager?: unknown;
    window?: unknown;
    _chartjsInstances?: unknown;
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

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object";
}

function hasDebouncedRender(
    value: unknown
): value is DebouncedChartStateManager {
    return (
        isRecord(value) &&
        typeof value["debouncedRender"] === "function"
    );
}

function hasChartAction(value: unknown): value is ChartActionsBridge {
    return (
        isRecord(value) &&
        (typeof value["clearCharts"] === "function" ||
            typeof value["completeRendering"] === "function" ||
            typeof value["startRendering"] === "function")
    );
}

function hasUpdatePanelVisibility(
    value: unknown
): value is PanelVisibilityBridge {
    return (
        isRecord(value) &&
        typeof value["updatePanelVisibility"] === "function"
    );
}

/**
 * Ensures Vitest/jsdom environments expose the process.nextTick shape expected
 * by renderer dependencies without spreading untyped global casts through the renderer.
 */
export function ensureProcessNextTick(): void {
    const chartGlobal = globalThis as RenderChartRuntimeGlobal;
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
        });
    };
}

/**
 * Reads NODE_ENV defensively for browser-like renderer test environments.
 */
export function isNodeEnv(expected: string): boolean {
    return (
        typeof process !== "undefined" &&
        process.env["NODE_ENV"] === expected
    );
}

/**
 * Returns true when development-only chart diagnostics should run.
 */
export function isDevelopmentEnvironment(): boolean {
    return isNodeEnv("development");
}

/**
 * Returns true when the current runtime is the test harness.
 */
export function isTestEnvironment(): boolean {
    return isNodeEnv("test");
}

/**
 * Reads the background-render loading suppression flag from the renderer global.
 */
export function isLoadingStateSuppressed(): boolean {
    return Boolean(
        (globalThis as RenderChartRuntimeGlobal).__FFV_suppressLoadingState
    );
}

/**
 * Reads the chart debug flag from the renderer global.
 */
export function isChartDebugEnabled(): boolean {
    return Boolean((globalThis as RenderChartRuntimeGlobal).__FFV_debugCharts);
}

/**
 * Returns the global chart state manager when it exposes debounced rendering.
 */
export function getDebouncedChartStateManager(): DebouncedChartStateManager | null {
    const chartGlobal = globalThis as RenderChartRuntimeGlobal;
    return hasDebouncedRender(chartGlobal.chartStateManager)
        ? chartGlobal.chartStateManager
        : null;
}

/**
 * Returns globally exposed chart actions when the legacy bridge is available.
 */
export function getGlobalChartActions(): ChartActionsBridge | null {
    const chartGlobal = globalThis as RenderChartRuntimeGlobal;
    return hasChartAction(chartGlobal.chartActions)
        ? chartGlobal.chartActions
        : null;
}

/**
 * Exposes chart actions for legacy event paths that still resolve them through globalThis.
 */
export function setGlobalChartActions(actions: unknown): void {
    const chartGlobal = globalThis as RenderChartRuntimeGlobal;
    chartGlobal.chartActions = actions;
}

/**
 * Returns a globally exposed UI state manager when it can update panel visibility.
 */
export function getGlobalPanelVisibilityManager(): PanelVisibilityBridge | null {
    const chartGlobal = globalThis as RenderChartRuntimeGlobal;
    return hasUpdatePanelVisibility(chartGlobal.uiStateManager)
        ? chartGlobal.uiStateManager
        : null;
}

/**
 * Returns Chart.js instances from either the renderer global or window mirror.
 */
export function getGlobalChartInstances(fallbackInstances: unknown): unknown[] {
    const chartGlobal = globalThis as RenderChartRuntimeGlobal;
    const windowValue = chartGlobal.window;
    const windowInstances = isRecord(windowValue)
        ? windowValue["_chartjsInstances"]
        : undefined;
    const instances =
        chartGlobal._chartjsInstances ?? windowInstances ?? fallbackInstances;

    return Array.isArray(instances) ? instances : [];
}

/**
 * Calls the optional AppActions chart-render completion hook.
 */
export function notifyChartRenderComplete(
    appActions: unknown,
    chartCount: number
): void {
    if (!isRecord(appActions)) {
        return;
    }

    const notifier = appActions["notifyChartRenderComplete"];
    if (typeof notifier === "function") {
        notifier(chartCount);
    }
}
