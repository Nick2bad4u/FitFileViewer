export type AboutModalTimerHandle = ReturnType<typeof globalThis.setTimeout>;

export interface AboutModalRuntimeScope {
    readonly cancelAnimationFrame?:
        | typeof globalThis.cancelAnimationFrame
        | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly requestAnimationFrame?:
        | typeof globalThis.requestAnimationFrame
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface AboutModalRuntime {
    cancelAnimationFrame(handle: number): void;
    clearTimeout(handle: AboutModalTimerHandle): void;
    requestAnimationFrame(onFrame: FrameRequestCallback): null | number;
    setTimeout(callback: () => void, delay: number): AboutModalTimerHandle;
}

export function getAboutModalRuntime(
    scope: AboutModalRuntimeScope = globalThis
): AboutModalRuntime {
    return {
        cancelAnimationFrame(handle: number): void {
            scope.cancelAnimationFrame?.(handle);
        },
        clearTimeout(handle: AboutModalTimerHandle): void {
            if (typeof scope.clearTimeout !== "function") {
                throw new TypeError(
                    "aboutModalRuntime requires a clearTimeout runtime"
                );
            }
            scope.clearTimeout(handle);
        },
        requestAnimationFrame(onFrame: FrameRequestCallback): null | number {
            if (typeof scope.requestAnimationFrame !== "function") {
                onFrame(0);
                return null;
            }

            return scope.requestAnimationFrame(onFrame);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): AboutModalTimerHandle {
            if (typeof scope.setTimeout !== "function") {
                throw new TypeError(
                    "aboutModalRuntime requires a setTimeout runtime"
                );
            }
            return scope.setTimeout(callback, delay);
        },
    };
}
