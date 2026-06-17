export type NotificationTimerHandle = ReturnType<typeof globalThis.setTimeout>;

export interface NotificationTimerRuntimeScope {
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface NotificationTimerRuntime {
    readonly clearTimeout: (handle: NotificationTimerHandle) => void;
    readonly setTimeout: (
        callback: () => void,
        delay: number
    ) => NotificationTimerHandle;
}

const defaultNotificationTimerRuntimeScope: NotificationTimerRuntimeScope = {
    getClearTimeout: () => globalThis.clearTimeout,
    getSetTimeout: () => globalThis.setTimeout,
};

export function getNotificationTimerRuntime(
    scope: NotificationTimerRuntimeScope = defaultNotificationTimerRuntimeScope
): NotificationTimerRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimer = scope.getClearTimeout?.();
            if (typeof clearTimer !== "function") {
                throw new TypeError("notification timers require clearTimeout");
            }
            clearTimer(handle);
        },
        setTimeout(callback, delay): NotificationTimerHandle {
            const scheduleTimer = scope.getSetTimeout?.();
            if (typeof scheduleTimer !== "function") {
                throw new TypeError("notification timers require setTimeout");
            }
            return scheduleTimer(callback, delay);
        },
    };
}
