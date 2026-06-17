export type TabStateManagerHandlersTimerHandle = ReturnType<
    typeof globalThis.setTimeout
>;

export interface TabStateManagerHandlersRuntimeScope {
    readonly getCancelAnimationFrame?:
        | (() => typeof globalThis.cancelAnimationFrame | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getRequestAnimationFrame?:
        | (() => typeof globalThis.requestAnimationFrame | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface TabStateManagerHandlersRuntime {
    readonly cancelAnimationFrame: (handle: number) => void;
    readonly clearTimeout: (handle: TabStateManagerHandlersTimerHandle) => void;
    readonly requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => number | undefined;
    readonly setTimeout: (
        callback: () => void,
        delay: number
    ) => TabStateManagerHandlersTimerHandle;
}

const defaultTabStateManagerHandlersRuntimeScope: TabStateManagerHandlersRuntimeScope =
    {
        getCancelAnimationFrame: () => globalThis.cancelAnimationFrame,
        getClearTimeout: () => globalThis.clearTimeout,
        getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
        getSetTimeout: () => globalThis.setTimeout,
    };

export function getTabStateManagerHandlersRuntime(
    scope: TabStateManagerHandlersRuntimeScope = defaultTabStateManagerHandlersRuntimeScope
): TabStateManagerHandlersRuntime {
    return {
        cancelAnimationFrame(handle: number): void {
            scope.getCancelAnimationFrame?.()?.(handle);
        },
        clearTimeout(handle: TabStateManagerHandlersTimerHandle): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
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
            const requestAnimationFrameRef = scope.getRequestAnimationFrame?.();
            if (typeof requestAnimationFrameRef !== "function") {
                return undefined;
            }

            return requestAnimationFrameRef(callback);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): TabStateManagerHandlersTimerHandle {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "tabStateManagerHandlers requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, delay);
        },
    };
}
