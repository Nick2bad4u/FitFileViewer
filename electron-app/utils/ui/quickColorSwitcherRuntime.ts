export type QuickColorSwitcherTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

export interface QuickColorSwitcherRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?:
        | ((
              callback: () => void,
              timeout: number
          ) => QuickColorSwitcherTimerHandle)
        | undefined;
}

export interface QuickColorSwitcherRuntime {
    clearTimeout(handle: QuickColorSwitcherTimerHandle): void;
    setTimeout(
        callback: () => void,
        timeout: number
    ): QuickColorSwitcherTimerHandle;
}

export function getQuickColorSwitcherRuntime(
    scope: QuickColorSwitcherRuntimeScope = globalThis
): QuickColorSwitcherRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(handle);
        },
        setTimeout(callback, timeout): QuickColorSwitcherTimerHandle {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, timeout);
        },
    };
}
