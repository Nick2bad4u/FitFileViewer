/**
 * Toggles the visibility of tab content sections by setting the display style.
 * Now integrated with centralized state management for reactive updates.
 */

// Prefer dynamic state manager accessor to avoid stale imports across suites
import * as __StateMgr from "../../state/core/stateManager.js";

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
        if (!d && typeof document !== "undefined" && document && typeof document.getElementById === "function") {
            // @ts-ignore
            d = /** @type {any} */ (document);
        }
    } catch {}
    try {
        if (!d && globalThis.window !== undefined && globalThis.document) d = /** @type {any} */ (globalThis.document);
    } catch {}
    try {
        // Then prefer the current global document
        if (!d && typeof globalThis !== "undefined" && /** @type {any} */ (globalThis).document) {
            d = /** @type {any} */ (/** @type {any} */ (globalThis).document);
        }
    } catch {}
    // Fallback: canonical test document
    try {
        // @ts-ignore
        if (!d && typeof __vitest_effective_document__ !== "undefined" && __vitest_effective_document__) {
            // @ts-ignore
            d = /** @type {any} */ (__vitest_effective_document__);
        }
    } catch {}
    if (!d) {
        // @ts-ignore JSDOM provides document
        d = /** @type {any} */ (document);
    }
    try {
        if (!(d && typeof d.getElementById === "function" && typeof d.querySelectorAll === "function")) {
            // Prefer current doc/window, then global, then canonical
            // @ts-ignore
            if (typeof document !== "undefined" && document && typeof document.getElementById === "function") {
                // @ts-ignore
                d = /** @type {any} */ (document);
            } else if (globalThis.window !== undefined && globalThis.document) {
                d = /** @type {any} */ (globalThis.document);
            } else if (typeof globalThis !== "undefined" && /** @type {any} */ (globalThis).document) {
                d = /** @type {any} */ (/** @type {any} */ (globalThis).document);
            } else if (
                typeof __vitest_effective_document__ !== "undefined" &&
                /** @type {any} */ (/** @type {any} */ (__vitest_effective_document__))
            ) {
                // @ts-ignore
                d = /** @type {any} */ (__vitest_effective_document__);
            }
        }
    } catch {}
    return /** @type {Document} */ (d);
};

// Retrieve state manager functions. Prefer the module namespace (so Vitest mocks are respected),
// And only fall back to a canonical global mock if module functions are unavailable.
/** @returns {{ getState: any, setState: any, subscribe: any }} */
const getStateMgr = () => {
    try {
        const sm = /** @type {any} */ (__StateMgr);
        const getState = sm && typeof sm.getState === "function" ? sm.getState : undefined;
        const setState = sm && typeof sm.setState === "function" ? sm.setState : undefined;
        const subscribe = sm && typeof sm.subscribe === "function" ? sm.subscribe : undefined;
        if (getState && setState && subscribe) {
            return { getState, setState, subscribe };
        }
    } catch {}
    try {
        // @ts-ignore
        const eff =
            typeof __vitest_effective_stateManager__ !== "undefined" &&
            /** @type {any} */ (__vitest_effective_stateManager__);
        if (eff && typeof eff === "object") {
            const getState = typeof eff.getState === "function" ? eff.getState : __StateMgr.getState;
            const setState = typeof eff.setState === "function" ? eff.setState : __StateMgr.setState;
            const subscribe = typeof eff.subscribe === "function" ? eff.subscribe : __StateMgr.subscribe;
            return { getState, setState, subscribe };
        }
    } catch {}
    return {
        getState: /** @type {any} */ (__StateMgr.getState),
        setState: /** @type {any} */ (__StateMgr.setState),
        subscribe: /** @type {any} */ (__StateMgr.subscribe),
    };
};

/**
 * Get currently visible tab content
 * @returns {string|null} Currently visible tab name or null
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
            const currentTab = getStateMgr().getState("ui.activeTab") || "summary",
                hasData = data !== null && data !== undefined;

            if (!hasData && currentTab !== "summary") {
                // If no data, switch to summary tab
                getStateMgr().setState("ui.activeTab", "summary", { source: "initializeTabVisibilityState" });
            }
        }
    );

    console.log("[TabVisibility] State management initialized");
}

/**
 * Show specific tab content
 * @param {string} tabName - Name of the tab to show
 */
export function showTabContent(tabName) {
    const contentId = getContentIdFromTabName(tabName);
    updateTabVisibility(contentId);
}

/**
 * Toggles the visibility of tab content sections by setting the display style.
 * Only the tab content with the specified `visibleTabId` will be shown; all others will be hidden.
 * If `visibleTabId` does not match any of the IDs in `tabContentIds`, no tab content will be displayed.
 *
 * @param {string|null|undefined} visibleTabId - The ID of the tab content element to display.
 * If `null` or `undefined` is passed, no tab content will be displayed.
 */
export function updateTabVisibility(visibleTabId) {
    const // Cache DOM elements in a map for better performance
        elementMap = {},
        tabContentIds = [
            "content-data",
            "content-chartjs",
            "content-map",
            "content-summary",
            "content-altfit",
            "content-zwift",
        ];
    for (const id of tabContentIds) {
        const el = getDoc().getElementById(/** @type {string} */ (id));
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

    // Toggle visibility using the cached elements
    for (const [id, el] of Object.entries(elementMap)) {
        const isVisible = id === visibleTabId;
        el.style.display = isVisible ? DISPLAY_BLOCK : DISPLAY_NONE;
        el.setAttribute("aria-hidden", (!isVisible).toString());
    }

    // Update state to track visible tab content
    if (visibleTabId) {
        const tabName = extractTabNameFromContentId(visibleTabId);
        if (tabName) {
            getStateMgr().setState("ui.activeTabContent", tabName, { source: "updateTabVisibility" });
        }
    }
}

/**
 * Extract tab name from content ID
 * @param {string} contentId - Content element ID
 * @returns {string|null} Tab name or null if not found
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
        /^content-(.+)$/, // Content-summary -> summary
        /^(.+)-content$/, // Summary-content -> summary
    ];

    for (const pattern of patterns) {
        const match = contentId.match(pattern);
        if (match) {
            return match[1] === "chartjs" ? "chart" : /** @type {string} */ (match[1]); // Special case for chartjs -> chart
        }
    }

    return null;
}

/**
 * Get content ID from tab name
 * @param {string} tabName - Tab name
 * @returns {string} Content element ID
 */
function getContentIdFromTabName(tabName) {
    // Map tab names to content IDs
    const tabToContentMap = {
        altfit: "content-altfit",
        chart: "content-chartjs",
        data: "content-data",
        map: "content-map",
        summary: "content-summary",
        zwift: "content-zwift",
    };

    return /** @type {any} */ (tabToContentMap)[tabName] || `content-${tabName}`;
}
