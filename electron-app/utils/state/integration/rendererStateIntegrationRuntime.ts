import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserElementConstructor,
    type BrowserHTMLElementConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserElement,
    getBrowserHTMLElement,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type RendererStateIntegrationTimer = BrowserTimerHandle;

export type RendererStateIntegrationClickListener = (
    event: Readonly<MouseEvent>
) => void;

export interface RendererStateIntegrationRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getDocumentEventTarget?: (() => Document | undefined) | undefined;
    readonly getElement?:
        | (() => BrowserElementConstructor | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
    readonly getSetTimeout?: (() => BrowserSetTimeout | undefined) | undefined;
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
        getAbortController: getBrowserAbortController,
        getClearTimeout: getBrowserClearTimeout,
        getDocument: getBrowserDocument,
        getElement: getBrowserElement,
        getHTMLElement: getBrowserHTMLElement,
        getSetTimeout: getBrowserSetTimeout,
    };

function getAbortControllerConstructor(
    scope: RendererStateIntegrationRuntimeScope
): BrowserAbortControllerConstructor {
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
    return scope.getDocumentEventTarget?.() ?? scope.getDocument?.();
}

function getElementConstructor(
    scope: RendererStateIntegrationRuntimeScope
): BrowserElementConstructor {
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
): BrowserHTMLElementConstructor {
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
