export type ShowNotificationTimerHandle =
    | number
    | ReturnType<typeof globalThis.setTimeout>;

type ShowNotificationWindowRuntime = {
    readonly cancelAnimationFrame?:
        | typeof globalThis.cancelAnimationFrame
        | undefined;
    readonly requestAnimationFrame?:
        | typeof globalThis.requestAnimationFrame
        | undefined;
};

export type ShowNotificationRuntimeScope = {
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
    readonly getWindow?:
        | (() => ShowNotificationWindowRuntime | undefined)
        | undefined;
    readonly requestAnimationFrame?:
        | typeof globalThis.requestAnimationFrame
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
    readonly window?: ShowNotificationWindowRuntime | undefined;
};

export type ShowNotificationRuntime = {
    readonly cancelAnimationFrame: (frame: number) => void;
    readonly clearTimeout: (timer: ShowNotificationTimerHandle) => void;
    readonly requestAnimationFrame: (onFrame: FrameRequestCallback) => null | number;
    readonly setTimeout: (
        callback: () => void,
        duration: number
    ) => ShowNotificationTimerHandle;
};

function getFrameRuntime(
    scope: ShowNotificationRuntimeScope
): ShowNotificationRuntimeScope | ShowNotificationWindowRuntime {
    return scope.getWindow?.() ?? scope.window ?? scope;
}

const defaultShowNotificationRuntimeScope: ShowNotificationRuntimeScope = {
    getCancelAnimationFrame: () => globalThis.cancelAnimationFrame,
    getClearTimeout: () => globalThis.clearTimeout,
    getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
    getSetTimeout: () => globalThis.setTimeout,
    getWindow: () => globalThis.window,
};

function getCancelAnimationFrame(
    scope: ShowNotificationRuntimeScope
): typeof globalThis.cancelAnimationFrame | undefined {
    const runtimeWindow = scope.getWindow?.() ?? scope.window;
    return (
        runtimeWindow?.cancelAnimationFrame ??
        scope.getCancelAnimationFrame?.() ??
        scope.cancelAnimationFrame
    );
}

function getClearTimeout(
    scope: ShowNotificationRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.() ?? scope.clearTimeout;
}

function getRequestAnimationFrame(
    scope: ShowNotificationRuntimeScope
): typeof globalThis.requestAnimationFrame | undefined {
    const runtimeWindow = scope.getWindow?.() ?? scope.window;
    return (
        runtimeWindow?.requestAnimationFrame ??
        scope.getRequestAnimationFrame?.() ??
        scope.requestAnimationFrame
    );
}

function getSetTimeout(
    scope: ShowNotificationRuntimeScope
): typeof globalThis.setTimeout | undefined {
    return scope.getSetTimeout?.() ?? scope.setTimeout;
}

export function getShowNotificationRuntime(
    scope: ShowNotificationRuntimeScope = defaultShowNotificationRuntimeScope
): ShowNotificationRuntime {
    return {
        cancelAnimationFrame(frame) {
            const cancelFrame = getCancelAnimationFrame(scope);
            if (typeof cancelFrame !== "function") {
                return;
            }
            cancelFrame.call(getFrameRuntime(scope), frame);
        },
        clearTimeout(timer) {
            const clearTimer = getClearTimeout(scope);
            if (typeof clearTimer !== "function") {
                throw new TypeError(
                    "show notification runtime requires clearTimeout"
                );
            }
            clearTimer(timer);
        },
        requestAnimationFrame(onFrame) {
            const requestFrame = getRequestAnimationFrame(scope);
            if (typeof requestFrame !== "function") {
                onFrame(0);
                return null;
            }
            return requestFrame.call(getFrameRuntime(scope), onFrame);
        },
        setTimeout(callback, duration) {
            const setTimer = getSetTimeout(scope);
            if (typeof setTimer !== "function") {
                throw new TypeError(
                    "show notification runtime requires setTimeout"
                );
            }
            return setTimer(callback, duration);
        },
    };
}
