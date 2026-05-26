/**
 * Integration test that simulates the real app's initialization sequence to
 * identify where the disabled attribute bug occurs
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the state manager
const mockStateManager = {
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn((key, cb) => {
        return () => {
            /* noop */
        };
    }),
};

// Mock the global state
let globalState = {
    "ui.activeTab": "summary",
    "ui.tabButtonsEnabled": false,
    globalData: null,
};

const TAB_FIXTURES = [
    { active: true, id: "tab-summary", label: "Summary", tabIndex: "0" },
    { active: false, id: "tab-chart", label: "Chart", tabIndex: "-1" },
    { active: false, id: "tab-map", label: "Map", tabIndex: "-1" },
    { active: false, id: "tab-table", label: "Data", tabIndex: "-1" },
] as const;

function createRealAppTabsDom(): void {
    const container = document.createElement("div");
    container.className = "tabs-container";

    for (const tab of TAB_FIXTURES) {
        const button = document.createElement("button");
        button.className = tab.active ? "tab-button active" : "tab-button";
        button.id = tab.id;
        button.role = "tab";
        button.setAttribute("aria-selected", String(tab.active));
        button.tabIndex = Number(tab.tabIndex);
        button.textContent = tab.label;
        container.appendChild(button);
    }

    document.body.replaceChildren(container);
}

async function flushMutationObservers(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

// Mock implementation
mockStateManager.getState.mockImplementation((key) => globalState[key]);
mockStateManager.setState.mockImplementation((key, value) => {
    globalState[key] = value;
    // Trigger subscribers
    const callbacks = mockStateManager.subscribe.mock.calls
        .filter((call) => call[0] === key)
        .map((call) => call[1]);
    callbacks.forEach((callback) => callback(value));
});

// Mock the imports before importing the modules
vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: mockStateManager.getState,
    setState: mockStateManager.setState,
    subscribe: mockStateManager.subscribe,
}));

vi.mock("../../../utils/dom/index.js", () => ({
    isHTMLElement: (el) => el instanceof HTMLElement,
}));

describe("Real App Integration: Tab Button Bug", () => {
    beforeEach(() => {
        // Reset state
        globalState = {
            "ui.activeTab": "summary",
            "ui.tabButtonsEnabled": false,
            globalData: null,
        };

        // Clear mocks
        vi.clearAllMocks();

        // Create real DOM like the actual app
        createRealAppTabsDom();
    });

    afterEach(() => {
        document.body.replaceChildren();
        vi.clearAllMocks();
    });

    it("should simulate the exact real app initialization sequence", async () => {
        // Dynamic import after mocks are set up
        const { setTabButtonsEnabled, initializeTabButtonState } =
            await import("../../utils/ui/controls/enableTabButtons.js");
        const { initializeActiveTabState } =
            await import("../../utils/ui/tabs/updateActiveTab.js");

        console.log("Starting real app simulation...");

        // Step 1: Initialize tab button state (like masterStateManager.js does)
        console.log("Step 1: Initialize tab button state");
        initializeTabButtonState(); // This sets tabs to disabled initially

        // Step 2: Initialize active tab state (like masterStateManager.js does)
        console.log("Step 2: Initialize active tab state");
        initializeActiveTabState(); // This adds click handlers

        // Verify initial state - tabs should be disabled
        const buttons = document.querySelectorAll(".tab-button");
        buttons.forEach((button) => {
            const btn = /** @type {HTMLButtonElement} */ button;
            expect(btn.disabled).toBe(true);
            expect(btn.hasAttribute("disabled")).toBe(true);
            console.log(
                `Initial: ${btn.id} - disabled=${btn.disabled}, hasAttr=${btn.hasAttribute("disabled")}`
            );
        });

        // Step 3: Simulate file loading (like showFitData.js does)
        console.log("Step 3: Simulate file loading");

        // First set globalData (triggers subscription in initializeTabButtonState)
        globalState.globalData = { records: [{ type: "activity" }] };
        mockStateManager.setState("globalData", globalState.globalData);

        await flushMutationObservers();

        // Also call setTabButtonsEnabled directly (like showFitData.js does)
        if (typeof window !== "undefined") {
            window.setTabButtonsEnabled = setTabButtonsEnabled;
        }
        setTabButtonsEnabled(true);

        await flushMutationObservers();

        // Step 4: Check final state - this is where the bug occurs
        console.log("Step 4: Check final state");
        buttons.forEach((button) => {
            const btn = /** @type {HTMLButtonElement} */ button;
            console.log(
                `Final: ${btn.id} - disabled=${btn.disabled}, hasAttr=${btn.hasAttribute("disabled")}, style=${btn.style.pointerEvents}`
            );

            // These should all be false, but in the real app, hasAttribute('disabled') remains true
            expect(btn.disabled).toBe(false);
            expect(btn.hasAttribute("disabled")).toBe(false); // This is the failing assertion in real app
            expect(btn.hasAttribute("disabled")).not.toBe(true);
            expect(btn.style.pointerEvents).toBe("auto");
        });
    }, 15000);

    it("should detect conflicts between multiple enable/disable calls", async () => {
        // Dynamic import after mocks are set up
        const { setTabButtonsEnabled, initializeTabButtonState } =
            await import("../../utils/ui/controls/enableTabButtons.js");
        const { initializeActiveTabState } =
            await import("../../utils/ui/tabs/updateActiveTab.js");

        // Set up mutation observer to track all changes
        const changes: {
            newValue: null | string;
            oldValue: null | string;
            source: string;
            target: string;
            timestamp: number;
        }[] = [];
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                    mutation.type === "attributes" &&
                    mutation.attributeName === "disabled"
                ) {
                    const target = /** @type {HTMLElement} */ mutation.target;
                    changes.push({
                        target: target.id,
                        oldValue: mutation.oldValue,
                        newValue: target.getAttribute("disabled"),
                        timestamp: Date.now(),
                        source: "unknown",
                    });
                }
            });
        });

        const buttons = document.querySelectorAll(".tab-button");
        buttons.forEach((button) => {
            observer.observe(button, {
                attributes: true,
                attributeOldValue: true,
                attributeFilter: ["disabled"],
            });
        });

        // Simulate rapid initialization
        initializeTabButtonState(); // Disables tabs
        initializeActiveTabState(); // Adds click handlers

        await flushMutationObservers();

        // Simulate file loading
        globalState.globalData = { records: [] };
        mockStateManager.setState("globalData", globalState.globalData);
        setTabButtonsEnabled(true);

        await flushMutationObservers();

        // Check if something is re-adding disabled attributes
        setTabButtonsEnabled(true); // Call again (like showFitData.js might)

        await flushMutationObservers();

        observer.disconnect();

        console.log("Attribute changes detected:", changes);

        // Look for patterns that might indicate the bug
        const unexpectedDisables = changes.filter(
            (change) => change.newValue === "" && change.oldValue === null
        );

        const buttonStates = [...buttons].map((button) => ({
            disabled: (button as HTMLButtonElement).disabled,
            hasDisabledAttribute: button.hasAttribute("disabled"),
            id: button.id,
        }));

        // Assert that no unexpected disables occurred
        expect(unexpectedDisables).toStrictEqual([]);
        expect(buttonStates).toStrictEqual([
            {
                disabled: false,
                hasDisabledAttribute: false,
                id: "tab-summary",
            },
            {
                disabled: false,
                hasDisabledAttribute: false,
                id: "tab-chart",
            },
            {
                disabled: false,
                hasDisabledAttribute: false,
                id: "tab-map",
            },
            {
                disabled: false,
                hasDisabledAttribute: false,
                id: "tab-table",
            },
        ]);
    }, 15000);

    it("should test timing-sensitive scenarios", async () => {
        // Dynamic import after mocks are set up
        const { setTabButtonsEnabled, initializeTabButtonState } =
            await import("../../utils/ui/controls/enableTabButtons.js");
        const { initializeActiveTabState } =
            await import("../../utils/ui/tabs/updateActiveTab.js");

        // Initialize systems
        initializeTabButtonState();
        initializeActiveTabState();

        // Rapidly toggle state (like might happen during initialization)
        setTabButtonsEnabled(false);
        await flushMutationObservers();

        setTabButtonsEnabled(true);
        await flushMutationObservers();

        setTabButtonsEnabled(false);
        await flushMutationObservers();

        setTabButtonsEnabled(true);
        await flushMutationObservers();

        // Final check
        const buttons = document.querySelectorAll(".tab-button");
        buttons.forEach((button) => {
            const btn = /** @type {HTMLButtonElement} */ button;
            expect(btn.disabled).toBe(false);
            expect(btn.hasAttribute("disabled")).toBe(false);
        });
    }, 15000);
});
