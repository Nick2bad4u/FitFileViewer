import { isHTMLElement } from "../../dom/index.js";
import { getState } from "../../state/core/stateManager.js";
import {
    getTabButtonIdentity,
    isOpenFileButton,
    safeComputedStyle,
    safeQueryTabButtons,
} from "./enableTabButtonsHelpers.js";
const testClickRegistrations = new Set();
/**
 * Debug function to manually test and fix tab button states.
 *
 * @throws TypeError when computed styles are unavailable in the active DOM.
 */
export function debugTabButtons() {
    console.log("[TabButtons] === DEBUG TAB BUTTONS ===");
    const tabButtons = safeQueryTabButtons();
    for (const element of tabButtons) {
        if (!isHTMLElement(element)) {
            continue;
        }
        const button = element;
        const { id: buttonId } = getTabButtonIdentity(button);
        if (isOpenFileButton(button)) {
            console.log(`[TabButtons] SKIPPING open file button: ${buttonId}`);
            continue;
        }
        // Explicitly surface missing or throwing getComputedStyle in tests.
        if (
            globalThis.window === undefined ||
            typeof globalThis.getComputedStyle !== "function"
        ) {
            throw new TypeError("getComputedStyle not available");
        }
        globalThis.getComputedStyle(button);
        const buttonElement = button;
        console.log(`[TabButtons] Button ${buttonId}:`, {
            computedCursor: safeComputedStyle(button, "cursor"),
            computedOpacity: safeComputedStyle(button, "opacity"),
            computedPointerEvents: safeComputedStyle(button, "pointerEvents"),
            cursor: button.style.cursor,
            disabled: buttonElement.disabled,
            hasDisabledAttr: button.hasAttribute("disabled"),
            hasDisabledClass: button.classList.contains("tab-disabled"),
            opacity: button.style.opacity,
            pointerEvents: button.style.pointerEvents,
        });
    }
    const globalData = getState("globalData");
    const isLoading = getState("isLoading");
    const tabButtonsEnabled = getState("ui.tabButtonsEnabled");
    console.log("[TabButtons] Current state:", {
        globalDataKeys: isRecord(globalData) ? Object.keys(globalData) : null,
        hasGlobalData: Boolean(globalData),
        isLoading,
        tabButtonsEnabled,
    });
}
/**
 * Debug function to check current tab states.
 */
export function debugTabState() {
    console.log("[TabButtons] === CURRENT TAB STATE ===");
    try {
        const activeTab = getState("ui.activeTab");
        const globalData = getState("globalData");
        const tabButtonsEnabled = getState("ui.tabButtonsEnabled");
        console.log("[TabButtons] UI State Snapshot", {
            activeTab,
            hasGlobalData: Boolean(globalData),
            tabButtonsEnabled,
        });
    } catch {
        /* Ignore errors */
    }
    for (const element of safeQueryTabButtons()) {
        if (!isHTMLElement(element)) {
            continue;
        }
        const button = element;
        const ariaSelected = button.getAttribute("aria-selected");
        const buttonId =
            button.id ||
            (typeof button.getAttribute === "function"
                ? button.getAttribute("id")
                : "") ||
            button.textContent?.trim() ||
            "";
        const buttonElement = button;
        const computedStyle = safeComputedStyle(button, "cursor");
        const currentPointerEvents = safeComputedStyle(button, "pointerEvents");
        console.log(`[TabButtons] Tab ${buttonId}:`, {
            ariaSelected,
            classList: Array.from(button.classList),
            computedCursor: computedStyle,
            computedPointerEvents: currentPointerEvents,
            disabled: buttonElement.disabled,
            hasDisabledAttr: button.hasAttribute("disabled"),
        });
    }
}
/**
 * Test function to manually check if tab buttons can receive click events.
 */
export function testTabButtonClicks() {
    console.log("[TabButtons] === TESTING TAB BUTTON CLICKS ===");
    clearPendingTestClickTimers();
    for (const element of safeQueryTabButtons()) {
        if (!isHTMLElement(element)) {
            continue;
        }
        const button = element;
        const { id: buttonId } = getTabButtonIdentity(button);
        if (isOpenFileButton(button)) {
            continue;
        }
        const testHandler = (event) => {
            console.log(
                `[TabButtons] TEST CLICK DETECTED on ${buttonId}!`,
                event
            );
            try {
                console.log(`Clicked on ${buttonId}!`);
            } catch {
                /* Ignore errors */
            }
        };
        const abortController = new AbortController();
        button.addEventListener("click", testHandler, {
            signal: abortController.signal,
        });
        console.log(`[TabButtons] Added test handler to: ${buttonId}`);
        const registration = {
            abortController,
            button,
            handler: testHandler,
            timer: setTimeout(() => {
                testClickRegistrations.delete(registration);
                removeTestClickRegistration(registration);
                console.log(
                    `[TabButtons] Removed test handler from: ${buttonId}`
                );
            }, 30_000),
        };
        testClickRegistrations.add(registration);
    }
    console.log("[TabButtons] Test handlers added. Try clicking buttons now!");
}
function clearPendingTestClickTimers() {
    for (const registration of testClickRegistrations) {
        clearTimeout(registration.timer);
        removeTestClickRegistration(registration);
    }
    testClickRegistrations.clear();
}
function removeTestClickRegistration(registration) {
    registration.abortController.abort();
    registration.button.removeEventListener("click", registration.handler);
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
