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
export function sanitizeHtmlAllowlist(html, options) {
    const template = document.createElement("template");
    template.innerHTML = html;

    const allowedTags = new Set(options.allowedTags);
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
            if (name === "href" || name === "src" || name === "xlink:href") {
                el.removeAttribute(attr.name);
                continue;
            }

            if (!allowedAttributes.has(name)) {
                el.removeAttribute(attr.name);
                continue;
            }

            if (stripUrlInStyle && name === "style") {
                const lower = value.toLowerCase();
                if (lower.includes("url(") || lower.includes("expression(")) {
                    el.removeAttribute(attr.name);
                }
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
