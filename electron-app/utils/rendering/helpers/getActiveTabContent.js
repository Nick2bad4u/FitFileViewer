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
const // CSS display states
    DISPLAY_STATES = {
        HIDDEN: "none",
        VISIBLE: "block",
    },
    LOG_PREFIX = "[ActiveTabContent]",
    SELECTORS = {
        TAB_CONTENT: ".tab-content",
    };

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

        // Primary strategy (legacy + test-friendly): Find the first visible tab content element
        // by checking its *inline* display style.
        for (const element of tabContents) {
            if (/** @type {HTMLElement} */ (element).style.display === DISPLAY_STATES.VISIBLE) {
                return element;
            }
        }

        // Secondary strategy (modern CSS-driven tabs): a tab may be "visible" via classes/ARIA
        // rather than an inline style. These fallbacks intentionally do not use getComputedStyle
        // because JSDOM defaults can cause false positives in unit tests.
        try {
            const activeByClass = document.querySelector(`${SELECTORS.TAB_CONTENT}.active`);
            if (activeByClass) {
                return activeByClass;
            }
        } catch {
            /* ignore */
        }

        try {
            const activeByAria = document.querySelector(`${SELECTORS.TAB_CONTENT}[aria-hidden="false"]`);
            if (activeByAria) {
                return activeByAria;
            }
        } catch {
            /* ignore */
        }

        // Final strategy: derive active content from the active tab button id (tab-*)
        // and map to content-*.
        try {
            const activeBtn = document.querySelector(".tab-button.active");
            const activeId = activeBtn && typeof (/** @type {any} */ (activeBtn).id) === "string" ? activeBtn.id : "";
            if (activeId && activeId.startsWith("tab-")) {
                const tabName = activeId.slice("tab-".length);
                const contentId = `content-${tabName}`;
                const contentEl = document.getElementById(contentId);
                if (contentEl) {
                    return contentEl;
                }
            }
        } catch {
            /* ignore */
        }

        // No active tab found
        return null;
    } catch (error) {
        console.error(`${LOG_PREFIX} Error getting active tab content:`, error);
        return null;
    }
}
