export type ThemeRuntimeTimer = ReturnType<typeof globalThis.setTimeout>;

export interface ThemeRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface ThemeRuntime {
    clearTimeout(timer: ThemeRuntimeTimer): void;
    setTimeout(callback: () => void, delayMs: number): ThemeRuntimeTimer;
}

export function getThemeRuntime(
    scope: ThemeRuntimeScope = globalThis
): ThemeRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(timer);
        },
        setTimeout(callback, delayMs): ThemeRuntimeTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
