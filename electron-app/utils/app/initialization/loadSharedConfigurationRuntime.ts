import {
    type BrowserClearTimeout,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserClearTimeout,
    getBrowserLocation,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type SharedConfigurationLocation = Pick<Location, "search">;
export type LoadSharedConfigurationTimerHandle = BrowserTimerHandle | number;

export interface LoadSharedConfigurationRuntime {
    readonly locationSearch: string;
    readonly clearTimeout: (handle: LoadSharedConfigurationTimerHandle) => void;
    readonly setTimeout: (
        callback: () => void,
        timeout: number
    ) => LoadSharedConfigurationTimerHandle;
}

type LoadSharedConfigurationClearTimeout = (
    handle: LoadSharedConfigurationTimerHandle
) => ReturnType<BrowserClearTimeout>;
type LoadSharedConfigurationSetTimeout = (
    callback: () => void,
    timeout: number
) => ReturnType<BrowserSetTimeout> | number;

export interface LoadSharedConfigurationRuntimeScope {
    readonly getClearTimeout: LoadSharedConfigurationRuntimeProvider<LoadSharedConfigurationClearTimeout>;
    readonly getLocation: LoadSharedConfigurationRuntimeProvider<SharedConfigurationLocation>;
    readonly getSetTimeout: LoadSharedConfigurationRuntimeProvider<LoadSharedConfigurationSetTimeout>;
}

const defaultLoadSharedConfigurationRuntimeScope: LoadSharedConfigurationRuntimeScope =
    {
        getClearTimeout: getBrowserClearTimeout,
        getLocation: getBrowserLocation,
        getSetTimeout: getBrowserSetTimeout,
    };

type LoadSharedConfigurationRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

function getRequiredProvider<T>(
    provider: LoadSharedConfigurationRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `loadSharedConfigurationRuntime requires ${providerName} provider`
        );
    }

    return provider;
}

export function getLoadSharedConfigurationRuntime(
    scope: LoadSharedConfigurationRuntimeScope = defaultLoadSharedConfigurationRuntimeScope
): LoadSharedConfigurationRuntime {
    const getClearTimeout = getRequiredProvider(
        scope.getClearTimeout,
        "clearTimeout"
    );
    const getLocation = getRequiredProvider(scope.getLocation, "location");
    const getSetTimeout = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    );

    return {
        clearTimeout(handle): void {
            const clearTimeoutRef = getClearTimeout();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "loadSharedConfigurationRuntime requires clearTimeout"
                );
            }

            clearTimeoutRef(handle);
        },
        locationSearch: getLocation()?.search ?? "",
        setTimeout(callback, timeout): LoadSharedConfigurationTimerHandle {
            const setTimeoutRef = getSetTimeout();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "loadSharedConfigurationRuntime requires setTimeout"
                );
            }

            return setTimeoutRef(callback, timeout);
        },
    };
}
