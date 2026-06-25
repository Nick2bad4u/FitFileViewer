import {
    getBrowserAbortController,
    getBrowserCancelAnimationFrame,
    getBrowserDateNow,
    getBrowserDocument,
    getBrowserEventTarget,
    getBrowserFileReader,
    getBrowserRequestAnimationFrame,
} from "../runtime/browserRuntime.js";

export interface DragDropHandlerRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getCancelAnimationFrame?:
        | (() => typeof globalThis.cancelAnimationFrame | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getEventTarget?: (() => EventTarget | undefined) | undefined;
    readonly getFileReader?: (() => typeof FileReader | undefined) | undefined;
    readonly getRequestAnimationFrame?:
        | (() => typeof globalThis.requestAnimationFrame | undefined)
        | undefined;
}

export interface DragDropHandlerRuntime {
    readonly cancelAnimationFrame: (handle: number) => void;
    readonly createAbortController: () => AbortController;
    readonly createFileReader: () => FileReader;
    readonly dateNow: () => number;
    readonly getDocument: () => Document | null;
    readonly getEventTarget: () => EventTarget;
    readonly requestAnimationFrame: (
        onFrame: FrameRequestCallback
    ) => null | number;
}

const defaultDragDropHandlerRuntimeScope: DragDropHandlerRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getCancelAnimationFrame: getBrowserCancelAnimationFrame,
    getDateNow: getBrowserDateNow,
    getDocument: getBrowserDocument,
    getEventTarget: getBrowserEventTarget,
    getFileReader: getBrowserFileReader,
    getRequestAnimationFrame: getBrowserRequestAnimationFrame,
};

function getAbortControllerConstructor(
    scope: DragDropHandlerRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.();
}

function getCancelAnimationFrame(
    scope: DragDropHandlerRuntimeScope
): typeof globalThis.cancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.();
}

function getDateNow(scope: DragDropHandlerRuntimeScope): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow !== "function") {
        throw new TypeError("dragDropHandler requires a date clock runtime");
    }

    return dateNow;
}

function getDocument(scope: DragDropHandlerRuntimeScope): Document | undefined {
    return scope.getDocument?.();
}

function getEventTarget(
    scope: DragDropHandlerRuntimeScope
): EventTarget | undefined {
    return scope.getEventTarget?.();
}

function getFileReaderConstructor(
    scope: DragDropHandlerRuntimeScope
): typeof FileReader | undefined {
    return scope.getFileReader?.();
}

function getRequestAnimationFrame(
    scope: DragDropHandlerRuntimeScope
): typeof globalThis.requestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.();
}

export function getDragDropHandlerRuntime(
    scope: DragDropHandlerRuntimeScope = defaultDragDropHandlerRuntimeScope
): DragDropHandlerRuntime {
    return {
        cancelAnimationFrame(handle: number): void {
            getCancelAnimationFrame(scope)?.call(scope, handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor =
                getAbortControllerConstructor(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "dragDropHandler requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createFileReader(): FileReader {
            const FileReaderConstructor = getFileReaderConstructor(scope);
            if (typeof FileReaderConstructor !== "function") {
                throw new TypeError(
                    "dragDropHandler requires a FileReader runtime"
                );
            }

            return new FileReaderConstructor();
        },
        dateNow(): number {
            return getDateNow(scope)();
        },
        getDocument(): Document | null {
            return getDocument(scope) ?? null;
        },
        getEventTarget(): EventTarget {
            const eventTarget = getEventTarget(scope);
            if (!eventTarget) {
                throw new TypeError(
                    "dragDropHandler requires an event target runtime"
                );
            }

            return eventTarget;
        },
        requestAnimationFrame(onFrame: FrameRequestCallback): null | number {
            const requestAnimationFrame = getRequestAnimationFrame(scope);
            if (typeof requestAnimationFrame !== "function") {
                onFrame(0);
                return null;
            }

            return requestAnimationFrame.call(scope, onFrame);
        },
    };
}
