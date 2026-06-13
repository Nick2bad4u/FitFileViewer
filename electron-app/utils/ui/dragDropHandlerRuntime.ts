export interface DragDropHandlerRuntimeScope {
    readonly cancelAnimationFrame?:
        | typeof globalThis.cancelAnimationFrame
        | undefined;
    readonly requestAnimationFrame?:
        | typeof globalThis.requestAnimationFrame
        | undefined;
}

export interface DragDropHandlerRuntime {
    cancelAnimationFrame(handle: number): void;
    requestAnimationFrame(onFrame: FrameRequestCallback): null | number;
}

export function getDragDropHandlerRuntime(
    scope: DragDropHandlerRuntimeScope = globalThis
): DragDropHandlerRuntime {
    return {
        cancelAnimationFrame(handle: number): void {
            scope.cancelAnimationFrame?.(handle);
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
