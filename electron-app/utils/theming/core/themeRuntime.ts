export type ThemeRuntimeTimer = ReturnType<typeof globalThis.setTimeout>;

export interface ThemeRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getGlobalEventTarget?: (() => EventTarget | undefined) | undefined;
    readonly getMatchMedia?:
        | (() => typeof globalThis.matchMedia | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface ThemeRuntime {
    readonly clearTimeout: (timer: ThemeRuntimeTimer) => void;
    readonly createAbortController: () => AbortController;
    readonly getGlobalEventTarget: () => EventTarget | null;
    readonly getSystemThemeMediaQuery: () => MediaQueryList | null;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => ThemeRuntimeTimer;
}

const browserGlobal = globalThis as Partial<
    Pick<typeof globalThis, "matchMedia">
>;

function isEventTarget(candidate: unknown): candidate is EventTarget {
    return (
        candidate !== null &&
        typeof candidate === "object" &&
        "addEventListener" in candidate &&
        typeof candidate.addEventListener === "function" &&
        "removeEventListener" in candidate &&
        typeof candidate.removeEventListener === "function"
    );
}

function getDefaultEventTarget(): EventTarget | undefined {
    return isEventTarget(globalThis) ? globalThis : undefined;
}

function getDefaultMatchMedia(): typeof globalThis.matchMedia | undefined {
    const matchMedia = browserGlobal.matchMedia;
    if (typeof matchMedia !== "function") {
        return undefined;
    }

    return (query) => matchMedia.call(browserGlobal, query);
}

const defaultThemeRuntimeScope: ThemeRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getClearTimeout: () => globalThis.clearTimeout,
    getGlobalEventTarget: getDefaultEventTarget,
    getMatchMedia: getDefaultMatchMedia,
    getSetTimeout: () => globalThis.setTimeout,
};

function getScopeAbortController(
    scope: ThemeRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.();
}

function getScopeClearTimeout(
    scope: ThemeRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getScopeGlobalEventTarget(
    scope: ThemeRuntimeScope
): EventTarget | undefined {
    return scope.getGlobalEventTarget?.();
}

function getScopeMatchMedia(
    scope: ThemeRuntimeScope
): typeof globalThis.matchMedia | undefined {
    return scope.getMatchMedia?.();
}

function getScopeSetTimeout(
    scope: ThemeRuntimeScope
): typeof globalThis.setTimeout | undefined {
    return scope.getSetTimeout?.();
}

export function getThemeRuntime(
    scope: ThemeRuntimeScope = defaultThemeRuntimeScope
): ThemeRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = getScopeClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "theme core requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef.call(scope, timer);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getScopeAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "theme core requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getGlobalEventTarget(): EventTarget | null {
            return getScopeGlobalEventTarget(scope) ?? null;
        },
        getSystemThemeMediaQuery(): MediaQueryList | null {
            const matchMedia = getScopeMatchMedia(scope);
            if (typeof matchMedia === "function") {
                return matchMedia.call(scope, "(prefers-color-scheme: dark)");
            }

            return null;
        },
        setTimeout(callback, delayMs): ThemeRuntimeTimer {
            const setTimeoutRef = getScopeSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError("theme core requires a setTimeout runtime");
            }

            return setTimeoutRef.call(scope, callback, delayMs);
        },
    };
}
