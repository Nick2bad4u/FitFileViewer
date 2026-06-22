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
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getCancelAnimationFrame?:
        | (() => DataPointFilterPanelCancelAnimationFrame | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getNode?: (() => typeof Node | undefined) | undefined;
    readonly getRequestAnimationFrame?:
        | (() => DataPointFilterPanelRequestAnimationFrame | undefined)
        | undefined;
    readonly getViewport?: (() => ViewportEventTarget | undefined) | undefined;
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

function getAbortControllerConstructor(
    scope: DataPointFilterPanelControllerRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "data point filter panel controller requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(
    scope: DataPointFilterPanelControllerRuntimeScope
): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError(
            "data point filter panel controller requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getNodeConstructor(
    scope: DataPointFilterPanelControllerRuntimeScope
): typeof Node {
    const NodeConstructor = scope.getNode?.();
    if (typeof NodeConstructor !== "function") {
        throw new TypeError(
            "data point filter panel controller requires a Node runtime"
        );
    }

    return NodeConstructor;
}

function getViewport(
    scope: DataPointFilterPanelControllerRuntimeScope
): ViewportEventTarget {
    const viewport = scope.getViewport?.();
    if (!viewport) {
        throw new TypeError(
            "data point filter panel controller requires a viewport runtime"
        );
    }

    return viewport;
}

function getAnimationFrameRequester(
    scope: DataPointFilterPanelControllerRuntimeScope
): (
    callback: PanelFrameRequestCallback
) => DataPointFilterPanelAnimationFrameHandle {
    const requestFrame = scope.getRequestAnimationFrame?.();
    if (typeof requestFrame !== "function") {
        throw new TypeError(
            "data point filter panel controller requires a requestAnimationFrame runtime"
        );
    }

    return requestFrame;
}

function getAnimationFrameCanceler(
    scope: DataPointFilterPanelControllerRuntimeScope
): (handle: DataPointFilterPanelAnimationFrameHandle) => void {
    const cancelFrame = scope.getCancelAnimationFrame?.();
    if (typeof cancelFrame !== "function") {
        throw new TypeError(
            "data point filter panel controller requires a cancelAnimationFrame runtime"
        );
    }

    return cancelFrame;
}

const defaultDataPointFilterPanelControllerRuntimeScope: DataPointFilterPanelControllerRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getCancelAnimationFrame: () => globalThis.cancelAnimationFrame,
        getDocument: () => globalThis.document,
        getNode: () => globalThis.Node,
        getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
        getViewport: () => globalThis,
    };

export function getDataPointFilterPanelControllerRuntime(
    scope: DataPointFilterPanelControllerRuntimeScope = defaultDataPointFilterPanelControllerRuntimeScope
): DataPointFilterPanelControllerRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        addDocumentKeydownListener(
            listener: (event: Readonly<KeyboardEvent>) => void,
            options: PanelListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by the open panel lifecycle.
            getDocument(scope).addEventListener("keydown", listener, options);
        },
        addDocumentMouseDownListener(
            listener: (event: Readonly<MouseEvent>) => void,
            options: PanelListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by the open panel lifecycle.
            getDocument(scope).addEventListener("mousedown", listener, options);
        },
        addViewportResizeListener(
            listener: PanelViewportListener,
            options: PanelListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by the open panel lifecycle.
            getViewport(scope).addEventListener("resize", listener, options);
        },
        addViewportScrollListener(
            listener: PanelViewportListener,
            options: PanelListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by the open panel lifecycle.
            getViewport(scope).addEventListener("scroll", listener, options);
        },
        cancelAnimationFrame(
            handle: DataPointFilterPanelAnimationFrameHandle
        ): void {
            getAnimationFrameCanceler(scope)(handle);
        },
        getBody(): HTMLElement | null {
            return getDocument(scope).body;
        },
        getViewportSize(): { height: number; width: number } {
            const viewport = getViewport(scope);
            return {
                height: viewport.innerHeight,
                width: viewport.innerWidth,
            };
        },
        isNode(value: unknown): value is Node {
            return value instanceof getNodeConstructor(scope);
        },
        requestAnimationFrame(
            callback: PanelFrameRequestCallback
        ): DataPointFilterPanelAnimationFrameHandle {
            return getAnimationFrameRequester(scope)(callback);
        },
    };
}
