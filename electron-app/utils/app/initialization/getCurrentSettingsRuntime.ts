export type GetCurrentSettingsTimer = ReturnType<typeof globalThis.setTimeout>;

export interface GetCurrentSettingsRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface GetCurrentSettingsRuntime {
    clearTimeout(timer: GetCurrentSettingsTimer): void;
    setTimeout(callback: () => void, delayMs: number): GetCurrentSettingsTimer;
}

export function getGetCurrentSettingsRuntime(
    scope: GetCurrentSettingsRuntimeScope = globalThis
): GetCurrentSettingsRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(timer);
        },
        setTimeout(callback, delayMs): GetCurrentSettingsTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
