import {
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserHTMLElement,
} from "../../runtime/browserRuntime.js";

type UpdateMapThemeEventTarget = Pick<EventTarget, "addEventListener">;

export interface UpdateMapThemeRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getBeforeUnloadTarget?:
        | (() => UpdateMapThemeEventTarget | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => typeof HTMLElement | undefined)
        | undefined;
}

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
    getBeforeUnloadTarget: () => globalThis,
    getDocument: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
};

function getAbortController(
    scope: UpdateMapThemeRuntimeScope
): typeof AbortController | undefined {
    return scope.getAbortController?.();
}

function getBeforeUnloadTarget(
    scope: UpdateMapThemeRuntimeScope
): UpdateMapThemeEventTarget | undefined {
    return scope.getBeforeUnloadTarget?.();
}

function getDocument(scope: UpdateMapThemeRuntimeScope): Document | undefined {
    return scope.getDocument?.();
}

function getHTMLElement(
    scope: UpdateMapThemeRuntimeScope
): typeof HTMLElement | undefined {
    return scope.getHTMLElement?.();
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
