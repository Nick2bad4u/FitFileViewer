type WindowEventTarget = Pick<Window, "addEventListener" | "matchMedia">;

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
    hasWindow: () => boolean;
}

export function getUIStateManagerRuntime(
    scope: UIStateManagerRuntimeScope = globalThis
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
        hasWindow(): boolean {
            return scope.window !== undefined;
        },
    };
}
