import {
    type BrowserCustomEventConstructor,
    type BrowserDispatchEvent,
    type BrowserMatchMedia,
    type BrowserQueueMicrotask,
    getBrowserCustomEvent,
    getBrowserDispatchEvent,
    getBrowserDocument,
    getBrowserMatchMedia,
    getBrowserQueueMicrotask,
    getBrowserScrollTo,
} from "../../runtime/browserRuntime.js";

type ShowFitDataScrollTo = (options: Readonly<ScrollToOptions>) => void;
type ShowFitDataDocument = Pick<Document, "querySelector">;

export interface ShowFitDataRuntimeScope {
    readonly getCustomEvent: ShowFitDataRuntimeProvider<BrowserCustomEventConstructor>;
    readonly getDocument: ShowFitDataRuntimeProvider<ShowFitDataDocument>;
    readonly getDispatchEvent: ShowFitDataRuntimeProvider<BrowserDispatchEvent>;
    readonly getMatchMedia: ShowFitDataRuntimeProvider<BrowserMatchMedia>;
    readonly getQueueMicrotask: ShowFitDataRuntimeProvider<BrowserQueueMicrotask>;
    readonly getScrollTo: ShowFitDataRuntimeProvider<ShowFitDataScrollTo>;
}

type ShowFitDataRuntimeProvider<T> = (() => T | undefined) | undefined;

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
    getCustomEvent: () => BrowserCustomEventConstructor | undefined
): BrowserCustomEventConstructor {
    const CustomEventConstructor = getCustomEvent();
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError("showFitData requires a CustomEvent runtime");
    }

    return CustomEventConstructor;
}

function getDispatchEvent(
    getDispatchEventRef: () => BrowserDispatchEvent | undefined
): BrowserDispatchEvent {
    const dispatchEvent = getDispatchEventRef();
    if (typeof dispatchEvent !== "function") {
        throw new TypeError("showFitData requires a dispatchEvent runtime");
    }

    return dispatchEvent;
}

function getScopeDocument(
    getDocument: () => ShowFitDataDocument | undefined
): ShowFitDataDocument | undefined {
    return getDocument();
}

function getScopeMatchMedia(
    getMatchMedia: () => BrowserMatchMedia | undefined
): BrowserMatchMedia | undefined {
    return getMatchMedia();
}

function getScopeQueueMicrotask(
    getQueueMicrotask: () => BrowserQueueMicrotask | undefined
): BrowserQueueMicrotask | undefined {
    return getQueueMicrotask();
}

function getScopeScrollTo(
    getScrollTo: () => ShowFitDataScrollTo | undefined
): ShowFitDataScrollTo | undefined {
    return getScrollTo();
}

const defaultShowFitDataRuntimeScope: ShowFitDataRuntimeScope = {
    getCustomEvent: getBrowserCustomEvent,
    getDocument: getBrowserDocument,
    getDispatchEvent: getBrowserDispatchEvent,
    getMatchMedia: getBrowserMatchMedia,
    getQueueMicrotask: getBrowserQueueMicrotask,
    getScrollTo: getBrowserScrollTo,
};

export function getShowFitDataRuntime(
    scope: ShowFitDataRuntimeScope = defaultShowFitDataRuntimeScope
): ShowFitDataRuntime {
    const getCustomEvent = getRequiredProvider(
        scope.getCustomEvent,
        "CustomEvent"
    );
    const getDocument = getRequiredProvider(scope.getDocument, "document");
    const getDispatchEventRef = getRequiredProvider(
        scope.getDispatchEvent,
        "dispatchEvent"
    );
    const getMatchMedia = getRequiredProvider(
        scope.getMatchMedia,
        "matchMedia"
    );
    const getQueueMicrotask = getRequiredProvider(
        scope.getQueueMicrotask,
        "queueMicrotask"
    );
    const getScrollTo = getRequiredProvider(scope.getScrollTo, "scrollTo");

    return {
        canScrollTo(): boolean {
            return typeof getScopeScrollTo(getScrollTo) === "function";
        },

        createCustomEvent<T>(
            type: string,
            eventInitDict?: Readonly<CustomEventInit<T>>
        ): CustomEvent<T> {
            return new (getCustomEventConstructor(getCustomEvent))<T>(
                type,
                eventInitDict
            );
        },

        dispatchEvent(event: Readonly<Event>): boolean {
            return getDispatchEvent(getDispatchEventRef).call(scope, event);
        },

        hasRenderedMapContainer(): boolean {
            const mapContainer =
                getScopeDocument(getDocument)?.querySelector("#leaflet-map");
            return mapContainer !== null && mapContainer !== undefined;
        },

        prefersReducedMotion(): boolean {
            const matchMedia = getScopeMatchMedia(getMatchMedia);
            return (
                typeof matchMedia === "function" &&
                matchMedia.call(scope, "(prefers-reduced-motion: reduce)")
                    .matches
            );
        },

        queueMicrotask(callback: () => void): void {
            const queueMicrotask = getScopeQueueMicrotask(getQueueMicrotask);
            if (typeof queueMicrotask === "function") {
                queueMicrotask.call(scope, callback);
                return;
            }

            void runAfterPromiseMicrotask(callback);
        },

        scrollTo(options: Readonly<ScrollToOptions>): void {
            getScopeScrollTo(getScrollTo)?.call(scope, options);
        },
    };
}

function getRequiredProvider<T>(
    provider: ShowFitDataRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(`showFitData requires a ${providerName} provider`);
    }

    return provider;
}
