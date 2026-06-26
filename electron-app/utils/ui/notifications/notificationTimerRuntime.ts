import {
    type BrowserClearTimeout,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserClearTimeout,
    getBrowserDateNow,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type NotificationTimerHandle = BrowserTimerHandle;

export interface NotificationTimerRuntimeScope {
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getSetTimeout?:
        | (() => BrowserSetTimeout | undefined)
        | undefined;
}

export interface NotificationTimerRuntime {
    readonly clearTimeout: (handle: NotificationTimerHandle) => void;
    readonly dateNow: () => number;
    readonly setTimeout: (
        callback: () => void,
        delay: number
    ) => NotificationTimerHandle;
}

const defaultNotificationTimerRuntimeScope: NotificationTimerRuntimeScope = {
    getClearTimeout: getBrowserClearTimeout,
    getDateNow: getBrowserDateNow,
    getSetTimeout: getBrowserSetTimeout,
};

function getRequiredDateNow(scope: NotificationTimerRuntimeScope): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow !== "function") {
        throw new TypeError("notification timers require dateNow");
    }

    return dateNow;
}

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
        dateNow(): number {
            return getRequiredDateNow(scope)();
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
