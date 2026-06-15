export type StateIntegrationInterval = ReturnType<
    typeof globalThis.setInterval
>;
export type StateIntegrationTimeout = ReturnType<typeof globalThis.setTimeout>;

export type StateIntegrationPerformanceMemory = {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
};

export interface StateIntegrationRuntimeScope {
    readonly clearInterval?: typeof globalThis.clearInterval | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly dateNow?: (() => number) | undefined;
    readonly localStorage?: Storage | undefined;
    readonly performance?:
        | (Performance & {
              readonly memory?:
                  | StateIntegrationPerformanceMemory
                  | undefined;
          })
        | undefined;
    readonly setInterval?: typeof globalThis.setInterval | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface StateIntegrationRuntime {
    clearInterval(interval: StateIntegrationInterval): void;
    clearTimeout(timeout: StateIntegrationTimeout): void;
    dateNow(): number;
    getPerformanceMemory(): StateIntegrationPerformanceMemory | undefined;
    getStorage(): Storage | undefined;
    setInterval(callback: () => void, delayMs: number): StateIntegrationInterval;
    setTimeout(callback: () => void, delayMs: number): StateIntegrationTimeout;
}

export function getStateIntegrationRuntime(
    scope: StateIntegrationRuntimeScope = globalThis
): StateIntegrationRuntime {
    return {
        clearInterval(interval): void {
            const clearIntervalRef =
                scope.clearInterval ?? globalThis.clearInterval;
            clearIntervalRef(interval);
        },
        clearTimeout(timeout): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(timeout);
        },
        dateNow(): number {
            return scope.dateNow?.() ?? Date.now();
        },
        getPerformanceMemory(): StateIntegrationPerformanceMemory | undefined {
            return scope.performance?.memory;
        },
        getStorage(): Storage | undefined {
            return scope.localStorage;
        },
        setInterval(callback, delayMs): StateIntegrationInterval {
            const setIntervalRef =
                scope.setInterval ?? globalThis.setInterval;
            return setIntervalRef(callback, delayMs);
        },
        setTimeout(callback, delayMs): StateIntegrationTimeout {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
