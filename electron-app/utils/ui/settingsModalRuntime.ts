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
    requestAnimationFrame(callback: FrameRequestCallback): null | number;
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
            scope.cancelAnimationFrame?.call(scope, handle);
        },
        clearTimeout(handle: SettingsModalTimerHandle): void {
            const clearTimer = scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimer.call(scope, handle);
        },
        requestAnimationFrame(callback: FrameRequestCallback): null | number {
            if (typeof scope.requestAnimationFrame !== "function") {
                callback(0);
                return null;
            }

            return scope.requestAnimationFrame.call(scope, callback);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): SettingsModalTimerHandle {
            const scheduleTimer = scope.setTimeout ?? globalThis.setTimeout;
            return scheduleTimer.call(scope, callback, delay);
        },
    };
}
