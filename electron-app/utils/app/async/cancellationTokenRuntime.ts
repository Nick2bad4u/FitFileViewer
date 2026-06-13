export type CancellationTokenTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

export interface CancellationTokenRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?:
        | ((
              callback: () => void,
              timeout: number
          ) => CancellationTokenTimerHandle)
        | undefined;
}

export interface CancellationTokenRuntime {
    clearTimeout(handle: CancellationTokenTimerHandle): void;
    setTimeout(
        callback: () => void,
        timeout: number
    ): CancellationTokenTimerHandle;
}

export function getCancellationTokenRuntime(
    scope: CancellationTokenRuntimeScope = globalThis
): CancellationTokenRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(handle);
        },
        setTimeout(callback, timeout): CancellationTokenTimerHandle {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, timeout);
        },
    };
}
