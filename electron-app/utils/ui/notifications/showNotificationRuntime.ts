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
    return scope.window ?? scope;
}

export function getShowNotificationRuntime(
    scope: ShowNotificationRuntimeScope = globalThis
): ShowNotificationRuntime {
    return {
        cancelAnimationFrame(frame) {
            const cancelFrame =
                scope.window?.cancelAnimationFrame ??
                scope.cancelAnimationFrame;
            if (typeof cancelFrame !== "function") {
                return;
            }
            cancelFrame.call(getFrameRuntime(scope), frame);
        },
        clearTimeout(timer) {
            const clearTimer = scope.clearTimeout;
            if (typeof clearTimer !== "function") {
                throw new TypeError(
                    "show notification runtime requires clearTimeout"
                );
            }
            clearTimer(timer);
        },
        requestAnimationFrame(onFrame) {
            const requestFrame =
                scope.window?.requestAnimationFrame ??
                scope.requestAnimationFrame;
            if (typeof requestFrame !== "function") {
                onFrame(0);
                return null;
            }
            return requestFrame.call(getFrameRuntime(scope), onFrame);
        },
        setTimeout(callback, duration) {
            const setTimer = scope.setTimeout;
            if (typeof setTimer !== "function") {
                throw new TypeError(
                    "show notification runtime requires setTimeout"
                );
            }
            return setTimer(callback, duration);
        },
    };
}
