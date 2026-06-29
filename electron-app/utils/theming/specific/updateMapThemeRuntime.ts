import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLElementConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserEventTarget,
    getBrowserHTMLElement,
} from "../../runtime/browserRuntime.js";

type UpdateMapThemeEventTarget = Pick<EventTarget, "addEventListener">;

export interface UpdateMapThemeRuntimeScope {
    readonly getAbortController: UpdateMapThemeRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getBeforeUnloadTarget: UpdateMapThemeRuntimeProvider<UpdateMapThemeEventTarget>;
    readonly getDocument: UpdateMapThemeRuntimeProvider<Document>;
    readonly getHTMLElement: UpdateMapThemeRuntimeProvider<BrowserHTMLElementConstructor>;
}

type UpdateMapThemeRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface UpdateMapThemeRuntime {
    addDocumentListener: (
        eventName: string,
        listener: EventListener,
        options: AddEventListenerOptions
    ) => void;
    addWindowBeforeUnloadListener: (
        listener: EventListener,
        options: AddEventListenerOptions
    ) => void;
    createAbortController: () => AbortController;
    isHTMLElement: (element: Element | null) => element is HTMLElement;
    queryLeafletMap: () => Element | null;
}

function isHTMLElement(
    scope: UpdateMapThemeRuntimeScope,
    element: Element | null
): element is HTMLElement {
    const HTMLElementConstructor = getHTMLElement(scope);
    return (
        typeof HTMLElementConstructor === "function" &&
        element instanceof HTMLElementConstructor
    );
}

const defaultUpdateMapThemeRuntimeScope: UpdateMapThemeRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getBeforeUnloadTarget: getBrowserEventTarget,
    getDocument: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
};

function getRequiredProvider<T>(
    provider: UpdateMapThemeRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `updateMapTheme requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortController(
    scope: UpdateMapThemeRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return getRequiredProvider(scope.getAbortController, "AbortController")();
}

function getBeforeUnloadTarget(
    scope: UpdateMapThemeRuntimeScope
): UpdateMapThemeEventTarget | undefined {
    return getRequiredProvider(
        scope.getBeforeUnloadTarget,
        "beforeunload target"
    )();
}

function getDocument(scope: UpdateMapThemeRuntimeScope): Document | undefined {
    return getRequiredProvider(scope.getDocument, "document")();
}

function getHTMLElement(
    scope: UpdateMapThemeRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    return getRequiredProvider(scope.getHTMLElement, "HTMLElement")();
}

export function getUpdateMapThemeRuntime(
    scope: UpdateMapThemeRuntimeScope = defaultUpdateMapThemeRuntimeScope
): UpdateMapThemeRuntime {
    return {
        addDocumentListener(
            eventName: string,
            listener: EventListener,
            options: AddEventListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by installUpdateMapThemeListeners.
            getDocument(scope)?.addEventListener(eventName, listener, options);
        },
        addWindowBeforeUnloadListener(
            listener: EventListener,
            options: AddEventListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by installUpdateMapThemeListeners.
            getBeforeUnloadTarget(scope)?.addEventListener(
                "beforeunload",
                listener,
                options
            );
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "updateMapTheme requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        isHTMLElement(element: Element | null): element is HTMLElement {
            return isHTMLElement(scope, element);
        },
        queryLeafletMap(): Element | null {
            return getDocument(scope)?.querySelector("#leaflet-map") ?? null;
        },
    };
}
