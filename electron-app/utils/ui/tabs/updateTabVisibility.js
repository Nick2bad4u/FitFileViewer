/**
 * Toggles the visibility of tab content sections by setting the display style.
 * Now integrated with centralized state management for reactive updates.
 */

import { getState, setState, subscribe } from "../../state/core/stateManager.js";

/**
 * Toggles the visibility of tab content sections by setting the display style.
 * Only the tab content with the specified `visibleTabId` will be shown; all others will be hidden.
 * If `visibleTabId` does not match any of the IDs in `tabContentIds`, no tab content will be displayed.
 *
 * @param {string|null|undefined} visibleTabId - The ID of the tab content element to display.
 * If `null` or `undefined` is passed, no tab content will be displayed.
 */
export function updateTabVisibility(visibleTabId) {
    const tabContentIds = [
        "content-data",
        "content-chartjs",
        "content-map",
        "content-summary",
        "content-altfit",
        "content-zwift",
    ],

    // Cache DOM elements in a map for better performance
     elementMap = {};
    for (let i = 0; i < tabContentIds.length; i++) {
        const id = tabContentIds[i],
         el = document.getElementById(/** @type {string} */ (id));
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
    Object.entries(elementMap).forEach(([id, el]) => {
        const isVisible = id === visibleTabId;
        el.style.display = isVisible ? DISPLAY_BLOCK : DISPLAY_NONE;
        el.setAttribute("aria-hidden", (!isVisible).toString());
    });

    // Update state to track visible tab content
    if (visibleTabId) {
        const tabName = extractTabNameFromContentId(visibleTabId);
        if (tabName) {
            setState("ui.activeTabContent", tabName, { source: "updateTabVisibility" });
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
        console.warn("extractTabNameFromContentId: Invalid contentId provided. Expected a non-empty string. Received:", contentId);
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
        summary: "content-summary",
        chart: "content-chartjs",
        map: "content-map",
        data: "content-data",
        altfit: "content-altfit",
        zwift: "content-zwift",
    };

    return /** @type {any} */ (tabToContentMap)[tabName] || `content-${tabName}`;
}

/**
 * Initialize tab visibility state management
 */
export function initializeTabVisibilityState() {
    // Subscribe to active tab changes to update content visibility
    subscribe(
        "ui.activeTab",
        /** @param {any} activeTab */ (activeTab) => {
            const contentId = getContentIdFromTabName(activeTab);
            updateTabVisibility(contentId);
        }
    );

    // Subscribe to data loading to show/hide appropriate content
    subscribe(
        "globalData",
        /** @param {any} data */ (data) => {
            const hasData = data !== null && data !== undefined,
             currentTab = getState("ui.activeTab") || "summary";

            if (!hasData && currentTab !== "summary") {
                // If no data, switch to summary tab
                setState("ui.activeTab", "summary", { source: "initializeTabVisibilityState" });
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
 * Hide all tab content
 */
export function hideAllTabContent() {
    updateTabVisibility(null);
}

/**
 * Get currently visible tab content
 * @returns {string|null} Currently visible tab name or null
 */
export function getVisibleTabContent() {
    return getState("ui.activeTabContent") || null;
}
