/**
 * Sets the active tab by adding the 'active' class to the tab button with the given ID,
 * and removing the 'active' class from all other tab buttons.
 * Now integrated with centralized state management.
 */

import { getState, setState, subscribe } from "../../state/core/stateManager.js";

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

    // CRITICAL BUG FIX: Defensive check for querySelectorAll result
    if (!tabButtons || tabButtons.length === 0) {
        console.warn("No tab buttons found in DOM. Cannot update active tab.");
        return;
    }

    // Remove active class from all tab buttons
    tabButtons.forEach((btn) => {
        // CRITICAL BUG FIX: Defensive check for classList
        if (btn && btn.classList) {
            btn.classList.remove("active");
        }
    });

    // Add active class to the target tab button
    const tab = document.getElementById(tabId);
    if (tab && tab.classList) {
        tab.classList.add("active");

        // Extract tab name from button ID or data attribute
        const tabName = extractTabName(tabId);
        if (tabName) {
            setState("ui.activeTab", tabName, { source: "updateActiveTab" });
        }
    } else {
        console.error(`Element with ID "${tabId}" not found in the DOM or missing classList.`);
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
        /^tab-(.+)$/, // Tab-summary -> summary
        /^(.+)-tab$/, // Summary-tab -> summary
        /^btn-(.+)$/, // Btn-chart -> chart
        /^(.+)-btn$/, // Chart-btn -> chart
    ];

    for (const pattern of patterns) {
        const match = tabId.match(pattern);
        if (match) {
            return /** @type {string} */ (match[1] || null);
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
    subscribe("ui.activeTab", (/** @type {string} */ activeTab) => {
        updateTabButtonsFromState(activeTab);
    });

    // Set up click listeners for tab buttons
    const tabButtons = document.querySelectorAll(".tab-button");

    // CRITICAL BUG FIX: Defensive check for querySelectorAll result
    if (!tabButtons || tabButtons.length === 0) {
        console.warn("initializeActiveTabState: No tab buttons found in DOM. Click listeners not set up.");
    } else {
        tabButtons.forEach((button) => {
            // CRITICAL BUG FIX: Defensive check for button validity
            if (!button || !button.addEventListener) {
                console.warn("initializeActiveTabState: Invalid button element found:", button);
                return;
            }

            button.addEventListener("click", (event) => {
                // Check if button is disabled - same logic as TabStateManager
                if (
                    !button ||
                    ("disabled" in button && /** @type {any} */ (button).disabled) ||
                    button.hasAttribute("disabled") ||
                    button.classList.contains("tab-disabled")
                ) {
                    console.log(`[ActiveTab] Ignoring click on disabled button: ${button.id}`);
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }

                const tabName = extractTabName(button.id);
                if (tabName) {
                    setState("ui.activeTab", tabName, { source: "tabButtonClick" });
                }
            });
        });
    }

    console.log("[ActiveTab] State management initialized");
}

/**
 * Update tab button states based on current state
 * @param {string} activeTab - Currently active tab name
 */
function updateTabButtonsFromState(activeTab) {
    const tabButtons = document.querySelectorAll(".tab-button");

    // CRITICAL BUG FIX: Defensive check for querySelectorAll result
    if (!tabButtons || tabButtons.length === 0) {
        console.warn("updateTabButtonsFromState: No tab buttons found in DOM.");
        return;
    }

    tabButtons.forEach((btn) => {
        // CRITICAL BUG FIX: Defensive check for classList and setAttribute
        if (!btn || !btn.classList) {
            console.warn("updateTabButtonsFromState: Invalid button element found:", btn);
            return;
        }

        const tabName = extractTabName(btn.id),
         isActive = tabName === activeTab;

        btn.classList.toggle("active", isActive);

        // CRITICAL BUG FIX: Defensive check for setAttribute
        if (btn.setAttribute) {
            btn.setAttribute("aria-selected", isActive.toString());
        }
    });
}

/**
 * Get the currently active tab
 * @returns {string} Currently active tab name
 */
export function getActiveTab() {
    return getState("ui.activeTab") || "summary";
}
