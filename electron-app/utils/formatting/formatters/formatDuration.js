/**
 * @fileoverview Duration formatting utility for FitFileViewer
 *
 * Provides functions for formatting durations from seconds into human-readable
 * strings with appropriate time units (seconds, minutes, hours).
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */

// Time conversion constants
const TIME_CONSTANTS = {
    SECONDS_PER_MINUTE: 60,
    SECONDS_PER_HOUR: 3600,
},

// Formatting thresholds
 THRESHOLDS = {
    SECONDS_ONLY: TIME_CONSTANTS.SECONDS_PER_MINUTE,
    MINUTES_ONLY: TIME_CONSTANTS.SECONDS_PER_HOUR,
};

/**
 * Validates and normalizes duration input
 * @param {number|string|null|undefined} seconds - Duration input to validate
 * @returns {{isValid: boolean, value: number, error?: string}} Validation result
 */
function validateAndNormalizeDuration(seconds) {
    // Handle null/undefined inputs
    if (seconds === null || seconds === undefined) {
        return { isValid: true, value: 0 };
    }

    // Convert string to number if possible
    if (typeof seconds === "string") {
        const trimmed = seconds.trim();
        if (trimmed === "") {
            // Provide required value field for validation result shape
            return { isValid: false, value: 0, error: "Empty string input" };
        }
        seconds = Number(trimmed);
    }

    // Round to integer if it's a decimal number
    if (typeof seconds === "number" && !Number.isInteger(seconds)) {
        seconds = Math.round(seconds);
    }

    // Validate that it's a finite number
    if (!Number.isFinite(seconds)) {
        return { isValid: false, value: 0, error: "Input must be a finite number" };
    }

    // Ensure non-negative
    if (seconds < 0) {
        return { isValid: false, value: 0, error: "Duration cannot be negative" };
    }

    return { isValid: true, value: seconds };
}

/**
 * Formats duration in seconds only
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted string like "30 sec"
 */
function formatSecondsOnly(seconds) {
    return `${seconds} sec`;
}

/**
 * Formats duration in minutes and seconds
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted string like "5 min 30 sec"
 */
function formatMinutesAndSeconds(seconds) {
    const minutes = Math.floor(seconds / TIME_CONSTANTS.SECONDS_PER_MINUTE),
     remainingSeconds = seconds % TIME_CONSTANTS.SECONDS_PER_MINUTE;
    return `${minutes} min ${remainingSeconds} sec`;
}

/**
 * Formats duration in hours and minutes
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted string like "2 hrs 30 min"
 */
function formatHoursAndMinutes(seconds) {
    const hours = Math.floor(seconds / TIME_CONSTANTS.SECONDS_PER_HOUR),
     remainingSeconds = seconds % TIME_CONSTANTS.SECONDS_PER_HOUR,
     minutes = Math.floor(remainingSeconds / TIME_CONSTANTS.SECONDS_PER_MINUTE),

     hourText = hours === 1 ? "hr" : "hrs";
    return `${hours} ${hourText} ${minutes} min`;
}

/**
 * Formats a duration given in seconds into a human-readable string
 *
 * Handles various input types and formats appropriately:
 * - Null/undefined inputs return empty string
 * - Invalid inputs throw descriptive errors
 * - Less than 60 seconds: "X sec"
 * - Less than 1 hour: "Y min Z sec"
 * - 1 hour or more: "H hr(s) M min"
 *
 * @param {number|string|null|undefined} seconds - The duration in seconds
 * @returns {string} The formatted duration string
 * @throws {Error} If the input is not a finite number or is negative
 *
 * @example
 * formatDuration(30);        // "30 sec"
 * formatDuration(90);        // "1 min 30 sec"
 * formatDuration(3661);      // "1 hr 1 min"
 * formatDuration(7320);      // "2 hrs 2 min"
 * formatDuration(null);      // ""
 * formatDuration(-10);       // throws Error
 */
export function formatDuration(seconds) {
    // Validate and normalize input
    const validation = validateAndNormalizeDuration(seconds);

    if (!validation.isValid) {
        throw new Error(`Invalid duration input: ${validation.error}`);
    }

    // Handle null/undefined case (returns empty string)
    if (seconds === null || seconds === undefined) {
        return "";
    }

    const normalizedSeconds = validation.value;

    // Format based on duration length
    if (normalizedSeconds < THRESHOLDS.SECONDS_ONLY) {
        return formatSecondsOnly(normalizedSeconds);
    } else if (normalizedSeconds < THRESHOLDS.MINUTES_ONLY) {
        return formatMinutesAndSeconds(normalizedSeconds);
    } 
        return formatHoursAndMinutes(normalizedSeconds);
    
}
