export type SettingsModalTimerHandle = ReturnType<typeof globalThis.setTimeout>;

export interface SettingsModalRuntimeScope {
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

export interface SettingsModalRuntime {
    readonly cancelAnimationFrame: (handle: number) => void;
    readonly clearTimeout: (handle: SettingsModalTimerHandle) => void;
    readonly requestAnimationFrame: (
        onFrame: FrameRequestCallback
    ) => null | number;
    readonly setTimeout: (
        callback: () => void,
        delay: number
    ) => SettingsModalTimerHandle;
}

const defaultSettingsModalRuntimeScope: SettingsModalRuntimeScope = {
    getCancelAnimationFrame: () => globalThis.cancelAnimationFrame,
    getClearTimeout: () => globalThis.clearTimeout,
    getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
    getSetTimeout: () => globalThis.setTimeout,
};

function getScopeCancelAnimationFrame(
    scope: SettingsModalRuntimeScope
): typeof globalThis.cancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.();
}

function getScopeClearTimeout(
    scope: SettingsModalRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getScopeRequestAnimationFrame(
    scope: SettingsModalRuntimeScope
): typeof globalThis.requestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.();
}

function getScopeSetTimeout(
    scope: SettingsModalRuntimeScope
): typeof globalThis.setTimeout | undefined {
    return scope.getSetTimeout?.();
}

export function getSettingsModalRuntime(
    scope: SettingsModalRuntimeScope = defaultSettingsModalRuntimeScope
): SettingsModalRuntime {
    return {
        cancelAnimationFrame(handle: number): void {
            getScopeCancelAnimationFrame(scope)?.call(scope, handle);
        },
        clearTimeout(handle: SettingsModalTimerHandle): void {
            const clearTimeoutRef = getScopeClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "settingsModalRuntime requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef.call(scope, handle);
        },
        requestAnimationFrame(onFrame: FrameRequestCallback): null | number {
            const requestAnimationFrameRef =
                getScopeRequestAnimationFrame(scope);
            if (typeof requestAnimationFrameRef !== "function") {
                onFrame(0);
                return null;
            }

            return requestAnimationFrameRef.call(scope, onFrame);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): SettingsModalTimerHandle {
            const setTimeoutRef = getScopeSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "settingsModalRuntime requires a setTimeout runtime"
                );
            }
            return setTimeoutRef.call(scope, callback, delay);
        },
    };
}
