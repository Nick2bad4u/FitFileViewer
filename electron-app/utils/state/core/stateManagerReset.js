import { AppState, createResetAppState } from "./stateManagerDefaults.js";
/**
 * Resets state to initial values.
 *
 * When a path is provided, only that leaf is removed. Without a path, the full
 * state is reset using the legacy reset shape.
 *
 * @param path - Optional path to reset only part of state.
 */
export function resetState(path) {
    if (path) {
        resetStatePath(path);
    } else {
        resetAllState();
    }
    console.log(`[StateManager] State reset: ${path || "all"}`);
}
function resetStatePath(path) {
    const keys = path.split(".");
    let target = AppState;
    for (let i = 0; i < keys.length - 1; i += 1) {
        const key = keys[i];
        if (!key || target === null || typeof target !== "object") {
            return;
        }
        const container = target;
        if (!Object.hasOwn(container, key)) {
            return;
        }
        target = container[key];
    }
    const finalKey = keys.at(-1);
    if (!finalKey || target === null || typeof target !== "object") {
        return;
    }
    const container = target;
    if (Object.hasOwn(container, finalKey)) {
        delete container[finalKey];
    }
}
function resetAllState() {
    const state = AppState;
    for (const key of Object.keys(state)) {
        delete state[key];
    }
    Object.assign(AppState, createResetAppState());
}
