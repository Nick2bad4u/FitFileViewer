export interface DragDropHandlerRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly cancelAnimationFrame?:
        | typeof globalThis.cancelAnimationFrame
        | undefined;
    readonly document?: Document | undefined;
    readonly eventTarget?: EventTarget | undefined;
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getCancelAnimationFrame?:
        | (() => typeof globalThis.cancelAnimationFrame | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getEventTarget?: (() => EventTarget | undefined) | undefined;
    readonly getRequestAnimationFrame?:
        | (() => typeof globalThis.requestAnimationFrame | undefined)
        | undefined;
    readonly requestAnimationFrame?:
        | typeof globalThis.requestAnimationFrame
        | undefined;
}

export interface DragDropHandlerRuntime {
    cancelAnimationFrame(handle: number): void;
    createAbortController(): AbortController;
    getDocument(): Document | null;
    getEventTarget(): EventTarget;
    requestAnimationFrame(onFrame: FrameRequestCallback): null | number;
}

const defaultDragDropHandlerRuntimeScope: DragDropHandlerRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getCancelAnimationFrame: () => globalThis.cancelAnimationFrame,
    getDocument: () => globalThis.document,
    getEventTarget: () => globalThis,
    getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
};

function getAbortControllerConstructor(
    scope: DragDropHandlerRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.() ?? scope.AbortController;
}

function getCancelAnimationFrame(
    scope: DragDropHandlerRuntimeScope
): typeof globalThis.cancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.() ?? scope.cancelAnimationFrame;
}

function getDocument(scope: DragDropHandlerRuntimeScope): Document | undefined {
    return scope.getDocument?.() ?? scope.document;
}

function getEventTarget(
    scope: DragDropHandlerRuntimeScope
): EventTarget | undefined {
    return scope.getEventTarget?.() ?? scope.eventTarget;
}

function getRequestAnimationFrame(
    scope: DragDropHandlerRuntimeScope
): typeof globalThis.requestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.() ?? scope.requestAnimationFrame;
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
