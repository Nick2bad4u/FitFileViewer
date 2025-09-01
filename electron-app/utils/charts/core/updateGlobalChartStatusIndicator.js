/**
 * @fileoverview Global chart status indicator updater for FitFileViewer
 *
 * Updates the global chart status indicator in the UI by creating a new
 * indicator and replacing the existing one. Handles DOM manipulation
 * with error handling and fallback container logic.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */

import { createGlobalChartStatusIndicator } from "../components/createGlobalChartStatusIndicator.js";

// DOM element IDs and selectors
const ELEMENT_IDS = {
    STATUS_INDICATOR: "global-chart-status",
    STATUS_CONTAINER: "global-chart-status-container",
},

 LOG_PREFIX = "[ChartStatusUpdater]";

/**
 * Finds suitable container for chart status indicator
 * @returns {Element} Container element (preferred container or body as fallback)
 */
function findStatusContainer() {
    return document.getElementById(ELEMENT_IDS.STATUS_CONTAINER) || document.body;
}

/**
 * Replaces existing status indicator with new one
 * @param {Element} newIndicator - New status indicator element
 * @param {Element} existingIndicator - Existing status indicator element
 * @returns {boolean} True if replacement was successful
 */
function replaceExistingIndicator(newIndicator, existingIndicator) {
    try {
        if (existingIndicator.parentNode) {
            existingIndicator.parentNode.replaceChild(newIndicator, existingIndicator);
            console.log(`${LOG_PREFIX} Replaced existing status indicator`);
            return true;
        } 
            console.warn(`${LOG_PREFIX} Existing indicator has no parent node`);
            return false;
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Error replacing existing indicator:`, error);
        return false;
    }
}

/**
 * Appends new status indicator to container
 * @param {Element} newIndicator - New status indicator element
 * @param {Element} container - Container element
 */
function appendNewIndicator(newIndicator, container) {
    try {
        container.appendChild(newIndicator);
        console.log(`${LOG_PREFIX} Appended new status indicator to container`);
    } catch (error) {
        console.error(`${LOG_PREFIX} Error appending new indicator:`, error);
    }
}

/**
 * Updates the global chart status indicator in the UI
 *
 * Creates a new chart status indicator and either replaces an existing
 * indicator or appends it to the appropriate container. Handles DOM
 * manipulation errors gracefully.
 *
 * @returns {boolean} True if update was successful, false otherwise
 */
export function updateGlobalChartStatusIndicator() {
    try {
        // Create new status indicator
        const newIndicator = createGlobalChartStatusIndicator();
        if (!newIndicator) {
            console.warn(`${LOG_PREFIX} Failed to create global chart status indicator`);
            return false;
        }

        // Check for existing indicator
        const existingIndicator = document.getElementById(ELEMENT_IDS.STATUS_INDICATOR);

        if (existingIndicator) {
            // Replace existing indicator
            const replaced = replaceExistingIndicator(newIndicator, existingIndicator);
            if (!replaced) {
                // Fallback: append to container if replacement failed
                const container = findStatusContainer();
                appendNewIndicator(newIndicator, container);
            }
        } else {
            // No existing indicator, append to container
            const container = findStatusContainer();
            appendNewIndicator(newIndicator, container);
        }

        return true;
    } catch (error) {
        console.error(`${LOG_PREFIX} Error updating global chart status indicator:`, error);
        return false;
    }
}
