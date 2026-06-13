export interface CreateFieldTogglesSectionRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly CustomEvent?: typeof CustomEvent | undefined;
    readonly HTMLInputElement?: typeof HTMLInputElement | undefined;
    readonly clearTimeout?: typeof clearTimeout | undefined;
    readonly dispatchEvent?: ((event: Event) => boolean) | undefined;
    readonly document?: Document | undefined;
    readonly setTimeout?: typeof setTimeout | undefined;
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
    clearTimeout: (timer: ReturnType<typeof setTimeout>) => void;
    dispatchEvent: (event: Event) => boolean;
    isHTMLInputElement: (value: unknown) => value is HTMLInputElement;
    queryFieldCheckboxToggles: () => NodeListOf<HTMLInputElement>;
    setTimeout: (
        handler: () => void,
        timeout: number
    ) => ReturnType<typeof setTimeout>;
}

function getAbortControllerConstructor(
    scope: CreateFieldTogglesSectionRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.AbortController ?? scope.document?.defaultView?.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createFieldTogglesSection requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getCustomEventConstructor(
    scope: CreateFieldTogglesSectionRuntimeScope
): typeof CustomEvent {
    const CustomEventConstructor =
        scope.CustomEvent ?? scope.document?.defaultView?.CustomEvent;
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
    const dispatchEvent =
        scope.dispatchEvent ??
        scope.document?.defaultView?.dispatchEvent?.bind(
            scope.document.defaultView
        );
    if (typeof dispatchEvent !== "function") {
        throw new TypeError(
            "createFieldTogglesSection requires a dispatchEvent runtime"
        );
    }

    return dispatchEvent;
}

function getDocument(scope: CreateFieldTogglesSectionRuntimeScope): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError(
            "createFieldTogglesSection requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getHTMLInputElementConstructor(
    scope: CreateFieldTogglesSectionRuntimeScope
): typeof HTMLInputElement {
    const HTMLInputElementConstructor =
        scope.HTMLInputElement ??
        scope.document?.defaultView?.HTMLInputElement;
    if (typeof HTMLInputElementConstructor !== "function") {
        throw new TypeError(
            "createFieldTogglesSection requires an HTMLInputElement runtime"
        );
    }

    return HTMLInputElementConstructor;
}

export function getCreateFieldTogglesSectionRuntime(
    scope: CreateFieldTogglesSectionRuntimeScope = globalThis
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
        clearTimeout(timer: ReturnType<typeof setTimeout>): void {
            const clearTimer = scope.clearTimeout;
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
        ): ReturnType<typeof setTimeout> {
            const scheduleTimer = scope.setTimeout;
            if (typeof scheduleTimer !== "function") {
                throw new TypeError(
                    "createFieldTogglesSection requires a setTimeout runtime"
                );
            }
            return scheduleTimer(handler, timeout);
        },
    };
}
