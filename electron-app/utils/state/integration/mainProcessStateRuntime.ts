import {
    type BrowserClearTimeout,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserClearTimeout,
    getBrowserDateNow,
    getBrowserPerformance,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

type MainProcessPerformanceRuntime = {
    readonly now?: (() => number) | undefined;
};

type MainProcessStateRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface MainProcessStateRuntimeScope {
    readonly getClearTimeout: MainProcessStateRuntimeProvider<BrowserClearTimeout>;
    readonly getDateNow: MainProcessStateRuntimeProvider<() => number>;
    readonly getPerformance: MainProcessStateRuntimeProvider<MainProcessPerformanceRuntime>;
    readonly getSetTimeout: MainProcessStateRuntimeProvider<BrowserSetTimeout>;
}

export type MainProcessStateTimer = BrowserTimerHandle;

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

function getRequiredProvider<T>(
    provider: MainProcessStateRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `mainProcessStateRuntime requires ${providerName} provider`
        );
    }

    return provider;
}

function getRequiredDateNow(scope: MainProcessStateRuntimeScope): () => number {
    const dateNow = getRequiredProvider(scope.getDateNow, "dateNow")();
    if (typeof dateNow === "function") {
        return dateNow;
    }

    throw new TypeError("mainProcessStateRuntime requires a date clock");
}

function getRequiredMonotonicNow(
    scope: MainProcessStateRuntimeScope
): () => number {
    const performance = getRequiredProvider(
        scope.getPerformance,
        "performance"
    )();
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
            const clearTimeoutRef = getRequiredProvider(
                scope.getClearTimeout,
                "clearTimeout"
            )();
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
            const setTimeoutRef = getRequiredProvider(
                scope.getSetTimeout,
                "setTimeout"
            )();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mainProcessStateRuntime requires setTimeout"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
