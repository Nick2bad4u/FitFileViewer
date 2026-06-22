import { isHTMLElement } from "../../dom/index.js";
import { subscribeToActiveFitRawData } from "../../state/domain/activeFitRawDataState.js";
import {
    areRendererTabButtonsEnabled,
    setRendererTabButtonsEnabled,
} from "../../state/domain/rendererTabButtonsState.js";
import {
    debugTabButtons as debugTabButtonsImpl,
    debugTabState as debugTabStateImpl,
    testTabButtonClicks as testTabButtonClicksImpl,
} from "./enableTabButtonsDebug.js";
import {
    getTabButtonIdentity,
    safeQueryTabButtons,
} from "./enableTabButtonsHelpers.js";
import {
    getEnableTabButtonsRuntime,
    type TabButtonObserver,
} from "./enableTabButtonsRuntime.js";

/** Debug function to manually test and fix tab button states. */
export function debugTabButtons(): void {
    debugTabButtonsImpl();
}

/** Debug function to check current tab states. */
export function debugTabState(): void {
    debugTabStateImpl();
}

/** Test function to manually check if tab buttons can receive click events. */
export function testTabButtonClicks(): void {
    testTabButtonClicksImpl();
}

type TabButtonElement = HTMLElement & {
    disabled?: boolean;
};

const TAB_DISABLED_CLASS = "tab-disabled";
const finalStateLogTimers = new Set<ReturnType<typeof setTimeout>>();
let tabButtonsCurrentlyEnabled: boolean | undefined;
let tabButtonObserver: TabButtonObserver | undefined;

/** TEST-ONLY: reset module state between suites. */
export function __resetTabButtonStateForTests(): void {
    tabButtonsCurrentlyEnabled = undefined;
    tabButtonObserver = undefined;
    clearFinalStateLogTimers();
}

// Ensure console.trace exists for tests/environments where it is missing.
if (typeof console !== "undefined" && typeof console.trace !== "function") {
    console.trace = (...args: unknown[]) => {
        if (typeof console.debug === "function") {
            console.debug(...args);
        } else if (typeof console.log === "function") {
            console.log(...args);
        }
    };
}

/**
 * Check if tab buttons are currently enabled.
 *
 * @returns True if tab buttons are enabled.
 */
export function areTabButtonsEnabled(): boolean {
    return areRendererTabButtonsEnabled();
}

/**
 * Force enable all tab buttons.
 */
export function forceEnableTabButtons(): void {
    console.log("[TabButtons] === FORCE ENABLING TAB BUTTONS ===");

    for (const button of getHTMLElementTabButtons()) {
        const { id: buttonId, isOpenFile } = getTabButtonIdentity(button);
        if (isOpenFile) {
            continue;
        }

        enableButton(button);
        console.log(`[TabButtons] Force enabled: ${buttonId}`);
    }

    setRendererTabButtonsEnabled(true, { source: "forceEnableTabButtons" });
}

/**
 * Force fix tab button states by overriding disabled DOM state and styles.
 */
export function forceFixTabButtons(): void {
    console.log("[TabButtons] === FORCE FIXING TAB BUTTON STATES ===");

    for (const button of getHTMLElementTabButtons()) {
        const { id: buttonId, isOpenFile } = getTabButtonIdentity(button);
        if (isOpenFile) {
            continue;
        }

        console.log(
            `[TabButtons] BEFORE FIX: ${buttonId} disabled=${getButtonDisabled(button)}`
        );

        enableButton(button);

        console.log(
            `[TabButtons] AFTER FIX: ${buttonId} disabled=${getButtonDisabled(button)}`
        );
    }

    setRendererTabButtonsEnabled(true, { source: "forceFixTabButtons" });

    console.log("[TabButtons] Force fix complete - try clicking now!");
}

/**
 * Initialize tab button state management.
 */
export function initializeTabButtonState(): void {
    console.log("[TabButtons] Initializing proper tab button state management");

    ensureObserverInstalled();
    const runtime = getEnableTabButtonsRuntime();

    if (!runtime.isWindowAvailable()) {
        setTabButtonsEnabled(false);
    } else if (tabButtonsCurrentlyEnabled === undefined) {
        setTabButtonsEnabled(false);
    } else {
        setRendererTabButtonsEnabled(tabButtonsCurrentlyEnabled, {
            source: "initializeTabButtonState",
        });
    }

    subscribeToActiveFitRawData((data) => {
        const hasData = data !== null;
        console.log(
            `[TabButtons] fitFile.rawData changed, hasData: ${hasData}`,
            data ? "data present" : "no data"
        );
        console.log(
            `[TabButtons] Updating tabs based on fitFile.rawData: ${hasData ? "enabling" : "disabling"}`
        );
        setTabButtonsEnabled(hasData);
    });

    console.log(
        "[TabButtons] State management initialized - tabs disabled until file loaded"
    );
}

/**
 * Enable or disable all non-open-file tab buttons.
 *
 * @param enabled - True to enable, false to disable.
 */
export function setTabButtonsEnabled(enabled: boolean): void {
    console.log(`[TabButtons] setTabButtonsEnabled(${enabled}) called`);

    tabButtonsCurrentlyEnabled = enabled;

    ensureObserverInstalled();

    setRendererTabButtonsEnabled(enabled, {
        source: "setTabButtonsEnabled",
    });

    const tabButtons = safeQueryTabButtons();

    for (const button of getHTMLElementTabButtons(tabButtons)) {
        const { id: buttonId, isOpenFile } = getTabButtonIdentity(button);
        if (isOpenFile) {
            continue;
        }

        if (enabled) {
            console.log(`[TabButtons] Enabling button ${buttonId}`);
            enableButtonWithVerification(button, buttonId);
        } else {
            disableButton(button);
        }
    }

    scheduleFinalStateLog(enabled, tabButtons);

    console.log(`[TabButtons] Buttons ${enabled ? "enabled" : "disabled"}`);
}

/**
 * Ensure MutationObserver is installed and observing current tab buttons.
 */
function ensureObserverInstalled(): void {
    const runtime = getEnableTabButtonsRuntime();
    if (!runtime.isWindowAvailable()) {
        return;
    }

    if (!tabButtonObserver) {
        const callback: MutationCallback = (mutations) => {
            for (const mutation of mutations) {
                handleMutation(mutation);
            }
        };

        const observer = runtime.createMutationObserver(callback);
        tabButtonObserver = observer;
    }

    const observer = tabButtonObserver;
    if (observer) {
        for (const button of safeQueryTabButtons()) {
            try {
                if (typeof observer.observe === "function") {
                    observer.observe(button, {
                        attributeFilter: ["disabled"],
                        attributes: true,
                    });
                }
            } catch {
                /* Ignore errors */
            }
        }
    }
}

function disableButton(button: HTMLElement): void {
    setButtonDisabled(button, true);
    button.classList.add(TAB_DISABLED_CLASS);
    button.setAttribute("disabled", "");
    button.setAttribute("aria-disabled", "true");
    button.style.pointerEvents = "none";
}

function enableButton(button: HTMLElement): void {
    setButtonDisabled(button, false);
    button.classList.remove(TAB_DISABLED_CLASS);
    button.removeAttribute("disabled");
    button.style.pointerEvents = "auto";
    button.style.cursor = "pointer";
    button.style.filter = "none";
    button.style.opacity = "1";
    forceStyleRecalculation(button);
}

function enableButtonWithVerification(
    button: HTMLElement,
    buttonId: string
): void {
    setButtonDisabled(button, false);
    button.classList.remove(TAB_DISABLED_CLASS);
    button.removeAttribute("disabled");
    button.setAttribute("aria-disabled", "false");

    if (button.hasAttribute("disabled")) {
        console.log(
            `[TabButtons] WARNING: disabled attribute still present on ${buttonId}, forcing removal`
        );
        button.removeAttribute("disabled");
        button.removeAttribute("disabled");

        if (button.hasAttribute("disabled")) {
            console.log(
                `[TabButtons] CRITICAL: Using nuclear option for ${buttonId}`
            );
            replaceButtonToRemoveDisabledAttribute(button, buttonId);
        }
    }

    button.style.pointerEvents = "auto";
    button.style.cursor = "pointer";
    button.style.filter = "none";
    button.style.opacity = "1";
    forceStyleRecalculation(button);

    console.log(
        `[TabButtons] Final state for ${buttonId}: disabled=${getButtonDisabled(button)}, hasAttr=${button.hasAttribute("disabled")}`
    );
}

function forceStyleRecalculation(button: HTMLElement): void {
    void button.offsetHeight;
}

function getButtonDisabled(button: HTMLElement): boolean {
    return (button as TabButtonElement).disabled === true;
}

function setButtonDisabled(button: HTMLElement, disabled: boolean): void {
    (button as TabButtonElement).disabled = disabled;
}

function getHTMLElementTabButtons(
    buttons: readonly unknown[] = safeQueryTabButtons()
): HTMLElement[] {
    return buttons.filter(isHTMLElement);
}

function replaceButtonToRemoveDisabledAttribute(
    button: HTMLElement,
    buttonId: string
): void {
    const newButton = button.cloneNode(true);
    if (!isHTMLElement(newButton)) {
        return;
    }

    if (!newButton.id && buttonId) {
        newButton.id = buttonId;
    }
    newButton.removeAttribute("disabled");

    if (button.parentNode) {
        button.replaceWith(newButton);
    }
}

function scheduleFinalStateLog(
    enabled: boolean,
    tabButtons: readonly HTMLElement[]
): void {
    clearFinalStateLogTimers();
    const runtime = getEnableTabButtonsRuntime();
    const handle = runtime.setTimeout(() => {
        finalStateLogTimers.delete(handle);
        console.log(
            `[TabButtons] Final state after ${enabled ? "enable" : "disable"}:`
        );
        for (const button of getHTMLElementTabButtons(tabButtons)) {
            const { id: buttonId, isOpenFile } = getTabButtonIdentity(button);
            if (isOpenFile) {
                continue;
            }
            console.log(
                `[TabButtons] ${buttonId}: disabled=${getButtonDisabled(button)}, hasDisabledAttr=${button.hasAttribute("disabled")}, pointerEvents=${button.style.pointerEvents}`
            );
        }
    }, 50);
    finalStateLogTimers.add(handle);
}

function clearFinalStateLogTimers(): void {
    const runtime = getEnableTabButtonsRuntime();
    for (const handle of finalStateLogTimers) {
        runtime.clearTimeout(handle);
    }
    finalStateLogTimers.clear();
}

function handleMutation(mutation: MutationRecord): void {
    if (
        mutation.type !== "attributes" ||
        mutation.attributeName !== "disabled" ||
        !isHTMLElement(mutation.target)
    ) {
        return;
    }

    const target = mutation.target;
    if (!target.classList.contains("tab-button")) {
        return;
    }

    const hasDisabled = target.hasAttribute("disabled");
    const isEnabled = tabButtonsCurrentlyEnabled === true;

    if (hasDisabled && isEnabled) {
        console.warn(
            `[TabButtons] UNAUTHORIZED: disabled attribute added to ${target.id} when tabs should be enabled!`
        );
        if (typeof console.trace === "function") {
            console.trace("Stack trace for unauthorized disable:");
        }
        target.removeAttribute("disabled");
        setButtonDisabled(target, false);
    }
}
