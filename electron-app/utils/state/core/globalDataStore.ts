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
const ownedBridgeAccessors = new WeakMap<
    object,
    {
        readonly get: () => unknown;
        readonly set: (value: unknown) => void;
    }
>();
let fallbackGlobalDataValue: unknown;
let hasFallbackGlobalDataValue = false;
let isSyncingLegacyGlobalDataProperty = false;

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
    syncLegacyGlobalDataProperty(value, options);
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
        ownedBridgeAccessors.set(scope, { get, set });

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

function ensureLegacyGlobalDataBridge(options: StateUpdateOptions): boolean {
    return defineLegacyGlobalDataBridge({
        ...(options.silent === undefined ? {} : { silent: options.silent }),
        source: options.source ?? "globalDataStore.setGlobalData",
    });
}

function syncLegacyGlobalDataProperty(
    value: unknown,
    options: StateUpdateOptions
): void {
    if (isSyncingLegacyGlobalDataProperty) {
        return;
    }

    const scope = globalThis as LegacyGlobalDataScope;
    const bridgeDefined = ensureLegacyGlobalDataBridge(options);
    const descriptor = Object.getOwnPropertyDescriptor(
        scope,
        GLOBAL_DATA_PROPERTY
    );
    if (bridgeDefined || isOwnedLegacyGlobalDataBridge(scope, descriptor)) {
        return;
    }

    if (!descriptor) {
        return;
    }

    isSyncingLegacyGlobalDataProperty = true;
    try {
        if (descriptor.set) {
            descriptor.set.call(scope, value);
            return;
        }

        if ("value" in descriptor && descriptor.writable) {
            Reflect.set(scope, GLOBAL_DATA_PROPERTY, value);
        }
    } finally {
        isSyncingLegacyGlobalDataProperty = false;
    }
}

function isOwnedLegacyGlobalDataBridge(
    scope: LegacyGlobalDataScope,
    descriptor?: PropertyDescriptor
): boolean {
    const accessors = ownedBridgeAccessors.get(scope);
    return (
        accessors !== undefined &&
        descriptor?.get === accessors.get &&
        descriptor.set === accessors.set
    );
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
