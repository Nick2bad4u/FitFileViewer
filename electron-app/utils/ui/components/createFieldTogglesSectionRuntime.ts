import { getBrowserAbortController } from "../../runtime/browserRuntime.js";

export interface CreateFieldTogglesSectionRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getCustomEvent?:
        | (() => typeof globalThis.CustomEvent | undefined)
        | undefined;
    readonly getDispatchEvent?:
        | (() => ((event: Event) => boolean) | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLInputElement?:
        | (() => typeof globalThis.HTMLInputElement | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface CreateFieldTogglesSectionRuntime {
    createAbortController: () => AbortController;
    createCustomEvent: <T>(
        type: string,
        eventInitDict?: CustomEventInit<T>
    ) => CustomEvent<T>;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    clearTimeout: (timer: ReturnType<typeof globalThis.setTimeout>) => void;
    dispatchEvent: (event: Event) => boolean;
    isHTMLInputElement: (value: unknown) => value is HTMLInputElement;
    queryFieldCheckboxToggles: () => NodeListOf<HTMLInputElement>;
    setTimeout: (
        handler: () => void,
        timeout: number
    ) => ReturnType<typeof globalThis.setTimeout>;
}

function getAbortControllerConstructor(
    scope: CreateFieldTogglesSectionRuntimeScope
): typeof globalThis.AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createFieldTogglesSection requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getCustomEventConstructor(
    scope: CreateFieldTogglesSectionRuntimeScope
): typeof globalThis.CustomEvent {
    const CustomEventConstructor = scope.getCustomEvent?.();
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError(
            "createFieldTogglesSection requires a CustomEvent runtime"
        );
    }

    return CustomEventConstructor;
}

function getDispatchEvent(
    scope: CreateFieldTogglesSectionRuntimeScope
): (event: Event) => boolean {
    const dispatchEvent = scope.getDispatchEvent?.();
    if (typeof dispatchEvent !== "function") {
        throw new TypeError(
            "createFieldTogglesSection requires a dispatchEvent runtime"
        );
    }

    return dispatchEvent;
}

function getDocument(scope: CreateFieldTogglesSectionRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError(
            "createFieldTogglesSection requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getHTMLInputElementConstructor(
    scope: CreateFieldTogglesSectionRuntimeScope
): typeof globalThis.HTMLInputElement {
    const HTMLInputElementConstructor = scope.getHTMLInputElement?.();
    if (typeof HTMLInputElementConstructor !== "function") {
        throw new TypeError(
            "createFieldTogglesSection requires an HTMLInputElement runtime"
        );
    }

    return HTMLInputElementConstructor;
}

const defaultCreateFieldTogglesSectionRuntimeScope: CreateFieldTogglesSectionRuntimeScope =
    {
    getAbortController: getBrowserAbortController,
        getClearTimeout: () => globalThis.clearTimeout,
        getCustomEvent: () => globalThis.CustomEvent,
        getDispatchEvent: () => globalThis.dispatchEvent.bind(globalThis),
        getDocument: () => globalThis.document,
        getHTMLInputElement: () => globalThis.HTMLInputElement,
        getSetTimeout: () => globalThis.setTimeout,
    };

export function getCreateFieldTogglesSectionRuntime(
    scope: CreateFieldTogglesSectionRuntimeScope = defaultCreateFieldTogglesSectionRuntimeScope
): CreateFieldTogglesSectionRuntime {
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
        clearTimeout(timer: ReturnType<typeof globalThis.setTimeout>): void {
            const clearTimer = scope.getClearTimeout?.();
            if (typeof clearTimer !== "function") {
                throw new TypeError(
                    "createFieldTogglesSection requires a clearTimeout runtime"
                );
            }
            clearTimer(timer);
        },
        dispatchEvent(event: Event): boolean {
            return getDispatchEvent(scope)(event);
        },
        isHTMLInputElement(value: unknown): value is HTMLInputElement {
            return value instanceof getHTMLInputElementConstructor(scope);
        },
        queryFieldCheckboxToggles(): NodeListOf<HTMLInputElement> {
            return getDocument(scope).querySelectorAll<HTMLInputElement>(
                '.field-toggle input[type="checkbox"]'
            );
        },
        setTimeout(
            handler: () => void,
            timeout: number
        ): ReturnType<typeof globalThis.setTimeout> {
            const scheduleTimer = scope.getSetTimeout?.();
            if (typeof scheduleTimer !== "function") {
                throw new TypeError(
                    "createFieldTogglesSection requires a setTimeout runtime"
                );
            }
            return scheduleTimer(handler, timeout);
        },
    };
}
