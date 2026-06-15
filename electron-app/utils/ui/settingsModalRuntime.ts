export type SettingsModalTimerHandle = ReturnType<typeof globalThis.setTimeout>;

export interface SettingsModalRuntimeScope {
    readonly cancelAnimationFrame?:
        | typeof globalThis.cancelAnimationFrame
        | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
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

const defaultSettingsModalRuntimeScope: SettingsModalRuntimeScope = {
    getCancelAnimationFrame: () => globalThis.cancelAnimationFrame,
    getClearTimeout: () => globalThis.clearTimeout,
    getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
    getSetTimeout: () => globalThis.setTimeout,
};

function getScopeCancelAnimationFrame(
    scope: SettingsModalRuntimeScope
): typeof globalThis.cancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.() ?? scope.cancelAnimationFrame;
}

function getScopeClearTimeout(
    scope: SettingsModalRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.() ?? scope.clearTimeout;
}

function getScopeRequestAnimationFrame(
    scope: SettingsModalRuntimeScope
): typeof globalThis.requestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.() ?? scope.requestAnimationFrame;
}

function getScopeSetTimeout(
    scope: SettingsModalRuntimeScope
): typeof globalThis.setTimeout | undefined {
    return scope.getSetTimeout?.() ?? scope.setTimeout;
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
