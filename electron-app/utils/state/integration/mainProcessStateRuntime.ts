import {
    getBrowserClearTimeout,
    getBrowserDateNow,
    getBrowserPerformance,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

type MainProcessPerformanceRuntime = {
    readonly now?: (() => number) | undefined;
};

export interface MainProcessStateRuntimeScope {
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getPerformance?:
        | (() => MainProcessPerformanceRuntime | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export type MainProcessStateTimer = ReturnType<typeof globalThis.setTimeout>;

export interface MainProcessStateRuntime {
    clearTimeout: (handle: MainProcessStateTimer) => void;
    dateNow: () => number;
    monotonicNowMs: () => number;
    setTimeout: (
        callback: () => void,
        delayMs: number
    ) => MainProcessStateTimer;
}

const defaultMainProcessStateRuntimeScope: MainProcessStateRuntimeScope = {
    getClearTimeout: getBrowserClearTimeout,
    getDateNow: getBrowserDateNow,
    getPerformance: getBrowserPerformance,
    getSetTimeout: getBrowserSetTimeout,
};

function getRequiredDateNow(scope: MainProcessStateRuntimeScope): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow === "function") {
        return dateNow;
    }

    throw new TypeError("mainProcessStateRuntime requires a date clock");
}

function getRequiredMonotonicNow(
    scope: MainProcessStateRuntimeScope
): () => number {
    const performance = scope.getPerformance?.();
    const performanceNow = performance?.now;
    if (typeof performanceNow === "function") {
        return performanceNow.bind(performance);
    }

    return getRequiredDateNow(scope);
}

export function getMainProcessStateRuntime(
    scope: MainProcessStateRuntimeScope = defaultMainProcessStateRuntimeScope
): MainProcessStateRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mainProcessStateRuntime requires clearTimeout"
                );
            }

            clearTimeoutRef(handle);
        },
        dateNow(): number {
            return getRequiredDateNow(scope)();
        },
        monotonicNowMs(): number {
            return getRequiredMonotonicNow(scope)();
        },
        setTimeout(callback, delayMs): MainProcessStateTimer {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mainProcessStateRuntime requires setTimeout"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
