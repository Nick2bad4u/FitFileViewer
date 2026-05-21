import { isHTMLElement } from "../../dom/index.js";
import { getState, setState, subscribe, } from "../../state/core/stateManager.js";
import * as StateManager from "../../state/core/stateManager.js";
import { debugTabButtons as debugTabButtonsImpl, debugTabState as debugTabStateImpl, testTabButtonClicks as testTabButtonClicksImpl, } from "./enableTabButtonsDebug.js";
import { getTabButtonIdentity, safeQueryTabButtons, } from "./enableTabButtonsHelpers.js";
/** Debug function to manually test and fix tab button states. */
export function debugTabButtons() {
    debugTabButtonsImpl();
}
/** Debug function to check current tab states. */
export function debugTabState() {
    debugTabStateImpl();
}
/** Test function to manually check if tab buttons can receive click events. */
export function testTabButtonClicks() {
    testTabButtonClicksImpl();
}
const TAB_DISABLED_CLASS = "tab-disabled";
const finalStateLogTimers = new Set();
// Ensure console.trace exists for tests/environments where it is missing.
if (typeof console !== "undefined" && typeof console.trace !== "function") {
    console.trace = (...args) => {
        if (typeof console.debug === "function") {
            console.debug(...args);
        }
        else if (typeof console.log === "function") {
            console.log(...args);
        }
    };
}
/**
 * Check if tab buttons are currently enabled.
 *
 * @returns True if tab buttons are enabled.
 */
export function areTabButtonsEnabled() {
    return getState("ui.tabButtonsEnabled") === true;
}
/**
 * Force enable all tab buttons.
 */
export function forceEnableTabButtons() {
    console.log("[TabButtons] === FORCE ENABLING TAB BUTTONS ===");
    for (const button of getHTMLElementTabButtons()) {
        const { id: buttonId, isOpenFile } = getTabButtonIdentity(button);
        if (isOpenFile) {
            continue;
        }
        enableButton(button);
        console.log(`[TabButtons] Force enabled: ${buttonId}`);
    }
    setState("ui.tabButtonsEnabled", true, { source: "forceEnableTabButtons" });
}
/**
 * Force fix tab button states by overriding disabled DOM state and styles.
 */
export function forceFixTabButtons() {
    console.log("[TabButtons] === FORCE FIXING TAB BUTTON STATES ===");
    for (const button of getHTMLElementTabButtons()) {
        const { id: buttonId, isOpenFile } = getTabButtonIdentity(button);
        if (isOpenFile) {
            continue;
        }
        console.log(`[TabButtons] BEFORE FIX: ${buttonId} disabled=${getButtonDisabled(button)}`);
        enableButton(button);
        console.log(`[TabButtons] AFTER FIX: ${buttonId} disabled=${getButtonDisabled(button)}`);
    }
    setState("ui.tabButtonsEnabled", true, { source: "forceFixTabButtons" });
    console.log("[TabButtons] Force fix complete - try clicking now!");
}
/**
 * Initialize tab button state management.
 */
export function initializeTabButtonState() {
    console.log("[TabButtons] Initializing proper tab button state management");
    ensureObserverInstalled();
    const globals = getTabButtonsGlobal();
    if (globalThis.window === undefined) {
        setTabButtonsEnabled(false);
    }
    else if (globals.tabButtonsCurrentlyEnabled === undefined) {
        setTabButtonsEnabled(false);
    }
    else {
        setState("ui.tabButtonsEnabled", Boolean(globals.tabButtonsCurrentlyEnabled), {
            source: "initializeTabButtonState",
        });
    }
    const subscribeSingletonFn = getSubscribeSingleton();
    if (typeof subscribeSingletonFn === "function") {
        subscribeSingletonFn("globalData", "ui:tabButtons:globalData", (data) => {
            const hasData = data !== null && data !== undefined;
            console.log(`[TabButtons] globalData changed, hasData: ${hasData}`, data ? "data present" : "no data");
            console.log(`[TabButtons] Updating tabs based on globalData: ${hasData ? "enabling" : "disabling"}`);
            setTabButtonsEnabled(hasData);
        });
    }
    else if (typeof subscribe === "function") {
        subscribe("globalData", (data) => {
            const hasData = data !== null && data !== undefined;
            setTabButtonsEnabled(hasData);
        });
    }
    else {
        console.warn("[TabButtons] subscribe is not available; skipping globalData subscription");
    }
    console.log("[TabButtons] State management initialized - tabs disabled until file loaded");
}
/**
 * Enable or disable all non-open-file tab buttons.
 *
 * @param enabled - True to enable, false to disable.
 */
export function setTabButtonsEnabled(enabled) {
    console.log(`[TabButtons] setTabButtonsEnabled(${enabled}) called`);
    if (globalThis.window !== undefined) {
        getTabButtonsGlobal().tabButtonsCurrentlyEnabled = enabled;
    }
    ensureObserverInstalled();
    setState("ui.tabButtonsEnabled", enabled, {
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
        }
        else {
            disableButton(button);
        }
    }
    scheduleFinalStateLog(enabled, tabButtons);
    console.log(`[TabButtons] Buttons ${enabled ? "enabled" : "disabled"}`);
}
/**
 * Ensure MutationObserver is installed and observing current tab buttons.
 */
function ensureObserverInstalled() {
    if (globalThis.window === undefined) {
        return;
    }
    const globals = getTabButtonsGlobal();
    const observerConstructor = resolveMutationObserverConstructor();
    if (!globals.tabButtonObserver && observerConstructor !== undefined) {
        const callback = (mutations) => {
            for (const mutation of mutations) {
                handleMutation(mutation);
            }
        };
        const observer = new observerConstructor(callback);
        const globalConstructor = getGlobalMutationObserverConstructor();
        const windowConstructor = getWindowMutationObserverConstructor();
        if (globalConstructor &&
            windowConstructor &&
            globalConstructor !== windowConstructor) {
            try {
                // Preserve test coverage hooks that capture the callback through
                // a mocked window.MutationObserver constructor.
                Reflect.construct(windowConstructor, [callback]);
            }
            catch {
                /* Ignore errors */
            }
        }
        globals.tabButtonObserver = observer;
    }
    const observer = globals.tabButtonObserver;
    if (observer) {
        for (const button of safeQueryTabButtons()) {
            try {
                if (button && typeof observer.observe === "function") {
                    observer.observe(button, {
                        attributeFilter: ["disabled"],
                        attributes: true,
                    });
                }
            }
            catch {
                /* Ignore errors */
            }
        }
    }
}
function disableButton(button) {
    setButtonDisabled(button, true);
    button.classList.add(TAB_DISABLED_CLASS);
    button.setAttribute("disabled", "");
    button.setAttribute("aria-disabled", "true");
    button.style.pointerEvents = "none";
}
function enableButton(button) {
    setButtonDisabled(button, false);
    button.classList.remove(TAB_DISABLED_CLASS);
    button.removeAttribute("disabled");
    button.style.pointerEvents = "auto";
    button.style.cursor = "pointer";
    button.style.filter = "none";
    button.style.opacity = "1";
    forceStyleRecalculation(button);
}
function enableButtonWithVerification(button, buttonId) {
    setButtonDisabled(button, false);
    button.classList.remove(TAB_DISABLED_CLASS);
    button.removeAttribute("disabled");
    button.setAttribute("aria-disabled", "false");
    if (button.hasAttribute("disabled")) {
        console.log(`[TabButtons] WARNING: disabled attribute still present on ${buttonId}, forcing removal`);
        button.removeAttribute("disabled");
        button.removeAttribute("disabled");
        if (button.hasAttribute("disabled")) {
            console.log(`[TabButtons] CRITICAL: Using nuclear option for ${buttonId}`);
            replaceButtonToRemoveDisabledAttribute(button, buttonId);
        }
    }
    button.style.pointerEvents = "auto";
    button.style.cursor = "pointer";
    button.style.filter = "none";
    button.style.opacity = "1";
    forceStyleRecalculation(button);
    console.log(`[TabButtons] Final state for ${buttonId}: disabled=${getButtonDisabled(button)}, hasAttr=${button.hasAttribute("disabled")}`);
}
function forceStyleRecalculation(button) {
    void button.offsetHeight;
}
function getButtonDisabled(button) {
    return button.disabled === true;
}
function setButtonDisabled(button, disabled) {
    button.disabled = disabled;
}
function getHTMLElementTabButtons(buttons = safeQueryTabButtons()) {
    return buttons.filter(isHTMLElement);
}
function replaceButtonToRemoveDisabledAttribute(button, buttonId) {
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
function scheduleFinalStateLog(enabled, tabButtons) {
    clearFinalStateLogTimers();
    const handle = setTimeout(() => {
        finalStateLogTimers.delete(handle);
        console.log(`[TabButtons] Final state after ${enabled ? "enable" : "disable"}:`);
        for (const button of getHTMLElementTabButtons(tabButtons)) {
            const { id: buttonId, isOpenFile } = getTabButtonIdentity(button);
            if (isOpenFile) {
                continue;
            }
            console.log(`[TabButtons] ${buttonId}: disabled=${getButtonDisabled(button)}, hasDisabledAttr=${button.hasAttribute("disabled")}, pointerEvents=${button.style.pointerEvents}`);
        }
    }, 50);
    finalStateLogTimers.add(handle);
}
function clearFinalStateLogTimers() {
    for (const handle of finalStateLogTimers) {
        clearTimeout(handle);
    }
    finalStateLogTimers.clear();
}
function getSubscribeSingleton() {
    try {
        const candidate = StateManager;
        return typeof candidate.subscribeSingleton === "function"
            ? candidate.subscribeSingleton
            : undefined;
    }
    catch {
        return undefined;
    }
}
function handleMutation(mutation) {
    if (mutation.type !== "attributes" ||
        mutation.attributeName !== "disabled" ||
        !isHTMLElement(mutation.target)) {
        return;
    }
    const target = mutation.target;
    if (!target.classList.contains("tab-button")) {
        return;
    }
    const hasDisabled = target.hasAttribute("disabled");
    const isEnabled = getTabButtonsGlobal().tabButtonsCurrentlyEnabled === true;
    if (hasDisabled && isEnabled) {
        console.warn(`[TabButtons] UNAUTHORIZED: disabled attribute added to ${target.id} when tabs should be enabled!`);
        if (typeof console.trace === "function") {
            console.trace("Stack trace for unauthorized disable:");
        }
        target.removeAttribute("disabled");
        setButtonDisabled(target, false);
    }
}
function resolveMutationObserverConstructor() {
    const globalConstructor = getGlobalMutationObserverConstructor();
    const windowConstructor = getWindowMutationObserverConstructor();
    if (globalConstructor && windowConstructor) {
        return globalConstructor === windowConstructor
            ? windowConstructor
            : globalConstructor;
    }
    return windowConstructor ?? globalConstructor;
}
function getGlobalMutationObserverConstructor() {
    return typeof MutationObserver !== "undefined" &&
        isMutationObserverConstructorLike(MutationObserver)
        ? MutationObserver
        : undefined;
}
function getWindowMutationObserverConstructor() {
    const candidate = getTabButtonsGlobal().MutationObserver;
    return isMutationObserverConstructorLike(candidate) ? candidate : undefined;
}
function isMutationObserverConstructorLike(candidate) {
    return typeof candidate === "function";
}
function getTabButtonsGlobal() {
    return globalThis;
}
function exposeGlobalFunctions() {
    try {
        if (globalThis.window !== undefined) {
            const globals = getTabButtonsGlobal();
            globals.setTabButtonsEnabled = setTabButtonsEnabled;
            globals.areTabButtonsEnabled = areTabButtonsEnabled;
            globals.debugTabButtons = debugTabButtons;
            globals.forceEnableTabButtons = forceEnableTabButtons;
            globals.testTabButtonClicks = testTabButtonClicks;
            globals.debugTabState = debugTabState;
            globals.forceFixTabButtons = forceFixTabButtons;
            console.log("[TabButtons] Functions exposed globally for compatibility");
        }
    }
    catch {
        // Ignore if window is not available or assignment fails.
    }
}
exposeGlobalFunctions();
