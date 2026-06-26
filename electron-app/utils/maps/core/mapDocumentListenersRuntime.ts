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
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getDocument?:
        | (() => MapDocumentListenersDocument | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
    readonly getNode?: (() => BrowserNodeConstructor | undefined) | undefined;
    readonly getResizeTarget?:
        | (() => MapDocumentListenersResizeTarget | undefined)
        | undefined;
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

function getRuntimeDocument(
    scope: MapDocumentListenersRuntimeScope
): MapDocumentListenersDocument {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("mapDocumentListeners requires a document runtime");
    }

    return runtimeDocument;
}

function getRuntimeResizeTarget(
    scope: MapDocumentListenersRuntimeScope
): MapDocumentListenersResizeTarget {
    const runtimeResizeTarget = scope.getResizeTarget?.();
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
    scope: MapDocumentListenersRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return scope.getAbortController?.();
}

function getHTMLElementConstructor(
    scope: MapDocumentListenersRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    return scope.getHTMLElement?.();
}

function getNodeConstructor(
    scope: MapDocumentListenersRuntimeScope
): BrowserNodeConstructor | undefined {
    return scope.getNode?.();
}

export function getMapDocumentListenersRuntime(
    scope: MapDocumentListenersRuntimeScope = defaultMapDocumentListenersRuntimeScope
): MapDocumentListenersRuntime {
    return {
        addDocumentMousedownListener(listener, options): void {
            const runtimeDocument = getRuntimeDocument(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener("mousedown", listener, options);
        },
        addDocumentMouseupListener(listener, options): void {
            const runtimeDocument = getRuntimeDocument(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener("mouseup", listener, options);
        },
        addDocumentTouchendListener(listener, options): void {
            const runtimeDocument = getRuntimeDocument(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener("touchend", listener, options);
        },
        addWindowResizeListener(listener, options): void {
            const runtimeResizeTarget = getRuntimeResizeTarget(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeResizeTarget.addEventListener("resize", listener, options);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "mapDocumentListeners requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getLayersControlElement(): HTMLElement | null {
            return getRuntimeDocument(scope).querySelector<HTMLElement>(
                ".leaflet-control-layers"
            );
        },
        isHTMLElement(value: unknown): value is HTMLElement {
            const HTMLElementConstructor = getHTMLElementConstructor(scope);
            return (
                typeof HTMLElementConstructor === "function" &&
                value instanceof HTMLElementConstructor
            );
        },
        isNode(value: unknown): value is Node {
            const NodeConstructor = getNodeConstructor(scope);
            return (
                typeof NodeConstructor === "function" &&
                value instanceof NodeConstructor
            );
        },
    };
}
