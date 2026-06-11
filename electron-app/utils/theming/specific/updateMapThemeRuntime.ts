type UpdateMapThemeEventTarget = Pick<EventTarget, "addEventListener">;

export interface UpdateMapThemeRuntimeScope {
    readonly document?: Document | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
    readonly window?: UpdateMapThemeEventTarget | undefined;
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
    isHTMLElement: (element: Element | null) => element is HTMLElement;
    queryLeafletMap: () => Element | null;
}

function isHTMLElement(
    scope: UpdateMapThemeRuntimeScope,
    element: Element | null
): element is HTMLElement {
    const HTMLElementConstructor = scope.HTMLElement;
    return (
        typeof HTMLElementConstructor === "function" &&
        element instanceof HTMLElementConstructor
    );
}

export function getUpdateMapThemeRuntime(
    scope: UpdateMapThemeRuntimeScope = globalThis
): UpdateMapThemeRuntime {
    return {
        addDocumentListener(
            eventName: string,
            listener: EventListener,
            options: AddEventListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by installUpdateMapThemeListeners.
            scope.document?.addEventListener(eventName, listener, options);
        },
        addWindowBeforeUnloadListener(
            listener: EventListener,
            options: AddEventListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by installUpdateMapThemeListeners.
            scope.window?.addEventListener("beforeunload", listener, options);
        },
        isHTMLElement(element: Element | null): element is HTMLElement {
            return isHTMLElement(scope, element);
        },
        queryLeafletMap(): Element | null {
            return scope.document?.querySelector("#leaflet-map") ?? null;
        },
    };
}
