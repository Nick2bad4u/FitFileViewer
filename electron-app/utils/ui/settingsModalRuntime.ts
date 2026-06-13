export type SettingsModalTimerHandle = ReturnType<typeof globalThis.setTimeout>;

export interface SettingsModalRuntimeScope {
    readonly cancelAnimationFrame?:
        | typeof globalThis.cancelAnimationFrame
        | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly requestAnimationFrame?:
        | typeof globalThis.requestAnimationFrame
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface SettingsModalRuntime {
    cancelAnimationFrame(handle: number): void;
    clearTimeout(handle: SettingsModalTimerHandle): void;
    requestAnimationFrame(onFrame: FrameRequestCallback): null | number;
    setTimeout(
        callback: () => void,
        delay: number
    ): SettingsModalTimerHandle;
}

export function getSettingsModalRuntime(
    scope: SettingsModalRuntimeScope = globalThis
): SettingsModalRuntime {
    return {
        cancelAnimationFrame(handle: number): void {
            scope.cancelAnimationFrame?.(handle);
        },
        clearTimeout(handle: SettingsModalTimerHandle): void {
            if (typeof scope.clearTimeout === "function") {
                scope.clearTimeout(handle);
                return;
            }
            globalThis.clearTimeout(handle);
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
        ): SettingsModalTimerHandle {
            if (typeof scope.setTimeout === "function") {
                return scope.setTimeout(callback, delay);
            }
            return globalThis.setTimeout(callback, delay);
        },
    };
}
