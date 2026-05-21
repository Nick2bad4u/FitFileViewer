import { isRecord } from "./renderChartModuleHelpers.js";
function hasDebouncedRender(value) {
    return (isRecord(value) &&
        typeof value["debouncedRender"] === "function");
}
function hasChartAction(value) {
    return (isRecord(value) &&
        (typeof value["clearCharts"] === "function" ||
            typeof value["completeRendering"] === "function" ||
            typeof value["startRendering"] === "function"));
}
function hasUpdatePanelVisibility(value) {
    return (isRecord(value) &&
        typeof value["updatePanelVisibility"] === "function");
}
/**
 * Returns the renderer global through the local chart-runtime boundary.
 */
export function getMutableChartRuntimeGlobal() {
    return globalThis;
}
/**
 * Ensures Vitest/jsdom environments expose the process.nextTick shape expected
 * by renderer dependencies without spreading untyped global casts through the renderer.
 */
export function ensureProcessNextTick() {
    const chartGlobal = getMutableChartRuntimeGlobal();
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
    return Boolean(getMutableChartRuntimeGlobal().__FFV_suppressLoadingState);
}
/**
 * Reads the chart debug flag from the renderer global.
 */
export function isChartDebugEnabled() {
    return Boolean(getMutableChartRuntimeGlobal().__FFV_debugCharts);
}
/**
 * Returns the global chart state manager when it exposes debounced rendering.
 */
export function getDebouncedChartStateManager() {
    const chartGlobal = getMutableChartRuntimeGlobal();
    return hasDebouncedRender(chartGlobal.chartStateManager)
        ? chartGlobal.chartStateManager
        : null;
}
/**
 * Returns globally exposed chart actions when the legacy bridge is available.
 */
export function getGlobalChartActions() {
    const chartGlobal = getMutableChartRuntimeGlobal();
    return hasChartAction(chartGlobal.chartActions)
        ? chartGlobal.chartActions
        : null;
}
/**
 * Exposes chart actions for legacy event paths that still resolve them through globalThis.
 */
export function setGlobalChartActions(actions) {
    const chartGlobal = getMutableChartRuntimeGlobal();
    chartGlobal.chartActions = actions;
}
/**
 * Returns a globally exposed UI state manager when it can update panel visibility.
 */
export function getGlobalPanelVisibilityManager() {
    const chartGlobal = getMutableChartRuntimeGlobal();
    return hasUpdatePanelVisibility(chartGlobal.uiStateManager)
        ? chartGlobal.uiStateManager
        : null;
}
/**
 * Returns Chart.js instances from either the renderer global or window mirror.
 */
export function getGlobalChartInstances(fallbackInstances) {
    const chartGlobal = getMutableChartRuntimeGlobal();
    const windowValue = chartGlobal.window;
    const windowInstances = isRecord(windowValue)
        ? windowValue["_chartjsInstances"]
        : undefined;
    const instances = chartGlobal._chartjsInstances ?? windowInstances ?? fallbackInstances;
    return Array.isArray(instances) ? instances : [];
}
/**
 * Calls the optional AppActions chart-render completion hook.
 */
export function notifyChartRenderComplete(appActions, chartCount) {
    if (!isRecord(appActions)) {
        return;
    }
    const notifier = appActions["notifyChartRenderComplete"];
    if (typeof notifier === "function") {
        notifier(chartCount);
    }
}
