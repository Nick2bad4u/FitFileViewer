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
export type AppDomainStatePathSubscriber = (
    path: string,
    callback: StateListener
) => Unsubscribe;
export type AppDomainStateSubscriber = (
    event: string,
    callback: AppDomainStateListener
) => Unsubscribe;
export type Unsubscribe = () => void;

function appDomainStateRuntime(): AppDomainStateRuntime {
    return getAppDomainStateRuntime();
}

/** Gets app-domain state through the renderer-facing app-domain facade. */
export function getAppDomainState(path: string): unknown {
    return getCoreAppDomainState(path);
}

/** Subscribes to app-domain state through the renderer-facing facade. */
export function subscribeAppDomain(
    event: string,
    callback: AppDomainStateListener
): Unsubscribe {
    const path = normalizeAppDomainEventPath(event);

    return subscribeCoreAppDomainPath(path, (newValue, oldValue) => {
        callback({
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

function normalizeAppDomainEventPath(event: string): string {
    return event.endsWith("-changed")
        ? event.slice(0, -"-changed".length)
        : event;
}
