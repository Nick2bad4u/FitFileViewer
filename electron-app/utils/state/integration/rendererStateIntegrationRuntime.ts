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

type RendererStateIntegrationRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface RendererStateIntegrationRuntimeScope {
    readonly getAbortController: RendererStateIntegrationRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getClearTimeout: RendererStateIntegrationRuntimeProvider<BrowserClearTimeout>;
    readonly getDocument: RendererStateIntegrationRuntimeProvider<Document>;
    readonly getDocumentEventTarget: RendererStateIntegrationRuntimeProvider<Document>;
    readonly getElement: RendererStateIntegrationRuntimeProvider<BrowserElementConstructor>;
    readonly getHTMLElement: RendererStateIntegrationRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getSetTimeout: RendererStateIntegrationRuntimeProvider<BrowserSetTimeout>;
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
        getDocumentEventTarget: () => undefined,
        getElement: getBrowserElement,
        getHTMLElement: getBrowserHTMLElement,
        getSetTimeout: getBrowserSetTimeout,
    };

function getRequiredProvider<T>(
    provider: RendererStateIntegrationRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `rendererStateIntegration requires ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: RendererStateIntegrationRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
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
    return (
        getRequiredProvider(
            scope.getDocumentEventTarget,
            "document event-target"
        )() ?? getRequiredProvider(scope.getDocument, "document")()
    );
}

function getElementConstructor(
    scope: RendererStateIntegrationRuntimeScope
): BrowserElementConstructor {
    const ElementConstructor = getRequiredProvider(
        scope.getElement,
        "Element"
    )();
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
    const HTMLElementConstructor = getRequiredProvider(
        scope.getHTMLElement,
        "HTMLElement"
    )();
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
    const documentRef = getRequiredProvider(scope.getDocument, "document")();
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
            const clearTimeoutRef = getRequiredProvider(
                scope.getClearTimeout,
                "clearTimeout"
            )();
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
            const setTimeoutRef = getRequiredProvider(
                scope.getSetTimeout,
                "setTimeout"
            )();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "rendererStateIntegration requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
