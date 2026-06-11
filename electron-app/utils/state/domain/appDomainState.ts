import {
    getState as getLegacyAppDomainState,
    subscribe as subscribeLegacyAppDomain,
} from "./appState.js";
import {
    subscribe as subscribeCoreAppDomainPath,
    type StateListener,
} from "../core/stateManager.js";

type AppDomainStateListener = (data: unknown) => void;
type Unsubscribe = () => void;

/** Gets app-domain state through the renderer-facing app-domain facade. */
export function getAppDomainState(path: string): unknown {
    return getLegacyAppDomainState(path);
}

/** Subscribes to app-domain state through the renderer-facing facade. */
export function subscribeAppDomain(
    event: string,
    callback: AppDomainStateListener
): Unsubscribe {
    return subscribeLegacyAppDomain(event, callback);
}

/** Subscribes to an app-domain state path through the renderer-facing facade. */
export function subscribeAppDomainPath(
    path: string,
    callback: StateListener
): Unsubscribe {
    return subscribeCoreAppDomainPath(path, callback);
}
