type MapDocumentListenersDocument = Pick<Document, "addEventListener">;
type MapDocumentListenersResizeTarget = Pick<Window, "addEventListener">;

export interface MapDocumentListenersRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocument?:
        | (() => MapDocumentListenersDocument | undefined)
        | undefined;
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
        getAbortController: () => globalThis.AbortController,
        getDocument: () => globalThis.document,
        getResizeTarget: () => globalThis,
    };

function getAbortController(
    scope: MapDocumentListenersRuntimeScope
): typeof AbortController | undefined {
    return scope.getAbortController?.();
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
    };
}
