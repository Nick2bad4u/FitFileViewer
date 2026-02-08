/**
 * Toggles the visibility of tab content sections by setting the display style.
 * Now integrated with centralized state management for reactive updates.
 */

import * as __StateMgr from "../../state/core/stateManager.js";
// Prefer dynamic state manager accessor to avoid stale imports across suites
import {
    buildIdVariants,
    getElementByIdFlexible,
} from "../dom/elementIdUtils.js";

// Resolve document by preferring the canonical test-provided document
// (`__vitest_effective_document__`) first, then falling back to the
// Active global/window document. This aligns modules with the test
// File's jsdom instance reliably in full-suite runs.
/**
 * @returns {Document}
 */
const getDoc = () => {
    /** @type {any} */
    let d;
    // Prefer the current test's document first
    try {
        // @ts-ignore
        if (
            !d &&
            typeof document !== "undefined" &&
            document &&
            typeof document.getElementById === "function"
        ) {
            // @ts-ignore
            d = /** @type {any} */ (document);
        }
    } catch {
        /* Ignore errors */
    }
    try {
        if (!d && globalThis.window !== undefined && globalThis.document)
            d = /** @type {any} */ (globalThis.document);
    } catch {
        /* Ignore errors */
    }
    try {
        // Then prefer the current global document
        if (
            !d &&
            typeof globalThis !== "undefined" &&
            /** @type {any} */ (globalThis).document
        ) {
            d = /** @type {any} */ (/** @type {any} */ (globalThis).document);
        }
    } catch {
        /* Ignore errors */
    }
    // Fallback: canonical test document
    try {
        // @ts-ignore
        if (
            !d &&
            typeof __vitest_effective_document__ !== "undefined" &&
            __vitest_effective_document__
        ) {
            // @ts-ignore
            d = /** @type {any} */ (__vitest_effective_document__);
        }
    } catch {
        /* Ignore errors */
    }
    if (!d) {
        // @ts-ignore JSDOM provides document
        d = /** @type {any} */ (document);
    }
    try {
        if (
            !(
                d &&
                typeof d.getElementById === "function" &&
                typeof d.querySelectorAll === "function"
            )
        ) {
            // Prefer current doc/window, then global, then canonical
            // @ts-ignore
            if (
                typeof document !== "undefined" &&
                document &&
                typeof document.getElementById === "function"
            ) {
                // @ts-ignore
                d = /** @type {any} */ (document);
            } else if (globalThis.window !== undefined && globalThis.document) {
                d = /** @type {any} */ (globalThis.document);
            } else if (
                typeof globalThis !== "undefined" &&
                /** @type {any} */ (globalThis).document
            ) {
                d = /** @type {any} */ (
                    /** @type {any} */ (globalThis).document
                );
            } else if (
                typeof __vitest_effective_document__ !== "undefined" &&
                /** @type {any} */ (
                    /** @type {any} */ (__vitest_effective_document__)
                )
            ) {
                // @ts-ignore
                d = /** @type {any} */ (__vitest_effective_document__);
            }
        }
    } catch {
        /* Ignore errors */
    }
    return /** @type {Document} */ (d);
};

// Retrieve state manager functions. Prefer the module namespace (so Vitest mocks are respected),
// And only fall back to a canonical global mock if module functions are unavailable.
/** @returns {{ getState: any; setState: any; subscribe: any }} */
const getStateMgr = () => {
    try {
        const sm = /** @type {any} */ (__StateMgr);
        const getState =
            sm && typeof sm.getState === "function" ? sm.getState : undefined;
        const setState =
            sm && typeof sm.setState === "function" ? sm.setState : undefined;
        const subscribe =
            sm && typeof sm.subscribe === "function" ? sm.subscribe : undefined;
        if (getState && setState && subscribe) {
            return { getState, setState, subscribe };
        }
    } catch {
        /* Ignore errors */
    }
    try {
        // @ts-ignore
        const eff =
            typeof __vitest_effective_stateManager__ !== "undefined" &&
            /** @type {any} */ (__vitest_effective_stateManager__);
        if (eff && typeof eff === "object") {
            const getState =
                typeof eff.getState === "function"
                    ? eff.getState
                    : __StateMgr.getState;
            const setState =
                typeof eff.setState === "function"
                    ? eff.setState
                    : __StateMgr.setState;
            const subscribe =
                typeof eff.subscribe === "function"
                    ? eff.subscribe
                    : __StateMgr.subscribe;
            return { getState, setState, subscribe };
        }
    } catch {
        /* Ignore errors */
    }
    return {
        getState: /** @type {any} */ (__StateMgr.getState),
        setState: /** @type {any} */ (__StateMgr.setState),
        subscribe: /** @type {any} */ (__StateMgr.subscribe),
    };
};

/**
 * Get currently visible tab content
 *
 * @returns {string | null} Currently visible tab name or null
 */
export function getVisibleTabContent() {
    return getStateMgr().getState("ui.activeTabContent") || null;
}

/**
 * Hide all tab content
 */
export function hideAllTabContent() {
    updateTabVisibility(null);
}

/**
 * Initialize tab visibility state management
 */
export function initializeTabVisibilityState() {
    // Subscribe to active tab changes to update content visibility
    getStateMgr().subscribe(
        "ui.activeTab",
        /** @param {any} activeTab */ (activeTab) => {
            const contentId = getContentIdFromTabName(activeTab);
            updateTabVisibility(contentId);
        }
    );

    // Subscribe to data loading to show/hide appropriate content
    getStateMgr().subscribe(
        "globalData",
        /** @param {any} data */ (data) => {
            const currentTab =
                    getStateMgr().getState("ui.activeTab") || "summary",
                hasData = data !== null && data !== undefined;

            if (!hasData && currentTab !== "summary") {
                // If no data, switch to summary tab
                getStateMgr().setState("ui.activeTab", "summary", {
                    source: "initializeTabVisibilityState",
                });
            }
        }
    );

    console.log("[TabVisibility] State management initialized");
}

/**
 * Show specific tab content
 *
 * @param {string} tabName - Name of the tab to show
 */
export function showTabContent(tabName) {
    const contentId = getContentIdFromTabName(tabName);
    updateTabVisibility(contentId);
}

/**
 * Toggles the visibility of tab content sections by setting the display style.
 * Only the tab content with the specified `visibleTabId` will be shown; all
 * others will be hidden. If `visibleTabId` does not match any of the IDs in
 * `tabContentIds`, no tab content will be displayed.
 *
 * @param {string | null | undefined} visibleTabId - The ID of the tab content
 *   element to display. If `null` or `undefined` is passed, no tab content will
 *   be displayed.
 */
export function updateTabVisibility(visibleTabId) {
    const // Cache DOM elements in a map for better performance
        elementMap = {},
        tabContentIds = [
            "content_data",
            "content_chartjs",
            "content_browser",
            "content_map",
            "content_summary",
            "content_altfit",
            "content_zwift",
        ];
    for (const id of tabContentIds) {
        const el = getElementByIdFlexible(getDoc(), /** @type {string} */ (id));
        if (el) {
            /** @type {any} */ (elementMap)[/** @type {string} */ (id)] = el;
        } else {
            console.warn(
                `updateTabVisibility: Missing element in the DOM: ${id}. Please check the HTML structure to ensure the element with ID '${id}' exists, or verify that it is dynamically added to the DOM before calling updateTabVisibility.`
            );
        }
    }

    // Define constants for display styles
    const DISPLAY_BLOCK = "block",
        DISPLAY_NONE = "none";

    // Normalize the requested visible tab id to a canonical content id when possible.
    // This allows inputs like "summary_content" (pattern) to correctly map to "content_summary".
    /** @type {string | null | undefined} */
    let targetId = visibleTabId;
    /** @type {string | null} */ let derivedTabName = null;
    if (targetId && !(targetId in elementMap)) {
        const variants = buildIdVariants(String(targetId));
        const matchingVariant = variants.find(
            (variant) => variant in elementMap
        );
        if (matchingVariant) {
            targetId = matchingVariant;
        }
    }

    if (targetId && !(targetId in elementMap)) {
        const maybeName = extractTabNameFromContentId(String(targetId));
        if (maybeName) {
            const canonicalId = getContentIdFromTabName(maybeName);
            if (canonicalId in elementMap) {
                targetId = canonicalId;
                derivedTabName = maybeName;
            }
        }
    }

    // Toggle visibility using the cached elements
    for (const [id, el] of Object.entries(elementMap)) {
        const isVisible = id === targetId;
        el.style.display = isVisible ? DISPLAY_BLOCK : DISPLAY_NONE;
        el.setAttribute("aria-hidden", (!isVisible).toString());
    }

    // Update state to track visible tab content
    if (targetId) {
        const tabName = derivedTabName ?? extractTabNameFromContentId(targetId);
        if (tabName) {
            getStateMgr().setState("ui.activeTabContent", tabName, {
                source: "updateTabVisibility",
            });
        }
    }
}

/**
 * Extract tab name from content ID
 *
 * @param {string} contentId - Content element ID
 *
 * @returns {string | null} Tab name or null if not found
 */
function extractTabNameFromContentId(contentId) {
    // CRITICAL BUG FIX: Type validation for contentId
    if (!contentId || typeof contentId !== "string") {
        console.warn(
            "extractTabNameFromContentId: Invalid contentId provided. Expected a non-empty string. Received:",
            contentId
        );
        return null;
    }

    const patterns = [
        /^content_(.+)$/, // content_summary -> summary
        /^content-(.+)$/, // content-summary -> summary
        /^content([A-Z].+)$/, // contentSummary -> summary
        /^(.+)_content$/, // summary_content -> summary
        /^(.+)-content$/, // summary-content -> summary
    ];

    for (const pattern of patterns) {
        const match = contentId.match(pattern);
        if (match) {
            const [, rawName] = match;
            const normalized = String(rawName)
                .replaceAll(/([a-z0-9])([A-Z])/gu, "$1_$2")
                .toLowerCase();
            return normalized === "chartjs" ? "chart" : normalized;
        }
    }

    return null;
}

/**
 * Get content ID from tab name
 *
 * @param {string} tabName - Tab name
 *
 * @returns {string} Content element ID
 */
function getContentIdFromTabName(tabName) {
    // Map tab names to content IDs
    const tabToContentMap = {
        altfit: "content_altfit",
        chart: "content_chartjs",
        data: "content_data",
        map: "content_map",
        summary: "content_summary",
        zwift: "content_zwift",
    };

    return (
        /** @type {any} */ (tabToContentMap)[tabName] || `content_${tabName}`
    );
}
