/**
 * @fileoverview Number validation and conversion helpers
 * @description Centralized utilities for safe number validation and conversion
 */

import { logWithLevel } from "../../logging/logWithLevel.js";

/**
 * Validates if a value is a finite number
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is a finite number
 * @public
 */
export function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}

/**
 * Validates if a value is a positive number
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is a positive finite number
 * @public
 */
export function isPositiveNumber(value) {
    return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Validates if a value can be converted to a number
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is a valid number
 * @public
 */
export function isValidNumber(value) {
    const num = Number(value);
    return !Number.isNaN(num) && Number.isFinite(num);
}

/**
 * Converts a value to an integer safely
 * @param {any} value - Value to convert
 * @param {string} [fieldName="value"] - Name of the field for error reporting
 * @param {Object} [options] - Options
 * @param {boolean} [options.silent=false] - Don't log warnings
 * @returns {number|null} Converted integer or null if invalid
 * @public
 */
export function safeToInteger(value, fieldName = "value", options = {}) {
    const num = safeToNumber(value, fieldName, options);
    return num === null ? null : Math.round(num);
}

/**
 * Safely converts a value to a number with validation
 * @param {any} value - Value to convert
 * @param {string} [fieldName="value"] - Name of the field for error reporting
 * @param {Object} [options] - Options
 * @param {boolean} [options.silent=false] - Don't log warnings
 * @returns {number|null} Converted number or null if invalid
 * @public
 */
export function safeToNumber(value, fieldName = "value", options = {}) {
    if (value == null) {
        return null;
    }

    const num = Number(value);
    if (!Number.isFinite(num)) {
        if (!options.silent) {
            logWithLevel("warn", `Invalid ${fieldName}: ${value}`);
        }
        return null;
    }

    return num;
}
