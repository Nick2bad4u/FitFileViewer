/**
 * Validates if a value is a finite number
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is a finite number
 * @public
 */
export function isFiniteNumber(value: any): boolean;
/**
 * Validates if a value is a positive number
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is a positive finite number
 * @public
 */
export function isPositiveNumber(value: any): boolean;
/**
 * Validates if a value can be converted to a number
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is a valid number
 * @public
 */
export function isValidNumber(value: any): boolean;
/**
 * Converts a value to an integer safely
 * @param {any} value - Value to convert
 * @param {string} [fieldName="value"] - Name of the field for error reporting
 * @param {Object} [options] - Options
 * @param {boolean} [options.silent=false] - Don't log warnings
 * @returns {number|null} Converted integer or null if invalid
 * @public
 */
export function safeToInteger(value: any, fieldName?: string, options?: {
    silent?: boolean | undefined;
}): number | null;
/**
 * Safely converts a value to a number with validation
 * @param {any} value - Value to convert
 * @param {string} [fieldName="value"] - Name of the field for error reporting
 * @param {Object} [options] - Options
 * @param {boolean} [options.silent=false] - Don't log warnings
 * @returns {number|null} Converted number or null if invalid
 * @public
 */
export function safeToNumber(value: any, fieldName?: string, options?: {
    silent?: boolean | undefined;
}): number | null;
//# sourceMappingURL=numberHelpers.d.ts.map