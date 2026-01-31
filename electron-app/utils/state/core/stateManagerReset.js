/**
 * State reset utilities for the core state manager.
 */

import { AppState, createResetAppState } from "./stateManagerDefaults.js";

/**
 * Reset state to initial values.
 *
 * @param {string} [path] - Optional path to reset only part of state
 */
function resetState(path) {
    if (path) {
        const keys = path.split(".");
        /** @type {any} */
        let target = AppState;
        for (let i = 0; i < keys.length - 1; i++) {
            const k = /** @type {string} */ (keys[i]);
            if (target == null) {
                return;
            }
            if (Object.hasOwn(target, k)) {
                target = target[k];
            } else {
                return;
            }
        }
        const finalKey = keys.at(-1);
        if (finalKey && target) {
            const rec = /** @type {Record<string, any>} */ (target);
            if (Object.hasOwn(rec, finalKey)) {
                delete rec[finalKey];
            }
        }
    } else {
        // Reset entire state
        for (const key of Object.keys(AppState)) {
            delete (/** @type {any} */ (AppState)[key]);
        }

        // Restore initial structure (preserving legacy reset behavior)
        Object.assign(AppState, createResetAppState());
    }

    console.log(`[StateManager] State reset: ${path || "all"}`);
}

export { resetState };
