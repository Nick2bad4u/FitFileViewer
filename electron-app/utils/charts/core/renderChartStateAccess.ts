import {
    getState,
    getStateHistory,
    setState,
    subscribe,
    type StateListener,
    type StateUpdateOptions,
    updateState,
} from "../../state/core/stateManager.js";

type GetStateFunction = (path?: string) => unknown;
type SetStateFunction = typeof setState;
type SubscribeFunction = typeof subscribe;
type UpdateStateFunction = (
    path: string,
    value: Record<string, unknown>,
    options?: StateUpdateOptions
) => void;

export type ChartStateListener = StateListener;
export type ChartStateUpdateOptions = StateUpdateOptions;

/** State manager functions used by chart rendering modules. */
export type ChartStateManagerAccess = {
    readonly getState: GetStateFunction;
    readonly setState: SetStateFunction;
    readonly subscribe: SubscribeFunction;
    readonly updateState: UpdateStateFunction;
};

/** Reads the state manager used by chart rendering. */
export function getStateManagerSafe(): ChartStateManagerAccess {
    return {
        getState,
        setState,
        subscribe,
        updateState,
    };
}

/** Reads chart state through the centralized state manager. */
export function callGetState(path: string): unknown {
    try {
        return getState(path);
    } catch {
        return undefined;
    }
}

/** Reads chart state history through the centralized state manager. */
export function callGetStateHistory(): unknown[] {
    try {
        return getStateHistory();
    } catch {
        return [];
    }
}

/** Writes chart state through the centralized state manager. */
export function callSetState(
    path: string,
    value: unknown,
    options?: StateUpdateOptions
): void {
    try {
        setState(path, value, options);
    } catch {
        // Ignore state-manager failures in injected test environments.
    }
}

/** Subscribes to chart state changes through the centralized state manager. */
export function callSubscribe(
    path: string,
    callback: StateListener
): () => void {
    try {
        return subscribe(path, callback);
    } catch {
        return () => {
            // Ignore state-manager failures in injected test environments.
        };
    }
}

/** Updates chart state through the centralized state manager. */
export function callUpdateState(
    path: string,
    value: Record<string, unknown>,
    options?: StateUpdateOptions
): void {
    try {
        updateState(path, value, options);
    } catch {
        // Ignore state-manager failures in injected test environments.
    }
}
