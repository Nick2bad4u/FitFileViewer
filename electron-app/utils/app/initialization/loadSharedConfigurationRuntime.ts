import {
    getBrowserClearTimeout,
    getBrowserLocation,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type SharedConfigurationLocation = Pick<Location, "search">;
export type LoadSharedConfigurationTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

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
) => void;
type LoadSharedConfigurationSetTimeout = (
    callback: () => void,
    timeout: number
) => LoadSharedConfigurationTimerHandle;

export interface LoadSharedConfigurationRuntimeScope {
    readonly getClearTimeout?:
        | (() => LoadSharedConfigurationClearTimeout | undefined)
        | undefined;
    readonly getLocation?:
        | (() => SharedConfigurationLocation | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => LoadSharedConfigurationSetTimeout | undefined)
        | undefined;
}

const defaultLoadSharedConfigurationRuntimeScope: LoadSharedConfigurationRuntimeScope =
    {
        getClearTimeout: getBrowserClearTimeout,
        getLocation: getBrowserLocation,
        getSetTimeout: getBrowserSetTimeout,
    };

export function getLoadSharedConfigurationRuntime(
    scope: LoadSharedConfigurationRuntimeScope = defaultLoadSharedConfigurationRuntimeScope
): LoadSharedConfigurationRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "loadSharedConfigurationRuntime requires clearTimeout"
                );
            }

            clearTimeoutRef(handle);
        },
        locationSearch: scope.getLocation?.()?.search ?? "",
        setTimeout(callback, timeout): LoadSharedConfigurationTimerHandle {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "loadSharedConfigurationRuntime requires setTimeout"
                );
            }

            return setTimeoutRef(callback, timeout);
        },
    };
}
