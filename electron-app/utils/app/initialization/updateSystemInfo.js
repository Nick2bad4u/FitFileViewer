/**
 * @file System information display updater for FitFileViewer
 *
 *   Updates the system information display in the UI with application and runtime
 *   version information. Caches DOM elements for performance and validates
 *   expected structure.
 *
 * @author FitFileViewer Team
 *
 * @since 1.0.0
 */

/** @typedef {"version" | "electron" | "node" | "chrome" | "platform" | "author" | "license"} SystemInfoField */
/** @typedef {Partial<Record<SystemInfoField, unknown>>} SystemInfoRecord */
/** @typedef {{ isValid: boolean; missingFields?: SystemInfoField[] }} SystemInfoValidation */

// DOM selectors and constants
const DOM_SELECTORS = {
        SYSTEM_INFO_VALUE: ".system-info-value",
    },
    EXPECTED_INFO_FIELDS = 7,
    // System info field mapping (order matters - must match DOM structure)
    /** @type {readonly SystemInfoField[]} */
    INFO_FIELD_ORDER = [
        "version",
        "electron",
        "node",
        "chrome",
        "platform",
        "author",
        "license",
    ],
    LOG_PREFIX = "[SystemInfo]";

// Cache for DOM elements (initialized once)
/** @type {NodeList | null} */
let cachedSystemInfoItems = null;

/**
 * Returns true if the cached node list is still safe to use (elements are still
 * connected to the document).
 *
 * This matters because some UIs (e.g., the About modal) re-render the system
 * info grid by replacing `innerHTML`, which detaches the old elements.
 *
 * @param {NodeList | null} nodes
 *
 * @returns {boolean}
 */
function isCacheValid(nodes) {
    if (!nodes) return false;
    try {
        for (const node of Array.from(nodes)) {
            const el = /** @type {Element} */ (node);
            if (!el || !el.isConnected) {
                return false;
            }
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * Clears the cached DOM elements (useful for testing or DOM changes)
 *
 * @returns {void}
 */
export function clearSystemInfoCache() {
    cachedSystemInfoItems = null;
    console.log(`${LOG_PREFIX} DOM element cache cleared`);
}

/**
 * Gets a system info field value by its known field name.
 *
 * @param {SystemInfoRecord} info - System information object
 * @param {SystemInfoField} fieldName - Known system information field
 *
 * @returns {unknown} Field value
 */
function getSystemInfoField(info, fieldName) {
    return info[fieldName];
}

/**
 * Updates the system information display in the UI
 *
 * Takes a system information object and updates the corresponding DOM elements
 * with version, runtime, and platform information. Uses cached DOM elements for
 * performance and validates both input and DOM structure.
 *
 * @example
 *     updateSystemInfo({
 *         version: "1.2.3",
 *         electron: "28.0.0",
 *         node: "18.17.1",
 *         chrome: "120.0.6099.109",
 *         platform: "win32",
 *         author: "FitFileViewer Team",
 *         license: "MIT",
 *     });
 *
 * @param {unknown} info - System information object
 *
 * @returns {boolean} True if update was successful, false otherwise
 */
export function updateSystemInfo(info) {
    try {
        // Validate input
        const validation = validateSystemInfo(info);
        if (!validation.isValid) {
            console.error(`${LOG_PREFIX} Invalid system info object provided`);
            return false;
        }

        // Initialize DOM element cache
        const systemInfoItems = initializeSystemInfoCache();
        if (systemInfoItems.length === 0) {
            console.error(`${LOG_PREFIX} No system info elements found in DOM`);
            return false;
        }

        // Update each field in the defined order
        const systemInfo = /** @type {SystemInfoRecord} */ (info);
        for (const [index, fieldName] of INFO_FIELD_ORDER.entries()) {
            if (index < systemInfoItems.length) {
                const value = getSystemInfoField(systemInfo, fieldName);
                updateSystemInfoField(
                    /** @type {Element} */ (systemInfoItems[index]),
                    value,
                    fieldName
                );
            }
        }

        console.log(`${LOG_PREFIX} System information updated successfully`);
        return true;
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error updating system information:`,
            error
        );
        return false;
    }
}

/**
 * Initializes and caches system info DOM elements
 *
 * @returns {NodeList} Cached system info value elements
 */
function initializeSystemInfoCache() {
    if (isCacheValid(cachedSystemInfoItems)) {
        return cachedSystemInfoItems;
    }

    // Cache is missing or stale (detached nodes). Refresh it.
    cachedSystemInfoItems = null;

    cachedSystemInfoItems = document.querySelectorAll(
        DOM_SELECTORS.SYSTEM_INFO_VALUE
    );

    // Validate expected DOM structure
    if (cachedSystemInfoItems.length !== EXPECTED_INFO_FIELDS) {
        console.warn(
            `${LOG_PREFIX} Expected ${EXPECTED_INFO_FIELDS} ${DOM_SELECTORS.SYSTEM_INFO_VALUE} elements, ` +
                `but found ${cachedSystemInfoItems.length}. ` +
                "Check the HTML structure to ensure all system info fields are present."
        );
    }

    return cachedSystemInfoItems;
}

/**
 * Updates individual system info field in DOM
 *
 * @param {Element} element - DOM element to update
 * @param {unknown} value - Value to set
 * @param {string} fieldName - Name of field for logging
 */
function updateSystemInfoField(element, value, fieldName) {
    if (!element) {
        console.warn(
            `${LOG_PREFIX} Missing DOM element for field: ${fieldName}`
        );
        return;
    }

    try {
        element.textContent = value ? String(value) : "";
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error updating field ${fieldName}:`,
            error
        );
    }
}

/**
 * Validates system info object structure
 *
 * @param {unknown} info - System information object to validate
 *
 * @returns {SystemInfoValidation} Validation result
 */
function validateSystemInfo(info) {
    if (!info || typeof info !== "object") {
        return { isValid: false, missingFields: INFO_FIELD_ORDER };
    }

    const systemInfo = /** @type {SystemInfoRecord} */ (info);
    const missingFields = INFO_FIELD_ORDER.filter(
        (field) =>
            getSystemInfoField(systemInfo, field) === undefined ||
            getSystemInfoField(systemInfo, field) === null
    );

    if (missingFields.length > 0) {
        console.warn(
            `${LOG_PREFIX} Missing system info fields:`,
            missingFields
        );
    }

    return {
        isValid: true,
        ...(missingFields.length > 0 ? { missingFields } : {}),
    };
}
