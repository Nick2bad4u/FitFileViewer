/**
 * Sanitise an HTML string into a safe DocumentFragment.
 *
 * Strategy:
 *
 * - Remove any element whose tagName is not in the allowlist.
 * - Remove any attribute not in the allowlist.
 * - Always strip inline event handlers (`on*`).
 * - Always strip common URL-bearing attributes (href/src/xlink:href).
 * - Optionally strip style attributes containing `url(` or `expression(`.
 *
 * Disallowed elements are replaced with their textContent so user-visible text
 * remains.
 *
 * @param {string} html
 * @param {SanitizeAllowlistOptions} options
 *
 * @returns {DocumentFragment}
 */
export function sanitizeHtmlAllowlist(
    html: string,
    options: SanitizeAllowlistOptions
): DocumentFragment;
export type SanitizeAllowlistOptions = {
    allowedTags: ReadonlyArray<string>;
    allowedAttributes: ReadonlyArray<string>;
    stripUrlInStyle?: boolean;
};
