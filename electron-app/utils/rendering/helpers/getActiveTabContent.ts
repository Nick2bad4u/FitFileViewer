/**
 * Active tab content utility for finding the currently visible tab content
 * element in the tabbed interface.
 */

import {
    getGetActiveTabContentRuntime,
    type GetActiveTabContentRuntime,
} from "./getActiveTabContentRuntime.js";
import { getRendererActiveTabContentFromState } from "../../state/domain/rendererActiveTabState.js";
import { getRendererCoreStateManager } from "../../state/domain/rendererStateManagerAccess.js";
import {
    extractTabNameFromButtonId,
    getContentIdFromTabName,
} from "../../ui/tabs/tabIdUtils.js";

// CSS display states
const DISPLAY_STATES = {
    FLEX: "flex",
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

function isVisibleTabContentElement(element: HTMLElement): boolean {
    if (
        element.style.display === DISPLAY_STATES.HIDDEN ||
        element.getAttribute("aria-hidden") === "true"
    ) {
        return false;
    }

    return (
        element.style.display === DISPLAY_STATES.VISIBLE ||
        element.style.display === DISPLAY_STATES.FLEX ||
        element.getAttribute("aria-hidden") === "false" ||
        element.classList.contains("active")
    );
}

function getStateBackedActiveTabContent(
    runtime: GetActiveTabContentRuntime
): HTMLElement | null {
    try {
        const stateManager = getRendererCoreStateManager();
        if (!stateManager) {
            return null;
        }

        const tabName = getRendererActiveTabContentFromState(
            stateManager.getState
        );
        const contentElement = runtime.getElementByIdFlexible(
            getContentIdFromTabName(tabName)
        );

        return contentElement && isVisibleTabContentElement(contentElement)
            ? contentElement
            : null;
    } catch {
        return null;
    }
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
        const runtime = getActiveTabContentRuntime();
        const tabContents = runtime.queryTabContents(SELECTORS.TAB_CONTENT);

        if (tabContents.length === 0) {
            console.warn(`${LOG_PREFIX} No tab content elements found`);
            return null;
        }

        const stateBackedContent = getStateBackedActiveTabContent(runtime);
        if (stateBackedContent) {
            return stateBackedContent;
        }

        // Inline display fallback for older callers and narrow test fixtures.
        for (const element of tabContents) {
            if (element.style.display === DISPLAY_STATES.VISIBLE) {
                return element;
            }
        }

        // Secondary strategy (modern CSS-driven tabs): a tab may be "visible" via classes/ARIA
        // rather than an inline style. These fallbacks intentionally do not use getComputedStyle
        // because JSDOM defaults can cause false positives in unit tests.
        try {
            const activeByClass = runtime.querySelector(
                `${SELECTORS.TAB_CONTENT}.active`
            );
            if (activeByClass) {
                return activeByClass;
            }
        } catch {
            /* ignore */
        }

        try {
            const activeByAria = runtime.querySelector(
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
            const activeBtn = runtime.querySelector<HTMLElement>(
                ".tab-button.active"
            );
            const activeId = activeBtn?.id ?? "";
            const tabName = extractTabNameFromButtonId(activeId);
            if (tabName !== activeId) {
                const contentEl = runtime.getElementByIdFlexible(
                    getContentIdFromTabName(tabName)
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
