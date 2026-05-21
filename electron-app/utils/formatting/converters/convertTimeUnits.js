const TIME_CONVERSIONS = {
    SECONDS_TO_HOURS: 3600,
    SECONDS_TO_MINUTES: 60,
};
/**
 * Supported time units.
 */
export const TIME_UNITS = {
    HOURS: "hours",
    MINUTES: "minutes",
    SECONDS: "seconds",
};
/**
 * Converts time from seconds to the requested display unit.
 *
 * Unknown units preserve legacy behavior by warning and returning seconds.
 *
 * @example Const hours = convertTimeUnits(3600, TIME_UNITS.HOURS); // 1
 *
 * @param seconds - Time in seconds.
 * @param targetUnit - Target unit: seconds, minutes, or hours.
 *
 * @returns Converted time value.
 *
 * @throws TypeError If seconds is not a number or is NaN.
 */
export function convertTimeUnits(seconds, targetUnit) {
    if (typeof seconds !== "number" || Number.isNaN(seconds)) {
        throw new TypeError(
            `Expected seconds to be a number, received ${typeof seconds}`
        );
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
                console.warn(
                    `[convertTimeUnits] Unknown unit '${targetUnit}', defaulting to seconds`
                );
                return seconds;
            }
        }
    } catch (error) {
        console.error("[convertTimeUnits] Conversion failed:", error);
        throw new Error(`Failed to convert time: ${getErrorMessage(error)}`);
    }
}
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
