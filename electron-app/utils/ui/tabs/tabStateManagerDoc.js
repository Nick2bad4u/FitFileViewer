/**
 * Safely return a DOM document, preferring an effective Vitest realm when
 * present.
 *
 * @returns {Document}
 */
export function getDoc() {
    /** @type {any[]} */
    const candidates = [];

    // Prefer Vitest effective document, if present
    try {
        // @ts-ignore
        if (typeof __vitest_effective_document__ !== "undefined") {
            // @ts-ignore
            candidates.push(__vitest_effective_document__);
        }
    } catch {
        /* ignore */
    }

    // Local realm document (JSDOM/Electron)
    try {
        // @ts-ignore
        if (typeof document !== "undefined" && document) {
            // @ts-ignore
            candidates.push(document);
        }
    } catch {
        /* ignore */
    }

    // Global document (other realms)
    try {
        if (
            typeof globalThis !== "undefined" &&
            /** @type {any} */ (globalThis).document
        ) {
            candidates.push(/** @type {any} */ (globalThis).document);
        }
    } catch {
        /* ignore */
    }

    for (const candidate of candidates) {
        if (
            candidate &&
            typeof candidate.getElementById === "function" &&
            typeof candidate.querySelectorAll === "function"
        ) {
            return /** @type {Document} */ (candidate);
        }
    }

    // Final fallback (should exist in JSDOM/Electron)
    // @ts-ignore
    return /** @type {Document} */ (document);
}
