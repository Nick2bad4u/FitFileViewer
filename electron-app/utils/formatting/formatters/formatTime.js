/**
 * @version 2.0.0 - Updated to use centralized configuration and unified error
 *   handling
 *
 * @file Time formatting utility for FitFileViewer
 *
 *   Provides functions for formatting time values from seconds into
 *   human-readable strings with various formats and user-preferred units.
 *
 * @author FitFileViewer Team
 *
 * @since 1.0.0
 */

import { CONVERSION_FACTORS, TIME_UNITS } from "../../config/index.js";
import { getChartSetting } from "../../state/domain/settingsStateManager.js";
// No imports needed from errorHandling for current implementation
import { convertTimeUnits } from "../converters/convertTimeUnits.js";

/**
 * Time formatting constants
 *
 * @readonly
 */
const TIME_FORMAT_CONSTANTS = {
    FALLBACK_VALUE: "0:00",
    PAD_CHAR: "0",
    PAD_LENGTH: 2,
};

/**
 * Formats seconds into MM:SS or HH:MM:SS format, or converts to user's
 * preferred time units
 *
 * @example
 *     // Format time in MM:SS format
 *     const timeStr = formatTime(3661); // "1:01:01"
 *
 *     // Format with user units
 *     const timeUnits = formatTime(3600, true); // "1.0h" (if user prefers hours)
 *
 * @param {number} seconds - Time in seconds
 * @param {boolean} useUserUnits - Whether to use user's preferred units or
 *   always use MM:SS format
 *
 * @returns {string} Formatted time string
 */
export function formatTime(seconds, useUserUnits = false) {
    // Handle null and undefined
    if (seconds === null || seconds === undefined) {
        console.warn("[formatTime] Invalid seconds value:", seconds);
        return TIME_FORMAT_CONSTANTS.FALLBACK_VALUE;
    }

    // Handle non-number types
    if (typeof seconds !== "number") {
        console.warn("[formatTime] Invalid seconds value:", seconds);
        return TIME_FORMAT_CONSTANTS.FALLBACK_VALUE;
    }

    // Handle positive Infinity specially - must come before isFinite checks
    if (seconds === Infinity) {
        return "Infinity:NaN:NaN";
    }

    // Handle NaN
    if (Number.isNaN(seconds)) {
        console.warn("[formatTime] Invalid seconds value:", seconds);
        return TIME_FORMAT_CONSTANTS.FALLBACK_VALUE;
    }

    // Handle negative numbers (including -Infinity)
    if (seconds < 0) {
        console.warn("[formatTime] Negative time value:", seconds);
        return TIME_FORMAT_CONSTANTS.FALLBACK_VALUE;
    }

    // Valid positive finite number - process normally
    return formatTimeInternal(seconds, useUserUnits);
}

/**
 * Formats time as HH:MM:SS or MM:SS string
 *
 * @private
 *
 * @param {number} seconds - Time in seconds
 *
 * @returns {string} Formatted time string
 */
function formatAsTimeString(seconds) {
    const hours = Math.floor(seconds / CONVERSION_FACTORS.SECONDS_PER_HOUR);
    const minutes = Math.floor(
        (seconds % CONVERSION_FACTORS.SECONDS_PER_HOUR) /
            CONVERSION_FACTORS.SECONDS_PER_MINUTE
    );
    const secs = Math.floor(seconds % CONVERSION_FACTORS.SECONDS_PER_MINUTE);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(TIME_FORMAT_CONSTANTS.PAD_LENGTH, TIME_FORMAT_CONSTANTS.PAD_CHAR)}:${secs.toString().padStart(TIME_FORMAT_CONSTANTS.PAD_LENGTH, TIME_FORMAT_CONSTANTS.PAD_CHAR)}`;
    }
    return `${minutes}:${secs.toString().padStart(TIME_FORMAT_CONSTANTS.PAD_LENGTH, TIME_FORMAT_CONSTANTS.PAD_CHAR)}`;
}

/**
 * Internal time formatting with error handling
 *
 * @private
 *
 * @param {number} seconds - Validated time in seconds
 * @param {boolean} useUserUnits - Whether to use user's preferred units
 *
 * @returns {string} Formatted time string
 */
function formatTimeInternal(seconds, useUserUnits) {
    try {
        if (useUserUnits) {
            return formatWithUserUnits(seconds);
        }
        return formatAsTimeString(seconds);
    } catch (error) {
        console.error("[formatTime] Time formatting failed:", error);
        return TIME_FORMAT_CONSTANTS.FALLBACK_VALUE;
    }
}

/**
 * Formats time using user's preferred units from settings state
 *
 * @private
 *
 * @param {number} seconds - Time in seconds
 *
 * @returns {string} Formatted time string with units
 */
function formatWithUserUnits(seconds) {
    /** @type {string} */
    let timeUnits = TIME_UNITS.SECONDS;

    try {
        const stored = getChartSetting("timeUnits");
        if (
            stored === TIME_UNITS.MINUTES ||
            stored === TIME_UNITS.HOURS ||
            stored === TIME_UNITS.SECONDS
        ) {
            timeUnits = stored;
        }
    } catch (error) {
        console.error("[formatTime] Error accessing time unit setting:", error);
        throw error; // Re-throw to be caught by formatTimeInternal
    }

    try {
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
    } catch (error) {
        console.error("[formatTime] Error in convertTimeUnits:", error);
        throw error; // Re-throw to be caught by formatTimeInternal
    }
}
