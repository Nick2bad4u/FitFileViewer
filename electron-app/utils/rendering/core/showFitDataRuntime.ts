export interface ShowFitDataRuntimeScope {
    readonly matchMedia?: typeof globalThis.matchMedia | undefined;
    readonly queueMicrotask?: typeof globalThis.queueMicrotask | undefined;
    readonly scrollTo?: typeof globalThis.scrollTo | undefined;
}

export interface ShowFitDataRuntime {
    canScrollTo: () => boolean;
    prefersReducedMotion: () => boolean;
    queueMicrotask: (callback: () => void) => void;
    scrollTo: (options: ScrollToOptions) => void;
}

export function getShowFitDataRuntime(
    scope: ShowFitDataRuntimeScope = globalThis
): ShowFitDataRuntime {
    return {
        canScrollTo(): boolean {
            return typeof scope.scrollTo === "function";
        },

        prefersReducedMotion(): boolean {
            return (
                typeof scope.matchMedia === "function" &&
                scope.matchMedia("(prefers-reduced-motion: reduce)").matches
            );
        },

        queueMicrotask(callback: () => void): void {
            if (typeof scope.queueMicrotask === "function") {
                scope.queueMicrotask(callback);
                return;
            }

            void Promise.resolve().then(() => {
                callback();
            });
        },

        scrollTo(options: ScrollToOptions): void {
            scope.scrollTo?.(options);
        },
    };
}
