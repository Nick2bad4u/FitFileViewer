type UnknownFunction = (...args: unknown[]) => unknown;

interface ModuleShimGlobal {
    require?: unknown;
}

/**
 * Returns true for non-null object values that can be inspected by key.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object";
}

/**
 * Reads a property from an unknown record-like value.
 */
export function getRecordValue(value: unknown, key: string): unknown {
    return isRecord(value) ? value[key] : undefined;
}

/**
 * Reads a function property from an unknown record-like value.
 */
export function getRecordFunction(
    value: unknown,
    key: string
): UnknownFunction | null {
    const candidate = getRecordValue(value, key);
    return typeof candidate === "function"
        ? (candidate as UnknownFunction)
        : null;
}

/**
 * Reads a module from the CommonJS-like require hook used by tests.
 */
export function getInjectedModule(modulePath: string): unknown {
    const chartGlobal = globalThis as ModuleShimGlobal;
    if (typeof chartGlobal.require !== "function") {
        return null;
    }

    return chartGlobal.require(modulePath);
}
