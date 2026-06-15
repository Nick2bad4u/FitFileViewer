export type StateIntegrationInterval = ReturnType<
    typeof globalThis.setInterval
>;
export type StateIntegrationTimeout = ReturnType<typeof globalThis.setTimeout>;

export type StateIntegrationPerformanceMemory = {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
};

type StateIntegrationPerformance = Performance & {
    readonly memory?: StateIntegrationPerformanceMemory | undefined;
};

export interface StateIntegrationRuntimeScope {
    readonly clearInterval?: typeof globalThis.clearInterval | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly dateNow?: (() => number) | undefined;
    readonly getClearInterval?:
        | (() => typeof globalThis.clearInterval | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getLocalStorage?: (() => Storage | undefined) | undefined;
    readonly getPerformance?:
        | (() => StateIntegrationPerformance | undefined)
        | undefined;
    readonly getSetInterval?:
        | (() => typeof globalThis.setInterval | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
    readonly localStorage?: Storage | undefined;
    readonly performance?: StateIntegrationPerformance | undefined;
    readonly setInterval?: typeof globalThis.setInterval | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface StateIntegrationRuntime {
    clearInterval(interval: StateIntegrationInterval): void;
    clearTimeout(timeout: StateIntegrationTimeout): void;
    dateNow(): number;
    getPerformanceMemory(): StateIntegrationPerformanceMemory | undefined;
    getStorage(): Storage | undefined;
    setInterval(
        callback: () => void,
        delayMs: number
    ): StateIntegrationInterval;
    setTimeout(callback: () => void, delayMs: number): StateIntegrationTimeout;
}

const defaultStateIntegrationRuntimeScope: StateIntegrationRuntimeScope = {
    getClearInterval: () => globalThis.clearInterval,
    getClearTimeout: () => globalThis.clearTimeout,
    dateNow: Date.now,
    getLocalStorage: () => globalThis.localStorage,
    getPerformance: () => globalThis.performance,
    getSetInterval: () => globalThis.setInterval,
    getSetTimeout: () => globalThis.setTimeout,
};

function getRequiredDateNow(scope: StateIntegrationRuntimeScope): () => number {
    const dateNowRef = scope.dateNow;
    if (typeof dateNowRef !== "function") {
        throw new TypeError("stateIntegrationRuntime requires dateNow");
    }

    return dateNowRef;
}

function getRequiredClearInterval(
    scope: StateIntegrationRuntimeScope
): typeof globalThis.clearInterval {
    const clearIntervalRef = scope.getClearInterval?.() ?? scope.clearInterval;
    if (typeof clearIntervalRef !== "function") {
        throw new TypeError("stateIntegrationRuntime requires clearInterval");
    }

    return clearIntervalRef;
}

function getRequiredClearTimeout(
    scope: StateIntegrationRuntimeScope
): typeof globalThis.clearTimeout {
    const clearTimeoutRef = scope.getClearTimeout?.() ?? scope.clearTimeout;
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError("stateIntegrationRuntime requires clearTimeout");
    }

    return clearTimeoutRef;
}

function getRequiredSetInterval(
    scope: StateIntegrationRuntimeScope
): typeof globalThis.setInterval {
    const setIntervalRef = scope.getSetInterval?.() ?? scope.setInterval;
    if (typeof setIntervalRef !== "function") {
        throw new TypeError("stateIntegrationRuntime requires setInterval");
    }

    return setIntervalRef;
}

function getRequiredSetTimeout(
    scope: StateIntegrationRuntimeScope
): typeof globalThis.setTimeout {
    const setTimeoutRef = scope.getSetTimeout?.() ?? scope.setTimeout;
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
            return (scope.getPerformance?.() ?? scope.performance)?.memory;
        },
        getStorage(): Storage | undefined {
            return scope.getLocalStorage?.() ?? scope.localStorage;
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
