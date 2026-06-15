export type MapMeasureToolTimer = ReturnType<typeof globalThis.setTimeout>;

type MapMeasureToolDocument = Pick<
    Document,
    "addEventListener" | "removeEventListener"
>;

export interface MapMeasureToolRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly document?: MapMeasureToolDocument | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface MapMeasureToolRuntime {
    addDocumentKeydownListener(
        listener: (event: KeyboardEvent) => void,
        options: AddEventListenerOptions
    ): void;
    clearTimeout(timer: MapMeasureToolTimer): void;
    createAbortController(): AbortController;
    removeDocumentKeydownListener(listener: (event: KeyboardEvent) => void): void;
    setTimeout(callback: () => void, delayMs: number): MapMeasureToolTimer;
}

const defaultMapMeasureToolRuntimeScope: MapMeasureToolRuntimeScope =
    globalThis;

export function getMapMeasureToolRuntime(
    scope: MapMeasureToolRuntimeScope = defaultMapMeasureToolRuntimeScope
): MapMeasureToolRuntime {
    return {
        addDocumentKeydownListener(listener, options): void {
            const runtimeDocument = scope.document;
            if (!runtimeDocument) {
                throw new TypeError("mapMeasureTool requires a document runtime");
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener("keydown", listener, options);
        },
        clearTimeout(timer): void {
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mapMeasureTool requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(timer);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "mapMeasureTool requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        removeDocumentKeydownListener(listener): void {
            const runtimeDocument = scope.document;
            if (!runtimeDocument) {
                throw new TypeError("mapMeasureTool requires a document runtime");
            }

            runtimeDocument.removeEventListener("keydown", listener);
        },
        setTimeout(callback, delayMs): MapMeasureToolTimer {
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mapMeasureTool requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
