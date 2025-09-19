/**
 * Time conversion constants
 * @readonly
 */
const TIME_CONVERSIONS = {
    SECONDS_TO_HOURS: 3600,
    SECONDS_TO_MINUTES: 60,
};

/**
 * Supported time units
 * @readonly
 */
export const TIME_UNITS = {
    HOURS: "hours",
    MINUTES: "minutes",
    SECONDS: "seconds",
};

/**
 * Converts time from seconds to user's preferred units
 * @param {number} seconds - Time in seconds
 * @param {string} targetUnit - Target unit (seconds, minutes, hours)
 * @returns {number} Converted time value
 * @throws {TypeError} If seconds is not a number
 * @example
 * // Convert 3600 seconds to hours
 * const hours = convertTimeUnits(3600, TIME_UNITS.HOURS); // 1
 */
export function convertTimeUnits(seconds, targetUnit) {
    // Input validation
    if (typeof seconds !== "number" || isNaN(seconds)) {
        throw new TypeError(`Expected seconds to be a number, received ${typeof seconds}`);
    }

    if (seconds < 0) {
        console.warn("[convertTimeUnits] Negative time value:", seconds);
    }

    try {
        switch (targetUnit) {
            case TIME_UNITS.HOURS: {
                return seconds / TIME_CONVERSIONS.SECONDS_TO_HOURS;
            }
            case TIME_UNITS.MINUTES: {
                return seconds / TIME_CONVERSIONS.SECONDS_TO_MINUTES;
            }
            case TIME_UNITS.SECONDS: {
                return seconds;
            }
            default: {
                console.warn(`[convertTimeUnits] Unknown unit '${targetUnit}', defaulting to seconds`);
                return seconds;
            }
        }
    } catch (error) {
        console.error("[convertTimeUnits] Conversion failed:", error);
        const anyErr = /** @type {any} */ (error);
        throw new Error(`Failed to convert time: ${anyErr?.message}`);
    }
}
