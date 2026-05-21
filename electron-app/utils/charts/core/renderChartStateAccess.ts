import {
    getState,
    setState,
    subscribe,
    type StateUpdateOptions,
    updateState,
} from "../../state/core/stateManager.js";
import {
    getInjectedModule,
    getRecordFunction,
} from "./renderChartModuleHelpers.js";

type GetStateFunction = (path?: string) => unknown;
type SetStateFunction = typeof setState;
type SubscribeFunction = typeof subscribe;
type UpdateStateFunction = (
    path: string,
    value: Record<string, unknown>,
    options?: StateUpdateOptions
) => void;

/** State manager functions used by chart rendering compatibility paths. */
export type ChartStateManagerAccess = {
    readonly getState: GetStateFunction;
    readonly setState: SetStateFunction;
    readonly subscribe: SubscribeFunction;
    readonly updateState: UpdateStateFunction;
};

/** Reads the state manager, preferring test-injected modules when present. */
export function getStateManagerSafe(): ChartStateManagerAccess {
    try {
        const mod = getInjectedModule("../../state/core/stateManager.js");
        if (mod && typeof mod === "object") {
            const injectedGetState = getRecordFunction(mod, "getState");
            const injectedSetState = getRecordFunction(mod, "setState");
            const injectedSubscribe = getRecordFunction(mod, "subscribe");
            const injectedUpdateState = getRecordFunction(mod, "updateState");
            if (injectedGetState || injectedSetState || injectedUpdateState) {
                return {
                    getState: (injectedGetState || getState) as GetStateFunction,
                    setState: (injectedSetState ||
                        setState) as SetStateFunction,
                    subscribe: (injectedSubscribe ||
                        subscribe) as SubscribeFunction,
                    updateState: (injectedUpdateState ||
                        updateState) as UpdateStateFunction,
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
export function callGetState(path: string): unknown {
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
export function callSetState(
    path: string,
    value: unknown,
    options?: StateUpdateOptions
): void {
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
export function callUpdateState(
    path: string,
    value: Record<string, unknown>,
    options?: StateUpdateOptions
): void {
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
