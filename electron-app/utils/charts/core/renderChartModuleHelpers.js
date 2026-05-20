/**
 * Returns true for non-null object values that can be inspected by key.
 */
export function isRecord(value) {
    return value !== null && typeof value === "object";
}
/**
 * Reads a property from an unknown record-like value.
 */
export function getRecordValue(value, key) {
    return isRecord(value) ? value[key] : undefined;
}
/**
 * Reads a function property from an unknown record-like value.
 */
export function getRecordFunction(value, key) {
    const candidate = getRecordValue(value, key);
    return typeof candidate === "function"
        ? candidate
        : null;
}
/**
 * Reads a module from the CommonJS-like require hook used by tests.
 */
export function getInjectedModule(modulePath) {
    const chartGlobal = globalThis;
    if (typeof chartGlobal.require !== "function") {
        return null;
    }
    return chartGlobal.require(modulePath);
}
