export type QuickColorSwitcherTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

export interface QuickColorSwitcherRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
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
    createAbortController(): AbortController;
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
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "quickColorSwitcher requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        setTimeout(callback, timeout): QuickColorSwitcherTimerHandle {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, timeout);
        },
    };
}
