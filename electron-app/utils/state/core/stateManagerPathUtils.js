/**
 * Helper function to get nested value from object.
 *
 * @private
 *
 * @param {Object} obj - Source object
 * @param {string} path - Dot notation path
 *
 * @returns {any} Value at path
 */
function getNestedValue(obj, path) {
    const keys = path.split(".");
    /** @type {any} */
    let value = obj;
    for (const key of keys) {
        if (value == null) {
            return;
        }
        const container = /** @type {Record<string, any>} */ (value);
        if (Object.hasOwn(container, key)) {
            value = container[key];
        } else {
            return;
        }
    }
    return value;
}

/**
 * Helper function to set nested value in object.
 *
 * @private
 *
 * @param {Object} obj - Target object
 * @param {string} path - Dot notation path
 * @param {any} value - Value to set
 */
function setNestedValue(obj, path, value) {
    const keys = path.split(".");
    /** @type {any} */
    let target = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = /** @type {string} */ (keys[i]);
        if (!key) {
            continue;
        }
        if (target == null || typeof target !== "object") {
            return;
        }
        const container = /** @type {Record<string, any>} */ (target);
        if (
            !Object.hasOwn(container, key) ||
            typeof container[key] !== "object" ||
            container[key] === null
        ) {
            container[key] = {};
        }
        target = container[key];
    }
    const finalKey = keys.at(-1);
    if (finalKey && target != null && typeof target === "object") {
        /** @type {Record<string, any>} */ (target)[finalKey] = value;
    }
}

export { getNestedValue, setNestedValue };
