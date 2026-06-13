export type KeyboardShortcutsModalTimerHandle = ReturnType<
    typeof globalThis.setTimeout
>;

export interface KeyboardShortcutsModalRuntimeScope {
    readonly cancelAnimationFrame?:
        | typeof globalThis.cancelAnimationFrame
        | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly requestAnimationFrame?:
        | typeof globalThis.requestAnimationFrame
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface KeyboardShortcutsModalRuntime {
    cancelAnimationFrame(handle: number): void;
    clearTimeout(handle: KeyboardShortcutsModalTimerHandle): void;
    requestAnimationFrame(callback: FrameRequestCallback): null | number;
    setTimeout(
        callback: () => void,
        delay: number
    ): KeyboardShortcutsModalTimerHandle;
}

export function getKeyboardShortcutsModalRuntime(
    scope: KeyboardShortcutsModalRuntimeScope = globalThis
): KeyboardShortcutsModalRuntime {
    return {
        cancelAnimationFrame(handle: number): void {
            scope.cancelAnimationFrame?.call(scope, handle);
        },
        clearTimeout(handle: KeyboardShortcutsModalTimerHandle): void {
            const clearTimer = scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimer.call(scope, handle);
        },
        requestAnimationFrame(callback: FrameRequestCallback): null | number {
            if (typeof scope.requestAnimationFrame !== "function") {
                return null;
            }

            return scope.requestAnimationFrame.call(scope, callback);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): KeyboardShortcutsModalTimerHandle {
            const scheduleTimer = scope.setTimeout ?? globalThis.setTimeout;
            return scheduleTimer.call(scope, callback, delay);
        },
    };
}
