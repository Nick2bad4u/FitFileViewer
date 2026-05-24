/**
 * Comprehensive test suite for updateActiveTab module Testing tab state
 * management, DOM manipulation, and user interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the state manager
vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(() => () => {}),
}));

import {
    updateActiveTab,
    initializeActiveTabState,
    getActiveTab,
} from "../../../utils/ui/tabs/updateActiveTab.js";

import {
    getState,
    setState,
    subscribe,
} from "../../../utils/state/core/stateManager.js";

const mockGetState = vi.mocked(getState);
const mockSetState = vi.mocked(setState);
const mockSubscribe = vi.mocked(subscribe);

describe("updateActiveTab.js - Complete Test Suite", () => {
    let testContainer: HTMLDivElement;

    function createTabButton({
        active = false,
        disabled = false,
        id,
        label = id,
    }: {
        active?: boolean;
        disabled?: boolean;
        id: string;
        label?: string;
    }): HTMLButtonElement {
        const button = document.createElement("button");
        button.className = active ? "tab-button active" : "tab-button";
        button.disabled = disabled;
        button.id = id;
        button.textContent = label;

        return button;
    }

    function appendTabButton(
        options: Parameters<typeof createTabButton>[0],
        parent: HTMLElement = testContainer
    ): HTMLButtonElement {
        const button = createTabButton(options);
        parent.appendChild(button);

        return button;
    }

    function appendTabs(
        tabs: Parameters<typeof createTabButton>[0][],
        parent: HTMLElement = testContainer
    ): HTMLButtonElement[] {
        return tabs.map((tab) => appendTabButton(tab, parent));
    }

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();
        mockSubscribe.mockImplementation(() => () => {});

        // Mock console methods to prevent errors
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});

        // Set up DOM
        testContainer = document.createElement("div");
        testContainer.id = "test-container";
        document.body.appendChild(testContainer);

        // Default state mock return
        mockGetState.mockReturnValue("summary");
    });

    afterEach(() => {
        // Clean up DOM
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
        vi.resetAllMocks();
    });

    describe("updateActiveTab function", () => {
        it("should activate the correct tab and deactivate others", () => {
            appendTabs([
                { active: true, id: "tab-summary", label: "Summary" },
                { id: "tab-chart", label: "Chart" },
                { id: "tab-map", label: "Map" },
            ]);

            const result = updateActiveTab("tab-chart");

            const summaryTab = document.getElementById("tab-summary");
            const chartTab = document.getElementById("tab-chart");
            const mapTab = document.getElementById("tab-map");

            expect(result).toBe(true);
            expect(summaryTab?.classList.contains("active")).toBe(false);
            expect(chartTab?.classList.contains("active")).toBe(true);
            expect(mapTab?.classList.contains("active")).toBe(false);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chart", {
                source: "updateActiveTab",
            });
        });

        it("should handle all supported tab ID patterns", () => {
            const patterns = [
                { id: "tab-summary", expected: "summary" },
                { id: "chart-tab", expected: "chart" },
                { id: "btn-map", expected: "map" },
                { id: "analysis-btn", expected: "analysis" },
            ];

            patterns.forEach(({ id, expected }) => {
                testContainer.replaceChildren();
                appendTabButton({ id, label: "Test" });

                const result = updateActiveTab(id);

                const element = document.getElementById(id);
                expect(result).toBe(true);
                expect(element?.classList.contains("active")).toBe(true);
                expect(mockSetState).toHaveBeenCalledWith(
                    "ui.activeTab",
                    expected,
                    { source: "updateActiveTab" }
                );

                mockSetState.mockClear();
            });
        });

        it("should handle invalid input gracefully", () => {
            const existingButton = appendTabButton({
                active: true,
                id: "tab-test",
                label: "Test",
            });

            // Test null/undefined/empty inputs
            const invalidInputs: {
                input: null | string | undefined;
                keepsActive: boolean;
            }[] = [
                { input: null, keepsActive: true },
                { input: undefined, keepsActive: true },
                { input: "", keepsActive: true },
                { input: "   ", keepsActive: false },
            ];

            invalidInputs.forEach(({ input, keepsActive }) => {
                // @ts-ignore - Testing invalid inputs intentionally
                const result = updateActiveTab(input);
                expect(result).toBe(false);
                expect(existingButton.classList.contains("active")).toBe(
                    keepsActive
                );
                expect(mockSetState).not.toHaveBeenCalled();
            });
        });

        it("should handle non-existent elements gracefully", () => {
            const existingButton = appendTabButton({
                id: "tab-exists",
                label: "Exists",
            });

            // Should not throw when element doesn't exist
            expect(updateActiveTab("tab-nonexistent")).toBe(false);
            expect(existingButton.classList.contains("active")).toBe(false);
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should handle no tab buttons present", () => {
            const message = document.createElement("div");
            message.textContent = "No tab buttons here";
            testContainer.appendChild(message);

            expect(updateActiveTab("tab-test")).toBe(false);
            expect(testContainer.querySelectorAll(".tab-button")).toHaveLength(
                0
            );
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should fallback to using ID as tab name when no pattern matches", () => {
            appendTabButton({ id: "customTabId", label: "Custom" });

            const result = updateActiveTab("customTabId");

            const element = document.getElementById("customTabId");
            expect(result).toBe(true);
            expect(element?.classList.contains("active")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "customTabId",
                { source: "updateActiveTab" }
            );
        });

        it("should handle edge case where pattern matches but capture group is empty", () => {
            // Create a tab ID that would match a pattern but have empty capture group
            appendTabButton({ id: "tab-", label: "Empty" });

            const result = updateActiveTab("tab-");

            const element = document.getElementById("tab-");
            expect(result).toBe(true);
            expect(element?.classList.contains("active")).toBe(true);
            // Should fall back to using the full ID when capture group is empty
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "tab-", {
                source: "updateActiveTab",
            });
        });

        it("should handle special characters in tab IDs", () => {
            const specialId = "test-tab_123";
            appendTabButton({ id: `tab-${specialId}`, label: "Special" });

            const result = updateActiveTab(`tab-${specialId}`);

            const element = document.getElementById(`tab-${specialId}`);
            expect(result).toBe(true);
            expect(element?.classList.contains("active")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                specialId,
                { source: "updateActiveTab" }
            );
        });
    });

    describe("getActiveTab function", () => {
        it("should return the current state value", () => {
            mockGetState.mockReturnValue("chart");

            const result = getActiveTab();

            expect(result).toBe("chart");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it('should return default "summary" when state is null', () => {
            mockGetState.mockReturnValue(null);

            const result = getActiveTab();

            expect(result).toBe("summary");
            expect(result).not.toBe("chart");
        });

        it('should return default "summary" when state is undefined', () => {
            mockGetState.mockReturnValue(undefined);

            const result = getActiveTab();

            expect(result).toBe("summary");
        });

        it('should return default "summary" when state is empty string', () => {
            mockGetState.mockReturnValue("");

            const result = getActiveTab();

            expect(result).toBe("summary");
        });
    });

    describe("initializeActiveTabState function", () => {
        it("should set up state subscription", () => {
            const chartButton = appendTabButton({
                id: "tab-chart",
                label: "Chart",
            });

            initializeActiveTabState();

            const subscriptionCallback = mockSubscribe.mock.calls?.[0]?.[1];
            if (subscriptionCallback) {
                subscriptionCallback("chart");
            }

            expect(chartButton.classList.contains("active")).toBe(true);
            expect(chartButton.getAttribute("aria-selected")).toBe("true");
            expect(mockSubscribe).toHaveBeenCalledWith(
                "ui.activeTab",
                expect.any(Function)
            );
            expect(console.log).toHaveBeenCalledWith(
                "[ActiveTab] State management initialized"
            );
        });

        it("should set up click listeners on tab buttons", () => {
            const [, chartButton] = appendTabs([
                { id: "tab-summary", label: "Summary" },
                { id: "tab-chart", label: "Chart" },
            ]);

            // Call initializeActiveTabState which should set up listeners
            initializeActiveTabState();

            chartButton.dispatchEvent(
                new MouseEvent("click", { bubbles: true })
            );

            expect(chartButton.classList.contains("active")).toBe(false);
            expect(mockSubscribe).toHaveBeenCalledWith(
                "ui.activeTab",
                expect.any(Function)
            );
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chart", {
                source: "tabButtonClick",
            });
        });

        it("should handle disabled buttons correctly", () => {
            const summaryButton = appendTabButton({
                disabled: true,
                id: "tab-summary",
                label: "Summary",
            });

            initializeActiveTabState();

            // Simulate click on disabled button
            const clickEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
            });

            // The click should be handled but not call setState due to disabled state
            summaryButton.dispatchEvent(clickEvent);

            // Since the button is disabled, setState should not be called
            expect(clickEvent.defaultPrevented).toBe(true);
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should handle buttons without IDs gracefully", () => {
            const button = document.createElement("button");
            button.className = "tab-button";
            button.textContent = "No ID";
            testContainer.appendChild(button);

            expect(() => initializeActiveTabState()).not.toThrow();
            button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should work with no tab buttons present", () => {
            const message = document.createElement("div");
            message.textContent = "No buttons here";
            testContainer.appendChild(message);

            expect(() => initializeActiveTabState()).not.toThrow();
            expect(testContainer.querySelector(".tab-button")).toBeNull();
            expect(mockSubscribe).toHaveBeenCalledWith(
                "ui.activeTab",
                expect.any(Function)
            );
        });
    });

    describe("State integration tests", () => {
        it("should handle state subscription callback", () => {
            appendTabs([
                { active: true, id: "tab-summary", label: "Summary" },
                { id: "tab-chart", label: "Chart" },
                { id: "tab-map", label: "Map" },
            ]);

            initializeActiveTabState();

            // Get the subscription callback
            const subscriptionCallback = mockSubscribe.mock.calls?.[0]?.[1];

            if (subscriptionCallback) {
                // Call the callback as if state changed
                subscriptionCallback("summary");
            }

            // Should update DOM accordingly
            const summaryTab = document.getElementById("tab-summary");
            const chartTab = document.getElementById("tab-chart");
            const mapTab = document.getElementById("tab-map");

            expect(summaryTab?.classList.contains("active")).toBe(true);
            expect(summaryTab?.classList.contains("active")).not.toBe(false);
            expect(summaryTab?.getAttribute("aria-selected")).toBe("true");
            expect(chartTab?.classList.contains("active")).toBe(false);
            expect(chartTab?.getAttribute("aria-selected")).toBe("false");
            expect(mapTab?.classList.contains("active")).toBe(false);
            expect(mapTab?.getAttribute("aria-selected")).toBe("false");
        });

        it("should handle realistic user interaction flow", () => {
            const [summaryButton, chartButton] = appendTabs([
                { active: true, id: "tab-summary", label: "Summary" },
                { id: "tab-chart", label: "Chart" },
            ]);

            initializeActiveTabState();

            // Simulate user clicking on chart tab
            const clickEvent = new MouseEvent("click", { bubbles: true });
            chartButton.dispatchEvent(clickEvent);

            expect(summaryButton.classList.contains("active")).toBe(true);
            expect(chartButton.classList.contains("active")).toBe(false);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chart", {
                source: "tabButtonClick",
            });
        });
    });

    describe("Edge cases and error conditions", () => {
        it("should handle rapid successive calls", () => {
            const [summaryButton, chartButton] = appendTabs([
                { id: "tab-summary", label: "Summary" },
                { id: "tab-chart", label: "Chart" },
            ]);

            const startTime = performance.now();

            // Make many rapid calls
            for (let i = 0; i < 100; i++) {
                updateActiveTab(i % 2 === 0 ? "tab-summary" : "tab-chart");
            }

            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(100); // Should be fast
            expect(summaryButton.classList.contains("active")).toBe(false);
            expect(chartButton.classList.contains("active")).toBe(true);
            expect(mockSetState).toHaveBeenCalledTimes(100);
        });

        it("should handle tab text that looks like malformed HTML safely", () => {
            const button = appendTabButton({
                id: "tab-test",
                label: '<button id="tab-test" class="tab-button">Malformed',
            });

            expect(updateActiveTab("tab-test")).toBe(true);
            expect(button.classList.contains("active")).toBe(true);
            expect(button.textContent).toBe(
                '<button id="tab-test" class="tab-button">Malformed'
            );
        });

        it("should handle document.querySelectorAll returning empty array", () => {
            // Create a scenario where no .tab-button elements exist
            const message = document.createElement("div");
            message.textContent = "No tab buttons";
            testContainer.appendChild(message);

            expect(updateActiveTab("tab-nonexistent")).toBe(false);
            expect(testContainer.querySelector(".tab-button")).toBeNull();
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should handle elements without classList property", () => {
            // Create a tab button so querySelectorAll finds it
            const tabButton = document.createElement("button");
            tabButton.className = "tab-button";
            tabButton.id = "tab-existing";
            document.body.appendChild(tabButton);

            // Create a mock element without classList
            const mockElement = {
                id: "tab-test",
                classList: null,
            };

            // Mock getElementById to return the mock element
            const originalGetElementById = document.getElementById;
            document.getElementById = vi.fn().mockReturnValue(mockElement);

            // Spy on console.error to verify graceful error handling
            const consoleErrorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            // Should handle gracefully (not throw)
            expect(() => updateActiveTab("tab-test")).not.toThrow();

            // Should log an error about missing classList
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Element with ID "tab-test" not found in the DOM or missing classList.'
            );

            // Should not update state when element is invalid
            expect(mockSetState).not.toHaveBeenCalled();

            // Cleanup
            document.body.removeChild(tabButton);
            consoleErrorSpy.mockRestore();
            document.getElementById = originalGetElementById;
        });
    });

    describe("Performance and reliability tests", () => {
        it("should maintain consistent performance with many tab buttons", () => {
            // Create many tab buttons with proper .tab-button class
            for (let i = 0; i < 100; i++) {
                const button = document.createElement("button");
                button.id = `tab-item${i}`;
                button.className = "tab-button";
                button.textContent = `Item ${i}`;
                document.body.appendChild(button);
            }

            const startTime = performance.now();
            updateActiveTab("tab-item50");
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(25); // Should be very fast (allow slight variance in CI)

            const activeElement = document.getElementById("tab-item50");
            expect(activeElement?.classList.contains("active")).toBe(true);
            expect(activeElement?.classList.contains("active")).not.toBe(false);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "item50",
                { source: "updateActiveTab" }
            );
        });

        it("should handle memory cleanup properly", () => {
            // Ensure a clean DOM to avoid scanning large trees from previous tests
            testContainer.replaceChildren();

            // This test ensures no memory leaks with repeated operations
            for (let i = 0; i < 1000; i++) {
                // Create proper tab button elements with .tab-button class
                const button = document.createElement("button");
                button.id = `tab-test${i}`;
                button.className = "tab-button";
                button.textContent = "Test";
                document.body.appendChild(button);

                updateActiveTab(`tab-test${i}`);

                // Remove the element to keep DOM size stable and avoid performance degradation
                document.body.removeChild(button);
            }

            expect(testContainer.querySelector(".tab-button")).toBeNull();
            expect(mockSetState).toHaveBeenCalledTimes(1000);
        });
    });
});
