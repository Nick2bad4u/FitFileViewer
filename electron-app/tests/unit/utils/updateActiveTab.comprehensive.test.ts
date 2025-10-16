/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the state manager module first
vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(),
}));

// Then import the modules
import { updateActiveTab, initializeActiveTabState, getActiveTab } from "../../../utils/ui/tabs/updateActiveTab.js";
import { getState, setState, subscribe } from "../../../utils/state/core/stateManager.js";

// Get the mocked functions
const mockGetState = vi.mocked(getState);
const mockSetState = vi.mocked(setState);
const mockSubscribe = vi.mocked(subscribe);

describe("updateActiveTab.js - Comprehensive Tests", () => {
    let testContainer;

    beforeEach(() => {
        // Clear all mock calls before each test
        vi.clearAllMocks();

        // Set up fresh DOM
        document.body.innerHTML = "";
        testContainer = document.createElement("div");
        testContainer.id = "test-container";
        document.body.appendChild(testContainer);

        // Setup default mock returns
        mockGetState.mockReturnValue("summary");

        // Mock console methods
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        // Clean up DOM
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }

        // Reset all mocks
        vi.resetAllMocks();
    });

    describe("updateActiveTab", () => {
        it("should update tab classes correctly for valid tab IDs", () => {
            // Setup DOM with tab buttons
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button active">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
                <button id="tab-map" class="tab-button">Map</button>
                <button id="tab-data" class="tab-button">Data</button>
                <button id="tab-export" class="tab-button">Export</button>
            `;

            // Test updating to summary tab (pass full element ID)
            updateActiveTab("tab-summary");

            const summaryTab = document.getElementById("tab-summary");
            const chartTab = document.getElementById("tab-chart");
            const mapTab = document.getElementById("tab-map");

            expect(summaryTab?.classList.contains("active")).toBe(true);
            expect(chartTab?.classList.contains("active")).toBe(false);
            expect(mapTab?.classList.contains("active")).toBe(false);

            // Verify state manager was called with extracted tab name
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "summary", { source: "updateActiveTab" });
        });

        it("should handle switching between different tabs", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button active">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
                <button id="tab-data" class="tab-button">Data</button>
                <button id="tab-export" class="tab-button">Export</button>
            `;

            updateActiveTab("tab-chart");
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chartjs", { source: "updateActiveTab" });

            updateActiveTab("tab-summary");
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "summary", { source: "updateActiveTab" });

            updateActiveTab("tab-data");
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "data", { source: "updateActiveTab" });

            updateActiveTab("tab-export");
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "export", { source: "updateActiveTab" });
        });

        it("should remove active class from multiple active tabs", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button active">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
                <button id="tab-map" class="tab-button active">Map</button>
            `;

            // Both summary and map are active initially
            document.getElementById("tab-summary")?.classList.add("active");
            document.getElementById("tab-map")?.classList.add("active");

            updateActiveTab("tab-chart");

            expect(document.getElementById("tab-summary")?.classList.contains("active")).toBe(false);
            expect(document.getElementById("tab-chart")?.classList.contains("active")).toBe(true);
            expect(document.getElementById("tab-map")?.classList.contains("active")).toBe(false);
        });

        it("should handle invalid tab IDs gracefully", () => {
            testContainer.innerHTML = `<button id="tab-summary" class="tab-button">Summary</button>`;

            // Test with null (should warn and return early)
            updateActiveTab(null);
            expect(mockSetState).not.toHaveBeenCalled();

            // Test with undefined (should warn and return early)
            updateActiveTab(undefined);
            expect(mockSetState).not.toHaveBeenCalled();

            // Test with empty string (should warn and return early)
            updateActiveTab("");
            expect(mockSetState).not.toHaveBeenCalled();

            // Test with whitespace only (should warn and return early)
            updateActiveTab("   ");
            expect(mockSetState).not.toHaveBeenCalled();

            // Test with nonexistent ID (should log error but not call setState)
            updateActiveTab("nonexistent");
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should work with no tab buttons in DOM", () => {
            testContainer.innerHTML = "<div>No tabs here</div>";

            updateActiveTab("tab-summary");

            // Should log error and not call setState for nonexistent element
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should handle tab IDs with special characters", () => {
            testContainer.innerHTML = `
                <button id="tab-special-chars_123" class="tab-button">Special</button>
                <button id="tab-with-dashes" class="tab-button">Dashes</button>
                <button id="tab_with_underscores" class="tab-button">Underscores</button>
            `;

            updateActiveTab("tab-special-chars_123");
            expect(document.getElementById("tab-special-chars_123")?.classList.contains("active")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "special-chars_123", {
                source: "updateActiveTab",
            });

            updateActiveTab("tab-with-dashes");
            expect(document.getElementById("tab-with-dashes")?.classList.contains("active")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "with-dashes", { source: "updateActiveTab" });

            updateActiveTab("tab_with_underscores");
            expect(document.getElementById("tab_with_underscores")?.classList.contains("active")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "tab_with_underscores", {
                source: "updateActiveTab",
            });
        });

        it("should handle case sensitivity in tab IDs", () => {
            testContainer.innerHTML = `
                <button id="tab-Summary" class="tab-button">Summary</button>
                <button id="tab-CHART" class="tab-button">Chart</button>
            `;

            updateActiveTab("tab-Summary");
            expect(document.getElementById("tab-Summary")?.classList.contains("active")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "summary", { source: "updateActiveTab" });

            updateActiveTab("tab-CHART");
            expect(document.getElementById("tab-CHART")?.classList.contains("active")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chartjs", { source: "updateActiveTab" });

            // These should not match due to case sensitivity
            updateActiveTab("tab-summary");
            expect(mockSetState).toHaveBeenCalledTimes(2); // Should not increment beyond canonical updates
        });

        it("should handle repeated calls with same tab ID", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button">Summary</button>
                <button id="tab-chart" class="tab-button active">Chart</button>
            `;

            updateActiveTab("tab-summary");
            updateActiveTab("tab-summary");
            updateActiveTab("tab-summary");

            expect(mockSetState).toHaveBeenCalledTimes(3);
            expect(document.getElementById("tab-summary")?.classList.contains("active")).toBe(true);
        });

        it("should handle pattern extraction correctly", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button">Tab Pattern</button>
                <button id="summary-tab" class="tab-button">Reverse Tab Pattern</button>
                <button id="btn-chart" class="tab-button">Btn Pattern</button>
                <button id="map-btn" class="tab-button">Reverse Btn Pattern</button>
                <button id="custom-element" class="tab-button">Fallback Pattern</button>
            `;

            updateActiveTab("tab-summary");
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "summary", { source: "updateActiveTab" });

            updateActiveTab("summary-tab");
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "summary", { source: "updateActiveTab" });

            updateActiveTab("btn-chart");
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chartjs", { source: "updateActiveTab" });

            updateActiveTab("map-btn");
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "map", { source: "updateActiveTab" });

            updateActiveTab("custom-element");
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "custom-element", { source: "updateActiveTab" });
        });

        it("should handle elements without classList gracefully", () => {
            // Create a custom element that doesn't have classList
            const mockElement = {
                id: "tab-summary",
                classList: null,
            };

            // Mock getElementById to return our mock element
            const originalGetElementById = document.getElementById;
            document.getElementById = vi.fn().mockImplementation((id) => {
                if (id === "tab-summary") return mockElement;
                return originalGetElementById.call(document, id);
            });

            // Should not throw error
            expect(() => updateActiveTab("tab-summary")).not.toThrow();

            // Restore original method
            document.getElementById = originalGetElementById;
        });
    });

    describe("initializeActiveTabState", () => {
        it("should set up subscription to ui.activeTab state", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button">Summary</button>
                <button id="tab-chart" class="tab-button active">Chart</button>
                <button id="tab-map" class="tab-button">Map</button>
            `;

            initializeActiveTabState();

            expect(mockSubscribe).toHaveBeenCalledWith("ui.activeTab", expect.any(Function));
        });

        it("should set up click listeners when tab buttons exist", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
            `;

            // Spy on addEventListener
            const buttons = testContainer.querySelectorAll(".tab-button");
            const addEventListenerSpies = Array.from(buttons).map((btn) => vi.spyOn(btn, "addEventListener"));

            initializeActiveTabState();

            // Verify each button got a click listener (with options parameter for cleanup)
            addEventListenerSpies.forEach((spy) => {
                expect(spy).toHaveBeenCalledWith("click", expect.any(Function), expect.anything());
            });
        });

        it("should warn when no tab buttons found", () => {
            testContainer.innerHTML = "<div>No tabs here</div>";
            const consoleWarnSpy = vi.spyOn(console, "warn");

            initializeActiveTabState();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "initializeActiveTabState: No tab buttons found in DOM. Click listeners not set up."
            );
        });

        it("should handle invalid button elements gracefully", () => {
            // Create a mock element that lacks addEventListener method
            const invalidElement = {
                className: "tab-button",
                id: "invalid-button",
            };

            // Mock querySelectorAll to return array with invalid element
            const originalQuerySelectorAll = document.querySelectorAll;
            document.querySelectorAll = vi.fn().mockReturnValue([invalidElement]);

            const consoleWarnSpy = vi.spyOn(console, "warn");

            expect(() => initializeActiveTabState()).not.toThrow();

            // Should warn about invalid button elements
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "initializeActiveTabState: Invalid button element found:",
                invalidElement
            );

            // Restore original method
            document.querySelectorAll = originalQuerySelectorAll;
        });

        it("should handle click events on tab buttons", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
            `;

            initializeActiveTabState();

            // Simulate click on summary tab
            const summaryButton = document.getElementById("tab-summary");
            summaryButton?.click();

            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "summary", { source: "tabButtonClick" });
        });

        it("should ignore clicks on disabled buttons", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button" disabled>Summary</button>
                <button id="tab-chart" class="tab-button tab-disabled">Chart</button>
            `;

            initializeActiveTabState();

            // Simulate clicks on disabled buttons
            const summaryButton = document.getElementById("tab-summary");
            const chartButton = document.getElementById("tab-chart");

            summaryButton?.click();
            chartButton?.click();

            // setState should not be called for disabled buttons
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should log initialization message", () => {
            const consoleLogSpy = vi.spyOn(console, "log");

            initializeActiveTabState();

            expect(consoleLogSpy).toHaveBeenCalledWith("[ActiveTab] State management initialized");
        });
    });

    describe("getActiveTab", () => {
        it("should return current state from state manager", () => {
            mockGetState.mockReturnValue("chart");

            const result = getActiveTab();

            expect(result).toBe("chartjs");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it('should return default "summary" when state is null', () => {
            mockGetState.mockReturnValue(null);

            const result = getActiveTab();

            expect(result).toBe("summary");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it('should return default "summary" when state is undefined', () => {
            mockGetState.mockReturnValue(undefined);

            const result = getActiveTab();

            expect(result).toBe("summary");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it("should handle various state types", () => {
            // Test string
            mockGetState.mockReturnValue("chart");
            expect(getActiveTab()).toBe("chartjs");

            // Test empty string (falsy) - should return default
            mockGetState.mockReturnValue("");
            expect(getActiveTab()).toBe("summary");

            // Test non-empty string
            mockGetState.mockReturnValue("map");
            expect(getActiveTab()).toBe("map");
        });

        it("should handle state manager throwing error", () => {
            mockGetState.mockImplementation(() => {
                throw new Error("State manager error");
            });

            expect(() => getActiveTab()).toThrow("State manager error");
        });

        it("should call state manager exactly once", () => {
            mockGetState.mockReturnValue("data");

            getActiveTab();

            expect(mockGetState).toHaveBeenCalledTimes(1);
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });
    });

    describe("Integration Tests", () => {
        it("should work with realistic tab switching scenario", () => {
            testContainer.innerHTML = `
                <div class="tab-container">
                    <button id="tab-summary" class="tab-button active">Summary</button>
                    <button id="tab-chart" class="tab-button">Chart</button>
                    <button id="tab-map" class="tab-button">Map</button>
                    <button id="tab-data" class="tab-button">Data</button>
                </div>
            `;

            // Initialize listeners
            initializeActiveTabState();
            expect(mockSubscribe).toHaveBeenCalledWith("ui.activeTab", expect.any(Function));

            // Switch to chart
            updateActiveTab("tab-chart");
            expect(document.getElementById("tab-summary")?.classList.contains("active")).toBe(false);
            expect(document.getElementById("tab-chart")?.classList.contains("active")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chartjs", { source: "updateActiveTab" });

            // Switch to map
            updateActiveTab("tab-map");
            expect(document.getElementById("tab-chart")?.classList.contains("active")).toBe(false);
            expect(document.getElementById("tab-map")?.classList.contains("active")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "map", { source: "updateActiveTab" });

            // Get current state
            mockGetState.mockReturnValue("map");
            expect(getActiveTab()).toBe("map");
        });

        it("should handle state manager integration errors gracefully", () => {
            testContainer.innerHTML = `<button id="tab-summary" class="tab-button">Summary</button>`;

            // Mock setState to throw error
            mockSetState.mockImplementation(() => {
                throw new Error("State error");
            });

            expect(() => updateActiveTab("tab-summary")).toThrow("State error");

            // initializeActiveTabState should NOT throw because it doesn't call setState directly
            expect(() => initializeActiveTabState()).not.toThrow();
        });

        it("should handle complex DOM structures", () => {
            testContainer.innerHTML = `
                <div class="app">
                    <nav class="navigation">
                        <div class="tab-group">
                            <button id="tab-summary" class="tab-button">Summary</button>
                            <button id="tab-chart" class="tab-button active">Chart</button>
                        </div>
                        <div class="other-buttons">
                            <button id="not-a-tab">Other</button>
                        </div>
                    </nav>
                    <div class="content">
                        <button id="tab-nested" class="tab-button">Nested</button>
                    </div>
                </div>
            `;

            updateActiveTab("tab-summary");
            expect(document.getElementById("tab-summary")?.classList.contains("active")).toBe(true);
            expect(document.getElementById("tab-chart")?.classList.contains("active")).toBe(false);

            updateActiveTab("tab-nested");
            expect(document.getElementById("tab-nested")?.classList.contains("active")).toBe(true);
        });
    });

    describe("Edge Cases and Error Handling", () => {
        it("should handle null document gracefully", () => {
            // Mock document methods
            const originalQuerySelectorAll = document.querySelectorAll;
            const originalGetElementById = document.getElementById;

            document.querySelectorAll = vi.fn().mockReturnValue([]);
            document.getElementById = vi.fn().mockReturnValue(null);

            // updateActiveTab should not call setState for nonexistent element
            updateActiveTab("tab-summary");
            expect(mockSetState).not.toHaveBeenCalled();

            // initializeActiveTabState should warn about no tab buttons
            const consoleWarnSpy = vi.spyOn(console, "warn");
            initializeActiveTabState();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "initializeActiveTabState: No tab buttons found in DOM. Click listeners not set up."
            );

            // Restore
            document.querySelectorAll = originalQuerySelectorAll;
            document.getElementById = originalGetElementById;
        });

        it("should handle very long tab IDs", () => {
            const longId = "a".repeat(1000);
            testContainer.innerHTML = `<button id="tab-${longId}" class="tab-button">Long</button>`;

            updateActiveTab(`tab-${longId}`);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", longId, { source: "updateActiveTab" });
        });

        it("should handle tab IDs with special regex characters", () => {
            const specialId = "test.with+special*chars?and[brackets]and(parens)and{braces}";
            testContainer.innerHTML = `<button id="tab-${specialId}" class="tab-button">Special</button>`;

            updateActiveTab(`tab-${specialId}`);
            expect(document.getElementById(`tab-${specialId}`)?.classList.contains("active")).toBe(true);
        });

        it("should handle concurrent tab updates", async () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
            `;

            // Simulate concurrent updates
            const promises = [
                Promise.resolve(updateActiveTab("tab-summary")),
                Promise.resolve(updateActiveTab("tab-chart")),
                Promise.resolve(updateActiveTab("tab-summary")),
            ];

            await Promise.all(promises);
            expect(mockSetState).toHaveBeenCalledTimes(3);
        });

        it("should handle memory cleanup scenarios", () => {
            testContainer.innerHTML = `<button id="tab-summary" class="tab-button">Summary</button>`;

            // Create many operations to test memory handling
            for (let i = 0; i < 100; i++) {
                updateActiveTab("tab-summary");
            }

            expect(mockSetState).toHaveBeenCalledTimes(100);
        });
    });

    describe("Performance Tests", () => {
        it("should handle large number of tab elements efficiently", () => {
            // Create many tab elements
            const tabsHtml = Array.from(
                { length: 1000 },
                (_, i) => `<button id="tab-item${i}" class="tab-button">Tab ${i}</button>`
            ).join("");

            testContainer.innerHTML = tabsHtml;

            const startTime = performance.now();
            updateActiveTab("tab-item500");
            const endTime = performance.now();

            // Should complete quickly even with many elements
            // Note: Allow some headroom for slower CI/Windows runners to avoid flaky failures.
            expect(endTime - startTime).toBeLessThan(250); // <= 250ms threshold
            expect(document.getElementById("tab-item500")?.classList.contains("active")).toBe(true);
        });

        it("should handle rapid successive calls efficiently", () => {
            testContainer.innerHTML = `<button id="tab-summary" class="tab-button">Summary</button>`;

            const startTime = performance.now();
            for (let i = 0; i < 1000; i++) {
                updateActiveTab("tab-summary");
            }
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(1000); // 1s threshold
            expect(mockSetState).toHaveBeenCalledTimes(1000);
        });
    });

    describe("Accessibility and Standards Compliance", () => {
        it("should preserve ARIA attributes when updating tabs", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button active"
                        aria-selected="true" role="tab">Summary</button>
                <button id="tab-chart" class="tab-button"
                        aria-selected="false" role="tab">Chart</button>
            `;

            updateActiveTab("tab-chart");

            // Verify ARIA attributes are preserved
            expect(document.getElementById("tab-summary")?.getAttribute("aria-selected")).toBe("true");
            expect(document.getElementById("tab-chart")?.getAttribute("aria-selected")).toBe("false");
            expect(document.getElementById("tab-summary")?.getAttribute("role")).toBe("tab");
            expect(document.getElementById("tab-chart")?.getAttribute("role")).toBe("tab");
        });

        it("should work with various HTML5 button types", () => {
            testContainer.innerHTML = `
                <button type="button" id="tab-summary" class="tab-button">Summary</button>
                <button type="submit" id="tab-chart" class="tab-button">Chart</button>
                <button type="reset" id="tab-map" class="tab-button">Map</button>
            `;

            updateActiveTab("tab-summary");
            expect(document.getElementById("tab-summary")?.classList.contains("active")).toBe(true);

            updateActiveTab("tab-chart");
            expect(document.getElementById("tab-chart")?.classList.contains("active")).toBe(true);

            updateActiveTab("tab-map");
            expect(document.getElementById("tab-map")?.classList.contains("active")).toBe(true);
        });
    });
});
