export type SetupThemeTimer = ReturnType<typeof globalThis.setTimeout>;

export interface SetupThemeRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface SetupThemeRuntime {
    clearTimeout(timer: SetupThemeTimer): void;
    setTimeout(callback: () => void, delayMs: number): SetupThemeTimer;
}

const defaultSetupThemeRuntimeScope: SetupThemeRuntimeScope = {
    getClearTimeout: () => globalThis.clearTimeout,
    getSetTimeout: () => globalThis.setTimeout,
};

function getScopeClearTimeout(
    scope: SetupThemeRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.() ?? scope.clearTimeout;
}

function getScopeSetTimeout(
    scope: SetupThemeRuntimeScope
): typeof globalThis.setTimeout | undefined {
    return scope.getSetTimeout?.() ?? scope.setTimeout;
}

export function getSetupThemeRuntime(
    scope: SetupThemeRuntimeScope = defaultSetupThemeRuntimeScope
): SetupThemeRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = getScopeClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError("setupThemeRuntime requires clearTimeout");
            }

            clearTimeoutRef(timer);
        },
        setTimeout(callback, delayMs): SetupThemeTimer {
            const setTimeoutRef = getScopeSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError("setupThemeRuntime requires setTimeout");
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
