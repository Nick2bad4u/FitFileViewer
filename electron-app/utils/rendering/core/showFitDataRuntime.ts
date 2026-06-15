export interface ShowFitDataRuntimeScope {
    readonly CustomEvent?: typeof globalThis.CustomEvent | undefined;
    readonly dispatchEvent?: typeof globalThis.dispatchEvent | undefined;
    readonly matchMedia?: typeof globalThis.matchMedia | undefined;
    readonly queueMicrotask?: typeof globalThis.queueMicrotask | undefined;
    readonly scrollTo?: typeof globalThis.scrollTo | undefined;
}

export interface ShowFitDataRuntime {
    canScrollTo: () => boolean;
    createCustomEvent: <T>(
        type: string,
        eventInitDict?: CustomEventInit<T>
    ) => CustomEvent<T>;
    dispatchEvent: (event: Event) => boolean;
    prefersReducedMotion: () => boolean;
    queueMicrotask: (callback: () => void) => void;
    scrollTo: (options: ScrollToOptions) => void;
}

function getCustomEventConstructor(
    scope: ShowFitDataRuntimeScope
): typeof CustomEvent {
    const CustomEventConstructor = scope.CustomEvent;
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError("showFitData requires a CustomEvent runtime");
    }

    return CustomEventConstructor;
}

function getDispatchEvent(
    scope: ShowFitDataRuntimeScope
): typeof globalThis.dispatchEvent {
    const dispatchEvent = scope.dispatchEvent;
    if (typeof dispatchEvent !== "function") {
        throw new TypeError("showFitData requires a dispatchEvent runtime");
    }

    return dispatchEvent;
}

const defaultShowFitDataRuntimeScope: ShowFitDataRuntimeScope = globalThis;

export function getShowFitDataRuntime(
    scope: ShowFitDataRuntimeScope = defaultShowFitDataRuntimeScope
): ShowFitDataRuntime {
    return {
        canScrollTo(): boolean {
            return typeof scope.scrollTo === "function";
        },

        createCustomEvent<T>(
            type: string,
            eventInitDict?: CustomEventInit<T>
        ): CustomEvent<T> {
            return new (getCustomEventConstructor(scope))<T>(
                type,
                eventInitDict
            );
        },

        dispatchEvent(event: Event): boolean {
            return getDispatchEvent(scope)(event);
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
