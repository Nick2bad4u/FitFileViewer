export type NotificationTimerHandle = ReturnType<typeof globalThis.setTimeout>;

export interface NotificationTimerRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout;
    readonly setTimeout?: typeof globalThis.setTimeout;
}

export interface NotificationTimerRuntime {
    clearTimeout(handle: NotificationTimerHandle): void;
    setTimeout(
        callback: () => void,
        delay: number
    ): NotificationTimerHandle;
}

const defaultNotificationTimerRuntimeScope: NotificationTimerRuntimeScope = {
    get clearTimeout(): typeof globalThis.clearTimeout {
        return globalThis.clearTimeout;
    },
    get setTimeout(): typeof globalThis.setTimeout {
        return globalThis.setTimeout;
    },
};

export function getNotificationTimerRuntime(
    scope: NotificationTimerRuntimeScope = defaultNotificationTimerRuntimeScope
): NotificationTimerRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimer = scope.clearTimeout;
            if (typeof clearTimer !== "function") {
                throw new TypeError(
                    "notification timers require clearTimeout"
                );
            }
            clearTimer(handle);
        },
        setTimeout(callback, delay): NotificationTimerHandle {
            const scheduleTimer = scope.setTimeout;
            if (typeof scheduleTimer !== "function") {
                throw new TypeError("notification timers require setTimeout");
            }
            return scheduleTimer(callback, delay);
        },
    };
}
