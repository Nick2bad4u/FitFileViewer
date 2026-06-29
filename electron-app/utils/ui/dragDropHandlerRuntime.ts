import {
    type BrowserAbortControllerConstructor,
    type BrowserCancelAnimationFrame,
    type BrowserFileReaderConstructor,
    type BrowserRequestAnimationFrame,
    getBrowserAbortController,
    getBrowserCancelAnimationFrame,
    getBrowserDateNow,
    getBrowserDocument,
    getBrowserEventTarget,
    getBrowserFileReader,
    getBrowserRequestAnimationFrame,
} from "../runtime/browserRuntime.js";

type DragDropHandlerRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface DragDropHandlerRuntimeScope {
    readonly getAbortController: DragDropHandlerRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getCancelAnimationFrame: DragDropHandlerRuntimeProvider<BrowserCancelAnimationFrame>;
    readonly getDateNow: DragDropHandlerRuntimeProvider<() => number>;
    readonly getDocument: DragDropHandlerRuntimeProvider<Document>;
    readonly getEventTarget: DragDropHandlerRuntimeProvider<EventTarget>;
    readonly getFileReader: DragDropHandlerRuntimeProvider<BrowserFileReaderConstructor>;
    readonly getRequestAnimationFrame: DragDropHandlerRuntimeProvider<BrowserRequestAnimationFrame>;
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

function getRequiredProvider<T>(
    provider: DragDropHandlerRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (provider === undefined) {
        throw new TypeError(
            `dragDropHandler requires ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: DragDropHandlerRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return getRequiredProvider(scope.getAbortController, "AbortController")();
}

function getCancelAnimationFrame(
    scope: DragDropHandlerRuntimeScope
): BrowserCancelAnimationFrame | undefined {
    return getRequiredProvider(
        scope.getCancelAnimationFrame,
        "cancelAnimationFrame"
    )();
}

function getDateNow(scope: DragDropHandlerRuntimeScope): () => number {
    const dateNow = getRequiredProvider(scope.getDateNow, "date clock")();
    if (typeof dateNow !== "function") {
        throw new TypeError("dragDropHandler requires a date clock runtime");
    }

    return dateNow;
}

function getDocument(scope: DragDropHandlerRuntimeScope): Document | undefined {
    return getRequiredProvider(scope.getDocument, "document")();
}

function getEventTarget(
    scope: DragDropHandlerRuntimeScope
): EventTarget | undefined {
    return getRequiredProvider(scope.getEventTarget, "event target")();
}

function getFileReaderConstructor(
    scope: DragDropHandlerRuntimeScope
): BrowserFileReaderConstructor | undefined {
    return getRequiredProvider(scope.getFileReader, "FileReader")();
}

function getRequestAnimationFrame(
    scope: DragDropHandlerRuntimeScope
): BrowserRequestAnimationFrame | undefined {
    return getRequiredProvider(
        scope.getRequestAnimationFrame,
        "requestAnimationFrame"
    )();
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
