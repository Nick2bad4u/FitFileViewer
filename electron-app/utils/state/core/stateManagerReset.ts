import { AppState, createResetAppState } from "./stateManagerDefaults.js";

type MutableRecord = Record<string, unknown>;

/**
 * Resets state to initial values.
 *
 * When a path is provided, only that leaf is removed. Without a path, the full
 * state is reset using the legacy reset shape.
 *
 * @param path - Optional path to reset only part of state.
 */
export function resetState(path?: string): void {
    if (path) {
        resetStatePath(path);
    } else {
        resetAllState();
    }

    console.log(`[StateManager] State reset: ${path || "all"}`);
}

function resetStatePath(path: string): void {
    const keys = path.split(".");
    let target: unknown = AppState;

    for (let i = 0; i < keys.length - 1; i += 1) {
        const key = keys[i];

        if (!key || target === null || typeof target !== "object") {
            return;
        }

        const container = target as MutableRecord;
        if (!Object.hasOwn(container, key)) {
            return;
        }

        target = container[key];
    }

    const finalKey = keys.at(-1);
    if (!finalKey || target === null || typeof target !== "object") {
        return;
    }

    const container = target as MutableRecord;
    if (Object.hasOwn(container, finalKey)) {
        delete container[finalKey];
    }
}

function resetAllState(): void {
    const state = AppState as MutableRecord;

    for (const key of Object.keys(state)) {
        delete state[key];
    }

    Object.assign(AppState, createResetAppState());
}
