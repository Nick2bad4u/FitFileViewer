import { getBrowserAbortController } from "../../runtime/browserRuntime.js";

export interface CreateInlineZoneColorSelectorRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getCustomEvent?:
        | (() => typeof globalThis.CustomEvent | undefined)
        | undefined;
    readonly getDispatchEvent?:
        | (() => ((event: Event) => boolean) | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly getHTMLInputElement?:
        | (() => typeof globalThis.HTMLInputElement | undefined)
        | undefined;
    readonly getHTMLSelectElement?:
        | (() => typeof globalThis.HTMLSelectElement | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
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
    ) => ReturnType<typeof globalThis.setTimeout>;
}

const defaultCreateInlineZoneColorSelectorRuntimeScope: CreateInlineZoneColorSelectorRuntimeScope =
    {
    getAbortController: getBrowserAbortController,
        getCustomEvent: () => globalThis.CustomEvent,
        getDispatchEvent: () => globalThis.dispatchEvent.bind(globalThis),
        getDocument: () => globalThis.document,
        getHTMLElement: () => globalThis.HTMLElement,
        getHTMLInputElement: () => globalThis.HTMLInputElement,
        getHTMLSelectElement: () => globalThis.HTMLSelectElement,
        getSetTimeout: () => globalThis.setTimeout,
    };

function getAbortControllerConstructor(
    scope: CreateInlineZoneColorSelectorRuntimeScope
): typeof globalThis.AbortController {
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
): typeof globalThis.CustomEvent {
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
): (event: Event) => boolean {
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
): typeof globalThis.HTMLElement {
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
): typeof globalThis.HTMLInputElement {
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
): typeof globalThis.HTMLSelectElement {
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
): typeof globalThis.setTimeout {
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
        ): ReturnType<typeof globalThis.setTimeout> {
            const scheduleTimer = getRequiredSetTimeout(scope);
            return scheduleTimer(handler, timeout);
        },
    };
}
