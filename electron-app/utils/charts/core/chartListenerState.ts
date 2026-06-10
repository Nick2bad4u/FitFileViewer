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

export function registerChartRequestListenerController(): AbortSignal {
    chartRequestListenerController?.abort();
    chartRequestListenerController = new AbortController();
    chartRequestListenerRegistered = true;

    return chartRequestListenerController.signal;
}

export function registerSharedConfigurationListenerController(): AbortSignal {
    sharedConfigurationListenerController?.abort();
    sharedConfigurationListenerController = new AbortController();
    sharedConfigurationListenerRegistered = true;

    return sharedConfigurationListenerController.signal;
}

export function resetChartListenerStateForTests(): void {
    chartRequestListenerController?.abort();
    chartRequestListenerController = null;
    chartRequestListenerRegistered = false;
    abortSharedConfigurationListener();
}
