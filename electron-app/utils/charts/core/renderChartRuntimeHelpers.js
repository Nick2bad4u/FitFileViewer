function isRecord(value) {
    return value !== null && typeof value === "object";
}
function hasDebouncedRender(value) {
    return (isRecord(value) &&
        typeof value["debouncedRender"] === "function");
}
/**
 * Ensures Vitest/jsdom environments expose the process.nextTick shape expected
 * by renderer dependencies without spreading untyped global casts through the renderer.
 */
export function ensureProcessNextTick() {
    const chartGlobal = globalThis;
    chartGlobal.process ??= {};
    if (typeof chartGlobal.process.nextTick === "function") {
        return;
    }
    chartGlobal.process.nextTick = (callback, ...args) => {
        void Promise.resolve().then(() => {
            callback(...args);
        });
    };
}
/**
 * Reads NODE_ENV defensively for browser-like renderer test environments.
 */
export function isNodeEnv(expected) {
    return (typeof process !== "undefined" &&
        process.env["NODE_ENV"] === expected);
}
/**
 * Returns true when development-only chart diagnostics should run.
 */
export function isDevelopmentEnvironment() {
    return isNodeEnv("development");
}
/**
 * Returns true when the current runtime is the test harness.
 */
export function isTestEnvironment() {
    return isNodeEnv("test");
}
/**
 * Reads the background-render loading suppression flag from the renderer global.
 */
export function isLoadingStateSuppressed() {
    return Boolean(globalThis.__FFV_suppressLoadingState);
}
/**
 * Reads the chart debug flag from the renderer global.
 */
export function isChartDebugEnabled() {
    return Boolean(globalThis.__FFV_debugCharts);
}
/**
 * Returns the global chart state manager when it exposes debounced rendering.
 */
export function getDebouncedChartStateManager() {
    const chartGlobal = globalThis;
    return hasDebouncedRender(chartGlobal.chartStateManager)
        ? chartGlobal.chartStateManager
        : null;
}
