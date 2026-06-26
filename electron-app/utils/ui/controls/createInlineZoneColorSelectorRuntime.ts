import {
    type BrowserAbortControllerConstructor,
    type BrowserCustomEventConstructor,
    type BrowserDispatchEvent,
    type BrowserHTMLElementConstructor,
    type BrowserHTMLInputElementConstructor,
    type BrowserHTMLSelectElementConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserCustomEvent,
    getBrowserDispatchEvent,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserHTMLInputElement,
    getBrowserHTMLSelectElement,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type CreateInlineZoneColorSelectorTimerHandle = BrowserTimerHandle;

export interface CreateInlineZoneColorSelectorRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getCustomEvent?:
        | (() => BrowserCustomEventConstructor | undefined)
        | undefined;
    readonly getDispatchEvent?:
        | (() => BrowserDispatchEvent | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
    readonly getHTMLInputElement?:
        | (() => BrowserHTMLInputElementConstructor | undefined)
        | undefined;
    readonly getHTMLSelectElement?:
        | (() => BrowserHTMLSelectElementConstructor | undefined)
        | undefined;
    readonly getSetTimeout?: (() => BrowserSetTimeout | undefined) | undefined;
}

export interface CreateInlineZoneColorSelectorRuntime {
    createAbortController: () => AbortController;
    createCustomEvent: <T>(
        type: string,
        eventInitDict?: CustomEventInit<T>
    ) => CustomEvent<T>;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    dispatchEvent: (event: Event) => boolean;
    getBody: () => HTMLElement | null;
    isHTMLElement: (value: unknown) => value is HTMLElement;
    isHTMLInputElement: (value: unknown) => value is HTMLInputElement;
    isHTMLSelectElement: (value: unknown) => value is HTMLSelectElement;
    setTimeout: (
        handler: () => void,
        timeout: number
    ) => CreateInlineZoneColorSelectorTimerHandle;
}

const defaultCreateInlineZoneColorSelectorRuntimeScope: CreateInlineZoneColorSelectorRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getCustomEvent: getBrowserCustomEvent,
        getDispatchEvent: getBrowserDispatchEvent,
        getDocument: getBrowserDocument,
        getHTMLElement: getBrowserHTMLElement,
        getHTMLInputElement: getBrowserHTMLInputElement,
        getHTMLSelectElement: getBrowserHTMLSelectElement,
        getSetTimeout: getBrowserSetTimeout,
    };

function getAbortControllerConstructor(
    scope: CreateInlineZoneColorSelectorRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createInlineZoneColorSelector requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getCustomEventConstructor(
    scope: CreateInlineZoneColorSelectorRuntimeScope
): BrowserCustomEventConstructor {
    const CustomEventConstructor = scope.getCustomEvent?.();
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError(
            "createInlineZoneColorSelector requires a CustomEvent runtime"
        );
    }

    return CustomEventConstructor;
}

function getDispatchEvent(
    scope: CreateInlineZoneColorSelectorRuntimeScope
): BrowserDispatchEvent {
    const dispatchEvent = scope.getDispatchEvent?.();
    if (typeof dispatchEvent !== "function") {
        throw new TypeError(
            "createInlineZoneColorSelector requires a dispatchEvent runtime"
        );
    }

    return dispatchEvent;
}

function getDocument(
    scope: CreateInlineZoneColorSelectorRuntimeScope
): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError(
            "createInlineZoneColorSelector requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: CreateInlineZoneColorSelectorRuntimeScope
): BrowserHTMLElementConstructor {
    const HTMLElementConstructor = scope.getHTMLElement?.();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "createInlineZoneColorSelector requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}

function getHTMLInputElementConstructor(
    scope: CreateInlineZoneColorSelectorRuntimeScope
): BrowserHTMLInputElementConstructor {
    const HTMLInputElementConstructor = scope.getHTMLInputElement?.();
    if (typeof HTMLInputElementConstructor !== "function") {
        throw new TypeError(
            "createInlineZoneColorSelector requires an HTMLInputElement runtime"
        );
    }

    return HTMLInputElementConstructor;
}

function getHTMLSelectElementConstructor(
    scope: CreateInlineZoneColorSelectorRuntimeScope
): BrowserHTMLSelectElementConstructor {
    const HTMLSelectElementConstructor = scope.getHTMLSelectElement?.();
    if (typeof HTMLSelectElementConstructor !== "function") {
        throw new TypeError(
            "createInlineZoneColorSelector requires an HTMLSelectElement runtime"
        );
    }

    return HTMLSelectElementConstructor;
}

function getRequiredSetTimeout(
    scope: CreateInlineZoneColorSelectorRuntimeScope
): BrowserSetTimeout {
    const scheduleTimer = scope.getSetTimeout?.();
    if (typeof scheduleTimer !== "function") {
        throw new TypeError(
            "createInlineZoneColorSelector requires a setTimeout runtime"
        );
    }

    return scheduleTimer;
}

export function getCreateInlineZoneColorSelectorRuntime(
    scope: CreateInlineZoneColorSelectorRuntimeScope = defaultCreateInlineZoneColorSelectorRuntimeScope
): CreateInlineZoneColorSelectorRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
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
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getDocument(scope).createElement(tagName);
        },
        dispatchEvent(event: Event): boolean {
            return getDispatchEvent(scope)(event);
        },
        getBody(): HTMLElement | null {
            return getDocument(scope).body;
        },
        isHTMLElement(value: unknown): value is HTMLElement {
            return value instanceof getHTMLElementConstructor(scope);
        },
        isHTMLInputElement(value: unknown): value is HTMLInputElement {
            return value instanceof getHTMLInputElementConstructor(scope);
        },
        isHTMLSelectElement(value: unknown): value is HTMLSelectElement {
            return value instanceof getHTMLSelectElementConstructor(scope);
        },
        setTimeout(
            handler: () => void,
            timeout: number
        ): CreateInlineZoneColorSelectorTimerHandle {
            const scheduleTimer = getRequiredSetTimeout(scope);
            return scheduleTimer(handler, timeout);
        },
    };
}
