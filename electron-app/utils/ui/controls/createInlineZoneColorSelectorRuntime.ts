export interface CreateInlineZoneColorSelectorRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly CustomEvent?: typeof CustomEvent | undefined;
    readonly HTMLInputElement?: typeof HTMLInputElement | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
    readonly HTMLSelectElement?: typeof HTMLSelectElement | undefined;
    readonly dispatchEvent?: ((event: Event) => boolean) | undefined;
    readonly document?: Document | undefined;
    readonly setTimeout?: typeof setTimeout | undefined;
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
    ) => ReturnType<typeof setTimeout>;
}

const defaultCreateInlineZoneColorSelectorRuntimeScope: CreateInlineZoneColorSelectorRuntimeScope =
    globalThis;

function getAbortControllerConstructor(
    scope: CreateInlineZoneColorSelectorRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.AbortController ?? scope.document?.defaultView?.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createInlineZoneColorSelector requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getCustomEventConstructor(
    scope: CreateInlineZoneColorSelectorRuntimeScope
): typeof CustomEvent {
    const CustomEventConstructor =
        scope.CustomEvent ?? scope.document?.defaultView?.CustomEvent;
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
    const dispatchEvent =
        scope.dispatchEvent ??
        scope.document?.defaultView?.dispatchEvent?.bind(
            scope.document.defaultView
        );
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
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError(
            "createInlineZoneColorSelector requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getElementConstructor<K extends keyof Pick<
    CreateInlineZoneColorSelectorRuntimeScope,
    "HTMLElement" | "HTMLInputElement" | "HTMLSelectElement"
>>(
    scope: CreateInlineZoneColorSelectorRuntimeScope,
    name: K
): NonNullable<CreateInlineZoneColorSelectorRuntimeScope[K]> {
    const Constructor = scope[name] ?? scope.document?.defaultView?.[name];
    if (typeof Constructor !== "function") {
        throw new TypeError(
            `createInlineZoneColorSelector requires an ${name} runtime`
        );
    }

    return Constructor;
}

function getRequiredSetTimeout(
    scope: CreateInlineZoneColorSelectorRuntimeScope
): typeof setTimeout {
    const scheduleTimer = scope.setTimeout;
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
            return value instanceof getElementConstructor(scope, "HTMLElement");
        },
        isHTMLInputElement(value: unknown): value is HTMLInputElement {
            return (
                value instanceof
                getElementConstructor(scope, "HTMLInputElement")
            );
        },
        isHTMLSelectElement(value: unknown): value is HTMLSelectElement {
            return (
                value instanceof
                getElementConstructor(scope, "HTMLSelectElement")
            );
        },
        setTimeout(
            handler: () => void,
            timeout: number
        ): ReturnType<typeof setTimeout> {
            const scheduleTimer = getRequiredSetTimeout(scope);
            return scheduleTimer(handler, timeout);
        },
    };
}
