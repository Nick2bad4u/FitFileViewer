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
 */
export function attachExternalLinkHandlers({ root }) {
    // Delegate click handling to the root to avoid per-link loops.
    addEventListenerWithCleanup(/** @type {HTMLElement} */ (root), "click", (e) => {
        const event = /** @type {MouseEvent} */ (e);
        const anchor = resolveExternalLinkAnchor(event.target);
        if (!anchor) return;

        // Use the resolved href property for backward compatibility with previous implementations.
        // In browsers this canonicalizes URLs (e.g., adds trailing slash for bare origins).
        const { href } = anchor;
        if (typeof href !== "string" || href.trim().length === 0) return;

        event.preventDefault();
        event.stopPropagation();
        openExternal(href);
    });

    // Support keyboard activation on the anchor itself.
    addEventListenerWithCleanup(/** @type {HTMLElement} */ (root), "keydown", (e) => {
        const event = /** @type {KeyboardEvent} */ (e);
        if (event.key !== "Enter" && event.key !== " ") return;

        const anchor = resolveExternalLinkAnchor(event.target);
        if (!anchor) return;

        const { href } = anchor;
        if (typeof href !== "string" || href.trim().length === 0) return;

        event.preventDefault();
        event.stopPropagation();
        openExternal(href);
    });
}

/**
 * Attempt to open a URL externally.
 *
 * @param {string} url
 */
function openExternal(url) {
    const api =
        /** @type {any} */ (globalThis).electronAPI ??
        /** @type {any} */ ((globalThis).window ? /** @type {any} */ (globalThis).window.electronAPI : null);

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
