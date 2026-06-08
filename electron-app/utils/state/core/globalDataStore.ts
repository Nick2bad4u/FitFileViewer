import { getState, setState, type StateUpdateOptions } from "./stateManager.js";

type LegacyGlobalDataScope = typeof globalThis & {
    globalData?: unknown;
    window?: { globalData?: unknown };
};

const GLOBAL_DATA_PROPERTY = "globalData";

/** Reads FIT data from the managed state store, falling back to plain legacy data properties. */
export function getGlobalData<T = unknown>(
    scope: LegacyGlobalDataScope = globalThis
): T | null | undefined {
    const stateValue = getState<T | null>(GLOBAL_DATA_PROPERTY);
    if (stateValue !== undefined && stateValue !== null) {
        return stateValue as T;
    }

    const ownValue = readPlainGlobalDataValue(scope);
    if (ownValue !== undefined) {
        return ownValue as T;
    }

    const windowValue =
        scope.window === undefined
            ? undefined
            : readPlainGlobalDataValue(scope.window);
    if (windowValue !== undefined) {
        return windowValue as T;
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

function readPlainGlobalDataValue(scope: LegacyGlobalDataScope): unknown {
    const descriptor = Object.getOwnPropertyDescriptor(
        scope,
        GLOBAL_DATA_PROPERTY
    );

    return descriptor && "value" in descriptor ? descriptor.value : undefined;
}
