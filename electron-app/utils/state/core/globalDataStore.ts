import { getState, setState, type StateUpdateOptions } from "./stateManager.js";

type LegacyGlobalDataScope = typeof globalThis & {
    globalData?: unknown;
    window?: { globalData?: unknown };
};

type LegacyGlobalDataBridgeOptions = {
    readonly preserveExistingValue?: boolean;
    readonly silent?: boolean;
    readonly scope?: LegacyGlobalDataScope;
    readonly source: string;
};

const GLOBAL_DATA_PROPERTY = "globalData";
let fallbackGlobalDataValue: unknown;
let hasFallbackGlobalDataValue = false;

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

    const fallbackValue = readAccessorFallbackValue(scope);
    if (fallbackValue !== undefined) {
        return fallbackValue as T;
    }

    return stateValue === null ? null : undefined;
}

/** Writes FIT data through the managed state store. */
export function setGlobalData(
    value: unknown,
    options: StateUpdateOptions = {}
): void {
    fallbackGlobalDataValue = value;
    hasFallbackGlobalDataValue = true;
    setState(GLOBAL_DATA_PROPERTY, value, {
        source: "globalDataStore",
        ...options,
    });
}

/**
 * Defines the temporary legacy `globalData` property as a state-backed bridge.
 * New code should use getGlobalData/setGlobalData instead of this property.
 */
export function defineLegacyGlobalDataBridge({
    preserveExistingValue = false,
    silent,
    scope = globalThis,
    source,
}: LegacyGlobalDataBridgeOptions): boolean {
    try {
        const descriptor = Object.getOwnPropertyDescriptor(
            scope,
            GLOBAL_DATA_PROPERTY
        );

        if (descriptor?.get && descriptor.set) {
            return false;
        }

        if (descriptor && !descriptor.configurable) {
            return false;
        }

        const existingValue = readPlainGlobalDataValue(scope);
        if (preserveExistingValue && existingValue !== undefined) {
            fallbackGlobalDataValue = existingValue;
            hasFallbackGlobalDataValue = true;
            setGlobalData(existingValue, {
                source: `${source}.preserveExistingValue`,
            });
        }

        const get = (): unknown => getGlobalData(scope);
        const set = (value: unknown): void => {
            setGlobalData(
                value,
                silent === undefined ? { source } : { silent, source }
            );
        };

        Object.defineProperty(scope, GLOBAL_DATA_PROPERTY, {
            configurable: true,
            enumerable: true,
            get,
            set,
        });

        return true;
    } catch {
        return false;
    }
}

function readPlainGlobalDataValue(scope: LegacyGlobalDataScope): unknown {
    const descriptor = Object.getOwnPropertyDescriptor(
        scope,
        GLOBAL_DATA_PROPERTY
    );

    return descriptor && "value" in descriptor ? descriptor.value : undefined;
}

function readAccessorFallbackValue(scope: LegacyGlobalDataScope): unknown {
    const descriptor = Object.getOwnPropertyDescriptor(
        scope,
        GLOBAL_DATA_PROPERTY
    );
    if (!descriptor || "value" in descriptor || !hasFallbackGlobalDataValue) {
        return undefined;
    }

    return fallbackGlobalDataValue;
}
