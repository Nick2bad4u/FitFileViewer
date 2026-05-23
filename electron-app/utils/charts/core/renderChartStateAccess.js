import {
    getState,
    setState,
    subscribe,
    updateState,
} from "../../state/core/stateManager.js";
/** Reads the state manager used by chart rendering. */
export function getStateManagerSafe() {
    return {
        getState,
        setState,
        subscribe,
        updateState,
    };
}
/** Reads chart state through the centralized state manager. */
export function callGetState(path) {
    try {
        return getState(path);
    } catch {
        return undefined;
    }
}
/** Writes chart state through the centralized state manager. */
export function callSetState(path, value, options) {
    try {
        setState(path, value, options);
    } catch {
        // Ignore state-manager compatibility failures.
    }
}
/** Updates chart state through the centralized state manager. */
export function callUpdateState(path, value, options) {
    try {
        updateState(path, value, options);
    } catch {
        // Ignore state-manager compatibility failures.
    }
}
