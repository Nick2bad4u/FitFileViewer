/**
 * Flexible DOM element lookup helpers.
 */

type FlexibleLookupRoot = Document | ParentNode;

/**
 * Build a list of ID variants for a given element ID.
 */
export function buildIdVariants(id: string): string[] {
    const raw = String(id);
    const variants = new Set<string>();

    if (!raw) {
        return [];
    }

    addVariant(variants, raw);
    addVariant(variants, raw.replaceAll("_", "-"));
    addVariant(variants, raw.replaceAll("-", "_"));

    addVariant(
        variants,
        raw.replaceAll(/[-_]+(.)/gu, (_match, character: string) =>
            character.toUpperCase()
        )
    );
    addVariant(
        variants,
        raw.replaceAll(/([a-z0-9])([A-Z])/gu, "$1_$2").toLowerCase()
    );
    addVariant(
        variants,
        raw.replaceAll(/([a-z0-9])([A-Z])/gu, "$1-$2").toLowerCase()
    );

    return Array.from(variants);
}

/**
 * Attempt to find an element by ID using multiple naming variants.
 */
export function getElementByIdFlexible(
    doc: Document | null | undefined,
    id: string
): HTMLElement | null {
    if (!doc || typeof doc.getElementById !== "function") {
        return null;
    }

    for (const variant of buildIdVariants(id)) {
        const element = doc.getElementById(variant);

        if (element) {
            return element;
        }
    }

    return null;
}

/**
 * Query selector helper that supports alternate ID spellings when the selector
 * is a simple ID.
 */
export function querySelectorByIdFlexible(
    doc: Document | null | undefined,
    selector: string
): HTMLElement | null {
    if (!doc || typeof doc.querySelector !== "function") {
        return null;
    }

    if (selector.startsWith("#") && !selector.includes(" ")) {
        const id = selector.slice(1);
        const element = getElementByIdFlexible(doc, id);

        return element ?? toHTMLElement(doc.querySelector(selector));
    }

    return toHTMLElement(doc.querySelector(selector));
}

/**
 * Resolve the first matching element from a list of IDs or simple ID selectors.
 */
export function getElementByIdFlexibleList(
    doc: FlexibleLookupRoot | null | undefined,
    ids: string[] | string
): HTMLElement | null {
    if (!doc) {
        return null;
    }

    const values = Array.isArray(ids) ? ids : [ids];

    for (const value of values) {
        const candidate = String(value).trim();

        if (!candidate) {
            continue;
        }

        const element = candidate.startsWith("#")
            ? resolveIdSelector(doc, candidate)
            : resolveIdValue(doc, candidate);

        if (element) {
            return element;
        }
    }

    return null;
}

function addVariant(variants: Set<string>, value: string): void {
    if (value) {
        variants.add(value);
    }
}

function canGetById(root: FlexibleLookupRoot): root is Document {
    return (
        "getElementById" in root && typeof root.getElementById === "function"
    );
}

function canQuery(root: FlexibleLookupRoot): root is ParentNode {
    return typeof root.querySelector === "function";
}

function resolveIdSelector(
    doc: FlexibleLookupRoot,
    selector: string
): HTMLElement | null {
    if (canGetById(doc)) {
        return getElementByIdFlexible(doc, selector.slice(1));
    }

    return canQuery(doc) ? toHTMLElement(doc.querySelector(selector)) : null;
}

function resolveIdValue(
    doc: FlexibleLookupRoot,
    id: string
): HTMLElement | null {
    if (canGetById(doc)) {
        return getElementByIdFlexible(doc, id);
    }

    return canQuery(doc) ? toHTMLElement(doc.querySelector(`#${id}`)) : null;
}

function toHTMLElement(element: Element | null): HTMLElement | null {
    return element instanceof HTMLElement ? element : null;
}
