export type NetworkUtilsFetchInput = Parameters<typeof globalThis.fetch>[0];
export type NetworkUtilsFetchInit = Parameters<typeof globalThis.fetch>[1];
export type NetworkUtilsTimerHandle = ReturnType<typeof globalThis.setTimeout>;

export interface NetworkUtilsRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly fetch?: typeof globalThis.fetch | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface NetworkUtilsRuntime {
    clearTimeout(handle: NetworkUtilsTimerHandle): void;
    createAbortController(): AbortController | undefined;
    fetch(
        input: NetworkUtilsFetchInput,
        init?: NetworkUtilsFetchInit
    ): Promise<Response>;
    setTimeout(callback: () => void, delay: number): NetworkUtilsTimerHandle;
}

const defaultNetworkUtilsRuntimeScope: NetworkUtilsRuntimeScope = {
    get AbortController() {
        return globalThis.AbortController;
    },
    get clearTimeout() {
        return globalThis.clearTimeout;
    },
    get fetch() {
        return globalThis.fetch;
    },
    get setTimeout() {
        return globalThis.setTimeout;
    },
};

export function getNetworkUtilsRuntime(
    scope: NetworkUtilsRuntimeScope = defaultNetworkUtilsRuntimeScope
): NetworkUtilsRuntime {
    return {
        clearTimeout(handle: NetworkUtilsTimerHandle): void {
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError("networkUtils requires clearTimeout");
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController | undefined {
            if (typeof scope.AbortController !== "function") {
                return undefined;
            }

            return new scope.AbortController();
        },
        fetch(
            input: NetworkUtilsFetchInput,
            init?: NetworkUtilsFetchInit
        ): Promise<Response> {
            const fetchRef = scope.fetch;
            if (typeof fetchRef !== "function") {
                throw new TypeError("networkUtils requires fetch");
            }

            return fetchRef(input, init);
        },
        setTimeout(callback: () => void, delay: number): NetworkUtilsTimerHandle {
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError("networkUtils requires setTimeout");
            }

            return setTimeoutRef(callback, delay);
        },
    };
}
