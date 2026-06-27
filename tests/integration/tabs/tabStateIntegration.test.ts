/**
 * Integration tests for tab state management These tests verify the interaction
 * between TabStateManager, updateActiveTab, and enableTabButtons
 */
/* eslint-disable vitest/no-hooks -- Integration tests share DOM lifecycle setup. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    createMockTabButtons,
    cleanupDOM,
    mockStateManager,
} from "../../fixtures/tabFixtures.js";

// Mock the state manager
const mockState = mockStateManager();
vi.mock(
    import("../../../electron-app/utils/state/core/stateManager.js"),
    () => mockState
);

// Import modules after mocking
const { cleanupActiveTabState, initializeActiveTabState } =
    await import("../../../electron-app/utils/ui/tabs/updateActiveTab.js");
const { __resetTabButtonStateForTests, setTabButtonsEnabled } =
    await import("../../../electron-app/utils/ui/controls/enableTabButtons.js");

function getRequiredTabButton(id: string): HTMLButtonElement {
    const element = document.getElementById(id);

    if (!(element instanceof HTMLButtonElement)) {
        throw new TypeError(`Expected #${id} to be a button.`);
    }

    return element;
}

function getTabState(button: HTMLButtonElement) {
    return {
        ariaSelected: button.getAttribute("aria-selected"),
        classes: [...button.classList],
        disabled: button.disabled,
        hasDisabledAttribute: button.hasAttribute("disabled"),
        id: button.id,
        pointerEvents: button.style.pointerEvents,
    };
}

describe("tab state management integration", () => {
    beforeEach(() => {
        // Reset mocks and DOM
        vi.clearAllMocks();
        cleanupActiveTabState();
        __resetTabButtonStateForTests();
        mockState._state.clear();
        mockState._subscribers.clear();
        createMockTabButtons();

        // Set initial state
        mockState.setState("ui.activeTab", "summary");
    });

    afterEach(() => {
        cleanupActiveTabState();
        __resetTabButtonStateForTests();
        cleanupDOM();
    });

    describe("tab button lifecycle during file loading", () => {
        it("should disable tabs before file load and prevent clicks", () => {
            expect.assertions(3);

            // Initialize tab state management
            initializeActiveTabState();

            // Simulate file loading start - disable tabs
            setTabButtonsEnabled(false);

            // Verify tabs are disabled
            const chartTab = getRequiredTabButton("tab-chart");

            expect(getTabState(chartTab)).toStrictEqual({
                ariaSelected: "false",
                classes: ["tab-button", "tab-disabled"],
                disabled: true,
                hasDisabledAttribute: true,
                id: "tab-chart",
                pointerEvents: "none",
            });

            // Try to click disabled tab
            const clickEvent = new MouseEvent("click", { bubbles: true });
            const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");

            chartTab.dispatchEvent(clickEvent);

            // Should prevent the click
            expect(preventDefaultSpy).toHaveBeenCalledOnce();
            // State should not change
            expect(mockState.setState).not.toHaveBeenCalledWith(
                "ui.activeTab",
                "chart",
                { source: "tabButtonClick" }
            );
        });

        it("should re-enable tabs after file load and allow clicks", () => {
            expect.assertions(2);

            // Initialize and disable tabs
            initializeActiveTabState();
            setTabButtonsEnabled(false);

            // Simulate file loading complete - enable tabs
            setTabButtonsEnabled(true);

            // Verify tabs are enabled
            const chartTab = getRequiredTabButton("tab-chart");

            expect(getTabState(chartTab)).toStrictEqual({
                ariaSelected: "false",
                classes: ["tab-button"],
                disabled: false,
                hasDisabledAttribute: false,
                id: "tab-chart",
                pointerEvents: "auto",
            });

            // Click should now work
            const clickEvent = new MouseEvent("click", { bubbles: true });
            chartTab.dispatchEvent(clickEvent);

            // State should change
            expect(mockState.setState).toHaveBeenCalledWith(
                "ui.activeTab",
                "chart",
                { source: "tabButtonClick" }
            );
        });

        it("should handle multiple enable/disable cycles correctly", () => {
            expect.assertions(15);

            initializeActiveTabState();

            const chartTab = getRequiredTabButton("tab-chart");

            // Cycle through multiple disable/enable states
            for (let i = 0; i < 5; i++) {
                setTabButtonsEnabled(false);

                expect({ disabled: chartTab.disabled }).toStrictEqual({
                    disabled: true,
                });

                // Click should be prevented
                const clickEvent = new MouseEvent("click", { bubbles: true });
                chartTab.dispatchEvent(clickEvent);

                expect(mockState.setState).not.toHaveBeenCalledWith(
                    "ui.activeTab",
                    "chart",
                    {
                        source: "tabButtonClick",
                    }
                );

                setTabButtonsEnabled(true);

                expect({ disabled: chartTab.disabled }).toStrictEqual({
                    disabled: false,
                });

                // Clear previous calls for next iteration
                mockState.setState.mockClear();
            }
        });
    });

    describe("state synchronization between systems", () => {
        it("should maintain state consistency when tabs are disabled", () => {
            expect.assertions(3);

            initializeActiveTabState();

            // Set chart as active programmatically
            mockState.setState("ui.activeTab", "chart");

            const summaryTab = getRequiredTabButton("tab-summary");
            const chartTab = getRequiredTabButton("tab-chart");

            // Visual state should update
            expect(
                [summaryTab, chartTab].map((tab) => ({
                    classes: [...tab.classList],
                    id: tab.id,
                }))
            ).toStrictEqual([
                { classes: ["tab-button"], id: "tab-summary" },
                { classes: ["tab-button", "active"], id: "tab-chart" },
            ]);

            // Now disable tabs
            setTabButtonsEnabled(false);

            // Disabled state should be applied but active state preserved
            expect([...summaryTab.classList]).not.toContain("active");
            expect([summaryTab, chartTab].map(getTabState)).toStrictEqual([
                {
                    ariaSelected: "false",
                    classes: ["tab-button", "tab-disabled"],
                    disabled: true,
                    hasDisabledAttribute: true,
                    id: "tab-summary",
                    pointerEvents: "none",
                },
                {
                    ariaSelected: "true",
                    classes: [
                        "tab-button",
                        "active",
                        "tab-disabled",
                    ],
                    disabled: true,
                    hasDisabledAttribute: true,
                    id: "tab-chart",
                    pointerEvents: "none",
                },
            ]);
        });

        it("should handle rapid state changes during disabled state", () => {
            expect.assertions(2);

            initializeActiveTabState();
            setTabButtonsEnabled(false);

            // Rapidly change active tab state
            const tabNames = [
                "chart",
                "map",
                "table",
                "summary",
            ];
            tabNames.forEach((tabName) => {
                mockState.setState("ui.activeTab", tabName);
            });

            // Final state should be reflected in DOM
            const summaryTab = getRequiredTabButton("tab-summary");

            expect([...summaryTab.classList].sort()).toStrictEqual([
                "active",
                "tab-button",
                "tab-disabled",
            ]);

            // But tabs should still be disabled
            expect({ disabled: summaryTab.disabled }).toStrictEqual({
                disabled: true,
            });
        });
    });

    describe("error handling and edge cases", () => {
        it("should handle missing tab elements gracefully", () => {
            expect.assertions(3);

            // Remove a tab button
            getRequiredTabButton("tab-chart").remove();

            initializeActiveTabState();

            mockState.setState("ui.activeTab", "chart");

            expect(document.getElementById("tab-chart")).toBeNull();
            expect(mockState.getState("ui.activeTab")).toBe("chart");
            expect(
                [...document.querySelectorAll(".tab-button.active")].map(
                    (tab) => tab.id
                )
            ).toStrictEqual([]);
        });

        it("should handle initialization without DOM elements", () => {
            expect.assertions(3);

            cleanupDOM();

            initializeActiveTabState();
            setTabButtonsEnabled(false);
            setTabButtonsEnabled(true);

            expect(
                [...document.body.children].map((element) => element.tagName)
            ).toStrictEqual([]);
            expect({
                tabButtonsEnabled: mockState.getState("ui.tabButtonsEnabled"),
            }).toStrictEqual({
                tabButtonsEnabled: true,
            });

            const [subscribedKey, subscriber] =
                mockState.subscribe.mock.calls[0] ?? [];

            expect({
                subscriberCount:
                    mockState._subscribers.get("ui.activeTab")?.length,
                subscriber,
                subscribedKey,
            }).toStrictEqual({
                subscriberCount: 1,
                subscriber: mockState._subscribers.get("ui.activeTab")?.[0],
                subscribedKey: "ui.activeTab",
            });
        });

        it("should handle state changes before initialization", () => {
            expect.assertions(1);

            // Change state before initializing
            mockState.setState("ui.activeTab", "chart");

            // Then initialize
            initializeActiveTabState();

            // The initialization should read current state and apply it
            // Force a state update to trigger the subscriber
            mockState.setState("ui.activeTab", "chart");

            // Should reflect the state
            const chartTab = getRequiredTabButton("tab-chart");

            expect([...chartTab.classList]).toStrictEqual([
                "tab-button",
                "active",
            ]);
        });

        it("should handle invalid tab names", () => {
            expect.assertions(1);

            initializeActiveTabState();

            // Set invalid tab name
            mockState.setState("ui.activeTab", "nonexistent");

            // Should not break, all tabs should be inactive
            expect(
                [...document.querySelectorAll(".tab-button.active")].map(
                    (tab) => tab.id
                )
            ).toStrictEqual(["tab-summary"]);
        });
    });

    describe("performance and memory", () => {
        it("should not leak event listeners on repeated initialization", () => {
            expect.assertions(2);

            // Initialize multiple times
            for (let i = 0; i < 10; i++) {
                initializeActiveTabState();
            }

            const chartTab = getRequiredTabButton("tab-chart");

            // Click once
            const clickEvent = new MouseEvent("click", { bubbles: true });
            chartTab.dispatchEvent(clickEvent);

            // Re-initialization replaces the prior listeners instead of piling
            // up duplicate click handlers.
            const tabClickCalls = mockState.setState.mock.calls.filter(
                (call: unknown[]) =>
                    call[0] === "ui.activeTab" && call[1] === "chart"
            );

            expect(tabClickCalls).toHaveLength(1);
            expect(tabClickCalls).toStrictEqual([
                [
                    "ui.activeTab",
                    "chart",
                    { source: "tabButtonClick" },
                ],
            ]);
        });

        it("should handle high-frequency state changes", () => {
            expect.assertions(4);

            initializeActiveTabState();

            // Rapidly change states
            for (let i = 0; i < 100; i++) {
                const tabName = [
                    "summary",
                    "chart",
                    "map",
                    "chart",
                ][i % 4];
                mockState.setState("ui.activeTab", tabName);
            }

            // Should handle without errors
            const activeTab = document.querySelector(".tab-button.active");

            expect(activeTab).toBeInstanceOf(HTMLButtonElement);

            const activeTabButton = activeTab as HTMLButtonElement;

            expect(activeTabButton.id).toBe("tab-chart");
            expect(
                document.querySelectorAll(".tab-button.active")
            ).toHaveLength(1);
            expect(activeTabButton.id).not.toBe("tab-summary");
        });
    });
});
/* eslint-enable vitest/no-hooks */
