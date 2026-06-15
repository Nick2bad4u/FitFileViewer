export type TabStateManagerHandlersTimerHandle =
    ReturnType<typeof globalThis.setTimeout>;

export interface TabStateManagerHandlersRuntimeScope {
    readonly cancelAnimationFrame?:
        | typeof globalThis.cancelAnimationFrame
        | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly requestAnimationFrame?:
        | typeof globalThis.requestAnimationFrame
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface TabStateManagerHandlersRuntime {
    cancelAnimationFrame(handle: number): void;
    clearTimeout(handle: TabStateManagerHandlersTimerHandle): void;
    requestAnimationFrame(callback: FrameRequestCallback): number | undefined;
    setTimeout(
        callback: () => void,
        delay: number
    ): TabStateManagerHandlersTimerHandle;
}

const defaultTabStateManagerHandlersRuntimeScope: TabStateManagerHandlersRuntimeScope =
    globalThis;

export function getTabStateManagerHandlersRuntime(
    scope: TabStateManagerHandlersRuntimeScope = defaultTabStateManagerHandlersRuntimeScope
): TabStateManagerHandlersRuntime {
    return {
        cancelAnimationFrame(handle: number): void {
            scope.cancelAnimationFrame?.(handle);
        },
        clearTimeout(handle: TabStateManagerHandlersTimerHandle): void {
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "tabStateManagerHandlers requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef(handle);
        },
        requestAnimationFrame(
            callback: FrameRequestCallback
        ): number | undefined {
            if (typeof scope.requestAnimationFrame !== "function") {
                return undefined;
            }

            return scope.requestAnimationFrame(callback);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): TabStateManagerHandlersTimerHandle {
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "tabStateManagerHandlers requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, delay);
        },
    };
}
