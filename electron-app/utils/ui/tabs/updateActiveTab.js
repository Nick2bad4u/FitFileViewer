/**
 * Sets the active tab by adding the 'active' class to the tab button with the given ID,
 * and removing the 'active' class from all other tab buttons.
 * Now integrated with centralized state management.
 */

import { setState, getState, subscribe } from "../../state/core/stateManager.js";

/**
 * Sets the active tab by adding the 'active' class to the tab button with the given ID,
 * and removing the 'active' class from all other tab buttons.
 *
 * @param {string} tabId - The ID of the tab button to activate.
 * @returns {void} - This function does not return anything.
 */
export function updateActiveTab(tabId) {
    if (tabId == null || typeof tabId !== "string" || tabId.trim() === "") {
        console.warn("Invalid tabId provided. Expected a non-empty string. Received:", tabId);
        return;
    }

    const tabButtons = document.querySelectorAll(".tab-button");

    // Remove active class from all tab buttons
    tabButtons.forEach((btn) => {
        btn.classList.remove("active");
    });

    // Add active class to the target tab button
    const tab = document.getElementById(tabId);
    if (tab) {
        tab.classList.add("active");

        // Extract tab name from button ID or data attribute
        const tabName = extractTabName(tabId);
        if (tabName) {
            setState("ui.activeTab", tabName, { source: "updateActiveTab" });
        }
    } else {
        console.error(`Element with ID "${tabId}" not found in the DOM.`);
    }
}

/**
 * Extract tab name from button ID
 * @param {string} tabId - The button ID
 * @returns {string|null} Tab name or null if not found
 */
function extractTabName(tabId) {
    // Common patterns for tab button IDs
    const patterns = [
        /^tab-(.+)$/, // tab-summary -> summary
        /^(.+)-tab$/, // summary-tab -> summary
        /^btn-(.+)$/, // btn-chart -> chart
        /^(.+)-btn$/, // chart-btn -> chart
    ];

    for (const pattern of patterns) {
        const match = tabId.match(pattern);
        if (match) {
            return match[1];
        }
    }

    // Fallback: use the ID as-is if no pattern matches
    return tabId;
}

/**
 * Initialize active tab state management
 */
export function initializeActiveTabState() {
    // Subscribe to state changes to update DOM
    subscribe("ui.activeTab", (activeTab) => {
        updateTabButtonsFromState(activeTab);
    });

    // Set up click listeners for tab buttons
    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const tabName = extractTabName(button.id);
            if (tabName) {
                setState("ui.activeTab", tabName, { source: "tabButtonClick" });
            }
        });
    });

    console.log("[ActiveTab] State management initialized");
}

/**
 * Update tab button states based on current state
 * @param {string} activeTab - Currently active tab name
 */
function updateTabButtonsFromState(activeTab) {
    const tabButtons = document.querySelectorAll(".tab-button");

    tabButtons.forEach((btn) => {
        const tabName = extractTabName(btn.id);
        const isActive = tabName === activeTab;

        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", isActive.toString());
    });
}

/**
 * Get the currently active tab
 * @returns {string} Currently active tab name
 */
export function getActiveTab() {
    return getState("ui.activeTab") || "summary";
}
