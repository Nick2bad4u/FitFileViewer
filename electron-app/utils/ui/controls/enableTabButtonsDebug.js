import { isHTMLElement } from "../../dom/index.js";
import { getState } from "../../state/core/stateManager.js";
import {
    safeComputedStyle,
    safeQueryTabButtons,
} from "./enableTabButtonsHelpers.js";

/**
 * Debug function to manually test and fix tab button states
 */
export function debugTabButtons() {
    console.log("[TabButtons] === DEBUG TAB BUTTONS ===");
    const tabButtons = safeQueryTabButtons();

    for (const el of tabButtons) {
        if (!isHTMLElement(el)) {
            continue;
        }
        const btn = /** @type {HTMLElement} */ (el),
            btnId =
                btn.id ||
                (typeof btn.getAttribute === "function"
                    ? btn.getAttribute("id")
                    : "") ||
                btn.textContent?.trim() ||
                "";
        if (
            btnId === "open_file_btn" ||
            btnId === "open-file-btn" ||
            btn.classList.contains("open-file-btn")
        ) {
            console.log(`[TabButtons] SKIPPING open file button: ${btnId}`);
            continue;
        }

        // Explicitly test getComputedStyle availability and propagate failure for tests
        if (
            !(
                globalThis.window !== undefined &&
                typeof globalThis.getComputedStyle === "function"
            )
        ) {
            throw new TypeError("getComputedStyle not available");
        }
        // Intentionally invoke getComputedStyle to surface any mocked errors
        // The result isn't used directly here; safeComputedStyle is used below for values
        // But we want to ensure environments that throw are detected and rethrown
        globalThis.getComputedStyle(btn);

        const buttonEl = /** @type {HTMLButtonElement} */ (btn);
        console.log(`[TabButtons] Button ${btnId}:`, {
            computedCursor: safeComputedStyle(btn, "cursor"),
            computedOpacity: safeComputedStyle(btn, "opacity"),
            computedPointerEvents: safeComputedStyle(btn, "pointerEvents"),
            cursor: btn.style.cursor,
            disabled: buttonEl.disabled,
            hasDisabledAttr: btn.hasAttribute("disabled"),
            hasDisabledClass: btn.classList.contains("tab-disabled"),
            opacity: btn.style.opacity,
            pointerEvents: btn.style.pointerEvents,
        });
    }

    const globalData = getState("globalData"),
        isLoading = getState("isLoading"),
        tabButtonsEnabled = getState("ui.tabButtonsEnabled");

    console.log("[TabButtons] Current state:", {
        globalDataKeys: globalData ? Object.keys(globalData) : null,
        hasGlobalData: Boolean(globalData),
        isLoading,
        tabButtonsEnabled,
    });
}

/**
 * Debug function to check current tab states
 */
export function debugTabState() {
    console.log("[TabButtons] === CURRENT TAB STATE ===");
    const tabButtons = /** @type {Element[]} */ (safeQueryTabButtons());

    for (const el of tabButtons) {
        if (!isHTMLElement(el)) {
            continue;
        }
        const btn = /** @type {HTMLElement} */ (el),
            ariaSelected = btn.getAttribute("aria-selected"),
            btnId =
                btn.id ||
                (typeof btn.getAttribute === "function"
                    ? btn.getAttribute("id")
                    : "") ||
                btn.textContent?.trim() ||
                "",
            buttonEl = /** @type {HTMLButtonElement} */ (btn),
            computedStyle = safeComputedStyle(btn, "cursor"),
            currentPointerEvents = safeComputedStyle(btn, "pointerEvents");

        console.log(`[TabButtons] Tab ${btnId}:`, {
            ariaSelected,
            classList: Array.from(btn.classList),
            computedCursor: computedStyle,
            computedPointerEvents: currentPointerEvents,
            disabled: buttonEl.disabled,
            hasDisabledAttr: btn.hasAttribute("disabled"),
        });
    }
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
                (typeof btn.getAttribute === "function"
                    ? btn.getAttribute("id")
                    : "") ||
                btn.textContent?.trim() ||
                "",
            btnText = (btn.textContent || "").trim().toLowerCase(),
            isOpenFile =
                btnId === "open_file_btn" ||
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
