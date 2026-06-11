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
    return getStateHistory();
}

export function subscribeToDebugStateChanges(listener: StateListener): () => void {
    return subscribe("*", listener);
}
