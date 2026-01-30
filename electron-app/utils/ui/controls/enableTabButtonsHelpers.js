/**
 * Safely get computed style values when available.
 *
 * @param {Element} el
 * @param {string} prop
 *
 * @returns {string | undefined}
 */
export function safeComputedStyle(el, prop) {
    try {
        if (
            globalThis.window !== undefined &&
            typeof globalThis.getComputedStyle === "function"
        ) {
            const cs = globalThis.getComputedStyle(el);
            if (typeof cs.getPropertyValue === "function") {
                const v = cs.getPropertyValue(prop);
                return v || undefined;
            }
            // Fallback indexing for environments that allow it
            return /** @type {any} */ (cs)[prop];
        }
    } catch {
        /* Ignore errors */
    }
}

// Safe helpers to work across jsdom and heavily mocked DOMs in tests
/**
 * Safely get an array of elements matching the tab button selector. Returns an
 * empty array if document APIs are missing or throw.
 *
 * @returns {HTMLElement[]}
 */
export function safeQueryTabButtons() {
    try {
        if (typeof document !== "undefined") {
            if (typeof document.querySelectorAll === "function") {
                // NodeList may not be iterable in some mocked environments, Array.from handles it
                return /** @type {HTMLElement[]} */ ([
                    ...document.querySelectorAll(".tab-button"),
                ]);
            }
            if (typeof document.getElementsByClassName === "function") {
                return /** @type {HTMLElement[]} */ ([
                    ...document.querySelectorAll(".tab-button"),
                ]);
            }
        }
    } catch {
        // Fall-through to return []
    }
    return [];
}
