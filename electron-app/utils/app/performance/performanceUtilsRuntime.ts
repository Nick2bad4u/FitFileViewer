import {
    getBrowserCancelIdleCallback,
    getBrowserClearTimeout,
    getBrowserDateNow,
    getBrowserRequestIdleCallback,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type PerformanceUtilsTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;
export type PerformanceUtilsIdleCallbackHandle = PerformanceUtilsTimerHandle;

type PerformanceUtilsCancelIdleCallback = (handle: number) => void;
type PerformanceUtilsClearTimeout = typeof globalThis.clearTimeout;
type PerformanceUtilsDateNow = () => number;
type PerformanceUtilsRequestIdleCallback = (
    callback: () => void,
    options?: Readonly<IdleRequestOptions>
) => number;
type PerformanceUtilsSetTimeout = (
    callback: () => void,
    timeout?: number
) => PerformanceUtilsTimerHandle;

export interface PerformanceUtilsRuntimeScope {
    readonly getCancelIdleCallback?:
        | (() => PerformanceUtilsCancelIdleCallback | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => PerformanceUtilsClearTimeout | undefined)
        | undefined;
    readonly getDateNow?:
        | (() => PerformanceUtilsDateNow | undefined)
        | undefined;
    readonly getRequestIdleCallback?:
        | (() => PerformanceUtilsRequestIdleCallback | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => PerformanceUtilsSetTimeout | undefined)
        | undefined;
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

export function getPerformanceUtilsRuntime(
    scope: PerformanceUtilsRuntimeScope = getDefaultPerformanceUtilsRuntimeScope()
): PerformanceUtilsRuntime {
    return {
        cancelIdleCallback(handle): void {
            const cancelIdleCallback = scope.getCancelIdleCallback?.();
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
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError("performanceUtils requires clearTimeout");
            }

            clearTimeoutRef(handle);
        },
        now(): number {
            const dateNow = scope.getDateNow?.();
            if (typeof dateNow !== "function") {
                throw new TypeError("performanceUtils requires dateNow");
            }

            return dateNow();
        },
        requestIdleCallback(
            callback,
            options
        ): PerformanceUtilsIdleCallbackHandle {
            const requestIdleCallback = scope.getRequestIdleCallback?.();
            if (typeof requestIdleCallback === "function") {
                return requestIdleCallback(callback, options);
            }

            return this.setTimeout(callback, options?.timeout ?? 1);
        },
        setTimeout(callback, timeout): PerformanceUtilsTimerHandle {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError("performanceUtils requires setTimeout");
            }

            return setTimeoutRef(callback, timeout);
        },
    };
}
