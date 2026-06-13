export interface MainProcessStateRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly dateNow?: (() => number) | undefined;
    readonly performance?:
        | {
              readonly now?: (() => number) | undefined;
          }
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export type MainProcessStateTimer = ReturnType<typeof globalThis.setTimeout>;

export interface MainProcessStateRuntime {
    clearTimeout: (handle: MainProcessStateTimer) => void;
    monotonicNowMs: () => number;
    setTimeout: (
        callback: () => void,
        delayMs: number
    ) => MainProcessStateTimer;
}

export function getMainProcessStateRuntime(
    scope: MainProcessStateRuntimeScope = globalThis
): MainProcessStateRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(handle);
        },
        monotonicNowMs(): number {
            return scope.performance?.now?.() ?? scope.dateNow?.() ?? Date.now();
        },
        setTimeout(callback, delayMs): MainProcessStateTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
