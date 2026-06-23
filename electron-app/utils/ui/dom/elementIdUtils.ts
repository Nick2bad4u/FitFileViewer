/**
 * Flexible DOM element lookup helpers.
 */

import { getElementIdUtilsRuntime } from "./elementIdUtilsRuntime.js";

type FlexibleLookupRoot = Document | ParentNode;

const elementIdUtilsRuntime = getElementIdUtilsRuntime();

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

    addVariant(variants, toCamelCaseVariant(raw));
    addVariant(
        variants,
        raw.replaceAll(/(?<=[a-z0-9])(?=[A-Z])/gu, "_").toLowerCase()
    );
    addVariant(
        variants,
        raw.replaceAll(/(?<=[a-z0-9])(?=[A-Z])/gu, "-").toLowerCase()
    );

    return [...variants];
}

/**
 * Attempt to find an element by ID using multiple naming variants.
 */
export function getElementByIdFlexible(
    doc: Document | null | undefined,
    id: string
): HTMLElement | null {
    if (!doc) {
        return null;
    }

    for (const variant of buildIdVariants(id)) {
        const element = doc.querySelector(toExactIdSelector(variant));

        if (element) {
            return toHTMLElement(element);
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
    if (!doc) {
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
    return "querySelector" in root;
}

function resolveIdSelector(
    doc: FlexibleLookupRoot,
    selector: string
): HTMLElement | null {
    const id = selector.slice(1);

    if (canGetById(doc)) {
        return getElementByIdFlexible(doc, id);
    }

    return canQuery(doc) ? queryIdVariants(doc, id) : null;
}

function resolveIdValue(
    doc: FlexibleLookupRoot,
    id: string
): HTMLElement | null {
    if (canGetById(doc)) {
        return getElementByIdFlexible(doc, id);
    }

    return canQuery(doc) ? queryIdVariants(doc, id) : null;
}

function escapeCssString(value: string): string {
    const backslash = String.fromCodePoint(92);

    return value
        .replaceAll(backslash, `${backslash}${backslash}`)
        .replaceAll('"', `${backslash}"`);
}

function toCamelCaseVariant(value: string): string {
    let result = "";
    let uppercaseNext = false;

    for (const character of value) {
        if (character === "-" || character === "_") {
            uppercaseNext = true;
            continue;
        }

        result += uppercaseNext ? character.toUpperCase() : character;
        uppercaseNext = false;
    }

    return result;
}

function toExactIdSelector(id: string): string {
    return `[id="${escapeCssString(id)}"]`;
}

function queryIdVariants(root: ParentNode, id: string): HTMLElement | null {
    for (const variant of buildIdVariants(id)) {
        const element = toHTMLElement(
            root.querySelector(toExactIdSelector(variant))
        );

        if (element) {
            return element;
        }
    }

    return null;
}

function toHTMLElement(element: Element | null): HTMLElement | null {
    if (!element) {
        return null;
    }

    if (elementIdUtilsRuntime.isHTMLElement(element)) {
        return element;
    }

    return "classList" in element && "style" in element
        ? (element as HTMLElement)
        : null;
}
