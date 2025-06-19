// utils/enableTabButtons.js
// Utility to enable or disable all tab buttons (except Open FIT File)

import { setState, getState, subscribe } from "./stateManager.js";

/**
 * Enable or disable all tab buttons (with class 'tab-button'), except the "Open FIT File" button.
 * The "Open FIT File" button (ID: openFileBtn) is excluded from being disabled regardless 
 * of the value of the `enabled` parameter, allowing users to always open new files.
 * @param {boolean} enabled - true to enable, false to disable
 */
export function setTabButtonsEnabled(enabled) {
    // Update state to track tab button status
    setState("ui.tabButtonsEnabled", enabled, { source: "setTabButtonsEnabled" });

    // Cache the tab buttons outside the function
    const tabButtons = document.querySelectorAll(".tab-button");

    const TAB_DISABLED_CLASS = "tab-disabled";

    tabButtons.forEach((btn) => {
        // Skip the open file button - it should always remain enabled
        if (btn.id === "openFileBtn" || btn.id === "open-file-btn" || btn.classList.contains("open-file-btn")) {
            return;
        }

        btn.disabled = !enabled;
        if (!enabled) {
            btn.classList.add(TAB_DISABLED_CLASS);
        } else {
            btn.classList.remove(TAB_DISABLED_CLASS);
        }
    });

    console.log(`[TabButtons] Buttons ${enabled ? "enabled" : "disabled"}`);
}

/**
 * Initialize tab button state management
 */
export function initializeTabButtonState() {
    // Subscribe to data loading to automatically enable/disable tabs
    subscribe("globalData", (data) => {
        const hasData = data !== null && data !== undefined;
        setTabButtonsEnabled(hasData);
    });

    // Subscribe to loading state to disable tabs during loading
    subscribe("isLoading", (isLoading) => {
        if (isLoading) {
            const currentTabState = getState("ui.tabButtonsEnabled");
            if (currentTabState) {
                // Temporarily disable but remember the previous state
                setState("ui.tabButtonsPreviousState", currentTabState, { source: "initializeTabButtonState" });
                setTabButtonsEnabled(false);
            }
        } else {
            // Restore previous state when loading finishes
            const previousState = getState("ui.tabButtonsPreviousState");
            if (previousState !== undefined) {
                setTabButtonsEnabled(previousState);
                setState("ui.tabButtonsPreviousState", undefined, { source: "initializeTabButtonState" });
            }
        }
    });

    console.log("[TabButtons] State management initialized");
}

/**
 * Check if tab buttons are currently enabled
 * @returns {boolean} True if tab buttons are enabled
 */
export function areTabButtonsEnabled() {
    return getState("ui.tabButtonsEnabled") || false;
}
