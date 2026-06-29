import {
    type BrowserCustomEventConstructor,
    type BrowserDispatchEvent,
    type BrowserHTMLElementConstructor,
    type BrowserHTMLInputElementConstructor,
    type BrowserKeyboardEventConstructor,
    getBrowserCustomEvent,
    getBrowserDispatchEvent,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserHTMLInputElement,
    getBrowserKeyboardEvent,
} from "../../runtime/browserRuntime.js";

type OpenZoneColorPickerRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface OpenZoneColorPickerRuntimeScope {
    readonly getCustomEvent: OpenZoneColorPickerRuntimeProvider<BrowserCustomEventConstructor>;
    readonly getDocument: OpenZoneColorPickerRuntimeProvider<Document>;
    readonly getDispatchEvent: OpenZoneColorPickerRuntimeProvider<BrowserDispatchEvent>;
    readonly getHTMLElement: OpenZoneColorPickerRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getHTMLInputElement: OpenZoneColorPickerRuntimeProvider<BrowserHTMLInputElementConstructor>;
    readonly getKeyboardEvent: OpenZoneColorPickerRuntimeProvider<BrowserKeyboardEventConstructor>;
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

function getRequiredProvider<T>(
    provider: OpenZoneColorPickerRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `openZoneColorPicker requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getCustomEventConstructor(
    scope: OpenZoneColorPickerRuntimeScope
): BrowserCustomEventConstructor {
    const CustomEventConstructor = getRequiredProvider(
        scope.getCustomEvent,
        "CustomEvent"
    )();
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError(
            "openZoneColorPicker requires a CustomEvent runtime"
        );
    }

    return CustomEventConstructor;
}

function getDispatchEvent(
    scope: OpenZoneColorPickerRuntimeScope
): BrowserDispatchEvent {
    const dispatchEvent = getRequiredProvider(
        scope.getDispatchEvent,
        "dispatchEvent"
    )();
    if (typeof dispatchEvent !== "function") {
        throw new TypeError(
            "openZoneColorPicker requires a dispatchEvent runtime"
        );
    }

    return dispatchEvent;
}

function getRuntimeDocument(scope: OpenZoneColorPickerRuntimeScope): Document {
    const documentRef = getRequiredProvider(scope.getDocument, "document")();
    if (!documentRef) {
        throw new TypeError("openZoneColorPicker requires a document runtime");
    }

    return documentRef;
}

function getHTMLElementConstructor(
    scope: OpenZoneColorPickerRuntimeScope
): BrowserHTMLElementConstructor {
    const HTMLElementConstructor = getRequiredProvider(
        scope.getHTMLElement,
        "HTMLElement"
    )();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "openZoneColorPicker requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}

function getHTMLInputElementConstructor(
    scope: OpenZoneColorPickerRuntimeScope
): BrowserHTMLInputElementConstructor {
    const HTMLInputElementConstructor = getRequiredProvider(
        scope.getHTMLInputElement,
        "HTMLInputElement"
    )();
    if (typeof HTMLInputElementConstructor !== "function") {
        throw new TypeError(
            "openZoneColorPicker requires an HTMLInputElement runtime"
        );
    }

    return HTMLInputElementConstructor;
}

function getKeyboardEventConstructor(
    scope: OpenZoneColorPickerRuntimeScope
): BrowserKeyboardEventConstructor {
    const KeyboardEventConstructor = getRequiredProvider(
        scope.getKeyboardEvent,
        "KeyboardEvent"
    )();
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
