type UpdateMapThemeEventTarget = Pick<EventTarget, "addEventListener">;

export interface UpdateMapThemeRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
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
    createAbortController: () => AbortController;
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

const defaultUpdateMapThemeRuntimeScope: UpdateMapThemeRuntimeScope =
    globalThis;

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
            scope.document?.addEventListener(eventName, listener, options);
        },
        addWindowBeforeUnloadListener(
            listener: EventListener,
            options: AddEventListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by installUpdateMapThemeListeners.
            scope.window?.addEventListener("beforeunload", listener, options);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
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
            return scope.document?.querySelector("#leaflet-map") ?? null;
        },
    };
}
