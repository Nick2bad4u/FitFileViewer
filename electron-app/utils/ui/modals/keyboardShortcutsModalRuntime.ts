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

const defaultKeyboardShortcutsModalRuntimeScope: KeyboardShortcutsModalRuntimeScope =
    globalThis;

export function getKeyboardShortcutsModalRuntime(
    scope: KeyboardShortcutsModalRuntimeScope = defaultKeyboardShortcutsModalRuntimeScope
): KeyboardShortcutsModalRuntime {
    return {
        cancelAnimationFrame(handle: number): void {
            scope.cancelAnimationFrame?.(handle);
        },
        clearTimeout(handle: KeyboardShortcutsModalTimerHandle): void {
            if (typeof scope.clearTimeout !== "function") {
                throw new TypeError(
                    "keyboardShortcutsModalRuntime requires a clearTimeout runtime"
                );
            }
            scope.clearTimeout(handle);
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
            if (typeof scope.setTimeout !== "function") {
                throw new TypeError(
                    "keyboardShortcutsModalRuntime requires a setTimeout runtime"
                );
            }
            return scope.setTimeout(callback, delay);
        },
    };
}
