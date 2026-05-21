const FORMATTING_CONSTANTS = {
    DEFAULT_DECIMAL_DIGITS: 2,
    LOG_PREFIX: "[FormatUtils]",
    SEPARATOR: ", ",
};
/**
 * Formats an array or a comma-separated string of numbers.
 *
 * Arrays are rounded and then parsed back to numbers before joining, preserving
 * the legacy behavior that removes trailing zeroes. Comma-separated strings use
 * `toFixed`, preserving fixed decimal places.
 *
 * @example FormatArray([1.234, 2.567]); // "1.23, 2.57"
 * formatArray("1.234,2.567", 1); // "1.2, 2.6"
 *
 * @param val - Value to format.
 * @param digits - Decimal digits to use for numeric values.
 * @param options - Formatting options.
 *
 * @returns Formatted values, or the original value when it is not processable.
 *
 * @throws Error when strict validation is enabled and a value is invalid.
 */
export function formatArray(
    val,
    digits = FORMATTING_CONSTANTS.DEFAULT_DECIMAL_DIGITS,
    options = {}
) {
    const config = {
        separator: FORMATTING_CONSTANTS.SEPARATOR,
        strictValidation: true,
        ...(options ?? {}),
    };
    try {
        if (Array.isArray(val)) {
            return formatArrayInput(val, digits, config);
        }
        if (typeof val === "string" && val.includes(",")) {
            return formatCommaSeparatedString(val, digits, config);
        }
        return val;
    } catch (error) {
        logWithContext(
            `Error formatting array: ${getLegacyErrorMessage(error)}`,
            "error"
        );
        throw error;
    }
}
function formatArrayInput(values, digits, config) {
    return values
        .map((value) => {
            if (!isValidNumber(value)) {
                const error = `Invalid number: ${value}`;
                if (config.strictValidation) {
                    throw new Error(error);
                }
                logWithContext(error, "warn");
                return String(value);
            }
            return Number.parseFloat(Number(value).toFixed(digits));
        })
        .join(config.separator);
}
function formatCommaSeparatedString(value, digits, config) {
    return value
        .split(",")
        .map((entry) => {
            const trimmed = entry.trim();
            if (!isValidNumber(trimmed)) {
                const error = `Invalid number in string: ${trimmed}`;
                if (config.strictValidation) {
                    throw new Error(error);
                }
                logWithContext(error, "warn");
                return trimmed;
            }
            return Number(trimmed).toFixed(digits);
        })
        .join(config.separator);
}
function isValidNumber(value) {
    const numericValue = Number(value);
    return !Number.isNaN(numericValue) && Number.isFinite(numericValue);
}
function logWithContext(message, level = "info") {
    try {
        const prefix = FORMATTING_CONSTANTS.LOG_PREFIX;
        switch (level) {
            case "error": {
                console.error(`${prefix} ${message}`);
                break;
            }
            case "warn": {
                console.warn(`${prefix} ${message}`);
                break;
            }
            default: {
                console.log(`${prefix} ${message}`);
            }
        }
    } catch {
        // Logging failures must not break formatting paths.
    }
}
function getLegacyErrorMessage(error) {
    if (error !== null && typeof error === "object" && "message" in error) {
        const message = error.message;
        return message === undefined ? undefined : String(message);
    }
    return undefined;
}
