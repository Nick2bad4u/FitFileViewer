export type MapFullscreenControlTimer = ReturnType<
    typeof globalThis.setTimeout
>;

type MapFullscreenControlDocument = Pick<Document, "addEventListener">;

export interface MapFullscreenControlRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly document?: MapFullscreenControlDocument | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface MapFullscreenControlRuntime {
    addDocumentFullscreenChangeListener(
        listener: EventListener,
        options: AddEventListenerOptions
    ): void;
    clearTimeout(timer: MapFullscreenControlTimer): void;
    createAbortController(): AbortController;
    setTimeout(
        callback: () => void,
        delayMs: number
    ): MapFullscreenControlTimer;
}

export function getMapFullscreenControlRuntime(
    scope: MapFullscreenControlRuntimeScope = globalThis
): MapFullscreenControlRuntime {
    return {
        addDocumentFullscreenChangeListener(listener, options): void {
            const runtimeDocument = scope.document ?? globalThis.document;
            if (!runtimeDocument) {
                return;
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener(
                "fullscreenchange",
                listener,
                options
            );
        },
        clearTimeout(timer): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(timer);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "mapFullscreenControl requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        setTimeout(callback, delayMs): MapFullscreenControlTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
