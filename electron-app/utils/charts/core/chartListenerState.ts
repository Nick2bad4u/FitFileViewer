import { getChartListenerStateRuntime } from "./chartListenerStateRuntime.js";

let chartRequestListenerController: AbortController | null = null;
let chartRequestListenerRegistered = false;
const chartListenerStateRuntime = getChartListenerStateRuntime();
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

export function registerChartRequestListenerController(): AbortSignal {
    chartRequestListenerController?.abort();
    chartRequestListenerController =
        chartListenerStateRuntime.createAbortController();
    chartRequestListenerRegistered = true;

    return chartRequestListenerController.signal;
}

export function registerSharedConfigurationListenerController(): AbortSignal {
    sharedConfigurationListenerController?.abort();
    sharedConfigurationListenerController =
        chartListenerStateRuntime.createAbortController();
    sharedConfigurationListenerRegistered = true;

    return sharedConfigurationListenerController.signal;
}

export function resetChartListenerStateForTests(): void {
    chartRequestListenerController?.abort();
    chartRequestListenerController = null;
    chartRequestListenerRegistered = false;
    abortSharedConfigurationListener();
}
