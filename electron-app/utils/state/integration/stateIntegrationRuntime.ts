import {
    type BrowserClearInterval,
    type BrowserClearTimeout,
    type BrowserIntervalHandle,
    type BrowserSetInterval,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserClearInterval,
    getBrowserClearTimeout,
    getBrowserDateNow,
    getBrowserLocalStorage,
    getBrowserPerformance,
    getBrowserSetInterval,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type StateIntegrationInterval = BrowserIntervalHandle;
export type StateIntegrationTimeout = BrowserTimerHandle;

export type StateIntegrationPerformanceMemory = {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
};

type StateIntegrationPerformance = Performance & {
    readonly memory?: StateIntegrationPerformanceMemory | undefined;
};

export interface StateIntegrationRuntimeScope {
    readonly getClearInterval?:
        | (() => BrowserClearInterval | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getLocalStorage?: (() => Storage | undefined) | undefined;
    readonly getPerformance?:
        | (() => StateIntegrationPerformance | undefined)
        | undefined;
    readonly getSetInterval?:
        | (() => BrowserSetInterval | undefined)
        | undefined;
    readonly getSetTimeout?: (() => BrowserSetTimeout | undefined) | undefined;
}

export interface StateIntegrationRuntime {
    clearInterval: (interval: StateIntegrationInterval) => void;
    clearTimeout: (timeout: StateIntegrationTimeout) => void;
    dateNow: () => number;
    getPerformanceMemory: () => StateIntegrationPerformanceMemory | undefined;
    getStorage: () => Storage | undefined;
    setInterval: (
        callback: () => void,
        delayMs: number
    ) => StateIntegrationInterval;
    setTimeout: (
        callback: () => void,
        delayMs: number
    ) => StateIntegrationTimeout;
}

const defaultStateIntegrationRuntimeScope: StateIntegrationRuntimeScope = {
    getClearInterval: getBrowserClearInterval,
    getClearTimeout: getBrowserClearTimeout,
    getDateNow: getBrowserDateNow,
    getLocalStorage: getBrowserLocalStorage,
    getPerformance: getBrowserPerformance,
    getSetInterval: getBrowserSetInterval,
    getSetTimeout: getBrowserSetTimeout,
};

function getRequiredDateNow(scope: StateIntegrationRuntimeScope): () => number {
    const dateNowRef = scope.getDateNow?.();
    if (typeof dateNowRef !== "function") {
        throw new TypeError("stateIntegrationRuntime requires dateNow");
    }

    return dateNowRef;
}

function getRequiredClearInterval(
    scope: StateIntegrationRuntimeScope
): BrowserClearInterval {
    const clearIntervalRef = scope.getClearInterval?.();
    if (typeof clearIntervalRef !== "function") {
        throw new TypeError("stateIntegrationRuntime requires clearInterval");
    }

    return clearIntervalRef;
}

function getRequiredClearTimeout(
    scope: StateIntegrationRuntimeScope
): BrowserClearTimeout {
    const clearTimeoutRef = scope.getClearTimeout?.();
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError("stateIntegrationRuntime requires clearTimeout");
    }

    return clearTimeoutRef;
}

function getRequiredSetInterval(
    scope: StateIntegrationRuntimeScope
): BrowserSetInterval {
    const setIntervalRef = scope.getSetInterval?.();
    if (typeof setIntervalRef !== "function") {
        throw new TypeError("stateIntegrationRuntime requires setInterval");
    }

    return setIntervalRef;
}

function getRequiredSetTimeout(
    scope: StateIntegrationRuntimeScope
): BrowserSetTimeout {
    const setTimeoutRef = scope.getSetTimeout?.();
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
            return scope.getPerformance?.()?.memory;
        },
        getStorage(): Storage | undefined {
            return scope.getLocalStorage?.();
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
