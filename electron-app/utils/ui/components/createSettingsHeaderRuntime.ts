export type CreateSettingsHeaderTimer = ReturnType<
    typeof globalThis.setTimeout
>;

export interface CreateSettingsHeaderRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface CreateSettingsHeaderRuntime {
    clearTimeout(timer: CreateSettingsHeaderTimer | undefined): void;
    createAbortController: () => AbortController;
    setTimeout(
        callback: () => void,
        delayMs: number
    ): CreateSettingsHeaderTimer;
}

function getAbortControllerConstructor(
    scope: CreateSettingsHeaderRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createSettingsHeader requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
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
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        setTimeout(callback, delayMs): CreateSettingsHeaderTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
