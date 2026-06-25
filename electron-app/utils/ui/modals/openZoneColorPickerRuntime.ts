import {
    getBrowserCustomEvent,
    getBrowserDispatchEvent,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserHTMLInputElement,
    getBrowserKeyboardEvent,
} from "../../runtime/browserRuntime.js";

export interface OpenZoneColorPickerRuntimeScope {
    readonly getCustomEvent?:
        | (() => typeof globalThis.CustomEvent | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getDispatchEvent?:
        | (() => ((event: Event) => boolean) | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly getHTMLInputElement?:
        | (() => typeof globalThis.HTMLInputElement | undefined)
        | undefined;
    readonly getKeyboardEvent?:
        | (() => typeof globalThis.KeyboardEvent | undefined)
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
    isHTMLElement: (value: unknown) => value is HTMLElement;
    isHTMLInputElement: (value: unknown) => value is HTMLInputElement;
    isKeyboardEvent: (value: unknown) => value is KeyboardEvent;
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

function getHTMLElementConstructor(
    scope: OpenZoneColorPickerRuntimeScope
): typeof globalThis.HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement?.();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "openZoneColorPicker requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}

function getHTMLInputElementConstructor(
    scope: OpenZoneColorPickerRuntimeScope
): typeof globalThis.HTMLInputElement {
    const HTMLInputElementConstructor = scope.getHTMLInputElement?.();
    if (typeof HTMLInputElementConstructor !== "function") {
        throw new TypeError(
            "openZoneColorPicker requires an HTMLInputElement runtime"
        );
    }

    return HTMLInputElementConstructor;
}

function getKeyboardEventConstructor(
    scope: OpenZoneColorPickerRuntimeScope
): typeof globalThis.KeyboardEvent {
    const KeyboardEventConstructor = scope.getKeyboardEvent?.();
    if (typeof KeyboardEventConstructor !== "function") {
        throw new TypeError(
            "openZoneColorPicker requires a KeyboardEvent runtime"
        );
    }

    return KeyboardEventConstructor;
}

const defaultOpenZoneColorPickerRuntimeScope: OpenZoneColorPickerRuntimeScope =
    {
        getCustomEvent: getBrowserCustomEvent,
        getDocument: getBrowserDocument,
        getDispatchEvent: getBrowserDispatchEvent,
        getHTMLElement: getBrowserHTMLElement,
        getHTMLInputElement: getBrowserHTMLInputElement,
        getKeyboardEvent: getBrowserKeyboardEvent,
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
        isHTMLElement(value: unknown): value is HTMLElement {
            return value instanceof getHTMLElementConstructor(scope);
        },
        isHTMLInputElement(value: unknown): value is HTMLInputElement {
            return value instanceof getHTMLInputElementConstructor(scope);
        },
        isKeyboardEvent(value: unknown): value is KeyboardEvent {
            return value instanceof getKeyboardEventConstructor(scope);
        },
    };
}
