export interface OpenZoneColorPickerRuntimeScope {
    readonly getCustomEvent?:
        | (() => typeof globalThis.CustomEvent | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getDispatchEvent?:
        | (() => ((event: Event) => boolean) | undefined)
        | undefined;
}

export interface OpenZoneColorPickerRuntime {
    addDocumentKeydownListener: (
        listener: (event: Event) => void
    ) => () => void;
    appendToBody: (element: Element) => void;
    bodyContains: (element: Element) => boolean;
    createCustomEvent: <T>(
        type: string,
        eventInitDict?: CustomEventInit<T>
    ) => CustomEvent<T>;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    dispatchEvent: (event: Event) => boolean;
    getActiveElement: () => Element | null;
    getBody: () => HTMLElement;
    getDocument: () => Document;
}

function getCustomEventConstructor(
    scope: OpenZoneColorPickerRuntimeScope
): typeof globalThis.CustomEvent {
    const CustomEventConstructor = scope.getCustomEvent?.();
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError(
            "openZoneColorPicker requires a CustomEvent runtime"
        );
    }

    return CustomEventConstructor;
}

function getDispatchEvent(
    scope: OpenZoneColorPickerRuntimeScope
): (event: Event) => boolean {
    const dispatchEvent = scope.getDispatchEvent?.();
    if (typeof dispatchEvent !== "function") {
        throw new TypeError(
            "openZoneColorPicker requires a dispatchEvent runtime"
        );
    }

    return dispatchEvent;
}

function getRuntimeDocument(scope: OpenZoneColorPickerRuntimeScope): Document {
    const documentRef = scope.getDocument?.();
    if (!documentRef) {
        throw new TypeError("openZoneColorPicker requires a document runtime");
    }

    return documentRef;
}

const defaultOpenZoneColorPickerRuntimeScope: OpenZoneColorPickerRuntimeScope =
    {
        getCustomEvent: () => globalThis.CustomEvent,
        getDocument: () => globalThis.document,
        getDispatchEvent: () => globalThis.dispatchEvent.bind(globalThis),
    };

export function getOpenZoneColorPickerRuntime(
    scope: OpenZoneColorPickerRuntimeScope = defaultOpenZoneColorPickerRuntimeScope
): OpenZoneColorPickerRuntime {
    return {
        addDocumentKeydownListener(listener): () => void {
            const documentRef = getRuntimeDocument(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The returned cleanup removes this listener.
            documentRef.addEventListener("keydown", listener);

            return () => {
                documentRef.removeEventListener("keydown", listener);
            };
        },
        appendToBody(element): void {
            getRuntimeDocument(scope).body.append(element);
        },
        bodyContains(element): boolean {
            return getRuntimeDocument(scope).body.contains(element);
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
        createElement(tagName) {
            return getRuntimeDocument(scope).createElement(tagName);
        },
        dispatchEvent(event: Event): boolean {
            return getDispatchEvent(scope)(event);
        },
        getActiveElement(): Element | null {
            return getRuntimeDocument(scope).activeElement;
        },
        getBody(): HTMLElement {
            return getRuntimeDocument(scope).body;
        },
        getDocument(): Document {
            return getRuntimeDocument(scope);
        },
    };
}
