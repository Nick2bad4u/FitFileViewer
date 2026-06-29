import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserSetTimeout,
} from "../utils/runtime/browserRuntime.js";

export type RendererApplicationStartupTimerHandle = BrowserTimerHandle;

export interface RendererApplicationStartupRuntimeScope {
    readonly getAbortController: RendererApplicationStartupRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getClearTimeout: RendererApplicationStartupRuntimeProvider<BrowserClearTimeout>;
    readonly getSetTimeout: RendererApplicationStartupRuntimeProvider<BrowserSetTimeout>;
}

type RendererApplicationStartupRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface RendererApplicationStartupRuntime {
    clearTimeout: (handle: RendererApplicationStartupTimerHandle) => void;
    createAbortController: () => AbortController;
    setTimeout: (
        callback: () => void,
        delay: number
    ) => RendererApplicationStartupTimerHandle;
}

const defaultRendererApplicationStartupRuntimeScope: RendererApplicationStartupRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getClearTimeout: getBrowserClearTimeout,
        getSetTimeout: getBrowserSetTimeout,
    };

export function getRendererApplicationStartupRuntime(
    scope: RendererApplicationStartupRuntimeScope = defaultRendererApplicationStartupRuntimeScope
): RendererApplicationStartupRuntime {
    const getAbortController = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    );
    const getClearTimeout = getRequiredProvider(
        scope.getClearTimeout,
        "clearTimeout"
    );
    const getSetTimeout = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    );

    return {
        clearTimeout(handle: RendererApplicationStartupTimerHandle): void {
            const clearTimeoutRef = getClearTimeout();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "renderer application startup requires clearTimeout"
                );
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerRef = getAbortController();
            if (typeof AbortControllerRef !== "function") {
                throw new TypeError(
                    "renderer application startup requires an AbortController"
                );
            }

            return new AbortControllerRef();
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): RendererApplicationStartupTimerHandle {
            const setTimeoutRef = getSetTimeout();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "renderer application startup requires setTimeout"
                );
            }

            return setTimeoutRef(callback, delay);
        },
    };
}

function getRequiredProvider<T>(
    provider: RendererApplicationStartupRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `renderer application startup requires ${article} ${providerName} provider`
        );
    }

    return provider;
}
