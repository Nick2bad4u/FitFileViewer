/**
 * Formats an array or a comma-separated string of numbers to a string with each number
 * rounded to a specified number of decimal digits.
 *
 * @param {number[] | string} val - The array of numbers or a comma-separated string of numbers to format.
 * @param {number} [digits=2] - The number of decimal digits to round each number to.
 * @returns {string | any} The formatted string of numbers (as strings), or the original value if it is not an array or a comma-separated string.
 * @throws {Error} If any value in the array or string cannot be converted to a number.
 */
export function formatArray(val, digits = 2) {
    if (Array.isArray(val))
        return val
            .map((v) => {
                if (Number.isNaN(Number(v))) throw new Error(`Invalid number: ${v}`);
                return parseFloat(Number(v).toFixed(digits));
            })
            .join(", ");
    if (typeof val === "string" && val.includes(","))
        return val
            .split(",")
            .map((v) => {
                if (isNaN(Number(v))) throw new Error(`Invalid number: ${v}`);
                return Number(v).toFixed(digits);
            })
            .join(", ");
    return val;
}
