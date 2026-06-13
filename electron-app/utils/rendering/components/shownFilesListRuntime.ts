export type ShownFilesListTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

export interface ShownFilesListRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?:
        | ((
              callback: () => void,
              timeout: number
          ) => ShownFilesListTimerHandle)
        | undefined;
}

export interface ShownFilesListRuntime {
    clearTimeout(handle: ShownFilesListTimerHandle): void;
    setTimeout(
        callback: () => void,
        timeout: number
    ): ShownFilesListTimerHandle;
}

export function getShownFilesListRuntime(
    scope: ShownFilesListRuntimeScope = globalThis
): ShownFilesListRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(handle);
        },
        setTimeout(callback, timeout): ShownFilesListTimerHandle {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, timeout);
        },
    };
}
