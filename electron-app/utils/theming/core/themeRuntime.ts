export type ThemeRuntimeTimer = ReturnType<typeof globalThis.setTimeout>;

type ThemeWindowTarget = EventTarget & Pick<Window, "matchMedia">;

export interface ThemeRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getMatchMedia?:
        | (() => typeof globalThis.matchMedia | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
    readonly getWindow?: (() => ThemeWindowTarget | undefined) | undefined;
    readonly matchMedia?: typeof globalThis.matchMedia | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
    readonly window?: ThemeWindowTarget | undefined;
}

export interface ThemeRuntime {
    clearTimeout(timer: ThemeRuntimeTimer): void;
    createAbortController(): AbortController;
    getSystemThemeMediaQuery(): MediaQueryList | null;
    getWindowEventTarget(): EventTarget | null;
    setTimeout(callback: () => void, delayMs: number): ThemeRuntimeTimer;
}

const defaultThemeRuntimeScope: ThemeRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getClearTimeout: () => globalThis.clearTimeout,
    getMatchMedia: () => globalThis.matchMedia,
    getSetTimeout: () => globalThis.setTimeout,
    getWindow: () => globalThis.window,
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

function getScopeWindow(
    scope: ThemeRuntimeScope
): ThemeWindowTarget | undefined {
    return scope.getWindow?.() ?? scope.window;
}

export function getThemeRuntime(
    scope: ThemeRuntimeScope = defaultThemeRuntimeScope
): ThemeRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = getScopeClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError("theme core requires a clearTimeout runtime");
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

            const windowTarget = getScopeWindow(scope);
            const windowMatchMedia = windowTarget?.matchMedia;

            return typeof windowMatchMedia === "function"
                ? windowMatchMedia.call(
                      windowTarget,
                      "(prefers-color-scheme: dark)"
                  )
                : null;
        },
        getWindowEventTarget(): EventTarget | null {
            return getScopeWindow(scope) ?? null;
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
