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
        const element = getElementByIdFlexible(doc, id);
        if (element) {
            return element;
        }
        return /** @type {HTMLElement | null} */ (doc.querySelector(selector));
    }

    return /** @type {HTMLElement | null} */ (doc.querySelector(selector));
}

/**
 * Resolve the first matching element from a list of IDs or simple ID selectors.
 *
 * @param {Document | null | undefined} doc
 * @param {string[] | string} ids
 *
 * @returns {HTMLElement | null}
 */
export function getElementByIdFlexibleList(doc, ids) {
    if (!doc) {
        return null;
    }

    const canGetById = typeof doc.getElementById === "function";
    const canQuery = typeof doc.querySelector === "function";
    const values = Array.isArray(ids) ? ids : [ids];
    for (const value of values) {
        if (!value) {
            continue;
        }

        const candidate = String(value).trim();
        if (!candidate) {
            continue;
        }

        if (candidate.startsWith("#")) {
            const element = canQuery
                ? querySelectorByIdFlexible(doc, candidate)
                : canGetById
                  ? getElementByIdFlexible(doc, candidate.slice(1))
                  : null;
            if (element) {
                return element;
            }
            continue;
        }

        const element = canGetById
            ? getElementByIdFlexible(doc, candidate)
            : canQuery
              ? querySelectorByIdFlexible(doc, `#${candidate}`)
              : null;
        if (element) {
            return element;
        }
    }

    return null;
}
