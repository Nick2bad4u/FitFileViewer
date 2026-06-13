export type SetupThemeTimer = ReturnType<typeof globalThis.setTimeout>;

export interface SetupThemeRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface SetupThemeRuntime {
    clearTimeout(timer: SetupThemeTimer): void;
    setTimeout(callback: () => void, delayMs: number): SetupThemeTimer;
}

export function getSetupThemeRuntime(
    scope: SetupThemeRuntimeScope = globalThis
): SetupThemeRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(timer);
        },
        setTimeout(callback, delayMs): SetupThemeTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
