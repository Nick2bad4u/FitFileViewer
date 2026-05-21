// Prefer dynamic access to state manager to avoid cross-suite stale imports.
import * as __StateMgr from "../../state/core/stateManager.js";
import { getElementByIdFlexible } from "../dom/elementIdUtils.js";
import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import { extractTabNameFromButtonId } from "./tabIdUtils.js";
let activeTabUnsubscribe = null;
function canUseDocument(candidate) {
    return (
        candidate !== null &&
        typeof candidate === "object" &&
        "getElementById" in candidate &&
        typeof candidate.getElementById === "function" &&
        "querySelectorAll" in candidate &&
        typeof candidate.querySelectorAll === "function"
    );
}
function getEffectiveGlobals() {
    return globalThis;
}
function getWindowDocument() {
    try {
        return typeof globalThis.window !== "undefined"
            ? globalThis.window.document
            : undefined;
    } catch {
        return undefined;
    }
}
function getGlobalDocument() {
    try {
        return typeof globalThis.document !== "undefined"
            ? globalThis.document
            : undefined;
    } catch {
        return undefined;
    }
}
function getEffectiveDocument() {
    try {
        return getEffectiveGlobals().__vitest_effective_document__;
    } catch {
        return undefined;
    }
}
function getDoc() {
    const candidates = [
        getGlobalDocument(),
        getWindowDocument(),
        getGlobalDocument(),
        getEffectiveDocument(),
    ];
    for (const candidate of candidates) {
        if (canUseDocument(candidate)) {
            return candidate;
        }
    }
    return document;
}
function asStateManagerCandidate(value) {
    return value !== null && typeof value === "object" ? value : {};
}
function getGetState(candidate) {
    const value = candidate.getState;
    return typeof value === "function" ? value : undefined;
}
function getSetState(candidate) {
    const value = candidate.setState;
    return typeof value === "function" ? value : undefined;
}
function getSubscribe(candidate) {
    const value = candidate.subscribe;
    return typeof value === "function" ? value : undefined;
}
function getStateMgr() {
    try {
        const moduleStateManager = asStateManagerCandidate(__StateMgr);
        const getState = getGetState(moduleStateManager);
        const setState = getSetState(moduleStateManager);
        const subscribe = getSubscribe(moduleStateManager);
        if (getState && setState && subscribe) {
            return { getState, setState, subscribe };
        }
    } catch {
        /* Ignore errors */
    }
    try {
        const effectiveStateManager = asStateManagerCandidate(
            getEffectiveGlobals().__vitest_effective_stateManager__
        );
        const fallbackStateManager = asStateManagerCandidate(__StateMgr);
        const getState =
            getGetState(effectiveStateManager) ??
            getGetState(fallbackStateManager);
        const setState =
            getSetState(effectiveStateManager) ??
            getSetState(fallbackStateManager);
        const subscribe =
            getSubscribe(effectiveStateManager) ??
            getSubscribe(fallbackStateManager);
        if (getState && setState && subscribe) {
            return { getState, setState, subscribe };
        }
    } catch {
        /* Ignore errors */
    }
    return {
        getState: __StateMgr.getState,
        setState: __StateMgr.setState,
        subscribe: __StateMgr.subscribe,
    };
}
function getSubscribeSingleton() {
    const candidate = asStateManagerCandidate(__StateMgr);
    const value = candidate.subscribeSingleton;
    return typeof value === "function" ? value : undefined;
}
function getButtonCollection(selector) {
    return getDoc().querySelectorAll(selector);
}
function isButtonLike(candidate) {
    return (
        candidate !== null &&
        typeof candidate === "object" &&
        "classList" in candidate &&
        candidate.classList !== undefined &&
        candidate.classList !== null
    );
}
function getButtonId(button) {
    return typeof button.id === "string" ? button.id.trim() : "";
}
function isDisabledButton(button) {
    const hasDisabledClass =
        button.classList?.contains?.("tab-disabled") === true;
    return (
        button.disabled === true ||
        button.getAttribute?.("aria-disabled") === "true" ||
        hasDisabledClass
    );
}
function removeActiveClass(element) {
    if (isButtonLike(element)) {
        element.classList?.remove?.("active");
    }
}
/**
 * Get the currently active tab.
 *
 * @returns Currently active tab name.
 */
export function getActiveTab() {
    const activeTab = getStateMgr().getState("ui.activeTab");
    return typeof activeTab === "string" && activeTab ? activeTab : "summary";
}
/**
 * Initialize active tab state management by wiring state subscription.
 */
export function initializeActiveTabState() {
    try {
        const onActiveTabChange = (activeTab) => {
            try {
                if (typeof activeTab === "string") {
                    updateTabButtonsFromState(activeTab);
                }
            } catch {
                /* Ignore */
            }
        };
        try {
            if (typeof activeTabUnsubscribe === "function") {
                activeTabUnsubscribe();
            }
        } catch {
            /* Ignore errors */
        }
        activeTabUnsubscribe = null;
        const stateManager = getStateMgr();
        if (typeof stateManager.subscribe === "function") {
            const maybeUnsub = stateManager.subscribe(
                "ui.activeTab",
                onActiveTabChange
            );
            activeTabUnsubscribe =
                typeof maybeUnsub === "function" ? maybeUnsub : null;
        } else {
            const subscribeSingleton = getSubscribeSingleton();
            if (subscribeSingleton) {
                subscribeSingleton(
                    "ui.activeTab",
                    "ui:updateActiveTab:activeTab",
                    onActiveTabChange
                );
            } else {
                console.warn(
                    "[ActiveTab] No state subscription API available; active tab UI will not react to state"
                );
            }
        }
        const tabButtons = getButtonCollection(".tab-button");
        if (!tabButtons || tabButtons.length === 0) {
            console.warn(
                "initializeActiveTabState: No tab buttons found in DOM. Click listeners not set up."
            );
        } else {
            for (const candidate of tabButtons) {
                if (!isButtonLike(candidate)) {
                    console.warn(
                        "initializeActiveTabState: Invalid button element found:",
                        candidate
                    );
                    continue;
                }
                const button = candidate;
                const onClick = (event) => {
                    if (isDisabledButton(button)) {
                        try {
                            console.log(
                                `[ActiveTab] Ignoring click on disabled button: ${button.id ?? ""}`
                            );
                        } catch {
                            /* Ignore errors */
                        }
                        try {
                            event.preventDefault();
                            event.stopPropagation();
                        } catch {
                            /* Ignore errors */
                        }
                        return;
                    }
                    const buttonId = getButtonId(button);
                    if (!buttonId) {
                        return;
                    }
                    const tabName = extractTabNameFromButtonId(buttonId);
                    if (!tabName) {
                        return;
                    }
                    try {
                        getStateMgr().setState("ui.activeTab", tabName, {
                            source: "tabButtonClick",
                        });
                    } catch (error) {
                        try {
                            console.warn(
                                "[ActiveTab] Failed to set state from button click:",
                                error
                            );
                        } catch {
                            /* Ignore errors */
                        }
                    }
                };
                addEventListenerWithCleanup(button, "click", onClick);
            }
        }
        console.log("[ActiveTab] State management initialized");
    } catch {
        // Non-fatal in tests.
    }
}
/**
 * Update active tab efficiently.
 *
 * @param tabId - Tab button element ID.
 *
 * @returns True when the active tab was updated.
 */
export function updateActiveTab(tabId) {
    if (!tabId || typeof tabId !== "string") {
        console.warn("[updateActiveTab] Invalid tabId:", tabId);
        return false;
    }
    try {
        const currentActive = getDoc().querySelector(".tab-button.active");
        if (currentActive && currentActive.id === tabId) {
            const tabNameFast = extractTabNameFromButtonId(tabId);
            getStateMgr().setState("ui.activeTab", tabNameFast, {
                source: "updateActiveTab",
            });
            return true;
        }
    } catch {
        /* Ignore errors */
    }
    const activeNow = getButtonCollection(".tab-button.active");
    if (activeNow && activeNow.length > 0) {
        if (activeNow.length === 1) {
            const [only] = activeNow;
            removeActiveClass(only);
        } else {
            for (const element of activeNow) {
                removeActiveClass(element);
            }
        }
    }
    const target = getElementByIdFlexible(getDoc(), tabId);
    if (isButtonLike(target)) {
        target.classList.add("active");
        const tabName = extractTabNameFromButtonId(tabId);
        getStateMgr().setState("ui.activeTab", tabName, {
            source: "updateActiveTab",
        });
        return true;
    }
    console.error(
        `Element with ID "${tabId}" not found in the DOM or missing classList.`
    );
    return false;
}
/**
 * Update tab button states based on current state.
 *
 * @param activeTab - Currently active tab name.
 */
function updateTabButtonsFromState(activeTab) {
    const tabButtons = getButtonCollection(".tab-button");
    if (!tabButtons || tabButtons.length === 0) {
        console.warn("updateTabButtonsFromState: No tab buttons found in DOM.");
        return;
    }
    for (const candidate of tabButtons) {
        if (!isButtonLike(candidate)) {
            console.warn(
                "updateTabButtonsFromState: Invalid button element found:",
                candidate
            );
            continue;
        }
        const tabName = extractTabNameFromButtonId(candidate.id ?? "");
        const isActive = tabName === activeTab;
        candidate.classList.toggle("active", isActive);
        if (candidate.setAttribute) {
            candidate.setAttribute("aria-selected", isActive.toString());
        }
    }
}
