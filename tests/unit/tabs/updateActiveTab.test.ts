/**
 * Tests for tab button disabled state functionality These tests verify that
 * disabled tab buttons do not respond to clicks
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    createDisabledTabButtons,
    cleanupDOM,
    mockStateManager,
} from "../../fixtures/tabFixtures.js";

// Mock the state manager before importing tab modules
const mockState = mockStateManager();
vi.mock(
    import("../../../electron-app/utils/state/core/stateManager.js"),
    () => mockState
);

// Import tab modules after mocking
const { updateActiveTab, initializeActiveTabState } =
    await import("../../../electron-app/utils/ui/tabs/updateActiveTab.js");

function getRequiredElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (element === null) {
        throw new Error(`Expected #${id} to exist in the test DOM.`);
    }
    return element;
}

function getRequiredButton(id: string): HTMLButtonElement {
    const element = getRequiredElement(id);
    if (!(element instanceof HTMLButtonElement)) {
        throw new TypeError(`Expected #${id} to be a button.`);
    }
    return element;
}

function enableTabButton(button: HTMLElement): void {
    if (button instanceof HTMLButtonElement) {
        button.disabled = false;
    }
    button.removeAttribute("disabled");
    button.removeAttribute("aria-disabled");
    button.classList.remove("tab-disabled");
}

function expectTabActiveClass(tab: Element, isActive: boolean): void {
    const classNames = Array.from(tab.classList);
    if (isActive) {
        expect(classNames).toContain("active");
    } else {
        expect(classNames).not.toContain("active");
    }
}

function expectActiveTabButton(activeId: string): void {
    for (const tab of document.querySelectorAll(".tab-button")) {
        const isActive = tab.id === activeId;
        expectTabActiveClass(tab, isActive);
        expect(tab.getAttribute("aria-selected")).toBe(isActive.toString());
    }
}

function expectActiveTabButtonClass(activeId: string): void {
    for (const tab of document.querySelectorAll(".tab-button")) {
        expectTabActiveClass(tab, tab.id === activeId);
    }
}

describe("tab button disabled state", () => {
    let container: HTMLElement;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        mockState._state.clear();
        mockState._subscribers.clear();

        // Set up DOM
        container = createDisabledTabButtons();

        // Set initial state
        mockState.setState("ui.activeTab", "summary");
    });

    afterEach(() => {
        cleanupDOM();
    });

    describe("updateActiveTab function", () => {
        it("should update active tab when called programmatically", () => {
            expect.assertions(6);

            updateActiveTab("tab-chart");

            expectActiveTabButtonClass("tab-chart");
            expect(mockState.getState("ui.activeTab")).toBe("chart");
            expect(mockState.setState).toHaveBeenCalledWith(
                "ui.activeTab",
                "chart",
                { source: "updateActiveTab" }
            );
        });

        it("should handle invalid tab IDs gracefully", () => {
            expect.assertions(11);

            const consoleSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            const blankResult = updateActiveTab("");
            const nullResult = updateActiveTab(null as unknown as string);
            const undefinedResult = updateActiveTab(
                undefined as unknown as string
            );

            expect([
                blankResult,
                nullResult,
                undefinedResult,
            ]).toStrictEqual([
                false,
                false,
                false,
            ]);
            expectActiveTabButton("tab-summary");
            expect(mockState.getState("ui.activeTab")).toBe("summary");
            expect(consoleSpy).toHaveBeenCalledTimes(3);
            consoleSpy.mockRestore();
        });
    });

    describe("tab button click handling", () => {
        beforeEach(() => {
            // Initialize the tab state management
            initializeActiveTabState();
        });

        it("should prevent clicks on buttons with disabled property", () => {
            expect.assertions(12);

            const chartTab = getRequiredButton("tab-chart");
            enableTabButton(chartTab);
            chartTab.disabled = true;

            const clickEvent = new MouseEvent("click", { bubbles: true });
            const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");
            const stopPropagationSpy = vi.spyOn(clickEvent, "stopPropagation");

            chartTab.dispatchEvent(clickEvent);

            expectActiveTabButton("tab-summary");
            expect(mockState.getState("ui.activeTab")).toBe("summary");
            expect(mockState.setState).not.toHaveBeenCalledWith(
                "ui.activeTab",
                "chart",
                {
                    source: "tabButtonClick",
                }
            );
            expect(preventDefaultSpy).toHaveBeenCalledOnce();
            expect(stopPropagationSpy).toHaveBeenCalledOnce();
        });

        it("should prevent clicks on buttons with disabled attribute", () => {
            expect.assertions(11);

            const mapTab = getRequiredButton("tab-map");
            enableTabButton(mapTab);
            mapTab.setAttribute("disabled", "true");

            const clickEvent = new MouseEvent("click", { bubbles: true });
            const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");

            mapTab.dispatchEvent(clickEvent);

            expectActiveTabButton("tab-summary");
            expect(mockState.getState("ui.activeTab")).toBe("summary");
            expect(mockState.setState).not.toHaveBeenCalledWith(
                "ui.activeTab",
                "map",
                {
                    source: "tabButtonClick",
                }
            );
            expect(preventDefaultSpy).toHaveBeenCalledOnce();
        });

        it("should prevent clicks on buttons with tab-disabled class", () => {
            expect.assertions(11);

            const tableTab = getRequiredButton("tab-table");
            enableTabButton(tableTab);
            tableTab.classList.add("tab-disabled");

            const clickEvent = new MouseEvent("click", { bubbles: true });
            const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");

            tableTab.dispatchEvent(clickEvent);

            expectActiveTabButton("tab-summary");
            expect(mockState.getState("ui.activeTab")).toBe("summary");
            expect(mockState.setState).not.toHaveBeenCalledWith(
                "ui.activeTab",
                "table",
                {
                    source: "tabButtonClick",
                }
            );
            expect(preventDefaultSpy).toHaveBeenCalledOnce();
        });

        it("should allow clicks on enabled buttons", () => {
            expect.assertions(10);

            const summaryTab = getRequiredButton("tab-summary");
            enableTabButton(summaryTab);

            const clickEvent = new MouseEvent("click", { bubbles: true });
            summaryTab.dispatchEvent(clickEvent);

            expectActiveTabButton("tab-summary");
            expect(mockState.getState("ui.activeTab")).toBe("summary");
            expect(mockState.setState).toHaveBeenCalledWith(
                "ui.activeTab",
                "summary",
                {
                    source: "tabButtonClick",
                }
            );
        });

        it("should log disabled button clicks for debugging", () => {
            expect.assertions(10);

            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            const chartTab = getRequiredButton("tab-chart");
            enableTabButton(chartTab);
            chartTab.disabled = true;

            const clickEvent = new MouseEvent("click", { bubbles: true });
            chartTab.dispatchEvent(clickEvent);

            expectActiveTabButton("tab-summary");
            expect(mockState.getState("ui.activeTab")).toBe("summary");
            expect(consoleSpy).toHaveBeenCalledWith(
                "[ActiveTab] Ignoring click on disabled button: tab-chart"
            );
            consoleSpy.mockRestore();
        });
    });

    describe("tab state synchronization", () => {
        beforeEach(() => {
            initializeActiveTabState();
        });

        it("should update DOM when state changes", () => {
            expect.assertions(9);

            // Change state programmatically
            mockState.setState("ui.activeTab", "chart");

            expect(mockState.getState("ui.activeTab")).toBe("chart");
            expectActiveTabButton("tab-chart");
        });

        it("should handle state changes to non-existent tabs gracefully", () => {
            expect.assertions(10);

            mockState.setState("ui.activeTab", "nonexistent");

            expect(mockState.getState("ui.activeTab")).toBe("nonexistent");
            expect(document.querySelector(".tab-button.active")).toBe(
                getRequiredElement("tab-summary")
            );
            const tabs = document.querySelectorAll(".tab-button");
            tabs.forEach((tab) => {
                const isSummary = tab.id === "tab-summary";
                expectTabActiveClass(tab, isSummary);
                expect(tab.getAttribute("aria-selected")).toBe(
                    isSummary.toString()
                );
            });
        });
    });

    describe("tab name extraction", () => {
        beforeEach(() => {
            // Initialize the tab state management for this test group
            initializeActiveTabState();
        });

        it("should extract tab names from various ID patterns", () => {
            expect.assertions(16);

            // This tests the internal extractTabName function indirectly
            const testCases = [
                ["tab-summary", "summary"],
                ["tab-chart", "chart"],
                ["btn-map", "map"],
                ["data-btn", "data"],
            ];

            testCases.forEach(([buttonId, expectedName]) => {
                // Clear previous calls
                mockState.setState.mockClear();

                // Create a button with the test ID
                const button = document.createElement("button");
                button.id = buttonId;
                button.className = "tab-button";
                button.setAttribute("aria-selected", "false");
                container.appendChild(button);

                // Re-initialize to pick up the new button
                initializeActiveTabState();

                const clickEvent = new MouseEvent("click", { bubbles: true });
                button.dispatchEvent(clickEvent);

                // Check that setState was called with correct tab name (don't check source parameter)
                expect(mockState.setState).toHaveBeenCalledWith(
                    "ui.activeTab",
                    expectedName,
                    { source: "tabButtonClick" }
                );
                expect(mockState.getState("ui.activeTab")).toBe(expectedName);
                expectTabActiveClass(button, true);
                expect(button.getAttribute("aria-selected")).toBe("true");
            });
        });

        it("should ignore buttons without extractable tab names", () => {
            expect.assertions(12);

            const button = document.createElement("button");
            button.className = "tab-button";
            button.setAttribute("aria-selected", "false");
            container.appendChild(button);

            initializeActiveTabState();

            button.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expectActiveTabButton("tab-summary");
            expect(mockState.getState("ui.activeTab")).toBe("summary");
            expect(mockState.setState).not.toHaveBeenCalledWith(
                "ui.activeTab",
                "",
                { source: "tabButtonClick" }
            );
        });
    });
});
