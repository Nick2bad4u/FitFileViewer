type MapLapSelectorDocument = Pick<
    Document,
    "addEventListener" | "removeEventListener"
>;
type MapLapSelectorKeydownListener = (event: Readonly<KeyboardEvent>) => void;
type MapLapSelectorMouseListener = (event: Readonly<MouseEvent>) => void;

export interface MapLapSelectorRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getDocument?:
        | (() => MapLapSelectorDocument | undefined)
        | undefined;
}

export interface MapLapSelectorRuntime {
    readonly addDocumentKeydownListener: (
        listener: MapLapSelectorKeydownListener,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly addDocumentMousedownListener: (
        listener: MapLapSelectorMouseListener,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly addDocumentMouseupListener: (
        listener: MapLapSelectorMouseListener,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly createAbortController: () => AbortController;
    readonly removeDocumentKeydownListener: (
        listener: MapLapSelectorKeydownListener
    ) => void;
    readonly removeDocumentMousedownListener: (
        listener: MapLapSelectorMouseListener
    ) => void;
    readonly removeDocumentMouseupListener: (
        listener: MapLapSelectorMouseListener
    ) => void;
}

function getRuntimeDocument(
    scope: MapLapSelectorRuntimeScope
): MapLapSelectorDocument {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("mapLapSelector requires a document runtime");
    }

    return runtimeDocument;
}

const defaultMapLapSelectorRuntimeScope: MapLapSelectorRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getDocument: () => globalThis.document,
};

export function getMapLapSelectorRuntime(
    scope: MapLapSelectorRuntimeScope = defaultMapLapSelectorRuntimeScope
): MapLapSelectorRuntime {
    return {
        addDocumentKeydownListener(listener, options): void {
            const runtimeDocument = getRuntimeDocument(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener("keydown", listener, options);
        },
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
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "mapLapSelector requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        removeDocumentKeydownListener(listener): void {
            const runtimeDocument = getRuntimeDocument(scope);
            runtimeDocument.removeEventListener("keydown", listener);
        },
        removeDocumentMousedownListener(listener): void {
            const runtimeDocument = getRuntimeDocument(scope);
            runtimeDocument.removeEventListener("mousedown", listener, true);
        },
        removeDocumentMouseupListener(listener): void {
            const runtimeDocument = getRuntimeDocument(scope);
            runtimeDocument.removeEventListener("mouseup", listener);
        },
    };
}
