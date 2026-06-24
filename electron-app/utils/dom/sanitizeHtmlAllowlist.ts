/**
 * Allowlist-based HTML sanitizer.
 *
 * This module safely consumes small HTML fragments produced from
 * untrusted/derived sources. It is intentionally conservative and should not be
 * treated as a full HTML sanitizer replacement for arbitrary documents.
 */
import { resolveDomPurifyRuntime } from "./domPurifyRuntime.js";
import {
    getSanitizeHtmlAllowlistRuntime,
    type SanitizeHtmlAllowlistRuntime,
} from "./sanitizeHtmlAllowlistRuntime.js";

/**
 * Small presentation-only HTML allowlist.
 */
export interface SanitizeAllowlistOptions {
    allowedTags: readonly string[];
    allowedAttributes: readonly string[];
    stripUrlInStyle?: boolean;
}

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
    "srcdoc",
    "srcset",
    "xlink:href",
]);

/**
 * Tags that are never allowed regardless of the caller allowlist.
 *
 * Rationale:
 *
 * - This sanitizer is used for UI fragments; we do not want it to be a general
 *   HTML renderer.
 * - Some tags (script/style/svg/iframe/...) significantly expand the attack
 *   surface.
 */
const ALWAYS_FORBID_TAGS = new Set([
    "embed",
    "iframe",
    "link",
    "math",
    "meta",
    "object",
    "script",
    "style",
    "svg",
]);

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
 * Disallowed non-dangerous elements are replaced with their textContent so
 * user-visible text remains.
 */
export function sanitizeHtmlAllowlist(
    html: string,
    options: SanitizeAllowlistOptions = {
        allowedAttributes: [],
        allowedTags: [],
    },
    runtime: SanitizeHtmlAllowlistRuntime = getSanitizeHtmlAllowlistRuntime()
): DocumentFragment {
    const allowedTagsInput = Array.isArray(options.allowedTags)
        ? options.allowedTags
        : [];
    const allowedAttributesInput = Array.isArray(options.allowedAttributes)
        ? options.allowedAttributes
        : [];

    const purifier = resolveDomPurifyRuntime();

    if (purifier) {
        const fragment = purifier.sanitize(String(html), {
            ALLOWED_ATTR: allowedAttributesInput.map((a) =>
                String(a).toLowerCase()
            ),
            ALLOWED_TAGS: allowedTagsInput.map((t) => String(t).toLowerCase()),
            FORBID_ATTR: [...ALWAYS_STRIP_URL_ATTRIBUTES],
            FORBID_CONTENTS: [...ALWAYS_FORBID_TAGS],
            FORBID_TAGS: [...ALWAYS_FORBID_TAGS],
            RETURN_DOM_FRAGMENT: true,
        });

        if (options.stripUrlInStyle !== false) {
            stripUnsafeStyleAttributes(fragment, runtime);
        }

        return fragment;
    }

    const fragment = parseHtmlFragment(String(html), runtime);
    sanitizeFragment(
        fragment,
        allowedTagsInput,
        allowedAttributesInput,
        options.stripUrlInStyle !== false,
        runtime
    );
    return fragment;
}

function parseHtmlFragment(
    html: string,
    runtime: SanitizeHtmlAllowlistRuntime
): DocumentFragment {
    // eslint-disable-next-line sdl/no-domparser-html-without-sanitization -- This is the sanitizer boundary; sanitizeFragment strips the parsed tree before callers receive it.
    const parsed = runtime.createDomParser().parseFromString(html, "text/html");
    const fragment = runtime.createDocumentFragment();
    for (const node of Array.from(parsed.body.childNodes)) {
        fragment.append(node);
    }
    return fragment;
}

function sanitizeFragment(
    fragment: DocumentFragment,
    allowedTagsInput: readonly string[],
    allowedAttributesInput: readonly string[],
    stripUrlInStyle: boolean,
    runtime: SanitizeHtmlAllowlistRuntime
): void {
    // DOM Element.tagName is always uppercase in HTML documents. Normalizing
    // here makes the sanitizer resilient to caller-provided casing.
    const forbiddenTagsUpper = new Set(
        Array.from(ALWAYS_FORBID_TAGS, (t) => t.toUpperCase())
    );
    const allowedTags = new Set(
        allowedTagsInput.map((t) => String(t).toUpperCase())
    );
    const allowedAttributes = new Set(
        allowedAttributesInput.map((a) => String(a).toLowerCase())
    );

    const walker = runtime.createElementTreeWalker(fragment);
    const nodesToReplace: Element[] = [];
    const nodesToRemove: Element[] = [];

    while (walker.nextNode()) {
        const el = walker.currentNode;
        if (!runtime.isElement(el)) {
            continue;
        }

        if (forbiddenTagsUpper.has(el.tagName)) {
            nodesToRemove.push(el);
            continue;
        }

        if (!allowedTags.has(el.tagName)) {
            nodesToReplace.push(el);
            continue;
        }

        sanitizeElementAttributes(el, allowedAttributes, stripUrlInStyle);
    }

    removeElements(nodesToRemove);
    replaceElementsWithText(nodesToReplace, runtime);
}

function sanitizeElementAttributes(
    el: Element,
    allowedAttributes: ReadonlySet<string>,
    stripUrlInStyle: boolean
): void {
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

function removeElements(elements: readonly Element[]): void {
    for (const el of elements) {
        try {
            el.remove();
        } catch {
            // Ignore DOM shim edge cases.
        }
    }
}

function replaceElementsWithText(
    elements: readonly Element[],
    runtime: SanitizeHtmlAllowlistRuntime
): void {
    for (const el of elements) {
        try {
            const text = el.textContent ?? "";
            el.replaceWith(runtime.createTextNode(text));
        } catch {
            try {
                el.remove();
            } catch {
                // Ignore DOM shim edge cases.
            }
        }
    }
}

function stripUnsafeStyleAttributes(
    fragment: DocumentFragment,
    runtime: SanitizeHtmlAllowlistRuntime
): void {
    const walker = runtime.createElementTreeWalker(fragment);
    while (walker.nextNode()) {
        const el = walker.currentNode;
        if (!runtime.isElement(el)) {
            continue;
        }
        const styleValue = el.getAttribute("style");
        if (typeof styleValue === "string" && containsUnsafeCss(styleValue)) {
            el.removeAttribute("style");
        }
    }
}

function containsUnsafeCss(styleValue: string): boolean {
    // Remove comments first so `u/*x*/rl(` can't bypass scans.
    const withoutComments = styleValue.replaceAll(/\/\*[\s\S]*?\*\//gu, "");
    const decoded = decodeCssEscapesForScan(withoutComments);
    const normalized = decoded.toLowerCase().replaceAll(/\s+/gu, "");

    // Block URL-like constructs.
    return (
        normalized.includes("url(") ||
        normalized.includes("expression(") ||
        normalized.includes("@import") ||
        // Old IE behavior() can fetch remote resources.
        normalized.includes("behavior:")
    );
}

function decodeCssEscapesForScan(input: string): string {
    // CSS escapes:
    // - \HHHHHH[whitespace]? (1-6 hex digits)
    // - \<any char>
    // Ref: CSS Syntax Level 3.
    return input.replaceAll(
        /\\(?:([0-9a-f]{1,6})\s?|([\s\S]))/giu,
        (
            _match: string,
            hex: string | undefined,
            single: string | undefined
        ) => {
            if (hex) {
                const codePoint = Number.parseInt(hex, 16);
                if (
                    !Number.isFinite(codePoint) ||
                    codePoint <= 0 ||
                    codePoint > 0x10_ff_ff
                ) {
                    return "";
                }
                try {
                    return String.fromCodePoint(codePoint);
                } catch {
                    return "";
                }
            }
            return typeof single === "string" ? single : "";
        }
    );
}
