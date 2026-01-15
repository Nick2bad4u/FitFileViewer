/**
 * @fileoverview Allowlist-based HTML sanitizer.
 *
 * This module exists to safely consume HTML strings produced from untrusted/derived sources
 * (e.g., FIT-derived strings formatted into template literals or third-party helpers like Arquero).
 *
 * IMPORTANT:
 * - This is not a full HTML sanitizer like DOMPurify.
 * - It is intentionally conservative and should be used with very small, known-safe allowlists.
 */
/**
 * @typedef {{
 *  allowedTags: ReadonlyArray<string>;
 *  allowedAttributes: ReadonlyArray<string>;
 *  stripUrlInStyle?: boolean;
 * }} SanitizeAllowlistOptions
 */
/**
 * Sanitise an HTML string into a safe DocumentFragment.
 *
 * Strategy:
 * - Remove any element whose tagName is not in the allowlist.
 * - Remove any attribute not in the allowlist.
 * - Always strip inline event handlers (`on*`).
 * - Always strip common URL-bearing attributes (href/src/xlink:href).
 * - Optionally strip style attributes containing `url(` or `expression(`.
 *
 * Disallowed elements are replaced with their textContent so user-visible text remains.
 *
 * @param {string} html
 * @param {SanitizeAllowlistOptions} options
 * @returns {DocumentFragment}
 */
export function sanitizeHtmlAllowlist(html: string, options: SanitizeAllowlistOptions): DocumentFragment;
export type SanitizeAllowlistOptions = {
    allowedTags: ReadonlyArray<string>;
    allowedAttributes: ReadonlyArray<string>;
    stripUrlInStyle?: boolean;
};
//# sourceMappingURL=sanitizeHtmlAllowlist.d.ts.map
