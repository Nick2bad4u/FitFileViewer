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
export function formatArray(val: number[] | string | any, digits?: number, options?: {
    separator?: string | undefined;
    strictValidation?: boolean | undefined;
}): string | any;
//# sourceMappingURL=formatUtils.d.ts.map