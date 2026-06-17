export type MapFullscreenControlTimer = ReturnType<
    typeof globalThis.setTimeout
>;

type MapFullscreenControlDocument = Pick<Document, "addEventListener">;

export interface MapFullscreenControlRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?:
        | (() => MapFullscreenControlDocument | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface MapFullscreenControlRuntime {
    readonly addDocumentFullscreenChangeListener: (
        listener: EventListener,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly clearTimeout: (timer: MapFullscreenControlTimer) => void;
    readonly createAbortController: () => AbortController;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => MapFullscreenControlTimer;
}

const defaultMapFullscreenControlRuntimeScope: MapFullscreenControlRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getClearTimeout: () => globalThis.clearTimeout,
        getDocument: () => globalThis.document,
        getSetTimeout: () => globalThis.setTimeout,
    };

export function getMapFullscreenControlRuntime(
    scope: MapFullscreenControlRuntimeScope = defaultMapFullscreenControlRuntimeScope
): MapFullscreenControlRuntime {
    return {
        addDocumentFullscreenChangeListener(listener, options): void {
            const runtimeDocument = scope.getDocument?.();
            if (!runtimeDocument) {
                throw new TypeError(
                    "mapFullscreenControl requires a document runtime"
                );
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener(
                "fullscreenchange",
                listener,
                options
            );
        },
        clearTimeout(timer): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mapFullscreenControl requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(timer);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "mapFullscreenControl requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        setTimeout(callback, delayMs): MapFullscreenControlTimer {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mapFullscreenControl requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
