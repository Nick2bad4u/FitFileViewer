export type SharedConfigurationLocation = Pick<Location, "search">;
export type LoadSharedConfigurationTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

export interface LoadSharedConfigurationRuntime {
    clearTimeout(handle: LoadSharedConfigurationTimerHandle): void;
    readonly locationSearch: string;
    setTimeout(
        callback: () => void,
        timeout: number
    ): LoadSharedConfigurationTimerHandle;
}

export interface LoadSharedConfigurationRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly location?: SharedConfigurationLocation | undefined;
    readonly setTimeout?:
        | ((
              callback: () => void,
              timeout: number
          ) => LoadSharedConfigurationTimerHandle)
        | undefined;
}

const defaultLoadSharedConfigurationRuntimeScope: LoadSharedConfigurationRuntimeScope =
    globalThis;

export function getLoadSharedConfigurationRuntime(
    scope: LoadSharedConfigurationRuntimeScope = defaultLoadSharedConfigurationRuntimeScope
): LoadSharedConfigurationRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "loadSharedConfigurationRuntime requires clearTimeout"
                );
            }

            clearTimeoutRef(handle);
        },
        locationSearch: scope.location?.search ?? "",
        setTimeout(callback, timeout): LoadSharedConfigurationTimerHandle {
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "loadSharedConfigurationRuntime requires setTimeout"
                );
            }

            return setTimeoutRef(callback, timeout);
        },
    };
}
