// Utils/enableTabButtons.js
// Utility to enable or disable all tab buttons (except Open FIT File)

import { getState, setState, subscribe } from "../../state/core/stateManager.js";
// Reuse central DOM helpers for safe narrowing
import { isHTMLElement } from "../../dom/domHelpers.js";

/**
 * Enable or disable all tab buttons (with class 'tab-button'), except the "Open FIT File" button.
 * The "Open FIT File" button (ID: openFileBtn) is excluded from being disabled regardless
 * of the value of the `enabled` parameter, allowing users to always open new files.
 * @param {boolean} enabled - true to enable, false to disable
 */
/**
 * Enable/disable all non "open file" tab buttons with defensive HTMLElement narrowing.
 * @param {boolean} enabled
 */
export function setTabButtonsEnabled(enabled) {
    console.log(`[TabButtons] setTabButtonsEnabled(${enabled}) called`);

    // Track current state globally for debugging
    if (typeof window !== "undefined") {
        /** @type {any} */ (window).tabButtonsCurrentlyEnabled = enabled;
    }

    // Update state to track tab button status
    setState("ui.tabButtonsEnabled", enabled, { source: "setTabButtonsEnabled" });

    // Cache the tab buttons outside the function
    const tabButtons = /** @type {NodeListOf<Element>} */ (document.querySelectorAll(".tab-button")),

     TAB_DISABLED_CLASS = "tab-disabled";

    tabButtons.forEach((el) => {
        if (!isHTMLElement(el)) {return;}
        const btn = /** @type {HTMLElement} */ (el);
        // Skip the open file button - it should always remain enabled
        if (btn.id === "openFileBtn" || btn.id === "open-file-btn" || btn.classList.contains("open-file-btn")) {
            return;
        }

        // Cast to HTMLButtonElement when we intend to use 'disabled'
        const buttonEl = /** @type {HTMLButtonElement} */ (btn);
        if (!enabled) {
            // Disable the button
            buttonEl.disabled = true;
            btn.classList.add(TAB_DISABLED_CLASS);
            btn.setAttribute("disabled", "");
            btn.setAttribute("aria-disabled", "true");
            btn.style.pointerEvents = "none";
        } else {
            // Enable the button - use multiple approaches to ensure disabled state is fully removed
            console.log(`[TabButtons] Enabling button ${btn.id || btn.textContent?.trim()}`);

            // Approach 1: Standard property and attribute removal
            buttonEl.disabled = false;
            btn.classList.remove(TAB_DISABLED_CLASS);
            btn.removeAttribute("disabled");
            btn.setAttribute("aria-disabled", "false");

            // Approach 2: Forceful attribute removal (in case standard removal fails)
            if (btn.hasAttribute("disabled")) {
                console.log(`[TabButtons] WARNING: disabled attribute still present on ${btn.id}, forcing removal`);
                btn.removeAttribute("disabled");
                // Try alternative approaches
                btn.removeAttribute("disabled"); // Try again
                // Nuclear option: recreate the element to force removal
                if (btn.hasAttribute("disabled")) {
                    console.log(`[TabButtons] CRITICAL: Using nuclear option for ${btn.id}`);
                    const parent = btn.parentNode;
                    const newBtn = /** @type {HTMLElement} */ (btn.cloneNode(true));
                    newBtn.removeAttribute("disabled");
                    if (parent) {
                        parent.replaceChild(newBtn, btn);
                    }
                }
            }

            // Approach 3: Reset all visual and interaction styles
            btn.style.pointerEvents = "auto";
            btn.style.cursor = "pointer";
            btn.style.filter = "none";
            btn.style.opacity = "1";

            // Force a style recalculation and reflow
            btn.offsetHeight; // Triggers reflow

            // Final verification
            const finalBtn = /** @type {HTMLButtonElement} */ (btn);
            console.log(`[TabButtons] Final state for ${btn.id}: disabled=${finalBtn.disabled}, hasAttr=${btn.hasAttribute("disabled")}`);
        }
    });

    // Debug logging to see final state after all operations complete
    setTimeout(() => {
        console.log(`[TabButtons] Final state after ${enabled ? "enable" : "disable"}:`);
        tabButtons.forEach((el) => {
            if (!isHTMLElement(el)) {return;}
            const btn = /** @type {HTMLElement} */ (el);
            if (btn.id === "openFileBtn" || btn.id === "open-file-btn" || btn.classList.contains("open-file-btn")) {
                return;
            }
            const buttonEl = /** @type {HTMLButtonElement} */ (btn);
            console.log(
                `[TabButtons] ${btn.id || btn.textContent?.trim()}: disabled=${buttonEl.disabled}, hasDisabledAttr=${btn.hasAttribute("disabled")}, pointerEvents=${btn.style.pointerEvents}`
            );
        });
    }, 50);

    console.log(`[TabButtons] Buttons ${enabled ? "enabled" : "disabled"}`);
}

/**
 * Initialize tab button state management
 */
export function initializeTabButtonState() {
    console.log("[TabButtons] Initializing proper tab button state management");

    // Add MutationObserver to detect unauthorized disabled attribute additions
    if (typeof window !== "undefined" && !/** @type {any} */ (window).tabButtonObserver) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
                    const target = /** @type {HTMLElement} */ (mutation.target);
                    if (target.classList.contains('tab-button')) {
                        const hasDisabled = target.hasAttribute('disabled');
                        const isEnabled = /** @type {any} */ (window).tabButtonsCurrentlyEnabled || false;

                        if (hasDisabled && isEnabled) {
                            console.warn(`[TabButtons] UNAUTHORIZED: disabled attribute added to ${target.id} when tabs should be enabled!`);
                            console.trace('Stack trace for unauthorized disable:');
                            // Force remove it
                            target.removeAttribute('disabled');
                            const buttonEl = /** @type {HTMLButtonElement} */ (target);
                            buttonEl.disabled = false;
                        }
                    }
                }
            });
        });

        // Observe all tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            observer.observe(button, {
                attributes: true,
                attributeFilter: ['disabled']
            });
        });

        /** @type {any} */ (window).tabButtonObserver = observer;
    }

    // Start with tabs disabled initially (before any file is loaded)
    setTabButtonsEnabled(false);

    // Subscribe to data loading to automatically enable/disable tabs
    // This is the ONLY controller of tab state to avoid conflicts
    subscribe("globalData", (/** @type {any} */ data) => {
        const hasData = data !== null && data !== undefined;
        console.log(`[TabButtons] globalData changed, hasData: ${hasData}`, data ? "data present" : "no data");
        console.log(`[TabButtons] Updating tabs based on globalData: ${hasData ? "enabling" : "disabling"}`);
        setTabButtonsEnabled(hasData);
    });

    // NOTE: Removed ui.isLoading subscription to avoid conflicts
    // Tab state is now controlled ONLY by globalData presence

    console.log("[TabButtons] State management initialized - tabs disabled until file loaded");
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
    const tabButtons = /** @type {NodeListOf<Element>} */ (document.querySelectorAll(".tab-button"));

    tabButtons.forEach((el) => {
        if (!isHTMLElement(el)) {return;}
        const btn = /** @type {HTMLElement} */ (el);
        if (btn.id === "openFileBtn" || btn.id === "open-file-btn" || btn.classList.contains("open-file-btn")) {
            console.log(`[TabButtons] SKIPPING open file button: ${btn.id}`);
            return;
        }

        const buttonEl = /** @type {HTMLButtonElement} */ (btn);
        console.log(`[TabButtons] Button ${btn.id}:`, {
            disabled: buttonEl.disabled,
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

    const globalData = getState("globalData"),
     isLoading = getState("ui.isLoading"),
     tabButtonsEnabled = getState("ui.tabButtonsEnabled");

    console.log("[TabButtons] Current state:", {
        hasGlobalData: Boolean(globalData),
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
    const tabButtons = /** @type {NodeListOf<Element>} */ (document.querySelectorAll(".tab-button"));

    tabButtons.forEach((el) => {
        if (!isHTMLElement(el)) {return;}
        const btn = /** @type {HTMLElement} */ (el);
        if (btn.id === "openFileBtn" || btn.id === "open-file-btn" || btn.classList.contains("open-file-btn")) {
            return;
        }

        // Aggressively remove all disabled states
        const buttonEl = /** @type {HTMLButtonElement} */ (btn);
        buttonEl.disabled = false;
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
    const tabButtons = /** @type {NodeListOf<Element>} */ (document.querySelectorAll(".tab-button"));

    tabButtons.forEach((el) => {
        if (!isHTMLElement(el)) {return;}
        const btn = /** @type {HTMLElement} */ (el);
        if (btn.id === "openFileBtn" || btn.id === "open-file-btn" || btn.classList.contains("open-file-btn")) {
            return;
        }

        // Add a temporary test click handler
        /** @param {MouseEvent} event */
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
    const tabButtons = /** @type {NodeListOf<Element>} */ (document.querySelectorAll(".tab-button"));

    tabButtons.forEach((el) => {
        if (!isHTMLElement(el)) {return;}
        const btn = /** @type {HTMLElement} */ (el),
         isActive = btn.classList.contains("active"),
         ariaSelected = btn.getAttribute("aria-selected"),

         buttonEl = /** @type {HTMLButtonElement} */ (btn);
        console.log(
            `[TabButtons] ${btn.id}: active=${isActive}, aria-selected=${ariaSelected}, disabled=${buttonEl.disabled}`
        );
    });

    const activeTab = getState("ui.activeTab"),
     globalData = getState("globalData");

    console.log("[TabButtons] State:", {
        activeTab,
        hasGlobalData: Boolean(globalData),
        tabButtonsEnabled: getState("ui.tabButtonsEnabled"),
    });
}

/**
 * Force fix tab button states - this will override everything
 */
export function forceFixTabButtons() {
    console.log("[TabButtons] === FORCE FIXING TAB BUTTON STATES ===");
    const tabButtons = /** @type {NodeListOf<Element>} */ (document.querySelectorAll(".tab-button"));

    tabButtons.forEach((el) => {
        if (!isHTMLElement(el)) {return;}
        const btn = /** @type {HTMLElement} */ (el);
        if (btn.id === "openFileBtn" || btn.id === "open-file-btn" || btn.classList.contains("open-file-btn")) {
            return;
        }

        const buttonEl = /** @type {HTMLButtonElement} */ (btn);
        console.log(`[TabButtons] BEFORE FIX: ${btn.id} disabled=${buttonEl.disabled}`);

        // Force set to enabled
        buttonEl.disabled = false;
        btn.classList.remove("tab-disabled");
        btn.removeAttribute("disabled");

        // Explicitly set styles
        btn.style.pointerEvents = "auto";
        btn.style.cursor = "pointer";
        btn.style.filter = "none";
        btn.style.opacity = "1";

        console.log(`[TabButtons] AFTER FIX: ${btn.id} disabled=${buttonEl.disabled}`);
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
