import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLElementConstructor,
    type BrowserNodeConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserEventTarget,
    getBrowserHTMLElement,
    getBrowserNode,
} from "../../runtime/browserRuntime.js";

type MapDocumentListenersDocument = Pick<
    Document,
    "addEventListener" | "querySelector"
>;
type MapDocumentListenersResizeTarget = Pick<EventTarget, "addEventListener">;

export interface MapDocumentListenersRuntimeScope {
    readonly getAbortController: MapDocumentListenersRuntimeProvider<
        BrowserAbortControllerConstructor
    >;
    readonly getDocument: MapDocumentListenersRuntimeProvider<
        MapDocumentListenersDocument
    >;
    readonly getHTMLElement: MapDocumentListenersRuntimeProvider<
        BrowserHTMLElementConstructor
    >;
    readonly getNode: MapDocumentListenersRuntimeProvider<BrowserNodeConstructor>;
    readonly getResizeTarget: MapDocumentListenersRuntimeProvider<
        MapDocumentListenersResizeTarget
    >;
}

export interface MapDocumentListenersRuntime {
    readonly addDocumentMousedownListener: (
        listener: (event: Readonly<MouseEvent>) => void,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly addDocumentMouseupListener: (
        listener: (event: Readonly<MouseEvent>) => void,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly addDocumentTouchendListener: (
        listener: () => void,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly addWindowResizeListener: (
        listener: () => void,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly createAbortController: () => AbortController;
    readonly getLayersControlElement: () => HTMLElement | null;
    readonly isHTMLElement: (value: unknown) => value is HTMLElement;
    readonly isNode: (value: unknown) => value is Node;
}

type MapDocumentListenersRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

function getRuntimeDocument(
    getDocument: () => MapDocumentListenersDocument | undefined
): MapDocumentListenersDocument {
    const runtimeDocument = getDocument();
    if (!runtimeDocument) {
        throw new TypeError("mapDocumentListeners requires a document runtime");
    }

    return runtimeDocument;
}

function getRuntimeResizeTarget(
    getResizeTarget: () => MapDocumentListenersResizeTarget | undefined
): MapDocumentListenersResizeTarget {
    const runtimeResizeTarget = getResizeTarget();
    if (!runtimeResizeTarget) {
        throw new TypeError(
            "mapDocumentListeners requires a resize target runtime"
        );
    }

    return runtimeResizeTarget;
}

const defaultMapDocumentListenersRuntimeScope: MapDocumentListenersRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getDocument: getBrowserDocument,
        getHTMLElement: getBrowserHTMLElement,
        getNode: getBrowserNode,
        getResizeTarget: getBrowserEventTarget,
    };

function getAbortController(
    getAbortControllerProvider: () =>
        | BrowserAbortControllerConstructor
        | undefined
): BrowserAbortControllerConstructor | undefined {
    return getAbortControllerProvider();
}

function getHTMLElementConstructor(
    getHTMLElement: () => BrowserHTMLElementConstructor | undefined
): BrowserHTMLElementConstructor | undefined {
    return getHTMLElement();
}

function getNodeConstructor(
    getNode: () => BrowserNodeConstructor | undefined
): BrowserNodeConstructor | undefined {
    return getNode();
}

export function getMapDocumentListenersRuntime(
    scope: MapDocumentListenersRuntimeScope = defaultMapDocumentListenersRuntimeScope
): MapDocumentListenersRuntime {
    const getAbortControllerProvider = getRequiredProvider(
        scope.getAbortController,
        "an AbortController"
    );
    const getDocument = getRequiredProvider(scope.getDocument, "a document");
    const getHTMLElement = getRequiredProvider(
        scope.getHTMLElement,
        "an HTMLElement"
    );
    const getNode = getRequiredProvider(scope.getNode, "a Node");
    const getResizeTarget = getRequiredProvider(
        scope.getResizeTarget,
        "a resize target"
    );

    return {
        addDocumentMousedownListener(listener, options): void {
            const runtimeDocument = getRuntimeDocument(getDocument);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener("mousedown", listener, options);
        },
        addDocumentMouseupListener(listener, options): void {
            const runtimeDocument = getRuntimeDocument(getDocument);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener("mouseup", listener, options);
        },
        addDocumentTouchendListener(listener, options): void {
            const runtimeDocument = getRuntimeDocument(getDocument);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener("touchend", listener, options);
        },
        addWindowResizeListener(listener, options): void {
            const runtimeResizeTarget =
                getRuntimeResizeTarget(getResizeTarget);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeResizeTarget.addEventListener("resize", listener, options);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getAbortController(
                getAbortControllerProvider
            );
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "mapDocumentListeners requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getLayersControlElement(): HTMLElement | null {
            return getRuntimeDocument(getDocument).querySelector<HTMLElement>(
                ".leaflet-control-layers"
            );
        },
        isHTMLElement(value: unknown): value is HTMLElement {
            const HTMLElementConstructor =
                getHTMLElementConstructor(getHTMLElement);
            return (
                typeof HTMLElementConstructor === "function" &&
                value instanceof HTMLElementConstructor
            );
        },
        isNode(value: unknown): value is Node {
            const NodeConstructor = getNodeConstructor(getNode);
            return (
                typeof NodeConstructor === "function" &&
                value instanceof NodeConstructor
            );
        },
    };
}

function getRequiredProvider<T>(
    provider: MapDocumentListenersRuntimeProvider<T>,
    providerLabel: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `mapDocumentListeners requires ${providerLabel} provider`
        );
    }

    return provider;
}
