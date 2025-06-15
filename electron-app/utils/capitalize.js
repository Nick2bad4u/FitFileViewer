/**
 * Capitalizes the first letter of a string.
 *
 * By default, lowercases the rest of the string. To preserve the original casing,
 * set the `lowercaseRest` option to false.
 *
 * @param {string} str - String to capitalize
 * @param {Object} [options] - Options object
 * @param {boolean} [options.lowercaseRest=true] - Whether to lowercase the rest of the string
 * @returns {string} Capitalized string
 *
 * @example
 * capitalize("hello world"); // "Hello world"
 * capitalize("FIT"); // "Fit"
 * capitalize("mcdonald", { lowercaseRest: false }); // "Mcdonald"
 */

export function capitalize(str, options = {}) {
    if (!str || typeof str !== "string") return str;
    const { lowercaseRest = true } = options;
    if (lowercaseRest) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}
