export type DataPointFilterPanelAnimationFrameHandle = number;

type PanelFrameRequestCallback = FrameRequestCallback;

type ViewportEventTarget = Pick<Window, "addEventListener"> & {
    readonly innerHeight: number;
    readonly innerWidth: number;
};

export interface DataPointFilterPanelControllerRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly cancelAnimationFrame?:
        | ((handle: DataPointFilterPanelAnimationFrameHandle) => void)
        | undefined;
    readonly document?: Document | undefined;
    readonly Node?: typeof Node | undefined;
    readonly requestAnimationFrame?:
        | ((
              callback: PanelFrameRequestCallback
          ) => DataPointFilterPanelAnimationFrameHandle)
        | undefined;
    readonly viewport?: ViewportEventTarget | undefined;
}

export interface DataPointFilterPanelControllerRuntime {
    createAbortController: () => AbortController;
    addDocumentKeydownListener: (
        listener: (event: KeyboardEvent) => void,
        options: AddEventListenerOptions
    ) => void;
    addDocumentMouseDownListener: (
        listener: (event: MouseEvent) => void,
        options: AddEventListenerOptions
    ) => void;
    addViewportResizeListener: (
        listener: EventListener,
        options: AddEventListenerOptions
    ) => void;
    addViewportScrollListener: (
        listener: EventListener,
        options: AddEventListenerOptions
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
    const AbortControllerConstructor =
        scope.AbortController ?? scope.document?.defaultView?.AbortController;
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
    const runtimeDocument = scope.document;
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
    const NodeConstructor = scope.Node ?? scope.document?.defaultView?.Node;
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
    const viewport = scope.viewport ?? scope.document?.defaultView;
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
    const requestFrame =
        scope.requestAnimationFrame ??
        scope.document?.defaultView?.requestAnimationFrame;
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
    const cancelFrame =
        scope.cancelAnimationFrame ??
        scope.document?.defaultView?.cancelAnimationFrame;
    if (typeof cancelFrame !== "function") {
        throw new TypeError(
            "data point filter panel controller requires a cancelAnimationFrame runtime"
        );
    }

    return cancelFrame;
}

const defaultDataPointFilterPanelControllerRuntimeScope: DataPointFilterPanelControllerRuntimeScope =
    globalThis;

export function getDataPointFilterPanelControllerRuntime(
    scope: DataPointFilterPanelControllerRuntimeScope = defaultDataPointFilterPanelControllerRuntimeScope
): DataPointFilterPanelControllerRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        addDocumentKeydownListener(
            listener: (event: KeyboardEvent) => void,
            options: AddEventListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by the open panel lifecycle.
            getDocument(scope).addEventListener("keydown", listener, options);
        },
        addDocumentMouseDownListener(
            listener: (event: MouseEvent) => void,
            options: AddEventListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by the open panel lifecycle.
            getDocument(scope).addEventListener("mousedown", listener, options);
        },
        addViewportResizeListener(
            listener: EventListener,
            options: AddEventListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal owned by the open panel lifecycle.
            getViewport(scope).addEventListener("resize", listener, options);
        },
        addViewportScrollListener(
            listener: EventListener,
            options: AddEventListenerOptions
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
