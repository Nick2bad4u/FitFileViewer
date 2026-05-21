/**
 * Capitalizes the first letter of a string.
 *
 * Non-string inputs are returned unchanged for compatibility with existing
 * rendering code. Passing `null` as the options object still throws when the
 * input is a string, matching the legacy destructuring behavior.
 *
 * @example FormatCapitalize("hello world"); // "Hello world"
 * formatCapitalize("FIT"); // "Fit" formatCapitalize("mcdonald", {
 * lowercaseRest: false }); // "Mcdonald"
 *
 * @param value - Value to capitalize when it is a string.
 * @param options - Capitalization options.
 *
 * @returns Capitalized string, or the original non-string value.
 */
export function formatCapitalize(value, options = {}) {
    if (!value || typeof value !== "string") {
        return value;
    }
    const { lowercaseRest = true } = options;
    if (lowercaseRest) {
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
}
