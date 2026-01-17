/**
 * @fileoverview Utilities for external links rendered inside the Electron renderer.
 *
 * Why:
 * - We use `data-external-link` attributes in UI markup to indicate links that should open in the
 *   user's default browser.
 * - Centralizing the handler avoids duplicated logic across modals and reduces the risk of missing
 *   preventDefault() (which would otherwise trigger in-app navigation).
 */

import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";

/**
 * Wires click/keyboard activation for links marked with `data-external-link` within a root.
 *
 * This is designed to be called for modal roots (not the entire document) to keep event scope
 * predictable and avoid interfering with OAuth flows or internal links.
 *
 * @param {Object} params
 * @param {ParentNode} params.root
 * @returns {() => void} cleanup
 */
export function attachExternalLinkHandlers({ root }) {
    /** @type {EventTarget | null} */
    const target =
        root && typeof (/** @type {any} */ (root).addEventListener) === "function" ? /** @type {any} */ (root) : null;

    if (!target) {
        return () => {};
    }

    /** @type {Array<() => void>} */
    let cleanupFns = [
        // Delegate click handling to the root to avoid per-link loops.
        addEventListenerWithCleanup(target, "click", (e) => {
            const event = /** @type {MouseEvent} */ (e);
            const anchor = resolveExternalLinkAnchor(event.target);
            if (!anchor) return;

            // Prefer the raw attribute to avoid browser canonicalization (e.g., adding trailing slash).
            const rawHref = anchor.getAttribute("href") ?? anchor.href;
            const validated = validateExternalHttpUrl(rawHref);

            // Always prevent in-app navigation for marked external links.
            event.preventDefault();
            event.stopPropagation();

            if (!validated) {
                return;
            }
            openExternal(validated);
        }),
        // Support keyboard activation on the anchor itself.
        addEventListenerWithCleanup(target, "keydown", (e) => {
            const event = /** @type {KeyboardEvent} */ (e);
            if (event.key !== "Enter" && event.key !== " ") return;

            const anchor = resolveExternalLinkAnchor(event.target);
            if (!anchor) return;

            const rawHref = anchor.getAttribute("href") ?? anchor.href;
            const validated = validateExternalHttpUrl(rawHref);

            event.preventDefault();
            event.stopPropagation();

            if (!validated) {
                return;
            }
            openExternal(validated);
        }),
    ];

    return () => {
        const fns = cleanupFns;
        cleanupFns = [];
        for (const fn of fns) {
            try {
                fn();
            } catch {
                /* ignore */
            }
        }
    };
}

/**
 * Attempt to open a URL externally.
 *
 * @param {string} url
 */
function openExternal(url) {
    const api =
        /** @type {any} */ (globalThis).electronAPI ??
        /** @type {any} */ (globalThis.window ? /** @type {any} */ (globalThis).window.electronAPI : null);

    if (typeof api?.openExternal === "function") {
        // Renderer-facing API returns a promise.
        Promise.resolve(api.openExternal(url)).catch(() => {
            /* ignore */
        });
        return;
    }

    // Fallback for non-Electron environments (tests / docs builds).
    try {
        window.open(url, "_blank", "noopener,noreferrer");
    } catch {
        /* ignore */
    }
}

/**
 * Determine whether an event target represents an anchor marked for external navigation.
 *
 * @param {EventTarget | null} target
 * @returns {HTMLAnchorElement | null}
 */
function resolveExternalLinkAnchor(target) {
    if (!(target instanceof Element)) return null;

    // Accept either:
    // - <a data-external-link>
    // - <a data-external-link="true">
    // - or a child of such an anchor
    const anchor = target.closest("a[data-external-link]");
    if (!(anchor instanceof HTMLAnchorElement)) return null;

    return anchor;
}

/**
 * Validate an external URL coming from DOM markup.
 *
 * Security:
 * - allow only http/https
 * - reject embedded credentials
 * - reject whitespace/control characters
 * - reject non-string/empty inputs
 *
 * @param {unknown} url
 * @returns {string | null}
 */
function validateExternalHttpUrl(url) {
    if (typeof url !== "string") {
        return null;
    }

    const trimmed = url.trim();
    if (!trimmed) {
        return null;
    }

    if (trimmed.length > 4096) {
        return null;
    }

    // Reject any whitespace (must be percent-encoded).
    if (/\s/u.test(trimmed)) {
        return null;
    }

    // Reject control characters outright.
    for (const ch of trimmed) {
        const code = ch.codePointAt(0);
        if (code !== undefined && (code < 0x20 || code === 0x7f)) {
            return null;
        }
    }

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        return null;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return null;
    }
    if (parsed.username || parsed.password) {
        return null;
    }

    return trimmed;
}
