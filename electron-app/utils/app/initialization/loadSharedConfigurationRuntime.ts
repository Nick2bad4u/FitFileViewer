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

export function getLoadSharedConfigurationRuntime(
    scope: LoadSharedConfigurationRuntimeScope = globalThis
): LoadSharedConfigurationRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(handle);
        },
        locationSearch: scope.location?.search ?? "",
        setTimeout(callback, timeout): LoadSharedConfigurationTimerHandle {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, timeout);
        },
    };
}
