/**
 * System information display updater for FitFileViewer.
 */
const DOM_SELECTORS = {
    SYSTEM_INFO_VALUE: ".system-info-value",
};
const EXPECTED_INFO_FIELDS = 7;
const INFO_FIELD_ORDER = [
    "version",
    "electron",
    "node",
    "chrome",
    "platform",
    "author",
    "license",
];
const LOG_PREFIX = "[SystemInfo]";
let cachedSystemInfoItems = null;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isCacheValid(nodes) {
    try {
        for (const element of nodes) {
            if (!element.isConnected) {
                return false;
            }
        }
        return true;
    } catch {
        return false;
    }
}
/**
 * Clears the cached DOM elements.
 */
export function clearSystemInfoCache() {
    cachedSystemInfoItems = null;
    console.log(`${LOG_PREFIX} DOM element cache cleared`);
}
function getSystemInfoField(info, fieldName) {
    return info[fieldName];
}
/**
 * Updates the system information display in the UI.
 */
export function updateSystemInfo(info) {
    try {
        if (!isRecord(info)) {
            console.error(`${LOG_PREFIX} Invalid system info object provided`);
            return false;
        }
        logMissingSystemInfoFields(info);
        const systemInfoItems = initializeSystemInfoCache();
        if (systemInfoItems.length === 0) {
            console.error(`${LOG_PREFIX} No system info elements found in DOM`);
            return false;
        }
        for (const [index, fieldName] of INFO_FIELD_ORDER.entries()) {
            const element = systemInfoItems.item(index);
            if (element) {
                updateSystemInfoField(
                    element,
                    getSystemInfoField(info, fieldName),
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
function initializeSystemInfoCache() {
    const cachedItems = cachedSystemInfoItems;
    if (cachedItems !== null && isCacheValid(cachedItems)) {
        return cachedItems;
    }
    cachedSystemInfoItems = document.querySelectorAll(
        DOM_SELECTORS.SYSTEM_INFO_VALUE
    );
    if (cachedSystemInfoItems.length !== EXPECTED_INFO_FIELDS) {
        console.warn(
            `${LOG_PREFIX} Expected ${EXPECTED_INFO_FIELDS} ${DOM_SELECTORS.SYSTEM_INFO_VALUE} elements, ` +
                `but found ${cachedSystemInfoItems.length}. ` +
                "Check the HTML structure to ensure all system info fields are present."
        );
    }
    return cachedSystemInfoItems;
}
function updateSystemInfoField(element, value, fieldName) {
    try {
        element.textContent = value ? String(value) : "";
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error updating field ${fieldName}:`,
            error
        );
    }
}
function logMissingSystemInfoFields(info) {
    const missingFields = INFO_FIELD_ORDER.filter(
        (field) =>
            getSystemInfoField(info, field) === undefined ||
            getSystemInfoField(info, field) === null
    );
    if (missingFields.length > 0) {
        console.warn(
            `${LOG_PREFIX} Missing system info fields:`,
            missingFields
        );
    }
}
