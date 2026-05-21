function isDocumentLike(candidate) {
    return (
        candidate !== null &&
        typeof candidate === "object" &&
        "getElementById" in candidate &&
        typeof candidate.getElementById === "function" &&
        "querySelectorAll" in candidate &&
        typeof candidate.querySelectorAll === "function"
    );
}
/**
 * Safely return a DOM document, preferring an effective Vitest realm when
 * present.
 */
export function getDoc() {
    const candidates = [];
    // Prefer Vitest effective document, if present
    try {
        if (
            typeof __vitest_effective_document__ !== "undefined" &&
            __vitest_effective_document__
        ) {
            candidates.push(__vitest_effective_document__);
        }
    } catch {
        /* ignore */
    }
    // Local realm document (JSDOM/Electron)
    try {
        if (typeof document !== "undefined" && document) {
            candidates.push(document);
        }
    } catch {
        /* ignore */
    }
    // Global document (other realms)
    try {
        if (
            typeof globalThis !== "undefined" &&
            "document" in globalThis &&
            globalThis.document
        ) {
            candidates.push(globalThis.document);
        }
    } catch {
        /* ignore */
    }
    for (const candidate of candidates) {
        if (isDocumentLike(candidate)) {
            return candidate;
        }
    }
    // Final fallback (should exist in JSDOM/Electron)
    return document;
}
