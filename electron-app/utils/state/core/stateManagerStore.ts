import {
    createDefaultAppState,
    createResetAppState,
    type AppStateShape,
} from "./stateManagerDefaults.js";

type MutableRecord = Record<string, unknown>;

const rootState: AppStateShape = createDefaultAppState();

/**
 * Gets the mutable root state container owned by the state manager.
 *
 * @returns Current root application state.
 */
export function getRootState(): AppStateShape {
    return rootState;
}

/**
 * Gets the root state as a mutable record for path-based state mutations.
 *
 * @returns Mutable root application state record.
 */
export function getMutableRootState(): MutableRecord {
    return rootState;
}

/**
 * Resets the root state using the legacy reset shape.
 */
export function resetRootState(): void {
    const state = getMutableRootState();

    for (const key of Object.keys(state)) {
        delete state[key];
    }

    Object.assign(state, createResetAppState());
}
