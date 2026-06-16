export type KeyboardShortcutsModalTimerHandle = ReturnType<
    typeof globalThis.setTimeout
>;

export interface KeyboardShortcutsModalRuntimeScope {
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

export interface KeyboardShortcutsModalRuntime {
    readonly cancelAnimationFrame: (handle: number) => void;
    readonly clearTimeout: (handle: KeyboardShortcutsModalTimerHandle) => void;
    readonly requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => null | number;
    readonly setTimeout: (
        callback: () => void,
        delay: number
    ) => KeyboardShortcutsModalTimerHandle;
}

const defaultKeyboardShortcutsModalRuntimeScope: KeyboardShortcutsModalRuntimeScope =
    {
        getCancelAnimationFrame: () => globalThis.cancelAnimationFrame,
        getClearTimeout: () => globalThis.clearTimeout,
        getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
        getSetTimeout: () => globalThis.setTimeout,
    };

function getScopeCancelAnimationFrame(
    scope: KeyboardShortcutsModalRuntimeScope
): typeof globalThis.cancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.();
}

function getScopeClearTimeout(
    scope: KeyboardShortcutsModalRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getScopeRequestAnimationFrame(
    scope: KeyboardShortcutsModalRuntimeScope
): typeof globalThis.requestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.();
}

function getScopeSetTimeout(
    scope: KeyboardShortcutsModalRuntimeScope
): typeof globalThis.setTimeout | undefined {
    return scope.getSetTimeout?.();
}

export function getKeyboardShortcutsModalRuntime(
    scope: KeyboardShortcutsModalRuntimeScope = defaultKeyboardShortcutsModalRuntimeScope
): KeyboardShortcutsModalRuntime {
    return {
        cancelAnimationFrame(handle: number): void {
            getScopeCancelAnimationFrame(scope)?.call(scope, handle);
        },
        clearTimeout(handle: KeyboardShortcutsModalTimerHandle): void {
            const clearTimeoutRef = getScopeClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "keyboardShortcutsModalRuntime requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef.call(scope, handle);
        },
        requestAnimationFrame(callback: FrameRequestCallback): null | number {
            const requestAnimationFrameRef =
                getScopeRequestAnimationFrame(scope);
            if (typeof requestAnimationFrameRef !== "function") {
                return null;
            }

            return requestAnimationFrameRef.call(scope, callback);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): KeyboardShortcutsModalTimerHandle {
            const setTimeoutRef = getScopeSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "keyboardShortcutsModalRuntime requires a setTimeout runtime"
                );
            }
            return setTimeoutRef.call(scope, callback, delay);
        },
    };
}
