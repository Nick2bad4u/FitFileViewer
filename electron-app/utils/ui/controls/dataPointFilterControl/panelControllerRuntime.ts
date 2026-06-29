import {
    type BrowserAbortControllerConstructor,
    type BrowserNodeConstructor,
    getBrowserAbortController,
    getBrowserCancelAnimationFrame,
    getBrowserDocument,
    getBrowserNode,
    getBrowserRequestAnimationFrame,
    getBrowserViewportEventTarget,
} from "../../../runtime/browserRuntime.js";

export type DataPointFilterPanelAnimationFrameHandle = number;

type PanelFrameRequestCallback = (time: number) => void;
type PanelListenerOptions = Readonly<AddEventListenerOptions>;
type PanelViewportListener = (event: Readonly<Event>) => void;

type DataPointFilterPanelCancelAnimationFrame = (
    handle: DataPointFilterPanelAnimationFrameHandle
) => void;
type DataPointFilterPanelRequestAnimationFrame = (
    callback: PanelFrameRequestCallback
) => DataPointFilterPanelAnimationFrameHandle;
type DataPointFilterPanelControllerRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

type ViewportEventTarget = {
    readonly addEventListener: (
        type: "resize" | "scroll",
        listener: PanelViewportListener,
        options?: PanelListenerOptions
    ) => void;
    readonly innerHeight: number;
    readonly innerWidth: number;
};

export interface DataPointFilterPanelControllerRuntimeScope {
    readonly getAbortController: DataPointFilterPanelControllerRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getCancelAnimationFrame: DataPointFilterPanelControllerRuntimeProvider<DataPointFilterPanelCancelAnimationFrame>;
    readonly getDocument: DataPointFilterPanelControllerRuntimeProvider<Document>;
    readonly getNode: DataPointFilterPanelControllerRuntimeProvider<BrowserNodeConstructor>;
    readonly getRequestAnimationFrame: DataPointFilterPanelControllerRuntimeProvider<DataPointFilterPanelRequestAnimationFrame>;
    readonly getViewport: DataPointFilterPanelControllerRuntimeProvider<ViewportEventTarget>;
}

export interface DataPointFilterPanelControllerRuntime {
    createAbortController: () => AbortController;
    addDocumentKeydownListener: (
        listener: (event: Readonly<KeyboardEvent>) => void,
        options: PanelListenerOptions
    ) => void;
    addDocumentMouseDownListener: (
        listener: (event: Readonly<MouseEvent>) => void,
        options: PanelListenerOptions
    ) => void;
    addViewportResizeListener: (
        listener: PanelViewportListener,
        options: PanelListenerOptions
    ) => void;
    addViewportScrollListener: (
        listener: PanelViewportListener,
        options: PanelListenerOptions
    ) => void;
    cancelAnimationFrame: (
        handle: DataPointFilterPanelAnimationFrameHandle
    ) => void;
    getBody: () => HTMLElement | null;
    getViewportSize: () => { height: number; width: number };
    isNode: (value: unknown) => value is Node;
    requestAnimationFrame: (
        callback: PanelFrameRequestCallback
    ) => DataPointFilterPanelAnimationFrameHandle;
}

function getRequiredProvider<T>(
    provider: DataPointFilterPanelControllerRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `data point filter panel controller requires ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    getAbortController: () => BrowserAbortControllerConstructor | undefined
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getAbortController();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "data point filter panel controller requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(
    getDocumentProvider: () => Document | undefined
): Document {
    const runtimeDocument = getDocumentProvider();
    if (!runtimeDocument) {
        throw new TypeError(
            "data point filter panel controller requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getNodeConstructor(
    getNode: () => BrowserNodeConstructor | undefined
): BrowserNodeConstructor {
    const NodeConstructor = getNode();
    if (typeof NodeConstructor !== "function") {
        throw new TypeError(
            "data point filter panel controller requires a Node runtime"
        );
    }

    return NodeConstructor;
}

function getViewport(
    getViewportProvider: () => ViewportEventTarget | undefined
): ViewportEventTarget {
    const viewport = getViewportProvider();
    if (!viewport) {
        throw new TypeError(
            "data point filter panel controller requires a viewport runtime"
        );
    }

    return viewport;
}

function getAnimationFrameRequester(
    getRequestAnimationFrame: () =>
        | DataPointFilterPanelRequestAnimationFrame
        | undefined
): (
    callback: PanelFrameRequestCallback
) => DataPointFilterPanelAnimationFrameHandle {
    const requestFrame = getRequestAnimationFrame();
    if (typeof requestFrame !== "function") {
        throw new TypeError(
            "data point filter panel controller requires a requestAnimationFrame runtime"
        );
    }

    return requestFrame;
}

function getAnimationFrameCanceler(
    getCancelAnimationFrame: () =>
        | DataPointFilterPanelCancelAnimationFrame
        | undefined
): (handle: DataPointFilterPanelAnimationFrameHandle) => void {
    const cancelFrame = getCancelAnimationFrame();
    if (typeof cancelFrame !== "function") {
        throw new TypeError(
            "data point filter panel controller requires a cancelAnimationFrame runtime"
        );
    }

    return cancelFrame;
}

const defaultDataPointFilterPanelControllerRuntimeScope: DataPointFilterPanelControllerRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getCancelAnimationFrame: getBrowserCancelAnimationFrame,
        getDocument: getBrowserDocument,
        getNode: getBrowserNode,
        getRequestAnimationFrame: getBrowserRequestAnimationFrame,
        getViewport: getBrowserViewportEventTarget,
    };

export function getDataPointFilterPanelControllerRuntime(
    scope: DataPointFilterPanelControllerRuntimeScope = defaultDataPointFilterPanelControllerRuntimeScope
): DataPointFilterPanelControllerRuntime {
    const getAbortController = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    );
    const getCancelAnimationFrame = getRequiredProvider(
        scope.getCancelAnimationFrame,
        "cancelAnimationFrame"
    );
    const getDocumentProvider = getRequiredProvider(
        scope.getDocument,
        "document"
    );
    const getNode = getRequiredProvider(scope.getNode, "Node");
    const getRequestAnimationFrame = getRequiredProvider(
        scope.getRequestAnimationFrame,
        "requestAnimationFrame"
    );
    const getViewportProvider = getRequiredProvider(
        scope.getViewport,
        "viewport"
    );

    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(getAbortController))();
        },
        addDocumentKeydownListener(
            listener: (event: Readonly<KeyboardEvent>) => void,
            options: PanelListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by the open panel lifecycle.
            getDocument(getDocumentProvider).addEventListener(
                "keydown",
                listener,
                options
            );
        },
        addDocumentMouseDownListener(
            listener: (event: Readonly<MouseEvent>) => void,
            options: PanelListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by the open panel lifecycle.
            getDocument(getDocumentProvider).addEventListener(
                "mousedown",
                listener,
                options
            );
        },
        addViewportResizeListener(
            listener: PanelViewportListener,
            options: PanelListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by the open panel lifecycle.
            getViewport(getViewportProvider).addEventListener(
                "resize",
                listener,
                options
            );
        },
        addViewportScrollListener(
            listener: PanelViewportListener,
            options: PanelListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by the open panel lifecycle.
            getViewport(getViewportProvider).addEventListener(
                "scroll",
                listener,
                options
            );
        },
        cancelAnimationFrame(
            handle: DataPointFilterPanelAnimationFrameHandle
        ): void {
            getAnimationFrameCanceler(getCancelAnimationFrame)(handle);
        },
        getBody(): HTMLElement | null {
            return getDocument(getDocumentProvider).body;
        },
        getViewportSize(): { height: number; width: number } {
            const viewport = getViewport(getViewportProvider);
            return {
                height: viewport.innerHeight,
                width: viewport.innerWidth,
            };
        },
        isNode(value: unknown): value is Node {
            return value instanceof getNodeConstructor(getNode);
        },
        requestAnimationFrame(
            callback: PanelFrameRequestCallback
        ): DataPointFilterPanelAnimationFrameHandle {
            return getAnimationFrameRequester(getRequestAnimationFrame)(
                callback
            );
        },
    };
}
