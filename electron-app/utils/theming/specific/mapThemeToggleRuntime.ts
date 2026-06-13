export type MapThemeToggleTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

export interface MapThemeToggleRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?:
        | ((
              callback: () => void,
              timeout: number
          ) => MapThemeToggleTimerHandle)
        | undefined;
}

export interface MapThemeToggleRuntime {
    clearTimeout(handle: MapThemeToggleTimerHandle): void;
    setTimeout(
        callback: () => void,
        timeout: number
    ): MapThemeToggleTimerHandle;
}

export function getMapThemeToggleRuntime(
    scope: MapThemeToggleRuntimeScope = globalThis
): MapThemeToggleRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(handle);
        },
        setTimeout(callback, timeout): MapThemeToggleTimerHandle {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, timeout);
        },
    };
}
