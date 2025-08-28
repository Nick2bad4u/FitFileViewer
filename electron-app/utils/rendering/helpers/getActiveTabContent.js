/**
 * @fileoverview Active tab content utility for FitFileViewer
 *
 * Provides functions for finding the currently active (visible) tab content
 * element in the tabbed interface.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */

// DOM selectors
const SELECTORS = {
    TAB_CONTENT: ".tab-content",
};

// CSS display states
const DISPLAY_STATES = {
    VISIBLE: "block",
    HIDDEN: "none",
};

const LOG_PREFIX = "[ActiveTabContent]";

/**
 * Gets the currently active (visible) tab content element
 *
 * Searches through all tab content elements to find the one that is
 * currently displayed (has display: block style). Returns the first
 * matching element or null if none are visible.
 *
 * @returns {Element|null} The active tab content element, or null if none found
 *
 * @example
 * const activeTab = getActiveTabContent();
 * if (activeTab) {
 *   console.log('Active tab ID:', activeTab.id);
 * }
 */
export function getActiveTabContent() {
    try {
        const tabContents = document.querySelectorAll(SELECTORS.TAB_CONTENT);

        if (tabContents.length === 0) {
            console.warn(`${LOG_PREFIX} No tab content elements found`);
            return null;
        }

        // Find the first visible tab content element
        for (const element of tabContents) {
            if (/** @type {HTMLElement} */ (element).style.display === DISPLAY_STATES.VISIBLE) {
                return element;
            }
        }

        // No active tab found
        return null;
    } catch (error) {
        console.error(`${LOG_PREFIX} Error getting active tab content:`, error);
        return null;
    }
}
