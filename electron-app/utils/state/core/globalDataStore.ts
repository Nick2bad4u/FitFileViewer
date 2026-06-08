import { getState, setState, type StateUpdateOptions } from "./stateManager.js";

const GLOBAL_DATA_PROPERTY = "globalData";

/** Reads FIT data from the managed state store. */
export function getGlobalData<T = unknown>(): T | null | undefined {
    const stateValue = getState<T | null>(GLOBAL_DATA_PROPERTY);
    if (stateValue !== undefined && stateValue !== null) {
        return stateValue as T;
    }

    return stateValue === null ? null : undefined;
}

/** Writes FIT data through the managed state store. */
export function setGlobalData(
    value: unknown,
    options: StateUpdateOptions = {}
): void {
    setState(GLOBAL_DATA_PROPERTY, value, {
        source: "globalDataStore",
        ...options,
    });
}
