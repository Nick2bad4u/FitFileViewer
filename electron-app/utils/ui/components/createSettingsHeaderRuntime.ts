export type CreateSettingsHeaderTimer = ReturnType<
    typeof globalThis.setTimeout
>;

export interface CreateSettingsHeaderRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface CreateSettingsHeaderRuntime {
    clearTimeout(timer: CreateSettingsHeaderTimer | undefined): void;
    setTimeout(
        callback: () => void,
        delayMs: number
    ): CreateSettingsHeaderTimer;
}

export function getCreateSettingsHeaderRuntime(
    scope: CreateSettingsHeaderRuntimeScope = globalThis
): CreateSettingsHeaderRuntime {
    return {
        clearTimeout(timer): void {
            if (timer === undefined) {
                return;
            }
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(timer);
        },
        setTimeout(callback, delayMs): CreateSettingsHeaderTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
