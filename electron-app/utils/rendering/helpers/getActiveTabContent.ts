/**
 * Active tab content utility for finding the currently visible tab content
 * element in the tabbed interface.
 */

import {
    getGetActiveTabContentRuntime,
    type GetActiveTabContentRuntime,
} from "./getActiveTabContentRuntime.js";

// CSS display states
const DISPLAY_STATES = {
    HIDDEN: "none",
    VISIBLE: "block",
} as const;

const LOG_PREFIX = "[ActiveTabContent]";

const SELECTORS = {
    TAB_CONTENT: ".tab-content",
} as const;

function getActiveTabContentRuntime(): GetActiveTabContentRuntime {
    return getGetActiveTabContentRuntime();
}

/**
 * Gets the currently active (visible) tab content element
 *
 * Searches through all tab content elements to find the one that is currently
 * displayed (has display: block style). Returns the first matching element or
 * null if none are visible.
 */
export function getActiveTabContent(): Element | null {
    try {
        const tabContents = getActiveTabContentRuntime().queryTabContents(
            SELECTORS.TAB_CONTENT
        );

        if (tabContents.length === 0) {
            console.warn(`${LOG_PREFIX} No tab content elements found`);
            return null;
        }

        // Primary strategy (legacy + test-friendly): Find the first visible tab content element
        // by checking its *inline* display style.
        for (const element of tabContents) {
            if (element.style.display === DISPLAY_STATES.VISIBLE) {
                return element;
            }
        }

        // Secondary strategy (modern CSS-driven tabs): a tab may be "visible" via classes/ARIA
        // rather than an inline style. These fallbacks intentionally do not use getComputedStyle
        // because JSDOM defaults can cause false positives in unit tests.
        try {
            const activeByClass = getActiveTabContentRuntime().querySelector(
                `${SELECTORS.TAB_CONTENT}.active`
            );
            if (activeByClass) {
                return activeByClass;
            }
        } catch {
            /* ignore */
        }

        try {
            const activeByAria = getActiveTabContentRuntime().querySelector(
                `${SELECTORS.TAB_CONTENT}[aria-hidden="false"]`
            );
            if (activeByAria) {
                return activeByAria;
            }
        } catch {
            /* ignore */
        }

        // Final strategy: derive active content from the active tab button id
        // and map to content-* using flexible ID lookup.
        try {
            const activeBtn =
                getActiveTabContentRuntime().querySelector<HTMLElement>(
                    ".tab-button.active"
                );
            const activeId =
                activeBtn && typeof activeBtn.id === "string"
                    ? activeBtn.id
                    : "";
            const match = /^tab[-_]?(.+)$/iu.exec(activeId);
            if (match && match[1]) {
                const rawName = String(match[1]);
                const normalized = rawName
                    .replaceAll(/(?<=[a-z0-9])(?=[A-Z])/gu, "_")
                    .toLowerCase();
                const contentEl =
                    getActiveTabContentRuntime().getElementByIdFlexible(
                        `content_${normalized}`
                    );
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
