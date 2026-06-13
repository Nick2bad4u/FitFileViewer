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

export function getThemeRuntime(
    scope: ThemeRuntimeScope = globalThis
): ThemeRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
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
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
