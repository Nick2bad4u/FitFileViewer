import {
    getState,
    setState,
    subscribe,
    updateState,
} from "../../state/core/stateManager.js";
import {
    getInjectedModule,
    getRecordFunction,
    isObjectRecord,
} from "./renderChartModuleHelpers.js";
/** Reads the state manager, preferring test-injected modules when present. */
export function getStateManagerSafe() {
    try {
        const mod = getInjectedModule("../../state/core/stateManager.js");
        if (isObjectRecord(mod)) {
            const injectedGetState = getRecordFunction(mod, "getState");
            const injectedSetState = getRecordFunction(mod, "setState");
            const injectedSubscribe = getRecordFunction(mod, "subscribe");
            const injectedUpdateState = getRecordFunction(mod, "updateState");
            if (injectedGetState || injectedSetState || injectedUpdateState) {
                return {
                    getState: injectedGetState || getState,
                    setState: injectedSetState || setState,
                    subscribe: injectedSubscribe || subscribe,
                    updateState: injectedUpdateState || updateState,
                };
            }
        }
    } catch {
        // Fall back to direct imports below.
    }
    return {
        getState,
        setState,
        subscribe,
        updateState,
    };
}
/** Reads chart state through the injectable state manager with direct fallback. */
export function callGetState(path) {
    try {
        const { getState: getStateSafe } = getStateManagerSafe();
        const value = getStateSafe(path);
        if (value !== undefined) {
            return value;
        }
    } catch {
        // Fall back to direct import below.
    }
    try {
        return getState(path);
    } catch {
        return undefined;
    }
}
/** Writes chart state through the injectable state manager and direct fallback. */
export function callSetState(path, value, options) {
    try {
        const { setState: setStateSafe } = getStateManagerSafe();
        setStateSafe(path, value, options);
    } catch {
        // Continue to direct import fallback below.
    }
    try {
        setState(path, value, options);
    } catch {
        // Ignore state-manager compatibility failures.
    }
}
/** Updates chart state through the injectable state manager and direct fallback. */
export function callUpdateState(path, value, options) {
    try {
        const { updateState: updateStateSafe } = getStateManagerSafe();
        updateStateSafe(path, value, options);
    } catch {
        // Continue to direct import fallback below.
    }
    try {
        updateState(path, value, options);
    } catch {
        // Ignore state-manager compatibility failures.
    }
}
