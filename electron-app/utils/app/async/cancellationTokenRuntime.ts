import {
    type BrowserClearTimeout,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserClearTimeout,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type CancellationTokenTimerHandle = BrowserTimerHandle | number;

export interface CancellationTokenRuntimeScope {
    readonly getClearTimeout: () => BrowserClearTimeout | undefined;
    readonly getSetTimeout: () => BrowserSetTimeout | undefined;
}

export interface CancellationTokenRuntime {
    readonly clearTimeout: (handle: CancellationTokenTimerHandle) => void;
    readonly setTimeout: (
        callback: () => void,
        timeout: number
    ) => CancellationTokenTimerHandle;
}

const defaultCancellationTokenRuntimeScope: CancellationTokenRuntimeScope = {
    getClearTimeout: getBrowserClearTimeout,
    getSetTimeout: getBrowserSetTimeout,
};

export function getCancellationTokenRuntime(
    scope: CancellationTokenRuntimeScope = defaultCancellationTokenRuntimeScope
): CancellationTokenRuntime {
    return {
        clearTimeout(handle): void {
            if (typeof scope.getClearTimeout !== "function") {
                throw new TypeError(
                    "cancellationTokenRuntime requires a clearTimeout provider"
                );
            }

            const clearTimeoutRef = scope.getClearTimeout();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "cancellationTokenRuntime requires clearTimeout"
                );
            }

            clearTimeoutRef(handle);
        },
        setTimeout(callback, timeout): CancellationTokenTimerHandle {
            if (typeof scope.getSetTimeout !== "function") {
                throw new TypeError(
                    "cancellationTokenRuntime requires a setTimeout provider"
                );
            }

            const setTimeoutRef = scope.getSetTimeout();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "cancellationTokenRuntime requires setTimeout"
                );
            }

            return setTimeoutRef(callback, timeout);
        },
    };
}
