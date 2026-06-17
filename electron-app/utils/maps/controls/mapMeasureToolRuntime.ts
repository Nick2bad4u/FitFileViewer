export type MapMeasureToolTimer = ReturnType<typeof globalThis.setTimeout>;

type MapMeasureToolDocument = Pick<
    Document,
    "addEventListener" | "removeEventListener"
>;
type MapMeasureToolKeydownListener = (event: Readonly<KeyboardEvent>) => void;

export interface MapMeasureToolRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?:
        | (() => MapMeasureToolDocument | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface MapMeasureToolRuntime {
    readonly addDocumentKeydownListener: (
        listener: MapMeasureToolKeydownListener,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly clearTimeout: (timer: MapMeasureToolTimer) => void;
    readonly createAbortController: () => AbortController;
    readonly removeDocumentKeydownListener: (
        listener: MapMeasureToolKeydownListener
    ) => void;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => MapMeasureToolTimer;
}

const defaultMapMeasureToolRuntimeScope: MapMeasureToolRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getClearTimeout: () => globalThis.clearTimeout,
    getDocument: () => globalThis.document,
    getSetTimeout: () => globalThis.setTimeout,
};

function getRequiredDocument(
    scope: MapMeasureToolRuntimeScope
): MapMeasureToolDocument {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("mapMeasureTool requires a document runtime");
    }

    return runtimeDocument;
}

export function getMapMeasureToolRuntime(
    scope: MapMeasureToolRuntimeScope = defaultMapMeasureToolRuntimeScope
): MapMeasureToolRuntime {
    return {
        addDocumentKeydownListener(listener, options): void {
            const runtimeDocument = getRequiredDocument(scope);

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-owned AbortSignal.
            runtimeDocument.addEventListener("keydown", listener, options);
        },
        clearTimeout(timer): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mapMeasureTool requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(timer);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "mapMeasureTool requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        removeDocumentKeydownListener(listener): void {
            const runtimeDocument = getRequiredDocument(scope);

            runtimeDocument.removeEventListener("keydown", listener);
        },
        setTimeout(callback, delayMs): MapMeasureToolTimer {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mapMeasureTool requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
