import { isHTMLElement } from "../../dom/index.js";
import type { BrowserTimerHandle } from "../../runtime/browserRuntime.js";
import { getActiveFitActivityData } from "../../state/domain/fitActivityDataState.js";
import { getRendererActiveTab } from "../../state/domain/rendererActiveTabState.js";
import { isRendererLoading } from "../../state/domain/rendererLoadingState.js";
import { areRendererTabButtonsEnabled } from "../../state/domain/rendererTabButtonsState.js";
import {
    getTabButtonIdentity,
    isOpenFileButton,
    safeComputedStyle,
    safeQueryTabButtons,
} from "./enableTabButtonsHelpers.js";
import {
    getEnableTabButtonsDebugRuntime,
    type EnableTabButtonsDebugRuntime,
} from "./enableTabButtonsDebugRuntime.js";

type TestClickRegistration = {
    readonly abortController: AbortController;
    readonly button: HTMLElement;
    readonly handler: (event: MouseEvent) => void;
    readonly timer: BrowserTimerHandle;
};

const testClickRegistrations = new Set<TestClickRegistration>();

function createTestClickHandler(buttonId: string): (event: MouseEvent) => void {
    return (event: MouseEvent): void => {
        console.log(`[TabButtons] TEST CLICK DETECTED on ${buttonId}!`, event);
        try {
            console.log(`Clicked on ${buttonId}!`);
        } catch {
            /* Ignore errors */
        }
    };
}

/**
 * Debug function to manually test and fix tab button states.
 *
 * @throws TypeError when computed styles are unavailable in the active DOM.
 */
export function debugTabButtons(): void {
    console.log("[TabButtons] === DEBUG TAB BUTTONS ===");
    const tabButtons = safeQueryTabButtons();
    const runtime = getEnableTabButtonsDebugRuntime();

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
        runtime.assertComputedStyleAvailable(button);

        const buttonElement = button as HTMLButtonElement;
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

    const activeFitRawData = getActiveFitActivityData().rawData;
    const isLoading = isRendererLoading();
    const tabButtonsEnabled = areRendererTabButtonsEnabled();

    console.log("[TabButtons] Current state:", {
        activeFitRawDataKeys: isRecord(activeFitRawData)
            ? Object.keys(activeFitRawData)
            : null,
        hasActiveFitRawData: Boolean(activeFitRawData),
        isLoading,
        tabButtonsEnabled,
    });
}

/**
 * Debug function to check current tab states.
 */
export function debugTabState(): void {
    console.log("[TabButtons] === CURRENT TAB STATE ===");
    try {
        const activeTab = getRendererActiveTab();
        const activeFitRawData = getActiveFitActivityData().rawData;
        const tabButtonsEnabled = areRendererTabButtonsEnabled();
        console.log("[TabButtons] UI State Snapshot", {
            activeTab,
            hasActiveFitRawData: Boolean(activeFitRawData),
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
        const buttonElement = button as HTMLButtonElement;
        const computedStyle = safeComputedStyle(button, "cursor");
        const currentPointerEvents = safeComputedStyle(button, "pointerEvents");

        console.log(`[TabButtons] Tab ${buttonId}:`, {
            ariaSelected,
            classList: [...button.classList],
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
export function testTabButtonClicks(): void {
    console.log("[TabButtons] === TESTING TAB BUTTON CLICKS ===");
    const runtime = getEnableTabButtonsDebugRuntime();
    clearPendingTestClickTimers(runtime);

    for (const element of safeQueryTabButtons()) {
        if (!isHTMLElement(element)) {
            continue;
        }

        const button = element;
        const { id: buttonId } = getTabButtonIdentity(button);
        if (isOpenFileButton(button)) {
            continue;
        }

        const testHandler = createTestClickHandler(buttonId);

        const abortController = runtime.createAbortController();
        button.addEventListener("click", testHandler, {
            signal: abortController.signal,
        });

        console.log(`[TabButtons] Added test handler to: ${buttonId}`);

        const registration: TestClickRegistration = {
            abortController,
            button,
            handler: testHandler,
            timer: runtime.setTimeout(() => {
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

function clearPendingTestClickTimers(
    runtime: EnableTabButtonsDebugRuntime = getEnableTabButtonsDebugRuntime()
): void {
    for (const registration of testClickRegistrations) {
        runtime.clearTimeout(registration.timer);
        removeTestClickRegistration(registration);
    }
    testClickRegistrations.clear();
}

function removeTestClickRegistration(
    registration: TestClickRegistration
): void {
    registration.abortController.abort();
    registration.button.removeEventListener("click", registration.handler);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
