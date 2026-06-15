export type NetworkUtilsFetchInput = Parameters<typeof globalThis.fetch>[0];
export type NetworkUtilsFetchInit = Parameters<typeof globalThis.fetch>[1];
export type NetworkUtilsTimerHandle = ReturnType<typeof globalThis.setTimeout>;

export interface NetworkUtilsRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly fetch?: typeof globalThis.fetch | undefined;
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getFetch?: (() => typeof globalThis.fetch | undefined) | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
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
    getAbortController: () => globalThis.AbortController,
    getClearTimeout: () => globalThis.clearTimeout,
    getFetch: () => globalThis.fetch,
    getSetTimeout: () => globalThis.setTimeout,
};

function getScopeAbortController(
    scope: NetworkUtilsRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.() ?? scope.AbortController;
}

function getScopeClearTimeout(
    scope: NetworkUtilsRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.() ?? scope.clearTimeout;
}

function getScopeFetch(
    scope: NetworkUtilsRuntimeScope
): typeof globalThis.fetch | undefined {
    return scope.getFetch?.() ?? scope.fetch;
}

function getScopeSetTimeout(
    scope: NetworkUtilsRuntimeScope
): typeof globalThis.setTimeout | undefined {
    return scope.getSetTimeout?.() ?? scope.setTimeout;
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
        fetch(
            input: NetworkUtilsFetchInput,
            init?: NetworkUtilsFetchInit
        ): Promise<Response> {
            const fetchRef = getScopeFetch(scope);
            if (typeof fetchRef !== "function") {
                throw new TypeError("networkUtils requires fetch");
            }

            return fetchRef(input, init);
        },
        setTimeout(callback: () => void, delay: number): NetworkUtilsTimerHandle {
            const setTimeoutRef = getScopeSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError("networkUtils requires setTimeout");
            }

            return setTimeoutRef(callback, delay);
        },
    };
}
