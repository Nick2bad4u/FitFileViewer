// utils/enableTabButtons.js
// Utility to enable or disable all tab buttons (except Open FIT File)

import { setState, getState } from "../../state/core/stateManager.js";

/**
 * Enable or disable all tab buttons (with class 'tab-button'), except the "Open FIT File" button.
 * The "Open FIT File" button (ID: openFileBtn) is excluded from being disabled regardless
 * of the value of the `enabled` parameter, allowing users to always open new files.
 * @param {boolean} enabled - true to enable, false to disable
 */
export function setTabButtonsEnabled(enabled) {
    console.log(`[TabButtons] setTabButtonsEnabled(${enabled}) called`);

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

        if (!enabled) {
            // Disable the button
            btn.disabled = true;
            btn.classList.add(TAB_DISABLED_CLASS);
            btn.setAttribute("disabled", "");
            btn.style.pointerEvents = "none";
        } else {
            // Enable the button - be more aggressive about removing all disabled states
            btn.disabled = false;
            btn.classList.remove(TAB_DISABLED_CLASS);
            btn.removeAttribute("disabled");

            // Forcefully reset pointer events and styles that might be blocking clicks
            btn.style.pointerEvents = "auto"; // Explicitly set to auto instead of empty
            btn.style.cursor = "pointer";
            btn.style.filter = "none";
            btn.style.opacity = "1";

            // Force a style recalculation
            btn.offsetHeight; // triggers reflow
        }
    });

    // Debug logging to see final state after all operations complete
    setTimeout(() => {
        console.log(`[TabButtons] Final state after ${enabled ? "enable" : "disable"}:`);
        tabButtons.forEach((btn) => {
            if (btn.id === "openFileBtn" || btn.id === "open-file-btn" || btn.classList.contains("open-file-btn")) {
                return;
            }
            console.log(
                `[TabButtons] ${btn.id || btn.textContent?.trim()}: disabled=${btn.disabled}, hasDisabledAttr=${btn.hasAttribute("disabled")}, pointerEvents=${btn.style.pointerEvents}`
            );
        });
    }, 50);

    console.log(`[TabButtons] Buttons ${enabled ? "enabled" : "disabled"}`);
}

/**
 * Initialize tab button state management
 */
export function initializeTabButtonState() {
    // TEMPORARY FIX: Always enable tabs, disable the disabling logic
    console.log("[TabButtons] TEMPORARY: Always enabling tabs, disabling auto-disable logic");
    setTabButtonsEnabled(true);

    // DISABLED: Subscribe to data loading to automatically enable/disable tabs
    // This is the ONLY controller of tab state to avoid conflicts
    // subscribe("globalData", (data) => {
    //     const hasData = data !== null && data !== undefined;
    //     console.log(`[TabButtons] globalData changed, hasData: ${hasData}`, data ? "data present" : "no data");
    //     console.log(`[TabButtons] Updating tabs based on globalData: ${hasData ? "enabling" : "disabling"}`);
    //     setTabButtonsEnabled(hasData);
    // });

    // NOTE: Removed ui.isLoading subscription to avoid conflicts
    // Tab state is now controlled ONLY by globalData presence

    console.log("[TabButtons] State management initialized (tabs always enabled)");
}

/**
 * Check if tab buttons are currently enabled
 * @returns {boolean} True if tab buttons are enabled
 */
export function areTabButtonsEnabled() {
    return getState("ui.tabButtonsEnabled") || false;
}

/**
 * Debug function to manually test and fix tab button states
 */
export function debugTabButtons() {
    console.log("[TabButtons] === DEBUG TAB BUTTONS ===");
    const tabButtons = document.querySelectorAll(".tab-button");

    tabButtons.forEach((btn) => {
        if (btn.id === "openFileBtn" || btn.id === "open-file-btn" || btn.classList.contains("open-file-btn")) {
            console.log(`[TabButtons] SKIPPING open file button: ${btn.id}`);
            return;
        }

        console.log(`[TabButtons] Button ${btn.id}:`, {
            disabled: btn.disabled,
            hasDisabledAttr: btn.hasAttribute("disabled"),
            hasDisabledClass: btn.classList.contains("tab-disabled"),
            pointerEvents: btn.style.pointerEvents,
            computedPointerEvents: window.getComputedStyle(btn).pointerEvents,
            cursor: btn.style.cursor,
            computedCursor: window.getComputedStyle(btn).cursor,
            opacity: btn.style.opacity,
            computedOpacity: window.getComputedStyle(btn).opacity,
        });
    });

    const globalData = getState("globalData");
    const isLoading = getState("ui.isLoading");
    const tabButtonsEnabled = getState("ui.tabButtonsEnabled");

    console.log("[TabButtons] Current state:", {
        hasGlobalData: !!globalData,
        isLoading,
        tabButtonsEnabled,
        globalDataKeys: globalData ? Object.keys(globalData) : null,
    });
}

/**
 * Force enable all tab buttons (for debugging)
 */
export function forceEnableTabButtons() {
    console.log("[TabButtons] === FORCE ENABLING ALL TAB BUTTONS ===");
    const tabButtons = document.querySelectorAll(".tab-button");

    tabButtons.forEach((btn) => {
        if (btn.id === "openFileBtn" || btn.id === "open-file-btn" || btn.classList.contains("open-file-btn")) {
            return;
        }

        // Aggressively remove all disabled states
        btn.disabled = false;
        btn.classList.remove("tab-disabled");
        btn.removeAttribute("disabled");

        // Remove all blocking styles - be explicit about the values
        btn.style.pointerEvents = "auto";
        btn.style.cursor = "pointer";
        btn.style.filter = "none";
        btn.style.opacity = "1";

        // Force style recalculation
        btn.offsetHeight;

        console.log(`[TabButtons] Force enabled: ${btn.id}`);
    });

    // Update state
    setState("ui.tabButtonsEnabled", true, { source: "forceEnableTabButtons" });
}

/**
 * Test function to manually check if tab buttons can receive click events
 */
export function testTabButtonClicks() {
    console.log("[TabButtons] === TESTING TAB BUTTON CLICKS ===");
    const tabButtons = document.querySelectorAll(".tab-button");

    tabButtons.forEach((btn) => {
        if (btn.id === "openFileBtn" || btn.id === "open-file-btn" || btn.classList.contains("open-file-btn")) {
            return;
        }

        // Add a temporary test click handler
        const testHandler = (event) => {
            console.log(`[TabButtons] TEST CLICK DETECTED on ${btn.id}!`, event);
            alert(`Clicked on ${btn.id}!`);
        };

        btn.addEventListener("click", testHandler);

        console.log(`[TabButtons] Added test handler to: ${btn.id}`);

        // Remove the test handler after 30 seconds
        setTimeout(() => {
            btn.removeEventListener("click", testHandler);
            console.log(`[TabButtons] Removed test handler from: ${btn.id}`);
        }, 30000);
    });

    console.log("[TabButtons] Test handlers added. Try clicking buttons now!");
}

/**
 * Debug function to check current tab states
 */
export function debugTabState() {
    console.log("[TabButtons] === CURRENT TAB STATE ===");
    const tabButtons = document.querySelectorAll(".tab-button");

    tabButtons.forEach((btn) => {
        const isActive = btn.classList.contains("active");
        const ariaSelected = btn.getAttribute("aria-selected");

        console.log(
            `[TabButtons] ${btn.id}: active=${isActive}, aria-selected=${ariaSelected}, disabled=${btn.disabled}`
        );
    });

    const activeTab = getState("ui.activeTab");
    const globalData = getState("globalData");

    console.log("[TabButtons] State:", {
        activeTab,
        hasGlobalData: !!globalData,
        tabButtonsEnabled: getState("ui.tabButtonsEnabled"),
    });
}

/**
 * Force fix tab button states - this will override everything
 */
export function forceFixTabButtons() {
    console.log("[TabButtons] === FORCE FIXING TAB BUTTON STATES ===");
    const tabButtons = document.querySelectorAll(".tab-button");

    tabButtons.forEach((btn) => {
        if (btn.id === "openFileBtn" || btn.id === "open-file-btn" || btn.classList.contains("open-file-btn")) {
            return;
        }

        console.log(`[TabButtons] BEFORE FIX: ${btn.id} disabled=${btn.disabled}`);

        // Force set to enabled
        btn.disabled = false;
        btn.classList.remove("tab-disabled");
        btn.removeAttribute("disabled");

        // Explicitly set styles
        btn.style.pointerEvents = "auto";
        btn.style.cursor = "pointer";
        btn.style.filter = "none";
        btn.style.opacity = "1";

        console.log(`[TabButtons] AFTER FIX: ${btn.id} disabled=${btn.disabled}`);
    });

    // Also force update the state
    setState("ui.tabButtonsEnabled", true, { source: "forceFixTabButtons" });

    console.log("[TabButtons] Force fix complete - try clicking now!");
}

// Expose function globally for debugging and compatibility
window.setTabButtonsEnabled = setTabButtonsEnabled;
window.areTabButtonsEnabled = areTabButtonsEnabled;
window.debugTabButtons = debugTabButtons;
window.forceEnableTabButtons = forceEnableTabButtons;
window.testTabButtonClicks = testTabButtonClicks;
window.debugTabState = debugTabState;
window.forceFixTabButtons = forceFixTabButtons;

console.log("[TabButtons] Functions exposed globally for compatibility");
