import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserFetch,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserFetch,
    getBrowserSetTimeout,
} from "../runtime/browserRuntime.js";

export type NetworkUtilsFetchInput = Readonly<Parameters<BrowserFetch>[0]>;
export type NetworkUtilsFetchInit =
    | Readonly<NonNullable<Parameters<BrowserFetch>[1]>>
    | undefined;
export type NetworkUtilsTimerHandle = BrowserTimerHandle;

export interface NetworkUtilsRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getFetch?: (() => BrowserFetch | undefined) | undefined;
    readonly getSetTimeout?:
        | (() => BrowserSetTimeout | undefined)
        | undefined;
}

export interface NetworkUtilsRuntime {
    clearTimeout: (handle: NetworkUtilsTimerHandle) => void;
    createAbortController: () => AbortController | undefined;
    fetch: (
        input: NetworkUtilsFetchInput,
        init?: NetworkUtilsFetchInit
    ) => Promise<Response>;
    setTimeout: (
        callback: () => void,
        delay: number
    ) => NetworkUtilsTimerHandle;
}

const defaultNetworkUtilsRuntimeScope: NetworkUtilsRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getClearTimeout: getBrowserClearTimeout,
    getFetch: getBrowserFetch,
    getSetTimeout: getBrowserSetTimeout,
};

function getScopeAbortController(
    scope: NetworkUtilsRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return scope.getAbortController?.();
}

function getScopeClearTimeout(
    scope: NetworkUtilsRuntimeScope
): BrowserClearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getScopeFetch(scope: NetworkUtilsRuntimeScope): BrowserFetch | undefined {
    return scope.getFetch?.();
}

function getScopeSetTimeout(
    scope: NetworkUtilsRuntimeScope
): BrowserSetTimeout | undefined {
    return scope.getSetTimeout?.();
}

export function getNetworkUtilsRuntime(
    scope: NetworkUtilsRuntimeScope = defaultNetworkUtilsRuntimeScope
): NetworkUtilsRuntime {
    return {
        clearTimeout(handle: NetworkUtilsTimerHandle): void {
            const clearTimeoutRef = getScopeClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError("networkUtils requires clearTimeout");
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController | undefined {
            const AbortControllerRef = getScopeAbortController(scope);
            if (typeof AbortControllerRef !== "function") {
                return undefined;
            }

            return new AbortControllerRef();
        },
        async fetch(
            input: NetworkUtilsFetchInput,
            init?: NetworkUtilsFetchInit
        ): Promise<Response> {
            const fetchRef = getScopeFetch(scope);
            if (typeof fetchRef !== "function") {
                throw new TypeError("networkUtils requires fetch");
            }

            return await fetchRef(input, init);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): NetworkUtilsTimerHandle {
            const setTimeoutRef = getScopeSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError("networkUtils requires setTimeout");
            }

            return setTimeoutRef(callback, delay);
        },
    };
}
