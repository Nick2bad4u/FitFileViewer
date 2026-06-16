export type ThemeRuntimeTimer = ReturnType<typeof globalThis.setTimeout>;

export interface ThemeRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly eventTarget?: EventTarget | undefined;
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getEventTarget?: (() => EventTarget | undefined) | undefined;
    readonly getMatchMedia?:
        | (() => typeof globalThis.matchMedia | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
    readonly matchMedia?: typeof globalThis.matchMedia | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface ThemeRuntime {
    clearTimeout(timer: ThemeRuntimeTimer): void;
    createAbortController(): AbortController;
    getSystemThemeMediaQuery(): MediaQueryList | null;
    getWindowEventTarget(): EventTarget | null;
    setTimeout(callback: () => void, delayMs: number): ThemeRuntimeTimer;
}

const browserGlobal = globalThis as typeof globalThis &
    Partial<EventTarget> & {
        readonly matchMedia?: typeof globalThis.matchMedia | undefined;
    };

function getDefaultEventTarget(): EventTarget | undefined {
    return typeof browserGlobal.addEventListener === "function" &&
        typeof browserGlobal.removeEventListener === "function"
        ? browserGlobal
        : undefined;
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
    getEventTarget: getDefaultEventTarget,
    getMatchMedia: getDefaultMatchMedia,
    getSetTimeout: () => globalThis.setTimeout,
};

function getScopeAbortController(
    scope: ThemeRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.() ?? scope.AbortController;
}

function getScopeClearTimeout(
    scope: ThemeRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.() ?? scope.clearTimeout;
}

function getScopeEventTarget(
    scope: ThemeRuntimeScope
): EventTarget | undefined {
    return scope.getEventTarget?.() ?? scope.eventTarget;
}

function getScopeMatchMedia(
    scope: ThemeRuntimeScope
): typeof globalThis.matchMedia | undefined {
    return scope.getMatchMedia?.() ?? scope.matchMedia;
}

function getScopeSetTimeout(
    scope: ThemeRuntimeScope
): typeof globalThis.setTimeout | undefined {
    return scope.getSetTimeout?.() ?? scope.setTimeout;
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
        getSystemThemeMediaQuery(): MediaQueryList | null {
            const matchMedia = getScopeMatchMedia(scope);
            if (typeof matchMedia === "function") {
                return matchMedia.call(scope, "(prefers-color-scheme: dark)");
            }

            return null;
        },
        getWindowEventTarget(): EventTarget | null {
            return getScopeEventTarget(scope) ?? null;
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
