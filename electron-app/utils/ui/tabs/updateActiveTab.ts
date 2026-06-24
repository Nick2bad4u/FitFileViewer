// Prefer dynamic access to state manager to avoid cross-suite stale imports.
import {
    getRendererCoreStateManager,
    getRendererCoreSubscribeSingleton,
    getRequiredRendererCoreStateManager,
    toRendererStateManagerAccess,
    type RendererStateManagerAccess,
} from "../../state/domain/rendererStateManagerAccess.js";
import { getElementByIdFlexible } from "../dom/elementIdUtils.js";
import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import { extractTabNameFromButtonId } from "./tabIdUtils.js";
import {
    getTabTestDocumentForTests,
    getTabTestStateManagerForTests,
} from "./tabTestEnvironment.js";
import {
    getUpdateActiveTabRuntime,
    type UpdateActiveTabRuntime,
} from "./updateActiveTabRuntime.js";

type TabButtonLike = EventTarget & {
    readonly classList: DOMTokenList;
    readonly disabled?: boolean;
    readonly getAttribute?: (qualifiedName: string) => string | null;
    readonly id?: string;
    readonly focus?: () => void;
    readonly setAttribute?: (qualifiedName: string, value: string) => void;
};

let activeTabUnsubscribe: (() => void) | null = null;

function activeTabRuntime(): UpdateActiveTabRuntime {
    return getUpdateActiveTabRuntime();
}

function getDoc(): Document | undefined {
    return activeTabRuntime().getDocument(getTabTestDocumentForTests());
}

function getStateMgr(): RendererStateManagerAccess {
    try {
        const stateManager = getRendererCoreStateManager();
        if (stateManager) {
            return stateManager;
        }
    } catch {
        /* Ignore errors */
    }

    try {
        const stateManager = toRendererStateManagerAccess(
            getTabTestStateManagerForTests()
        );
        if (stateManager) {
            return stateManager;
        }
    } catch {
        /* Ignore errors */
    }

    return getRequiredRendererCoreStateManager();
}

function getButtonCollection(selector: string): Element[] {
    return [...(getDoc()?.querySelectorAll(selector) ?? [])];
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
    const hasDisabledClass = button.classList?.contains?.("tab-disabled");

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
    return getButtonCollection(".tab-button")
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

function createActiveTabClickHandler(
    button: TabButtonLike
): (event: Event) => void {
    return (event: Event): void => {
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
    if (currentIndex === -1) {
        return;
    }

    let nextIndex: number | null = null;
    switch (event.key) {
        case "ArrowDown":
        case "ArrowRight": {
            nextIndex = (currentIndex + 1) % enabledButtons.length;
            break;
        }
        case "ArrowLeft":
        case "ArrowUp": {
            nextIndex =
                (currentIndex - 1 + enabledButtons.length) %
                enabledButtons.length;
            break;
        }
        case "End": {
            nextIndex = enabledButtons.length - 1;
            break;
        }
        case "Home": {
            nextIndex = 0;
            break;
        }
        // No default
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
            const subscribeSingleton = getRendererCoreSubscribeSingleton();
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
                const onClick = createActiveTabClickHandler(button);

                addEventListenerWithCleanup(button, "click", onClick);
                addEventListenerWithCleanup(button, "keydown", (event) => {
                    if (activeTabRuntime().isKeyboardEvent(event)) {
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
        const currentActive = getDoc()?.querySelector(".tab-button.active");
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

    const runtimeDocument = getDoc();
    if (!runtimeDocument) {
        console.error("[updateActiveTab] No document runtime is available.");
        return false;
    }

    const target = getElementByIdFlexible(runtimeDocument, tabId);
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
