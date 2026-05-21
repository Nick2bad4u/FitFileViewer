/**
 * Gets a nested value from an object by dot-notation path.
 *
 * @param obj - Source object.
 * @param path - Dot-notation path.
 *
 * @returns Value at the path, or undefined when the path cannot be resolved.
 */
export function getNestedValue(obj, path) {
    if (!path) {
        return obj;
    }
    const keys = path.split(".");
    let value = obj;
    for (const key of keys) {
        if (value === null || typeof value !== "object") {
            return undefined;
        }
        const container = value;
        if (!Object.hasOwn(container, key)) {
            return undefined;
        }
        value = container[key];
    }
    return value;
}
/**
 * Sets a nested value on an object by dot-notation path, creating missing
 * intermediate objects as needed.
 *
 * @param obj - Target object.
 * @param path - Dot-notation path.
 * @param value - Value to set.
 */
export function setNestedValue(obj, path, value) {
    if (obj === null || typeof obj !== "object" || !path) {
        return;
    }
    const keys = path.split(".");
    let target = obj;
    for (let i = 0; i < keys.length - 1; i += 1) {
        const key = keys[i];
        if (!key) {
            continue;
        }
        const nextValue = target[key];
        if (
            nextValue === null ||
            typeof nextValue !== "object" ||
            Array.isArray(nextValue)
        ) {
            target[key] = {};
        }
        target = target[key];
    }
    const finalKey = keys.at(-1);
    if (finalKey) {
        target[finalKey] = value;
    }
}
