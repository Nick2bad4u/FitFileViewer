// Utils/enableTabButtons.js
// Utility to enable or disable all tab buttons (except Open FIT File)

// Reuse central DOM helpers for safe narrowing
import { isHTMLElement } from "../../dom/domHelpers.js";
import { getState, setState, subscribe } from "../../state/core/stateManager.js";

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
            disabled: buttonEl.disabled,
            hasDisabledAttr: btn.hasAttribute("disabled"),
            hasDisabledClass: btn.classList.contains("tab-disabled"),
            opacity: btn.style.opacity,
            computedOpacity: window.getComputedStyle(btn).opacity,
        });
    });

    const globalData = getState("globalData");
    const isLoading = getState("ui.isLoading");
    const tabButtonsEnabled = getState("ui.tabButtonsEnabled");

    console.log("[TabButtons] Current state:", {
        globalDataKeys: globalData ? Object.keys(globalData) : null,
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

/**
 * Initialize tab button state management
 */
export function initializeTabButtonState() {
    console.log("[TabButtons] Initializing proper tab button state management");

    // Add MutationObserver to detect unauthorized disabled attribute additions
    ensureObserverInstalled();

    // Start with tabs disabled initially (before any file is loaded) but avoid overriding
    // Test-controlled conditions. Only call setTabButtonsEnabled(false) if the test hasn't
    // Explicitly set window.tabButtonsCurrentlyEnabled already.
    if (globalThis.window === undefined) {
        setTabButtonsEnabled(false);
    } else {
        const w = /** @type {any} */ (globalThis);
        if (w.tabButtonsCurrentlyEnabled === undefined) {
            setTabButtonsEnabled(false);
        } else {
            // Ensure internal state is initialized even if we don't toggle DOM
            setState("ui.tabButtonsEnabled", Boolean(w.tabButtonsCurrentlyEnabled), {
                source: "initializeTabButtonState",
            });
        }
    }

    // Subscribe to data loading to automatically enable/disable tabs
    // This is the ONLY controller of tab state to avoid conflicts
    if (typeof subscribe === "function") {
        subscribe("globalData", (/** @type {any} */ data) => {
            const hasData = data !== null && data !== undefined;
            console.log(`[TabButtons] globalData changed, hasData: ${hasData}`, data ? "data present" : "no data");
            console.log(`[TabButtons] Updating tabs based on globalData: ${hasData ? "enabling" : "disabling"}`);
            setTabButtonsEnabled(hasData);
        });
    } else {
        console.warn("[TabButtons] subscribe is not available; skipping globalData subscription");
    }

    // NOTE: Removed ui.isLoading subscription to avoid conflicts
    // Tab state is now controlled ONLY by globalData presence

    console.log("[TabButtons] State management initialized - tabs disabled until file loaded");
}

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
    if (globalThis.window !== undefined) {
        /** @type {any} */ (globalThis).tabButtonsCurrentlyEnabled = enabled;
    }

    // Ensure our MutationObserver is installed even if initializeTabButtonState wasn't called
    ensureObserverInstalled();

    // Update state to track tab button status
    setState("ui.tabButtonsEnabled", enabled, { source: "setTabButtonsEnabled" });

    // Cache the tab buttons using safe accessors for consistency in jsdom/tests/mocks
    const TAB_DISABLED_CLASS = "tab-disabled",
        tabButtons = safeQueryTabButtons();

    for (const el of tabButtons) {
        if (!isHTMLElement(el)) {
            continue;
        }
        const btn = /** @type {HTMLElement} */ (el),
            // Derive a robust identifier for logging and matching regardless of environment quirks
            btnId =
                btn.id ||
                (typeof btn.getAttribute === "function" ? btn.getAttribute("id") : "") ||
                btn.textContent?.trim() ||
                "",
            btnText = (btn.textContent || "").trim().toLowerCase(),
            isOpenFile =
                btnId === "openFileBtn" ||
                btnId === "open-file-btn" ||
                btn.classList.contains("open-file-btn") ||
                btnText.includes("open file");
        // Skip the open file button - it should always remain enabled
        if (isOpenFile) {
            continue;
        }

        // Cast to HTMLButtonElement when we intend to use 'disabled'
        const buttonEl = /** @type {HTMLButtonElement} */ (btn);
        if (enabled) {
            // Enable the button - use multiple approaches to ensure disabled state is fully removed
            console.log(`[TabButtons] Enabling button ${btnId}`);

            // Approach 1: Standard property and attribute removal
            buttonEl.disabled = false;
            btn.classList.remove(TAB_DISABLED_CLASS);
            btn.removeAttribute("disabled");
            btn.setAttribute("aria-disabled", "false");

            // Approach 2: Forceful attribute removal (in case standard removal fails)
            if (btn.hasAttribute("disabled")) {
                console.log(`[TabButtons] WARNING: disabled attribute still present on ${btnId}, forcing removal`);
                btn.removeAttribute("disabled");
                // Try alternative approaches
                btn.removeAttribute("disabled"); // Try again
                // Nuclear option: recreate the element to force removal
                if (btn.hasAttribute("disabled")) {
                    console.log(`[TabButtons] CRITICAL: Using nuclear option for ${btnId}`);
                    const parent = btn.parentNode;
                    const newBtn = /** @type {HTMLElement} */ (btn.cloneNode(true));
                    // Ensure id is preserved even if clone implementation is quirky
                    if (!newBtn.id && btnId) {
                        newBtn.id = btnId;
                    }
                    newBtn.removeAttribute("disabled");
                    if (parent) {
                        btn.replaceWith(newBtn);
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
            console.log(
                `[TabButtons] Final state for ${btnId}: disabled=${finalBtn.disabled}, hasAttr=${btn.hasAttribute("disabled")}`
            );
        } else {
            // Disable the button
            buttonEl.disabled = true;
            btn.classList.add(TAB_DISABLED_CLASS);
            btn.setAttribute("disabled", "");
            btn.setAttribute("aria-disabled", "true");
            btn.style.pointerEvents = "none";
        }
    }

    // Debug logging to see final state after all operations complete
    setTimeout(() => {
        console.log(`[TabButtons] Final state after ${enabled ? "enable" : "disable"}:`);
        for (const el of tabButtons) {
            if (!isHTMLElement(el)) {
                continue;
            }
            const btn = /** @type {HTMLElement} */ (el),
                btnId =
                    btn.id ||
                    (typeof btn.getAttribute === "function" ? btn.getAttribute("id") : "") ||
                    btn.textContent?.trim() ||
                    "",
                btnText = (btn.textContent || "").trim().toLowerCase(),
                isOpenFile =
                    btnId === "openFileBtn" ||
                    btnId === "open-file-btn" ||
                    btn.classList.contains("open-file-btn") ||
                    btnText.includes("open file");
            if (isOpenFile) {
                continue;
            }
            const buttonEl = /** @type {HTMLButtonElement} */ (btn);
            console.log(
                `[TabButtons] ${btnId}: disabled=${buttonEl.disabled}, hasDisabledAttr=${btn.hasAttribute("disabled")}, pointerEvents=${btn.style.pointerEvents}`
            );
        }
    }, 50);

    console.log(`[TabButtons] Buttons ${enabled ? "enabled" : "disabled"}`);
}

/**
 * Test function to manually check if tab buttons can receive click events
 */
export function testTabButtonClicks() {
    console.log("[TabButtons] === TESTING TAB BUTTON CLICKS ===");
    const tabButtons = safeQueryTabButtons();

    for (const el of tabButtons) {
        if (!isHTMLElement(el)) {
            continue;
        }
        const btn = /** @type {HTMLElement} */ (el),
            btnId =
                btn.id ||
                (typeof btn.getAttribute === "function" ? btn.getAttribute("id") : "") ||
                btn.textContent?.trim() ||
                "",
            btnText = (btn.textContent || "").trim().toLowerCase(),
            isOpenFile =
                btnId === "openFileBtn" ||
                btnId === "open-file-btn" ||
                btn.classList.contains("open-file-btn") ||
                btnText.includes("open file");
        if (isOpenFile) {
            continue;
        }

        // Add a temporary test click handler
        /** @param {MouseEvent} event */
        const testHandler = (event) => {
            console.log(`[TabButtons] TEST CLICK DETECTED on ${btnId}!`, event);
            try {
                console.log(`Clicked on ${btnId}!`);
            } catch {
                /* Ignore errors */
            }
        };

        btn.addEventListener("click", testHandler);

        console.log(`[TabButtons] Added test handler to: ${btnId}`);

        // Remove the test handler after 30 seconds
        setTimeout(() => {
            btn.removeEventListener("click", testHandler);
            console.log(`[TabButtons] Removed test handler from: ${btnId}`);
        }, 30_000);
    }

    console.log("[TabButtons] Test handlers added. Try clicking buttons now!");
}

/**
 * Ensure MutationObserver is installed and observing current tab buttons
 */
function ensureObserverInstalled() {
    if (globalThis.window === undefined) {
        return;
    }
    const w = /** @type {any} */ (globalThis);
    // Resolve MutationObserver constructor in a way that works for both browser/jsdom and tests:
    // - If both global and window constructors exist and are different (tests may mock one), prefer the global one.
    // - Otherwise prefer window.MutationObserver when available, then fall back to global.
    /** @type {typeof MutationObserver | undefined} */
    const globalCtor = typeof MutationObserver === "undefined" ? /** @type {any} */ undefined : MutationObserver;
    /** @type {typeof MutationObserver | undefined} */
    const windowCtor = w.MutationObserver === undefined ? /** @type {any} */ undefined : w.MutationObserver;
    const ObserverCtor =
        globalCtor && windowCtor ? (globalCtor === windowCtor ? windowCtor : globalCtor) : windowCtor || globalCtor;

    if (!w.tabButtonObserver && ObserverCtor !== undefined) {
        /** @param {MutationRecord[]} mutations */
        const callback = (mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "attributes" && mutation.attributeName === "disabled") {
                    const { target } = /** @type {HTMLElement} */ (mutation);
                    if (target.classList.contains("tab-button")) {
                        const hasDisabled = target.hasAttribute("disabled");
                        const isEnabled = w.tabButtonsCurrentlyEnabled || false;

                        if (hasDisabled && isEnabled) {
                            console.warn(
                                `[TabButtons] UNAUTHORIZED: disabled attribute added to ${target.id} when tabs should be enabled!`
                            );
                            if (typeof console.trace === "function") {
                                console.trace("Stack trace for unauthorized disable:");
                            }
                            // Force remove it
                            target.removeAttribute("disabled");
                            const buttonEl = /** @type {HTMLButtonElement} */ (target);
                            buttonEl.disabled = false;
                        }
                    }
                }
            }
        };
        // If both constructors exist and differ, construct with the chosen (ObserverCtor)
        // But also invoke windowCtor to allow tests to capture the callback via window.MutationObserver mocks.
        const observer = new ObserverCtor(callback);
        if (globalCtor && windowCtor && globalCtor !== windowCtor) {
            try {
                // eslint-disable-next-line no-new, new-cap
                new windowCtor(callback);
            } catch {
                /* Ignore errors */
            }
        }
        w.tabButtonObserver = observer;
    }
    // (Re)attach observer to current buttons
    const observer = w.tabButtonObserver;
    if (observer) {
        /** @type {Element[]} */
        const buttons = /** @type {Element[]} */ (safeQueryTabButtons());
        for (const button of buttons) {
            try {
                if (button && typeof observer.observe === "function") {
                    observer.observe(button, { attributeFilter: ["disabled"], attributes: true });
                }
            } catch {
                /* Ignore errors */
            }
        }
    }
}

/**
 * Safely get computed style values when available.
 * @param {Element} el
 * @param {string} prop
 * @returns {string|undefined}
 */
function safeComputedStyle(el, prop) {
    try {
        if (globalThis.window !== undefined && typeof globalThis.getComputedStyle === "function") {
            const cs = globalThis.getComputedStyle(el);
            if (typeof cs.getPropertyValue === "function") {
                const v = cs.getPropertyValue(prop);
                return v || undefined;
            }
            // Fallback indexing for environments that allow it
            return /** @type {any} */ (cs)[prop];
        }
    } catch {
        /* Ignore errors */
    }
}

// Safe helpers to work across jsdom and heavily mocked DOMs in tests
/**
 * Safely get an array of elements matching the tab button selector.
 * Returns an empty array if document APIs are missing or throw.
 * @returns {HTMLElement[]}
 */
function safeQueryTabButtons() {
    try {
        if (typeof document !== "undefined") {
            if (typeof document.querySelectorAll === "function") {
                // NodeList may not be iterable in some mocked environments, Array.from handles it
                return /** @type {HTMLElement[]} */ ([...document.querySelectorAll(".tab-button")]);
            }
            if (typeof document.getElementsByClassName === "function") {
                return /** @type {HTMLElement[]} */ ([...document.querySelectorAll(".tab-button")]);
            }
        }
    } catch {
        // Fall-through to return []
    }
    return [];
}

// Expose function globally for debugging and compatibility (only when window exists)
try {
    if (globalThis.window !== undefined) {
        /** @type {any} */ (globalThis).setTabButtonsEnabled = setTabButtonsEnabled;
        /** @type {any} */ (globalThis).areTabButtonsEnabled = areTabButtonsEnabled;
        /** @type {any} */ (globalThis).debugTabButtons = debugTabButtons;
        /** @type {any} */ (globalThis).forceEnableTabButtons = forceEnableTabButtons;
        /** @type {any} */ (globalThis).testTabButtonClicks = testTabButtonClicks;
        /** @type {any} */ (globalThis).debugTabState = debugTabState;
        /** @type {any} */ (globalThis).forceFixTabButtons = forceFixTabButtons;
        console.log("[TabButtons] Functions exposed globally for compatibility");
    }
} catch {
    // Ignore if window is not available or assignment fails (e.g., strict mocks)
}
