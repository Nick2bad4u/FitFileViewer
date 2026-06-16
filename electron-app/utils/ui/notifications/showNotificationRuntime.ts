export type ShowNotificationTimerHandle =
    | number
    | ReturnType<typeof globalThis.setTimeout>;

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
    readonly requestAnimationFrame?:
        | typeof globalThis.requestAnimationFrame
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
};

export type ShowNotificationRuntime = {
    readonly cancelAnimationFrame: (frame: number) => void;
    readonly clearTimeout: (timer: ShowNotificationTimerHandle) => void;
    readonly requestAnimationFrame: (
        onFrame: FrameRequestCallback
    ) => null | number;
    readonly setTimeout: (
        callback: () => void,
        duration: number
    ) => ShowNotificationTimerHandle;
};

const browserGlobal = globalThis as typeof globalThis & {
    readonly cancelAnimationFrame?:
        | typeof globalThis.cancelAnimationFrame
        | undefined;
    readonly requestAnimationFrame?:
        | typeof globalThis.requestAnimationFrame
        | undefined;
};

function getDefaultCancelAnimationFrame():
    | typeof globalThis.cancelAnimationFrame
    | undefined {
    if (typeof browserGlobal.cancelAnimationFrame !== "function") {
        return undefined;
    }

    return (frame) => browserGlobal.cancelAnimationFrame?.(frame);
}

function getDefaultRequestAnimationFrame():
    | typeof globalThis.requestAnimationFrame
    | undefined {
    if (typeof browserGlobal.requestAnimationFrame !== "function") {
        return undefined;
    }

    return (onFrame) => browserGlobal.requestAnimationFrame?.(onFrame) ?? 0;
}

const defaultShowNotificationRuntimeScope: ShowNotificationRuntimeScope = {
    getCancelAnimationFrame: getDefaultCancelAnimationFrame,
    getClearTimeout: () => globalThis.clearTimeout,
    getRequestAnimationFrame: getDefaultRequestAnimationFrame,
    getSetTimeout: () => globalThis.setTimeout,
};

function getCancelAnimationFrame(
    scope: ShowNotificationRuntimeScope
): typeof globalThis.cancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.() ?? scope.cancelAnimationFrame;
}

function getClearTimeout(
    scope: ShowNotificationRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.() ?? scope.clearTimeout;
}

function getRequestAnimationFrame(
    scope: ShowNotificationRuntimeScope
): typeof globalThis.requestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.() ?? scope.requestAnimationFrame;
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
            cancelFrame(frame);
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
            return requestFrame(onFrame);
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
