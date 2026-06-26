import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserCustomEventConstructor,
    type BrowserHTMLInputElementConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserCustomEvent,
    getBrowserDispatchEvent,
    getBrowserDocument,
    getBrowserHTMLInputElement,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export interface CreateFieldTogglesSectionRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getCustomEvent?:
        | (() => BrowserCustomEventConstructor | undefined)
        | undefined;
    readonly getDispatchEvent?:
        | (() => ((event: Event) => boolean) | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLInputElement?:
        | (() => BrowserHTMLInputElementConstructor | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => BrowserSetTimeout | undefined)
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
    clearTimeout: (timer: BrowserTimerHandle) => void;
    dispatchEvent: (event: Event) => boolean;
    isHTMLInputElement: (value: unknown) => value is HTMLInputElement;
    queryFieldCheckboxToggles: () => NodeListOf<HTMLInputElement>;
    setTimeout: (
        handler: () => void,
        timeout: number
    ) => BrowserTimerHandle;
}

function getAbortControllerConstructor(
    scope: CreateFieldTogglesSectionRuntimeScope
): BrowserAbortControllerConstructor {
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
): BrowserCustomEventConstructor {
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
): BrowserHTMLInputElementConstructor {
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
        getClearTimeout: getBrowserClearTimeout,
        getCustomEvent: getBrowserCustomEvent,
        getDispatchEvent: getBrowserDispatchEvent,
        getDocument: getBrowserDocument,
        getHTMLInputElement: getBrowserHTMLInputElement,
        getSetTimeout: getBrowserSetTimeout,
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
        clearTimeout(timer: BrowserTimerHandle): void {
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
        ): BrowserTimerHandle {
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
