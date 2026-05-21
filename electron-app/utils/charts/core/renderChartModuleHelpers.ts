type UnknownFunction = (...args: unknown[]) => unknown;
type TypedFunction = (...args: never[]) => unknown;

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
 * Returns true for non-null, non-array object values that can be used as data
 * rows.
 */
export function isObjectRecord(
    value: unknown
): value is Record<string, unknown> {
    return isRecord(value) && !Array.isArray(value);
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
 * Reads a function property when a legacy injection boundary supplies an
 * implementation whose runtime signature is validated by the caller's tests.
 */
export function getTypedRecordFunction<TFunction extends TypedFunction>(
    value: unknown,
    key: string
): TFunction | null {
    const candidate = getRecordValue(value, key);
    return typeof candidate === "function" ? (candidate as TFunction) : null;
}

/**
 * Checks whether an unknown object exposes a chart-style destroy hook.
 */
export function hasDestroy(value: unknown): value is { destroy(): void } {
    return getRecordFunction(value, "destroy") !== null;
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
