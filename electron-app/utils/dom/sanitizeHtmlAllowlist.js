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
 * Attributes that can trigger network/file fetches or navigation.
 *
 * We always remove these even if a caller includes them in allowedAttributes.
 * This sanitizer is designed for small, presentation-only fragments.
 */
const ALWAYS_STRIP_URL_ATTRIBUTES = new Set([
    "action",
    "background",
    "cite",
    "data",
    "formaction",
    "href",
    "longdesc",
    "manifest",
    "poster",
    "src",
    "srcset",
    "xlink:href",
]);

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
export function sanitizeHtmlAllowlist(html, options) {
    const template = document.createElement("template");
    template.innerHTML = html;

    // DOM Element.tagName is always uppercase in HTML documents.
    // Normalizing here makes the sanitizer resilient to caller-provided casing.
    const allowedTags = new Set(options.allowedTags.map((t) => String(t).toUpperCase()));
    const allowedAttributes = new Set(options.allowedAttributes.map((a) => a.toLowerCase()));
    const stripUrlInStyle = options.stripUrlInStyle !== false;

    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
    /** @type {Element[]} */
    const nodesToReplace = [];

    while (walker.nextNode()) {
        const el = /** @type {Element} */ (walker.currentNode);

        if (!allowedTags.has(el.tagName)) {
            nodesToReplace.push(el);
            continue;
        }

        for (const attr of Array.from(el.attributes)) {
            const name = attr.name.toLowerCase();
            const value = String(attr.value);

            // Inline event handlers are never allowed.
            if (name.startsWith("on")) {
                el.removeAttribute(attr.name);
                continue;
            }

            // Defensive: disallow URL-bearing attributes.
            if (ALWAYS_STRIP_URL_ATTRIBUTES.has(name)) {
                el.removeAttribute(attr.name);
                continue;
            }

            if (!allowedAttributes.has(name)) {
                el.removeAttribute(attr.name);
                continue;
            }

            if (stripUrlInStyle && name === "style" && containsUnsafeCss(value)) {
                el.removeAttribute(attr.name);
            }
        }
    }

    for (const el of nodesToReplace) {
        try {
            const text = el.textContent ?? "";
            el.replaceWith(document.createTextNode(text));
        } catch {
            try {
                el.remove();
            } catch {
                /* ignore */
            }
        }
    }

    return template.content;
}

/**
 * Conservative check for URL-capable primitives within a style attribute.
 *
 * @param {string} styleValue
 * @returns {boolean}
 */
function containsUnsafeCss(styleValue) {
    // Remove comments first so `u/*x*/rl(` can't bypass scans.
    const withoutComments = styleValue.replaceAll(/\/\*[\s\S]*?\*\//gu, "");
    const decoded = decodeCssEscapesForScan(withoutComments);
    const normalized = decoded.toLowerCase().replaceAll(/\s+/gu, "");

    // Block URL-like constructs.
    // Note: we intentionally do not include a literal "javascript:" substring here.
    return (
        normalized.includes("url(") ||
        normalized.includes("expression(") ||
        normalized.includes("@import") ||
        // Old IE behavior() can fetch remote resources.
        normalized.includes("behavior:")
    );
}

/**
 * Decode CSS escape sequences so string-scans can't be bypassed via e.g. `u\\72l(...)`.
 *
 * This is not a full CSS parser; it's a best-effort canonicalization specifically
 * for detecting dangerous URL-capable constructs inside style attributes.
 *
 * @param {string} input
 * @returns {string}
 */
function decodeCssEscapesForScan(input) {
    // CSS escapes:
    // - \HHHHHH[whitespace]? (1-6 hex digits)
    // - \<any char>
    // Ref: CSS Syntax Level 3.
    return input.replaceAll(/\\(?:([0-9a-f]{1,6})(?:\s)?|([\s\S]))/giu, (_match, hex, single) => {
        if (hex) {
            const codePoint = Number.parseInt(hex, 16);
            if (!Number.isFinite(codePoint) || codePoint <= 0 || codePoint > 0x10_ff_ff) {
                return "";
            }
            try {
                return String.fromCodePoint(codePoint);
            } catch {
                return "";
            }
        }
        return typeof single === "string" ? single : "";
    });
}
