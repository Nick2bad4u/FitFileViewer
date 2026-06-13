export interface RenderSummaryRuntimeScope {
    readonly addEventListener?:
        | typeof globalThis.addEventListener
        | undefined;
    readonly cancelAnimationFrame?:
        | typeof globalThis.cancelAnimationFrame
        | undefined;
    readonly requestAnimationFrame?:
        | typeof globalThis.requestAnimationFrame
        | undefined;
}

export interface RenderSummaryRuntime {
    addResizeListener(
        listener: EventListener,
        options?: AddEventListenerOptions
    ): void;
    cancelAnimationFrame(handle: number): void;
    requestAnimationFrame(callback: FrameRequestCallback): null | number;
}

export function getRenderSummaryRuntime(
    scope: RenderSummaryRuntimeScope = globalThis
): RenderSummaryRuntime {
    return {
        addResizeListener(
            listener: EventListener,
            options?: AddEventListenerOptions
        ): void {
            scope.addEventListener?.call(scope, "resize", listener, options);
        },
        cancelAnimationFrame(handle: number): void {
            scope.cancelAnimationFrame?.call(scope, handle);
        },
        requestAnimationFrame(callback: FrameRequestCallback): null | number {
            if (typeof scope.requestAnimationFrame !== "function") {
                return null;
            }

            return scope.requestAnimationFrame.call(scope, callback);
        },
    };
}
