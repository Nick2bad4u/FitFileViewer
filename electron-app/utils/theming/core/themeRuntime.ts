export type ThemeRuntimeTimer = ReturnType<typeof globalThis.setTimeout>;

type ThemeWindowTarget = EventTarget & Pick<Window, "matchMedia">;

export interface ThemeRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
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

const defaultThemeRuntimeScope: ThemeRuntimeScope = globalThis;

export function getThemeRuntime(
    scope: ThemeRuntimeScope = defaultThemeRuntimeScope
): ThemeRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError("theme core requires a clearTimeout runtime");
            }

            clearTimeoutRef(timer);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "theme core requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getSystemThemeMediaQuery(): MediaQueryList | null {
            const matchMedia =
                scope.matchMedia ??
                (scope.window === undefined ? undefined : scope.window.matchMedia);

            return typeof matchMedia === "function"
                ? matchMedia("(prefers-color-scheme: dark)")
                : null;
        },
        getWindowEventTarget(): EventTarget | null {
            return scope.window ?? null;
        },
        setTimeout(callback, delayMs): ThemeRuntimeTimer {
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError("theme core requires a setTimeout runtime");
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
