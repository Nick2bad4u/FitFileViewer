export interface DragDropHandlerRuntimeScope {
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
}

export interface DragDropHandlerRuntime {
    readonly cancelAnimationFrame: (handle: number) => void;
    readonly createAbortController: () => AbortController;
    readonly getDocument: () => Document | null;
    readonly getEventTarget: () => EventTarget;
    readonly requestAnimationFrame: (
        onFrame: FrameRequestCallback
    ) => null | number;
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
    return scope.getAbortController?.();
}

function getCancelAnimationFrame(
    scope: DragDropHandlerRuntimeScope
): typeof globalThis.cancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.();
}

function getDocument(scope: DragDropHandlerRuntimeScope): Document | undefined {
    return scope.getDocument?.();
}

function getEventTarget(
    scope: DragDropHandlerRuntimeScope
): EventTarget | undefined {
    return scope.getEventTarget?.();
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
