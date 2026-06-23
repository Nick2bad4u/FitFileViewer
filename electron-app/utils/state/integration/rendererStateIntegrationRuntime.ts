export type RendererStateIntegrationTimer = ReturnType<
    typeof globalThis.setTimeout
>;

export type RendererStateIntegrationClickListener = (
    event: Readonly<MouseEvent>
) => void;

export interface RendererStateIntegrationRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getDocumentEventTarget?: (() => Document | undefined) | undefined;
    readonly getElement?:
        | (() => typeof globalThis.Element | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface RendererStateIntegrationRuntime {
    addDocumentClickListener: (
        listener: RendererStateIntegrationClickListener,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    clearTimeout: (timer: RendererStateIntegrationTimer) => void;
    createAbortController: () => AbortController;
    getDocument: () => Document;
    isElement: (value: unknown) => value is Element;
    isHTMLElement: (value: unknown) => value is HTMLElement;
    setTimeout: (
        callback: () => void,
        delayMs: number
    ) => RendererStateIntegrationTimer;
}

const defaultRendererStateIntegrationRuntimeScope: RendererStateIntegrationRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getClearTimeout: () => globalThis.clearTimeout,
        getDocument: () => getGlobalDocument(),
        getDocumentEventTarget: () => getGlobalDocument(),
        getElement: () => globalThis.Element,
        getHTMLElement: () => globalThis.HTMLElement,
        getSetTimeout: () => globalThis.setTimeout,
    };

function getGlobalDocument(): Document {
    return globalThis.document;
}

function getAbortControllerConstructor(
    scope: RendererStateIntegrationRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "rendererStateIntegration requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocumentEventTarget(
    scope: RendererStateIntegrationRuntimeScope
): Document | undefined {
    return scope.getDocumentEventTarget?.();
}

function getElementConstructor(
    scope: RendererStateIntegrationRuntimeScope
): typeof globalThis.Element {
    const ElementConstructor = scope.getElement?.();
    if (typeof ElementConstructor !== "function") {
        throw new TypeError(
            "rendererStateIntegration requires an Element runtime"
        );
    }

    return ElementConstructor;
}

function getHTMLElementConstructor(
    scope: RendererStateIntegrationRuntimeScope
): typeof globalThis.HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement?.();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "rendererStateIntegration requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}

function requireDocument(
    scope: RendererStateIntegrationRuntimeScope
): Document {
    const documentRef = scope.getDocument?.();
    if (!documentRef) {
        throw new TypeError(
            "rendererStateIntegration requires a document runtime"
        );
    }

    return documentRef;
}

export function getRendererStateIntegrationRuntime(
    scope: RendererStateIntegrationRuntimeScope = defaultRendererStateIntegrationRuntimeScope
): RendererStateIntegrationRuntime {
    return {
        addDocumentClickListener(listener, options): void {
            const documentEventTarget = getDocumentEventTarget(scope);
            if (!documentEventTarget) {
                throw new TypeError(
                    "rendererStateIntegration requires a document event-target runtime"
                );
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            documentEventTarget.addEventListener("click", listener, options);
        },
        clearTimeout(timer): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "rendererStateIntegration requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(timer);
        },
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        getDocument(): Document {
            return requireDocument(scope);
        },
        isElement(value): value is Element {
            return value instanceof getElementConstructor(scope);
        },
        isHTMLElement(value): value is HTMLElement {
            return value instanceof getHTMLElementConstructor(scope);
        },
        setTimeout(callback, delayMs): RendererStateIntegrationTimer {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "rendererStateIntegration requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
