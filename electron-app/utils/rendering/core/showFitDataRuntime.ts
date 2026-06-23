type ShowFitDataScrollTo = (options: Readonly<ScrollToOptions>) => void;
type ShowFitDataDocument = Pick<Document, "querySelector">;

export interface ShowFitDataRuntimeScope {
    readonly getCustomEvent?:
        | (() => typeof globalThis.CustomEvent | undefined)
        | undefined;
    readonly getDocument?: (() => ShowFitDataDocument | undefined) | undefined;
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
}

export interface ShowFitDataRuntime {
    canScrollTo: () => boolean;
    createCustomEvent: <T>(
        type: string,
        eventInitDict?: Readonly<CustomEventInit<T>>
    ) => CustomEvent<T>;
    dispatchEvent: (event: Readonly<Event>) => boolean;
    hasRenderedMapContainer: () => boolean;
    prefersReducedMotion: () => boolean;
    queueMicrotask: (callback: () => void) => void;
    scrollTo: (options: Readonly<ScrollToOptions>) => void;
}

async function runAfterPromiseMicrotask(callback: () => void): Promise<void> {
    await Promise.resolve();
    callback();
}

function getCustomEventConstructor(
    scope: ShowFitDataRuntimeScope
): typeof CustomEvent {
    const CustomEventConstructor = scope.getCustomEvent?.();
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError("showFitData requires a CustomEvent runtime");
    }

    return CustomEventConstructor;
}

function getDispatchEvent(
    scope: ShowFitDataRuntimeScope
): typeof globalThis.dispatchEvent {
    const dispatchEvent = scope.getDispatchEvent?.();
    if (typeof dispatchEvent !== "function") {
        throw new TypeError("showFitData requires a dispatchEvent runtime");
    }

    return dispatchEvent;
}

function getScopeDocument(
    scope: ShowFitDataRuntimeScope
): ShowFitDataDocument | undefined {
    return scope.getDocument?.();
}

function getScopeMatchMedia(
    scope: ShowFitDataRuntimeScope
): typeof globalThis.matchMedia | undefined {
    return scope.getMatchMedia?.();
}

function getScopeQueueMicrotask(
    scope: ShowFitDataRuntimeScope
): typeof globalThis.queueMicrotask | undefined {
    return scope.getQueueMicrotask?.();
}

function getScopeScrollTo(
    scope: ShowFitDataRuntimeScope
): ShowFitDataScrollTo | undefined {
    return scope.getScrollTo?.();
}

const defaultShowFitDataRuntimeScope: ShowFitDataRuntimeScope = {
    getCustomEvent: () => globalThis.CustomEvent,
    getDocument: () => globalThis.document,
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
            eventInitDict?: Readonly<CustomEventInit<T>>
        ): CustomEvent<T> {
            return new (getCustomEventConstructor(scope))<T>(
                type,
                eventInitDict
            );
        },

        dispatchEvent(event: Readonly<Event>): boolean {
            return getDispatchEvent(scope).call(scope, event);
        },

        hasRenderedMapContainer(): boolean {
            const mapContainer =
                getScopeDocument(scope)?.querySelector("#leaflet-map");
            return mapContainer !== null && mapContainer !== undefined;
        },

        prefersReducedMotion(): boolean {
            const matchMedia = getScopeMatchMedia(scope);
            return (
                typeof matchMedia === "function" &&
                matchMedia.call(scope, "(prefers-reduced-motion: reduce)")
                    .matches
            );
        },

        queueMicrotask(callback: () => void): void {
            const queueMicrotask = getScopeQueueMicrotask(scope);
            if (typeof queueMicrotask === "function") {
                queueMicrotask.call(scope, callback);
                return;
            }

            void runAfterPromiseMicrotask(callback);
        },

        scrollTo(options: Readonly<ScrollToOptions>): void {
            getScopeScrollTo(scope)?.call(scope, options);
        },
    };
}
