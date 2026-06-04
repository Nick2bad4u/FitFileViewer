/**
 * Global chart status indicator updater for FitFileViewer.
 *
 * Updates the global chart status indicator in the UI by creating a new
 * indicator and replacing the existing one. Handles DOM manipulation with error
 * handling and fallback container logic.
 */

import { createGlobalChartStatusIndicator } from "../components/createGlobalChartStatusIndicator.js";

const ELEMENT_IDS = {
    STATUS_CONTAINER: "global-chart-status-container",
    STATUS_INDICATOR: "global-chart-status",
} as const;

const LOG_PREFIX = "[ChartStatusUpdater]";

/**
 * Updates the global chart status indicator in the UI.
 *
 * Creates a new chart status indicator and either replaces an existing
 * indicator or appends it to the appropriate container. Handles DOM
 * manipulation errors gracefully.
 *
 * @returns True if update was successful, false otherwise.
 */
export function updateGlobalChartStatusIndicator(): boolean {
    try {
        const newIndicator = createGlobalChartStatusIndicator();
        if (!newIndicator) {
            console.warn(
                `${LOG_PREFIX} Failed to create global chart status indicator`
            );
            return false;
        }

        const existingIndicator = document.querySelector<HTMLElement>(
            `#${ELEMENT_IDS.STATUS_INDICATOR}`
        );

        if (existingIndicator) {
            const replaced = replaceExistingIndicator(
                newIndicator,
                existingIndicator
            );

            if (!replaced) {
                appendNewIndicator(newIndicator, findStatusContainer());
            }
        } else {
            appendNewIndicator(newIndicator, findStatusContainer());
        }

        return true;
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error updating global chart status indicator:`,
            error
        );
        return false;
    }
}

/**
 * Appends new status indicator to container.
 */
function appendNewIndicator(
    newIndicator: HTMLElement,
    container: HTMLElement
): void {
    try {
        container.append(newIndicator);
        console.log(`${LOG_PREFIX} Appended new status indicator to container`);
    } catch (error) {
        console.error(`${LOG_PREFIX} Error appending new indicator:`, error);
    }
}

/**
 * Finds suitable container for chart status indicator.
 *
 * @returns Preferred status container, or document body as fallback.
 */
function findStatusContainer(): HTMLElement {
    const statusContainer = document.querySelector<HTMLElement>(
        `#${ELEMENT_IDS.STATUS_CONTAINER}`
    );

    return statusContainer instanceof HTMLElement
        ? statusContainer
        : document.body;
}

/**
 * Replaces existing status indicator with new one.
 *
 * @returns True if replacement was successful.
 */
function replaceExistingIndicator(
    newIndicator: HTMLElement,
    existingIndicator: HTMLElement
): boolean {
    try {
        if (existingIndicator.parentNode) {
            existingIndicator.parentNode.replaceChild(
                newIndicator,
                existingIndicator
            );
            console.log(`${LOG_PREFIX} Replaced existing status indicator`);
            return true;
        }

        console.warn(`${LOG_PREFIX} Existing indicator has no parent node`);
        return false;
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error replacing existing indicator:`,
            error
        );
        return false;
    }
}
