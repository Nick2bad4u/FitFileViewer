type ShowFitDataScrollTo = (options: ScrollToOptions) => void;

export interface ShowFitDataRuntimeScope {
    readonly CustomEvent?: typeof globalThis.CustomEvent | undefined;
    readonly dispatchEvent?: typeof globalThis.dispatchEvent | undefined;
    readonly getCustomEvent?:
        | (() => typeof globalThis.CustomEvent | undefined)
        | undefined;
    readonly getDispatchEvent?:
        | (() => typeof globalThis.dispatchEvent | undefined)
        | undefined;
    readonly getMatchMedia?:
        | (() => typeof globalThis.matchMedia | undefined)
        | undefined;
    readonly getQueueMicrotask?:
        | (() => typeof globalThis.queueMicrotask | undefined)
        | undefined;
    readonly getScrollTo?: (() => ShowFitDataScrollTo | undefined) | undefined;
    readonly matchMedia?: typeof globalThis.matchMedia | undefined;
    readonly queueMicrotask?: typeof globalThis.queueMicrotask | undefined;
    readonly scrollTo?: ShowFitDataScrollTo | undefined;
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
    const CustomEventConstructor = scope.getCustomEvent?.() ?? scope.CustomEvent;
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError("showFitData requires a CustomEvent runtime");
    }

    return CustomEventConstructor;
}

function getDispatchEvent(
    scope: ShowFitDataRuntimeScope
): typeof globalThis.dispatchEvent {
    const dispatchEvent = scope.getDispatchEvent?.() ?? scope.dispatchEvent;
    if (typeof dispatchEvent !== "function") {
        throw new TypeError("showFitData requires a dispatchEvent runtime");
    }

    return dispatchEvent;
}

function getScopeMatchMedia(
    scope: ShowFitDataRuntimeScope
): typeof globalThis.matchMedia | undefined {
    return scope.getMatchMedia?.() ?? scope.matchMedia;
}

function getScopeQueueMicrotask(
    scope: ShowFitDataRuntimeScope
): typeof globalThis.queueMicrotask | undefined {
    return scope.getQueueMicrotask?.() ?? scope.queueMicrotask;
}

function getScopeScrollTo(
    scope: ShowFitDataRuntimeScope
): ShowFitDataScrollTo | undefined {
    return scope.getScrollTo?.() ?? scope.scrollTo;
}

const defaultShowFitDataRuntimeScope: ShowFitDataRuntimeScope = {
    getCustomEvent: () => globalThis.CustomEvent,
    getDispatchEvent: () => globalThis.dispatchEvent,
    getMatchMedia: () => globalThis.matchMedia,
    getQueueMicrotask: () => globalThis.queueMicrotask,
    getScrollTo: () => globalThis.scrollTo,
};

export function getShowFitDataRuntime(
    scope: ShowFitDataRuntimeScope = defaultShowFitDataRuntimeScope
): ShowFitDataRuntime {
    return {
        canScrollTo(): boolean {
            return typeof getScopeScrollTo(scope) === "function";
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
            return getDispatchEvent(scope).call(scope, event);
        },

        prefersReducedMotion(): boolean {
            const matchMedia = getScopeMatchMedia(scope);
            return (
                typeof matchMedia === "function" &&
                matchMedia.call(
                    scope,
                    "(prefers-reduced-motion: reduce)"
                ).matches
            );
        },

        queueMicrotask(callback: () => void): void {
            const queueMicrotask = getScopeQueueMicrotask(scope);
            if (typeof queueMicrotask === "function") {
                queueMicrotask.call(scope, callback);
                return;
            }

            void Promise.resolve().then(() => {
                callback();
            });
        },

        scrollTo(options: ScrollToOptions): void {
            getScopeScrollTo(scope)?.call(scope, options);
        },
    };
}
