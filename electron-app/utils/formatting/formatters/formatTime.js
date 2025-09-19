import { convertTimeUnits, TIME_UNITS } from "../converters/convertTimeUnits.js";

/**
 * Time formatting constants
 * @readonly
 */
const TIME_FORMAT_CONSTANTS = {
    DEFAULT_TIME_UNITS_KEY: "chartjs_timeUnits",
    PAD_CHAR: "0",
    PAD_LENGTH: 2,
    SECONDS_PER_HOUR: 3600,
    SECONDS_PER_MINUTE: 60,
};

/**
 * Formats seconds into MM:SS or HH:MM:SS format, or converts to user's preferred time units
 * @param {number} seconds - Time in seconds
 * @param {boolean} useUserUnits - Whether to use user's preferred units or always use MM:SS format
 * @returns {string} Formatted time string
 * @throws {TypeError} If seconds is not a number
 * @example
 * // Format time in MM:SS format
 * const timeStr = formatTime(3661); // "1:01:01"
 *
 * // Format with user units
 * const timeUnits = formatTime(3600, true); // "1.0h" (if user prefers hours)
 */
export function formatTime(seconds, useUserUnits = false) {
    // Input validation
    if (typeof seconds !== "number" || isNaN(seconds)) {
        console.warn("[formatTime] Invalid seconds value:", seconds);
        return "0:00";
    }

    if (seconds < 0) {
        console.warn("[formatTime] Negative time value:", seconds);
        return "0:00";
    }

    try {
        if (useUserUnits) {
            return formatWithUserUnits(seconds);
        }

        return formatAsTimeString(seconds);
    } catch (error) {
        console.error("[formatTime] Time formatting failed:", error);
        return "0:00";
    }
}

/**
 * Formats time as HH:MM:SS or MM:SS string
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 * @private
 */
function formatAsTimeString(seconds) {
    const hours = Math.floor(seconds / TIME_FORMAT_CONSTANTS.SECONDS_PER_HOUR);
    const minutes = Math.floor(
        (seconds % TIME_FORMAT_CONSTANTS.SECONDS_PER_HOUR) / TIME_FORMAT_CONSTANTS.SECONDS_PER_MINUTE
    );
    const secs = Math.floor(seconds % TIME_FORMAT_CONSTANTS.SECONDS_PER_MINUTE);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(TIME_FORMAT_CONSTANTS.PAD_LENGTH, TIME_FORMAT_CONSTANTS.PAD_CHAR)}:${secs.toString().padStart(TIME_FORMAT_CONSTANTS.PAD_LENGTH, TIME_FORMAT_CONSTANTS.PAD_CHAR)}`;
    }
    return `${minutes}:${secs.toString().padStart(TIME_FORMAT_CONSTANTS.PAD_LENGTH, TIME_FORMAT_CONSTANTS.PAD_CHAR)}`;
}

/**
 * Formats time using user's preferred units from localStorage
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string with units
 * @private
 */
function formatWithUserUnits(seconds) {
    // Attempt to read from multiple storage locations to honor whichever
    // The runtime/tests have stubbed. Prefer globalThis, then window, then bare localStorage.
    /** @type {any} */
    const storages = [];
    try {
        if (typeof globalThis !== "undefined" && /** @type {any} */ (globalThis).localStorage)
            storages.push(/** @type {any} */ (globalThis).localStorage);
    } catch {
        /* Ignore errors */
    }
    try {
        if (globalThis.window !== undefined && /** @type {any} */ (globalThis).localStorage)
            storages.push(/** @type {any} */ (globalThis).localStorage);
    } catch {
        /* Ignore errors */
    }
    try {
        if (typeof localStorage !== "undefined") storages.push(/** @type {any} */ (localStorage));
    } catch {
        /* Ignore errors */
    }

    /** @type {string} */
    let timeUnits = TIME_UNITS.SECONDS;
    for (const storage of storages) {
        if (storage && typeof storage.getItem === "function") {
            const stored = storage.getItem(TIME_FORMAT_CONSTANTS.DEFAULT_TIME_UNITS_KEY);
            if (stored === TIME_UNITS.MINUTES || stored === TIME_UNITS.HOURS || stored === TIME_UNITS.SECONDS) {
                timeUnits = stored;
                break;
            }
        }
    }

    const convertedValue = convertTimeUnits(seconds, timeUnits);

    switch (timeUnits) {
        case TIME_UNITS.HOURS: {
            return `${convertedValue.toFixed(2)}h`;
        }
        case TIME_UNITS.MINUTES: {
            return `${convertedValue.toFixed(1)}m`;
        }
        default: {
            // For seconds, still use MM:SS format for better readability
            return formatAsTimeString(seconds);
        }
    }
}
