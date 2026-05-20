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
}

interface DebouncedChartStateManager {
    debouncedRender(reason: string): void;
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
