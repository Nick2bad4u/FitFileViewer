export interface DragDropHandlerRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly cancelAnimationFrame?:
        | typeof globalThis.cancelAnimationFrame
        | undefined;
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getCancelAnimationFrame?:
        | (() => typeof globalThis.cancelAnimationFrame | undefined)
        | undefined;
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
    requestAnimationFrame(onFrame: FrameRequestCallback): null | number;
}

const defaultDragDropHandlerRuntimeScope: DragDropHandlerRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getCancelAnimationFrame: () => globalThis.cancelAnimationFrame,
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
