import {
    getState,
    getStateHistory,
    subscribe,
    type StateListener,
} from "../core/stateManager.js";

export function getDebugStateRoot(): unknown {
    return getState("");
}

export function getDebugStateHistory(): unknown[] {
    try {
        return getStateHistory();
    } catch {
        return [];
    }
}

export function subscribeToDebugStateChanges(
    listener: StateListener
): () => void {
    return subscribe("*", listener);
}
