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
 * formatCapitalize("hello world"); // "Hello world"
 * formatCapitalize("FIT"); // "Fit"
 * formatCapitalize("mcdonald", { lowercaseRest: false }); // "Mcdonald"
 */
export function formatCapitalize(
    str: string,
    options?: {
        lowercaseRest?: boolean | undefined;
    }
): string;
