// Prefer dynamic access to state manager to avoid cross-suite stale imports.
import * as __StateMgr from "../../state/core/stateManager.js";
import { getElementByIdFlexible } from "../dom/elementIdUtils.js";
import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import { extractTabNameFromButtonId } from "./tabIdUtils.js";

type StateUpdateOptions = {
    readonly source: string;
};

type StateManagerAccess = {
    getState: (path?: string) => unknown;
    setState: (
        path: string,
        value: unknown,
        options?: StateUpdateOptions
    ) => void;
    subscribe: (
        path: string,
        callback: (newValue: unknown, oldValue?: unknown, path?: string) => void
    ) => unknown;
};

type StateManagerCandidate = Partial<StateManagerAccess> & {
    subscribeSingleton?: (
        path: string,
        key: string,
        callback: (newValue: unknown, oldValue?: unknown, path?: string) => void
    ) => void;
};

type TabButtonLike = EventTarget & {
    readonly classList: DOMTokenList;
    readonly disabled?: boolean;
    readonly getAttribute?: (qualifiedName: string) => string | null;
    readonly id?: string;
    readonly focus?: () => void;
    readonly setAttribute?: (qualifiedName: string, value: string) => void;
};

type EffectiveGlobals = typeof globalThis & {
    __vitest_effective_document__?: Document;
    __vitest_effective_stateManager__?: unknown;
};

let activeTabUnsubscribe: (() => void) | null = null;

function canUseDocument(candidate: unknown): candidate is Document {
    return (
        candidate !== null &&
        typeof candidate === "object" &&
        "getElementById" in candidate &&
        typeof candidate.getElementById === "function" &&
        "querySelectorAll" in candidate &&
        typeof candidate.querySelectorAll === "function"
    );
}

function getEffectiveGlobals(): EffectiveGlobals {
    return globalThis as EffectiveGlobals;
}

function getWindowDocument(): Document | undefined {
    try {
        return typeof globalThis.window !== "undefined"
            ? globalThis.window.document
            : undefined;
    } catch {
        return undefined;
    }
}

function getGlobalDocument(): Document | undefined {
    try {
        return typeof globalThis.document !== "undefined"
            ? globalThis.document
            : undefined;
    } catch {
        return undefined;
    }
}

function getEffectiveDocument(): Document | undefined {
    try {
        return getEffectiveGlobals().__vitest_effective_document__;
    } catch {
        return undefined;
    }
}

function getDoc(): Document {
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

function asStateManagerCandidate(value: unknown): StateManagerCandidate {
    return value !== null && typeof value === "object"
        ? (value as StateManagerCandidate)
        : {};
}

function getGetState(
    candidate: StateManagerCandidate
): StateManagerAccess["getState"] | undefined {
    const value = candidate.getState;

    return typeof value === "function" ? value : undefined;
}

function getSetState(
    candidate: StateManagerCandidate
): StateManagerAccess["setState"] | undefined {
    const value = candidate.setState;

    return typeof value === "function" ? value : undefined;
}

function getSubscribe(
    candidate: StateManagerCandidate
): StateManagerAccess["subscribe"] | undefined {
    const value = candidate.subscribe;

    return typeof value === "function" ? value : undefined;
}

function getStateMgr(): StateManagerAccess {
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

function getSubscribeSingleton():
    | StateManagerCandidate["subscribeSingleton"]
    | undefined {
    const candidate = asStateManagerCandidate(__StateMgr);
    const value = candidate.subscribeSingleton;

    return typeof value === "function" ? value : undefined;
}

function getButtonCollection(selector: string): NodeListOf<Element> {
    return getDoc().querySelectorAll(selector);
}

function isButtonLike(candidate: unknown): candidate is TabButtonLike {
    return (
        candidate !== null &&
        typeof candidate === "object" &&
        "classList" in candidate &&
        candidate.classList !== undefined &&
        candidate.classList !== null
    );
}

function getButtonId(button: TabButtonLike): string {
    return typeof button.id === "string" ? button.id.trim() : "";
}

function isDisabledButton(button: TabButtonLike): boolean {
    const hasDisabledClass =
        button.classList?.contains?.("tab-disabled") === true;

    return (
        button.disabled === true ||
        button.getAttribute?.("aria-disabled") === "true" ||
        hasDisabledClass
    );
}

function removeActiveClass(element: unknown): void {
    if (isButtonLike(element)) {
        element.classList?.remove?.("active");
    }
}

function getEnabledTabButtons(): TabButtonLike[] {
    return [...getButtonCollection(".tab-button")]
        .filter(isButtonLike)
        .filter((button) => !isDisabledButton(button));
}

function focusTabButton(button: TabButtonLike): void {
    try {
        button.focus?.();
    } catch {
        /* Ignore focus failures in test DOMs. */
    }
}

function setActiveTabFromButton(button: TabButtonLike, source: string): void {
    const buttonId = getButtonId(button);
    if (!buttonId) {
        return;
    }

    const tabName = extractTabNameFromButtonId(buttonId);
    if (!tabName) {
        return;
    }

    getStateMgr().setState("ui.activeTab", tabName, { source });
}

function handleTabKeyboardNavigation(
    event: KeyboardEvent,
    button: TabButtonLike
): void {
    if (isDisabledButton(button)) {
        return;
    }

    const enabledButtons = getEnabledTabButtons();
    if (enabledButtons.length === 0) {
        return;
    }

    const currentIndex = enabledButtons.indexOf(button);
    if (currentIndex < 0) {
        return;
    }

    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % enabledButtons.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        nextIndex =
            (currentIndex - 1 + enabledButtons.length) % enabledButtons.length;
    } else if (event.key === "Home") {
        nextIndex = 0;
    } else if (event.key === "End") {
        nextIndex = enabledButtons.length - 1;
    }

    if (nextIndex === null) {
        return;
    }

    event.preventDefault();
    const nextButton = enabledButtons[nextIndex];
    if (!nextButton) {
        return;
    }
    focusTabButton(nextButton);
    setActiveTabFromButton(nextButton, "tabKeyboardNavigation");
}

/**
 * Get the currently active tab.
 *
 * @returns Currently active tab name.
 */
export function getActiveTab(): string {
    const activeTab = getStateMgr().getState("ui.activeTab");

    return typeof activeTab === "string" && activeTab ? activeTab : "summary";
}

/**
 * Initialize active tab state management by wiring state subscription.
 */
export function initializeActiveTabState(): void {
    try {
        const onActiveTabChange = (activeTab: unknown) => {
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
                typeof maybeUnsub === "function"
                    ? (maybeUnsub as () => void)
                    : null;
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
                const onClick = (event: Event) => {
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

                    try {
                        setActiveTabFromButton(button, "tabButtonClick");
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
                addEventListenerWithCleanup(button, "keydown", (event) => {
                    if (event instanceof KeyboardEvent) {
                        handleTabKeyboardNavigation(event, button);
                    }
                });
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
export function updateActiveTab(tabId: unknown): boolean {
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
function updateTabButtonsFromState(activeTab: string): void {
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
            candidate.setAttribute("tabindex", isActive ? "0" : "-1");
        }
    }
}
