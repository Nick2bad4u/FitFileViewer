/**
 * Formatting utilities for various data types in FitFileViewer
 * Provides consistent formatting patterns across the application
 */

// Constants for better maintainability
const FORMATTING_CONSTANTS = {
    DEFAULT_DECIMAL_DIGITS: 2,
    SEPARATOR: ", ",
    LOG_PREFIX: "[FormatUtils]",
};

/**
 * Logs messages with context for formatting operations
 * @param {string} message - The message to log
 * @param {string} level - Log level ('info', 'warn', 'error')
 * @private
 */
function logWithContext(message, level = "info") {
    try {
        const prefix = FORMATTING_CONSTANTS.LOG_PREFIX;
        switch (level) {
            case "warn":
                console.warn(`${prefix} ${message}`);
                break;
            case "error":
                console.error(`${prefix} ${message}`);
                break;
            default:
                console.log(`${prefix} ${message}`);
        }
    } catch {
        // Silently fail if logging encounters an error
    }
}

/**
 * Validates if a value can be converted to a number
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is a valid number
 * @private
 */
function isValidNumber(value) {
    const num = Number(value);
    return !Number.isNaN(num) && Number.isFinite(num);
}

/**
 * Formats an array or a comma-separated string of numbers to a string with each number
 * rounded to a specified number of decimal digits.
 *
 * @param {number[] | string | any} val - The array of numbers, comma-separated string of numbers, or other value to format
 * @param {number} [digits=2] - The number of decimal digits to round each number to
 * @param {Object} [options={}] - Additional formatting options
 * @param {string} [options.separator=", "] - Custom separator for joined values
 * @param {boolean} [options.strictValidation=true] - Whether to throw on invalid numbers
 * @returns {string | any} The formatted string of numbers, or the original value if not processable
 * @throws {Error} If strictValidation is true and any value cannot be converted to a number
 *
 * @example
 * // Format array of numbers
 * formatArray([1.234, 2.567, 3.891]) // "1.23, 2.57, 3.89"
 *
 * @example
 * // Format comma-separated string
 * formatArray("1.234,2.567,3.891", 1) // "1.2, 2.6, 3.9"
 *
 * @example
 * // With custom options
 * formatArray([1.234, 2.567], 3, { separator: " | " }) // "1.234 | 2.567"
 */
export function formatArray(val, digits = FORMATTING_CONSTANTS.DEFAULT_DECIMAL_DIGITS, options = {}) {
    const config = {
        separator: FORMATTING_CONSTANTS.SEPARATOR,
        strictValidation: true,
        ...options,
    };

    try {
        // Handle array input
        if (Array.isArray(val)) {
            return val
                .map((v) => {
                    if (!isValidNumber(v)) {
                        const error = `Invalid number: ${v}`;
                        if (config.strictValidation) {
                            throw new Error(error);
                        }
                        logWithContext(error, "warn");
                        return String(v); // Return as-is if not strict
                    }
                    return parseFloat(Number(v).toFixed(digits));
                })
                .join(config.separator);
        }

        // Handle comma-separated string input
        if (typeof val === "string" && val.includes(",")) {
            return val
                .split(",")
                .map((v) => {
                    const trimmed = v.trim();
                    if (!isValidNumber(trimmed)) {
                        const error = `Invalid number in string: ${trimmed}`;
                        if (config.strictValidation) {
                            throw new Error(error);
                        }
                        logWithContext(error, "warn");
                        return trimmed; // Return as-is if not strict
                    }
                    return Number(trimmed).toFixed(digits);
                })
                .join(config.separator);
        }

        // Return original value for non-processable types
        return val;
    } catch (error) {
        const anyErr = /** @type {any} */ (error);
        logWithContext(`Error formatting array: ${anyErr?.message}`, "error");
        throw anyErr;
    }
}
