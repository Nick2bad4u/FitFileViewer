import { useStore } from "zustand";

import { appStateStore } from "../core/appStateStore.js";

/**
 * @typedef {import("../core/appStateStore.js").AppStateShape} AppState
 */

/**
 * Select a slice of the application state via zustand's vanilla store.
 * @template T
 * @param {(state: AppState) => T} selector state projection callback
 * @returns {T}
 */
export function useAppState(selector) {
    return useStore(appStateStore, selector);
}

/**
 * Convenience hook for accessing a top-level app state key.
 * @template {keyof AppState} K
 * @param {K} key state key to read
 * @returns {AppState[K]}
 */
export function useAppStateValue(key) {
    return useAppState((state) => state[key]);
}
