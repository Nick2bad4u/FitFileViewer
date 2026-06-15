export interface DragDropHandlerRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly cancelAnimationFrame?:
        | typeof globalThis.cancelAnimationFrame
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
    get AbortController(): typeof globalThis.AbortController | undefined {
        return globalThis.AbortController;
    },
    get cancelAnimationFrame():
        | typeof globalThis.cancelAnimationFrame
        | undefined {
        return globalThis.cancelAnimationFrame;
    },
    get requestAnimationFrame():
        | typeof globalThis.requestAnimationFrame
        | undefined {
        return globalThis.requestAnimationFrame;
    },
};

export function getDragDropHandlerRuntime(
    scope: DragDropHandlerRuntimeScope = defaultDragDropHandlerRuntimeScope
): DragDropHandlerRuntime {
    return {
        cancelAnimationFrame(handle: number): void {
            scope.cancelAnimationFrame?.(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "dragDropHandler requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        requestAnimationFrame(onFrame: FrameRequestCallback): null | number {
            if (typeof scope.requestAnimationFrame !== "function") {
                onFrame(0);
                return null;
            }

            return scope.requestAnimationFrame(onFrame);
        },
    };
}
