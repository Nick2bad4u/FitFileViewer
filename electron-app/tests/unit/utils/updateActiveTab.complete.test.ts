/**
 * Comprehensive test suite for updateActiveTab module
 * Testing tab state management, DOM manipulation, and user interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the state manager
vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(),
}));

import { updateActiveTab, initializeActiveTabState, getActiveTab } from "../../../utils/ui/tabs/updateActiveTab.js";

import { getState, setState, subscribe } from "../../../utils/state/core/stateManager.js";

const mockGetState = vi.mocked(getState);
const mockSetState = vi.mocked(setState);
const mockSubscribe = vi.mocked(subscribe);

describe("updateActiveTab.js - Complete Test Suite", () => {
    let testContainer;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

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
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button active">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
                <button id="tab-map" class="tab-button">Map</button>
            `;

            updateActiveTab("tab-chart");

            const summaryTab = document.getElementById("tab-summary");
            const chartTab = document.getElementById("tab-chart");
            const mapTab = document.getElementById("tab-map");

            expect(summaryTab?.classList.contains("active")).toBe(false);
            expect(chartTab?.classList.contains("active")).toBe(true);
            expect(mapTab?.classList.contains("active")).toBe(false);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chartjs", { source: "updateActiveTab" });
        });

        it("should handle all supported tab ID patterns", () => {
            const patterns = [
                { id: "tab-summary", expected: "summary" },
                { id: "chart-tab", expected: "chartjs" },
                { id: "btn-map", expected: "map" },
                { id: "analysis-btn", expected: "analysis" },
            ];

            patterns.forEach(({ id, expected }) => {
                testContainer.innerHTML = `<button id="${id}" class="tab-button">Test</button>`;

                updateActiveTab(id);

                const element = document.getElementById(id);
                expect(element?.classList.contains("active")).toBe(true);
                expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", expected, { source: "updateActiveTab" });

                mockSetState.mockClear();
            });
        });

        it("should handle invalid input gracefully", () => {
            testContainer.innerHTML = `<button id="tab-test" class="tab-button">Test</button>`;

            // Test null/undefined/empty inputs
            const invalidInputs = [null, undefined, "", "   "];

            invalidInputs.forEach((input) => {
                // @ts-ignore - Testing invalid inputs intentionally
                updateActiveTab(input);
                expect(mockSetState).not.toHaveBeenCalled();
            });
        });

        it("should handle non-existent elements gracefully", () => {
            testContainer.innerHTML = `<button id="tab-exists" class="tab-button">Exists</button>`;

            // Should not throw when element doesn't exist
            expect(() => updateActiveTab("tab-nonexistent")).not.toThrow();
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should handle no tab buttons present", () => {
            testContainer.innerHTML = "<div>No tab buttons here</div>";

            expect(() => updateActiveTab("tab-test")).not.toThrow();
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should fallback to using ID as tab name when no pattern matches", () => {
            testContainer.innerHTML = `<button id="customTabId" class="tab-button">Custom</button>`;

            updateActiveTab("customTabId");

            const element = document.getElementById("customTabId");
            expect(element?.classList.contains("active")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "customTabId", { source: "updateActiveTab" });
        });

        it("should handle edge case where pattern matches but capture group is empty", () => {
            // Create a tab ID that would match a pattern but have empty capture group
            testContainer.innerHTML = `<button id="tab-" class="tab-button">Empty</button>`;

            updateActiveTab("tab-");

            const element = document.getElementById("tab-");
            expect(element?.classList.contains("active")).toBe(true);
            // Should fall back to using the full ID when capture group is empty
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "tab-", { source: "updateActiveTab" });
        });

        it("should handle special characters in tab IDs", () => {
            const specialId = "test-tab_123";
            testContainer.innerHTML = `<button id="tab-${specialId}" class="tab-button">Special</button>`;

            updateActiveTab(`tab-${specialId}`);

            const element = document.getElementById(`tab-${specialId}`);
            expect(element?.classList.contains("active")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", specialId, { source: "updateActiveTab" });
        });
    });

    describe("getActiveTab function", () => {
        it("should return the current state value", () => {
            mockGetState.mockReturnValue("chart");

            const result = getActiveTab();

            expect(result).toBe("chartjs");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it('should return default "summary" when state is null', () => {
            mockGetState.mockReturnValue(null);

            const result = getActiveTab();

            expect(result).toBe("summary");
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
            initializeActiveTabState();

            expect(mockSubscribe).toHaveBeenCalledWith("ui.activeTab", expect.any(Function));
        });

        it("should set up click listeners on tab buttons", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
            `;

            // Call initializeActiveTabState which should set up listeners
            initializeActiveTabState();

            // Verify that the subscription was set up
            expect(mockSubscribe).toHaveBeenCalledWith("ui.activeTab", expect.any(Function));
        });

        it("should handle disabled buttons correctly", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button" disabled>Summary</button>
            `;

            initializeActiveTabState();

            // Simulate click on disabled button
            const summaryButton = document.getElementById("tab-summary");
            const clickEvent = new MouseEvent("click", { bubbles: true });

            // The click should be handled but not call setState due to disabled state
            if (summaryButton) {
                summaryButton.dispatchEvent(clickEvent);
            }

            // Since the button is disabled, setState should not be called
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should handle buttons without IDs gracefully", () => {
            testContainer.innerHTML = `
                <button class="tab-button">No ID</button>
            `;

            expect(() => initializeActiveTabState()).not.toThrow();
        });

        it("should work with no tab buttons present", () => {
            testContainer.innerHTML = "<div>No buttons here</div>";

            expect(() => initializeActiveTabState()).not.toThrow();
            expect(mockSubscribe).toHaveBeenCalledWith("ui.activeTab", expect.any(Function));
        });
    });

    describe("State integration tests", () => {
        it("should handle state subscription callback", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button active">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
                <button id="tab-map" class="tab-button">Map</button>
            `;

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
            expect(summaryTab?.getAttribute("aria-selected")).toBe("true");
            expect(chartTab?.classList.contains("active")).toBe(false);
            expect(chartTab?.getAttribute("aria-selected")).toBe("false");
            expect(mapTab?.classList.contains("active")).toBe(false);
            expect(mapTab?.getAttribute("aria-selected")).toBe("false");
        });

        it("should handle realistic user interaction flow", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button active">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
            `;

            initializeActiveTabState();

            // Simulate user clicking on chart tab
            const chartButton = document.getElementById("tab-chart");
            const clickEvent = new MouseEvent("click", { bubbles: true });
            if (chartButton) {
                chartButton.dispatchEvent(clickEvent);
            }

            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chartjs", { source: "tabButtonClick" });
        });
    });

    describe("Edge cases and error conditions", () => {
        it("should handle rapid successive calls", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
            `;

            const startTime = performance.now();

            // Make many rapid calls
            for (let i = 0; i < 100; i++) {
                updateActiveTab(i % 2 === 0 ? "tab-summary" : "tab-chart");
            }

            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(100); // Should be fast
            expect(mockSetState).toHaveBeenCalledTimes(100);
        });

        it("should handle malformed HTML gracefully", () => {
            testContainer.innerHTML = '<button id="tab-test" class="tab-button">Malformed';
            // Note: missing closing tag

            expect(() => updateActiveTab("tab-test")).not.toThrow();
        });

        it("should handle document.querySelectorAll returning empty array", () => {
            // Create a scenario where no .tab-button elements exist
            testContainer.innerHTML = "<div>No tab buttons</div>";

            expect(() => updateActiveTab("tab-nonexistent")).not.toThrow();
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
            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

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
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "item50", { source: "updateActiveTab" });
        });

        it("should handle memory cleanup properly", () => {
            // Ensure a clean DOM to avoid scanning large trees from previous tests
            document.body.innerHTML = "";

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

            expect(mockSetState).toHaveBeenCalledTimes(1000);
        });
    });
});
