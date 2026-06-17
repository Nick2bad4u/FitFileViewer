export type GetCurrentSettingsTimer = ReturnType<typeof globalThis.setTimeout>;

export interface GetCurrentSettingsRuntimeScope {
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface GetCurrentSettingsRuntime {
    readonly clearTimeout: (timer: GetCurrentSettingsTimer) => void;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => GetCurrentSettingsTimer;
}

const defaultGetCurrentSettingsRuntimeScope: GetCurrentSettingsRuntimeScope = {
    getClearTimeout: () => globalThis.clearTimeout,
    getSetTimeout: () => globalThis.setTimeout,
};

export function getGetCurrentSettingsRuntime(
    scope: GetCurrentSettingsRuntimeScope = defaultGetCurrentSettingsRuntimeScope
): GetCurrentSettingsRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "getCurrentSettingsRuntime requires clearTimeout"
                );
            }

            clearTimeoutRef(timer);
        },
        setTimeout(callback, delayMs): GetCurrentSettingsTimer {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "getCurrentSettingsRuntime requires setTimeout"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
