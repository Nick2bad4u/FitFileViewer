import {
    getState as getCoreAppDomainState,
    subscribe as subscribeCoreAppDomainPath,
    type StateListener,
} from "../core/stateManager.js";
import {
    getAppDomainStateRuntime,
    type AppDomainStateRuntime,
} from "./appDomainStateRuntime.js";

export type AppDomainStateListener = (data: unknown) => void;
export type AppDomainStateGetter = (path: string) => unknown;
export type AppOpeningFileSubscriber = (callback: StateListener) => Unsubscribe;
export type AppStartTimeGetter = () => null | number;
export type AppStartTimeSubscriber = (callback: StateListener) => Unsubscribe;
export type AppDomainStatePathSubscriber = (
    path: string,
    callback: StateListener
) => Unsubscribe;
export type AppDomainStateSubscriber = (
    event: string,
    callback: AppDomainStateListener
) => Unsubscribe;
export type Unsubscribe = () => void;

const APP_OPENING_FILE_STATE_PATH = "app.isOpeningFile";
const APP_START_TIME_STATE_PATH = "app.startTime";

function appDomainStateRuntime(): AppDomainStateRuntime {
    return getAppDomainStateRuntime();
}

/** Gets app-domain state through the renderer-facing app-domain facade. */
export function getAppDomainState(path: string): unknown {
    return getCoreAppDomainState(path);
}

/** Gets the renderer app startup timestamp through an explicit lifecycle path. */
export function getAppStartTime(): null | number {
    const startTime = getCoreAppDomainState(APP_START_TIME_STATE_PATH);
    return typeof startTime === "number" ? startTime : null;
}

/** Subscribes to app-domain state through the renderer-facing facade. */
export function subscribeAppDomain(
    event: string,
    listener: AppDomainStateListener
): Unsubscribe {
    const path = normalizeAppDomainEventPath(event);

    return subscribeCoreAppDomainPath(path, (newValue, oldValue) => {
        listener({
            newValue,
            oldValue,
            path,
            timestamp: appDomainStateRuntime().dateNow(),
        });
    });
}

/** Subscribes to an app-domain state path through the renderer-facing facade. */
export function subscribeAppDomainPath(
    path: string,
    callback: StateListener
): Unsubscribe {
    return subscribeCoreAppDomainPath(path, callback);
}

/** Subscribes to the app file-opening lifecycle state. */
export function subscribeToAppOpeningFile(
    callback: StateListener
): Unsubscribe {
    return subscribeCoreAppDomainPath(APP_OPENING_FILE_STATE_PATH, callback);
}

/** Subscribes to the app startup timestamp lifecycle state. */
export function subscribeToAppStartTime(callback: StateListener): Unsubscribe {
    return subscribeCoreAppDomainPath(APP_START_TIME_STATE_PATH, callback);
}

function normalizeAppDomainEventPath(event: string): string {
    return event.endsWith("-changed")
        ? event.slice(0, -"-changed".length)
        : event;
}
