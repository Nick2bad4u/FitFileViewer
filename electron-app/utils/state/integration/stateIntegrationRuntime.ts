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

const defaultStateIntegrationRuntimeScope: StateIntegrationRuntimeScope = {
    get clearInterval() {
        return globalThis.clearInterval;
    },
    get clearTimeout() {
        return globalThis.clearTimeout;
    },
    dateNow: Date.now,
    get localStorage() {
        return globalThis.localStorage;
    },
    get performance() {
        return globalThis.performance;
    },
    get setInterval() {
        return globalThis.setInterval;
    },
    get setTimeout() {
        return globalThis.setTimeout;
    },
};

function getRequiredDateNow(
    scope: StateIntegrationRuntimeScope
): () => number {
    const dateNowRef = scope.dateNow;
    if (typeof dateNowRef !== "function") {
        throw new TypeError("stateIntegrationRuntime requires dateNow");
    }

    return dateNowRef;
}

function getRequiredClearInterval(
    scope: StateIntegrationRuntimeScope
): typeof globalThis.clearInterval {
    const clearIntervalRef = scope.clearInterval;
    if (typeof clearIntervalRef !== "function") {
        throw new TypeError("stateIntegrationRuntime requires clearInterval");
    }

    return clearIntervalRef;
}

function getRequiredClearTimeout(
    scope: StateIntegrationRuntimeScope
): typeof globalThis.clearTimeout {
    const clearTimeoutRef = scope.clearTimeout;
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError("stateIntegrationRuntime requires clearTimeout");
    }

    return clearTimeoutRef;
}

function getRequiredSetInterval(
    scope: StateIntegrationRuntimeScope
): typeof globalThis.setInterval {
    const setIntervalRef = scope.setInterval;
    if (typeof setIntervalRef !== "function") {
        throw new TypeError("stateIntegrationRuntime requires setInterval");
    }

    return setIntervalRef;
}

function getRequiredSetTimeout(
    scope: StateIntegrationRuntimeScope
): typeof globalThis.setTimeout {
    const setTimeoutRef = scope.setTimeout;
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError("stateIntegrationRuntime requires setTimeout");
    }

    return setTimeoutRef;
}

export function getStateIntegrationRuntime(
    scope: StateIntegrationRuntimeScope = defaultStateIntegrationRuntimeScope
): StateIntegrationRuntime {
    return {
        clearInterval(interval): void {
            const clearIntervalRef = getRequiredClearInterval(scope);
            clearIntervalRef(interval);
        },
        clearTimeout(timeout): void {
            const clearTimeoutRef = getRequiredClearTimeout(scope);
            clearTimeoutRef(timeout);
        },
        dateNow(): number {
            const dateNowRef = getRequiredDateNow(scope);
            return dateNowRef();
        },
        getPerformanceMemory(): StateIntegrationPerformanceMemory | undefined {
            return scope.performance?.memory;
        },
        getStorage(): Storage | undefined {
            return scope.localStorage;
        },
        setInterval(callback, delayMs): StateIntegrationInterval {
            const setIntervalRef = getRequiredSetInterval(scope);
            return setIntervalRef(callback, delayMs);
        },
        setTimeout(callback, delayMs): StateIntegrationTimeout {
            const setTimeoutRef = getRequiredSetTimeout(scope);
            return setTimeoutRef(callback, delayMs);
        },
    };
}
