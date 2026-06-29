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
    readonly getAbortController: NetworkUtilsRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getClearTimeout: NetworkUtilsRuntimeProvider<BrowserClearTimeout>;
    readonly getFetch: NetworkUtilsRuntimeProvider<BrowserFetch>;
    readonly getSetTimeout: NetworkUtilsRuntimeProvider<BrowserSetTimeout>;
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

type NetworkUtilsRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultNetworkUtilsRuntimeScope: NetworkUtilsRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getClearTimeout: getBrowserClearTimeout,
    getFetch: getBrowserFetch,
    getSetTimeout: getBrowserSetTimeout,
};

export function getNetworkUtilsRuntime(
    scope: NetworkUtilsRuntimeScope = defaultNetworkUtilsRuntimeScope
): NetworkUtilsRuntime {
    const getAbortController = getRequiredProvider(
        scope.getAbortController,
        "an AbortController"
    );
    const getClearTimeout = getRequiredProvider(
        scope.getClearTimeout,
        "a clearTimeout"
    );
    const getFetch = getRequiredProvider(scope.getFetch, "a fetch");
    const getSetTimeout = getRequiredProvider(
        scope.getSetTimeout,
        "a setTimeout"
    );

    return {
        clearTimeout(handle: NetworkUtilsTimerHandle): void {
            const clearTimeoutRef = getClearTimeout();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError("networkUtils requires clearTimeout");
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController | undefined {
            const AbortControllerRef = getAbortController();
            if (typeof AbortControllerRef !== "function") {
                return undefined;
            }

            return new AbortControllerRef();
        },
        async fetch(
            input: NetworkUtilsFetchInput,
            init?: NetworkUtilsFetchInit
        ): Promise<Response> {
            const fetchRef = getFetch();
            if (typeof fetchRef !== "function") {
                throw new TypeError("networkUtils requires fetch");
            }

            return await fetchRef(input, init);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): NetworkUtilsTimerHandle {
            const setTimeoutRef = getSetTimeout();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError("networkUtils requires setTimeout");
            }

            return setTimeoutRef(callback, delay);
        },
    };
}

function getRequiredProvider<T>(
    provider: NetworkUtilsRuntimeProvider<T>,
    providerLabel: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(`networkUtils requires ${providerLabel} provider`);
    }

    return provider;
}
