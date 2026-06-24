import {
    getChartListenerStateRuntime,
    type ChartListenerStateRuntime,
} from "./chartListenerStateRuntime.js";

let chartRequestListenerController: AbortController | null = null;
let chartRequestListenerRegistered = false;
let sharedConfigurationListenerController: AbortController | null = null;
let sharedConfigurationListenerRegistered = false;

export function abortSharedConfigurationListener(): void {
    sharedConfigurationListenerController?.abort();
    sharedConfigurationListenerController = null;
    sharedConfigurationListenerRegistered = false;
}

export function isChartRequestListenerRegistered(): boolean {
    return chartRequestListenerRegistered;
}

export function isSharedConfigurationListenerRegistered(): boolean {
    return sharedConfigurationListenerRegistered;
}

export function registerChartRequestListenerController(
    runtime: ChartListenerStateRuntime = getChartListenerStateRuntime()
): AbortSignal {
    chartRequestListenerController?.abort();
    chartRequestListenerController = runtime.createAbortController();
    chartRequestListenerRegistered = true;

    return chartRequestListenerController.signal;
}

export function registerSharedConfigurationListenerController(
    runtime: ChartListenerStateRuntime = getChartListenerStateRuntime()
): AbortSignal {
    sharedConfigurationListenerController?.abort();
    sharedConfigurationListenerController = runtime.createAbortController();
    sharedConfigurationListenerRegistered = true;

    return sharedConfigurationListenerController.signal;
}

export function resetChartListenerStateForTests(): void {
    chartRequestListenerController?.abort();
    chartRequestListenerController = null;
    chartRequestListenerRegistered = false;
    abortSharedConfigurationListener();
}
