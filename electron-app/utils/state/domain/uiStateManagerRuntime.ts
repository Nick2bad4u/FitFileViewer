export interface UIStateWindowStateSnapshot extends Record<string, unknown> {
    readonly height: number;
    readonly maximized: boolean;
    readonly width: number;
    readonly x: number;
    readonly y: number;
}

type WindowEventTarget = Pick<Window, "addEventListener" | "matchMedia"> &
    Partial<
        Pick<
            Window,
            | "innerHeight"
            | "innerWidth"
            | "outerHeight"
            | "outerWidth"
            | "screenX"
            | "screenY"
        >
    > & {
        readonly screen?: Pick<Screen, "availHeight" | "availWidth">;
    };

export interface UIStateManagerRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly matchMedia?: typeof globalThis.matchMedia | undefined;
    readonly window?: WindowEventTarget | undefined;
}

export interface UIStateManagerRuntime {
    addWindowEventListener: <K extends keyof WindowEventMap>(
        type: K,
        listener: (event: WindowEventMap[K]) => void,
        options?: AddEventListenerOptions
    ) => void;
    createAbortController: () => AbortController;
    getSystemThemeMediaQuery: () => MediaQueryList | null;
    getWindowState: () => UIStateWindowStateSnapshot | null;
    hasWindow: () => boolean;
}

const defaultUIStateManagerRuntimeScope: UIStateManagerRuntimeScope =
    globalThis;

export function getUIStateManagerRuntime(
    scope: UIStateManagerRuntimeScope = defaultUIStateManagerRuntimeScope
): UIStateManagerRuntime {
    return {
        addWindowEventListener(type, listener, options): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- This scoped runtime forwards caller-owned listener options, including AbortSignal cleanup.
            scope.window?.addEventListener(
                type,
                listener as EventListener,
                options
            );
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "UI state manager requires an AbortController runtime"
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
        getWindowState(): UIStateWindowStateSnapshot | null {
            const windowTarget = scope.window;
            const availableScreen = windowTarget?.screen;
            if (windowTarget === undefined || availableScreen === undefined) {
                return null;
            }

            const {
                innerHeight = 0,
                innerWidth = 0,
                outerHeight = 0,
                outerWidth = 0,
                screenX = 0,
                screenY = 0,
            } = windowTarget;

            return {
                height: innerHeight,
                maximized:
                    outerWidth === availableScreen.availWidth &&
                    outerHeight === availableScreen.availHeight,
                width: innerWidth,
                x: screenX,
                y: screenY,
            };
        },
        hasWindow(): boolean {
            return scope.window !== undefined;
        },
    };
}
