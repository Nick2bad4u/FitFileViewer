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
            scope.cancelAnimationFrame?.(handle);
        },
        clearTimeout(handle: KeyboardShortcutsModalTimerHandle): void {
            if (typeof scope.clearTimeout === "function") {
                scope.clearTimeout(handle);
                return;
            }
            globalThis.clearTimeout(handle);
        },
        requestAnimationFrame(callback: FrameRequestCallback): null | number {
            if (typeof scope.requestAnimationFrame !== "function") {
                return null;
            }

            return scope.requestAnimationFrame(callback);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): KeyboardShortcutsModalTimerHandle {
            if (typeof scope.setTimeout === "function") {
                return scope.setTimeout(callback, delay);
            }
            return globalThis.setTimeout(callback, delay);
        },
    };
}
