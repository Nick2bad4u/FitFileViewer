type MapLapSelectorDocument = Pick<
    Document,
    "addEventListener" | "removeEventListener"
>;

export interface MapLapSelectorRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly document?: MapLapSelectorDocument | undefined;
}

export interface MapLapSelectorRuntime {
    addDocumentKeydownListener(
        listener: (event: KeyboardEvent) => void,
        options: AddEventListenerOptions
    ): void;
    addDocumentMousedownListener(
        listener: (event: MouseEvent) => void,
        options: AddEventListenerOptions
    ): void;
    addDocumentMouseupListener(
        listener: (event: MouseEvent) => void,
        options: AddEventListenerOptions
    ): void;
    createAbortController(): AbortController;
    removeDocumentKeydownListener(listener: (event: KeyboardEvent) => void): void;
    removeDocumentMousedownListener(
        listener: (event: MouseEvent) => void
    ): void;
    removeDocumentMouseupListener(listener: (event: MouseEvent) => void): void;
}

export function getMapLapSelectorRuntime(
    scope: MapLapSelectorRuntimeScope = globalThis
): MapLapSelectorRuntime {
    return {
        addDocumentKeydownListener(listener, options): void {
            const runtimeDocument = scope.document ?? globalThis.document;
            if (!runtimeDocument) {
                return;
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener("keydown", listener, options);
        },
        addDocumentMousedownListener(listener, options): void {
            const runtimeDocument = scope.document ?? globalThis.document;
            if (!runtimeDocument) {
                return;
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener("mousedown", listener, options);
        },
        addDocumentMouseupListener(listener, options): void {
            const runtimeDocument = scope.document ?? globalThis.document;
            if (!runtimeDocument) {
                return;
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener("mouseup", listener, options);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "mapLapSelector requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        removeDocumentKeydownListener(listener): void {
            const runtimeDocument = scope.document ?? globalThis.document;
            runtimeDocument?.removeEventListener("keydown", listener);
        },
        removeDocumentMousedownListener(listener): void {
            const runtimeDocument = scope.document ?? globalThis.document;
            runtimeDocument?.removeEventListener("mousedown", listener, true);
        },
        removeDocumentMouseupListener(listener): void {
            const runtimeDocument = scope.document ?? globalThis.document;
            runtimeDocument?.removeEventListener("mouseup", listener);
        },
    };
}
