/**
 * @file Flexible DOM element lookup helpers.
 *
 *   Provides resilient ID lookups that tolerate historical naming conventions
 *   (snake_case, kebab-case, camelCase) across legacy templates and tests.
 */

/**
 * Build a list of ID variants for a given element ID.
 *
 * @param {string} id
 *
 * @returns {string[]}
 */
export function buildIdVariants(id) {
    const raw = String(id);
    /** @type {Set<string>} */
    const variants = new Set();

    if (!raw) {
        return [];
    }

    const add = (value) => {
        if (value && typeof value === "string") {
            variants.add(value);
        }
    };

    add(raw);
    add(raw.replaceAll("_", "-"));
    add(raw.replaceAll("-", "_"));

    const camelFromDelimited = raw.replaceAll(/[-_]+(.)/gu, (_m, c) =>
        String(c).toUpperCase()
    );
    add(camelFromDelimited);

    const snakeFromCamel = raw
        .replaceAll(/([a-z0-9])([A-Z])/gu, "$1_$2")
        .toLowerCase();
    add(snakeFromCamel);

    const kebabFromCamel = raw
        .replaceAll(/([a-z0-9])([A-Z])/gu, "$1-$2")
        .toLowerCase();
    add(kebabFromCamel);

    return Array.from(variants);
}

/**
 * Attempt to find an element by ID using multiple naming variants.
 *
 * @param {Document | null | undefined} doc
 * @param {string} id
 *
 * @returns {HTMLElement | null}
 */
export function getElementByIdFlexible(doc, id) {
    if (!doc || typeof doc.getElementById !== "function") {
        return null;
    }

    const variants = buildIdVariants(id);
    for (const variant of variants) {
        const element = doc.getElementById(variant);
        if (element) {
            return element;
        }
    }

    return null;
}

/**
 * Query selector helper that supports alternate ID spellings when the selector
 * is a simple ID (e.g., "#content_chart").
 *
 * @param {Document | null | undefined} doc
 * @param {string} selector
 *
 * @returns {HTMLElement | null}
 */
export function querySelectorByIdFlexible(doc, selector) {
    if (!doc || typeof doc.querySelector !== "function") {
        return null;
    }

    if (selector?.startsWith("#") && !selector.includes(" ")) {
        const id = selector.slice(1);
        return getElementByIdFlexible(doc, id);
    }

    return /** @type {HTMLElement | null} */ (doc.querySelector(selector));
}
