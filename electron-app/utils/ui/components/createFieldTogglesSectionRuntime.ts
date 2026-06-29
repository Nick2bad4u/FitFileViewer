import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserCustomEventConstructor,
    type BrowserDispatchEvent,
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

export type CreateFieldTogglesSectionTimerHandle = BrowserTimerHandle;
type CreateFieldTogglesSectionRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface CreateFieldTogglesSectionRuntimeScope {
    readonly getAbortController: CreateFieldTogglesSectionRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getClearTimeout: CreateFieldTogglesSectionRuntimeProvider<BrowserClearTimeout>;
    readonly getCustomEvent: CreateFieldTogglesSectionRuntimeProvider<BrowserCustomEventConstructor>;
    readonly getDispatchEvent: CreateFieldTogglesSectionRuntimeProvider<BrowserDispatchEvent>;
    readonly getDocument: CreateFieldTogglesSectionRuntimeProvider<Document>;
    readonly getHTMLInputElement: CreateFieldTogglesSectionRuntimeProvider<BrowserHTMLInputElementConstructor>;
    readonly getSetTimeout: CreateFieldTogglesSectionRuntimeProvider<BrowserSetTimeout>;
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
    setTimeout: (handler: () => void, timeout: number) => BrowserTimerHandle;
}

function getRequiredProvider<T>(
    provider: CreateFieldTogglesSectionRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `createFieldTogglesSection requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: CreateFieldTogglesSectionRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
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
    const CustomEventConstructor = getRequiredProvider(
        scope.getCustomEvent,
        "CustomEvent"
    )();
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError(
            "createFieldTogglesSection requires a CustomEvent runtime"
        );
    }

    return CustomEventConstructor;
}

function getDispatchEvent(
    scope: CreateFieldTogglesSectionRuntimeScope
): BrowserDispatchEvent {
    const dispatchEvent = getRequiredProvider(
        scope.getDispatchEvent,
        "dispatchEvent"
    )();
    if (typeof dispatchEvent !== "function") {
        throw new TypeError(
            "createFieldTogglesSection requires a dispatchEvent runtime"
        );
    }

    return dispatchEvent;
}

function getDocument(scope: CreateFieldTogglesSectionRuntimeScope): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
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
    const HTMLInputElementConstructor = getRequiredProvider(
        scope.getHTMLInputElement,
        "HTMLInputElement"
    )();
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
            const clearTimer = getRequiredProvider(
                scope.getClearTimeout,
                "clearTimeout"
            )();
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
        setTimeout(handler: () => void, timeout: number): BrowserTimerHandle {
            const scheduleTimer = getRequiredProvider(
                scope.getSetTimeout,
                "setTimeout"
            )();
            if (typeof scheduleTimer !== "function") {
                throw new TypeError(
                    "createFieldTogglesSection requires a setTimeout runtime"
                );
            }
            return scheduleTimer(handler, timeout);
        },
    };
}
