import {
    type BrowserClearTimeout,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserCancelIdleCallback,
    getBrowserClearTimeout,
    getBrowserDateNow,
    getBrowserRequestIdleCallback,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type PerformanceUtilsTimerHandle = BrowserTimerHandle | number;
export type PerformanceUtilsIdleCallbackHandle = PerformanceUtilsTimerHandle;

type PerformanceUtilsCancelIdleCallback = (handle: number) => void;
type PerformanceUtilsClearTimeout = BrowserClearTimeout;
type PerformanceUtilsDateNow = () => number;
type PerformanceUtilsRequestIdleCallback = (
    callback: () => void,
    options?: Readonly<IdleRequestOptions>
) => number;
type PerformanceUtilsRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface PerformanceUtilsRuntimeScope {
    readonly getCancelIdleCallback: PerformanceUtilsRuntimeProvider<PerformanceUtilsCancelIdleCallback>;
    readonly getClearTimeout: PerformanceUtilsRuntimeProvider<PerformanceUtilsClearTimeout>;
    readonly getDateNow: PerformanceUtilsRuntimeProvider<PerformanceUtilsDateNow>;
    readonly getRequestIdleCallback: PerformanceUtilsRuntimeProvider<PerformanceUtilsRequestIdleCallback>;
    readonly getSetTimeout: PerformanceUtilsRuntimeProvider<BrowserSetTimeout>;
}

export interface PerformanceUtilsRuntime {
    readonly cancelIdleCallback: (
        handle: PerformanceUtilsIdleCallbackHandle
    ) => void;
    readonly clearTimeout: (handle: PerformanceUtilsTimerHandle) => void;
    readonly now: () => number;
    readonly requestIdleCallback: (
        callback: () => void,
        options?: Readonly<IdleRequestOptions>
    ) => PerformanceUtilsIdleCallbackHandle;
    readonly setTimeout: (
        callback: () => void,
        timeout: number
    ) => PerformanceUtilsTimerHandle;
}

function getDefaultPerformanceUtilsRuntimeScope(): PerformanceUtilsRuntimeScope {
    return {
        getCancelIdleCallback: getBrowserCancelIdleCallback,
        getClearTimeout: getBrowserClearTimeout,
        getDateNow: getBrowserDateNow,
        getRequestIdleCallback: getBrowserRequestIdleCallback,
        getSetTimeout: getBrowserSetTimeout,
    };
}

function getRequiredProvider<T>(
    provider: PerformanceUtilsRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `performanceUtils requires ${providerName} provider`
        );
    }

    return provider;
}

export function getPerformanceUtilsRuntime(
    scope: PerformanceUtilsRuntimeScope = getDefaultPerformanceUtilsRuntimeScope()
): PerformanceUtilsRuntime {
    const getCancelIdleCallback = getRequiredProvider(
        scope.getCancelIdleCallback,
        "cancelIdleCallback"
    );
    const getClearTimeout = getRequiredProvider(
        scope.getClearTimeout,
        "clearTimeout"
    );
    const getDateNow = getRequiredProvider(scope.getDateNow, "dateNow");
    const getRequestIdleCallback = getRequiredProvider(
        scope.getRequestIdleCallback,
        "requestIdleCallback"
    );
    const getSetTimeout = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    );

    return {
        cancelIdleCallback(handle): void {
            const cancelIdleCallback = getCancelIdleCallback();
            if (
                typeof handle === "number" &&
                typeof cancelIdleCallback === "function"
            ) {
                cancelIdleCallback(handle);
                return;
            }

            this.clearTimeout(handle);
        },
        clearTimeout(handle): void {
            const clearTimeoutRef = getClearTimeout();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError("performanceUtils requires clearTimeout");
            }

            clearTimeoutRef(handle);
        },
        now(): number {
            const dateNow = getDateNow();
            if (typeof dateNow !== "function") {
                throw new TypeError("performanceUtils requires dateNow");
            }

            return dateNow();
        },
        requestIdleCallback(
            callback,
            options
        ): PerformanceUtilsIdleCallbackHandle {
            const requestIdleCallback = getRequestIdleCallback();
            if (typeof requestIdleCallback === "function") {
                return requestIdleCallback(callback, options);
            }

            return this.setTimeout(callback, options?.timeout ?? 1);
        },
        setTimeout(callback, timeout): PerformanceUtilsTimerHandle {
            const setTimeoutRef = getSetTimeout();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError("performanceUtils requires setTimeout");
            }

            return setTimeoutRef(callback, timeout);
        },
    };
}
