import { getBrowserAbortController } from "../runtime/browserRuntime.js";

export type NetworkUtilsFetchInput = Readonly<
    Parameters<typeof globalThis.fetch>[0]
>;
export type NetworkUtilsFetchInit =
    | Readonly<NonNullable<Parameters<typeof globalThis.fetch>[1]>>
    | undefined;
export type NetworkUtilsTimerHandle = ReturnType<typeof globalThis.setTimeout>;

export interface NetworkUtilsRuntimeScope {
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
    getClearTimeout: () => globalThis.clearTimeout,
    getFetch: () => globalThis.fetch,
    getSetTimeout: () => globalThis.setTimeout,
};

function getScopeAbortController(
    scope: NetworkUtilsRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.();
}

function getScopeClearTimeout(
    scope: NetworkUtilsRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getScopeFetch(
    scope: NetworkUtilsRuntimeScope
): typeof globalThis.fetch | undefined {
    return scope.getFetch?.();
}

function getScopeSetTimeout(
    scope: NetworkUtilsRuntimeScope
): typeof globalThis.setTimeout | undefined {
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
