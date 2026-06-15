type MapDocumentListenersDocument = Pick<Document, "addEventListener">;
type MapDocumentListenersWindow = Pick<Window, "addEventListener">;

export interface MapDocumentListenersRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly document?: MapDocumentListenersDocument | undefined;
    readonly window?: MapDocumentListenersWindow | undefined;
}

export interface MapDocumentListenersRuntime {
    addDocumentMousedownListener(
        listener: (event: MouseEvent) => void,
        options: AddEventListenerOptions
    ): void;
    addDocumentMouseupListener(
        listener: (event: MouseEvent) => void,
        options: AddEventListenerOptions
    ): void;
    addDocumentTouchendListener(
        listener: () => void,
        options: AddEventListenerOptions
    ): void;
    addWindowResizeListener(
        listener: () => void,
        options: AddEventListenerOptions
    ): void;
    createAbortController(): AbortController;
}

function getRuntimeDocument(
    scope: MapDocumentListenersRuntimeScope
): MapDocumentListenersDocument {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError("mapDocumentListeners requires a document runtime");
    }

    return runtimeDocument;
}

function getRuntimeWindow(
    scope: MapDocumentListenersRuntimeScope
): MapDocumentListenersWindow {
    const runtimeWindow = scope.window;
    if (!runtimeWindow) {
        throw new TypeError("mapDocumentListeners requires a window runtime");
    }

    return runtimeWindow;
}

export function getMapDocumentListenersRuntime(
    scope: MapDocumentListenersRuntimeScope = globalThis
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
            const runtimeWindow = getRuntimeWindow(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeWindow.addEventListener("resize", listener, options);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "mapDocumentListeners requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}
