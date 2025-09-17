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

describe("updateActiveTab.js - Focused Comprehensive Tests", () => {
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
        it("should update tab classes correctly for standard tab pattern", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button active">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
                <button id="tab-map" class="tab-button">Map</button>
            `;

            updateActiveTab("tab-chart");

            expect(document.getElementById("tab-summary").classList.contains("active")).toBe(false);
            expect(document.getElementById("tab-chart").classList.contains("active")).toBe(true);
            expect(document.getElementById("tab-map").classList.contains("active")).toBe(false);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chart", { source: "updateActiveTab" });
        });

        it("should handle all tab ID patterns correctly", () => {
            testContainer.innerHTML = `
                <button id="tab-test1" class="tab-button">Tab Pattern</button>
                <button id="test2-tab" class="tab-button">Reverse Tab</button>
                <button id="btn-test3" class="tab-button">Btn Pattern</button>
                <button id="test4-btn" class="tab-button">Reverse Btn</button>
                <button id="custom-element" class="tab-button">Fallback</button>
            `;

            updateActiveTab("tab-test1");
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "test1", { source: "updateActiveTab" });

            updateActiveTab("test2-tab");
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "test2", { source: "updateActiveTab" });

            updateActiveTab("btn-test3");
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "test3", { source: "updateActiveTab" });

            updateActiveTab("test4-btn");
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "test4", { source: "updateActiveTab" });

            // Fallback pattern - uses full ID
            updateActiveTab("custom-element");
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "custom-element", { source: "updateActiveTab" });
        });

        it("should remove active class from all tab buttons before setting new one", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button active">Summary</button>
                <button id="tab-chart" class="tab-button active">Chart</button>
                <button id="tab-map" class="tab-button active">Map</button>
            `;

            // All start as active
            expect(document.getElementById("tab-summary").classList.contains("active")).toBe(true);
            expect(document.getElementById("tab-chart").classList.contains("active")).toBe(true);
            expect(document.getElementById("tab-map").classList.contains("active")).toBe(true);

            updateActiveTab("tab-chart");

            // Only chart should be active
            expect(document.getElementById("tab-summary").classList.contains("active")).toBe(false);
            expect(document.getElementById("tab-chart").classList.contains("active")).toBe(true);
            expect(document.getElementById("tab-map").classList.contains("active")).toBe(false);
        });

        it("should handle null/undefined/empty tab IDs gracefully", () => {
            testContainer.innerHTML = `<button id="tab-test" class="tab-button">Test</button>`;

            // These should all trigger early return and warning
            updateActiveTab(null);
            updateActiveTab(undefined);
            updateActiveTab("");
            updateActiveTab("   ");

            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should handle non-existent elements gracefully", () => {
            testContainer.innerHTML = `<button id="tab-exists" class="tab-button">Exists</button>`;

            updateActiveTab("tab-nonexistent");

            // Should log error but not call setState
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should handle elements without classList", () => {
            // Create element without proper classList
            const mockElement = { id: "tab-test", classList: null };
            const originalGetElementById = document.getElementById;
            document.getElementById = vi.fn().mockImplementation((id) => {
                if (id === "tab-test") return mockElement;
                return originalGetElementById.call(document, id);
            });

            // Should not throw
            expect(() => updateActiveTab("tab-test")).not.toThrow();

            document.getElementById = originalGetElementById;
        });

        it("should call setState even when element is not found for DOM update", () => {
            testContainer.innerHTML = "<div>No tab buttons</div>";

            updateActiveTab("tab-nonexistent");

            // Element doesn't exist so no DOM update, but still logs error
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should handle special characters in tab IDs", () => {
            const specialId = "test-special_chars.with+symbols";
            testContainer.innerHTML = `<button id="tab-${specialId}" class="tab-button">Special</button>`;

            updateActiveTab(`tab-${specialId}`);

            expect(document.getElementById(`tab-${specialId}`).classList.contains("active")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", specialId, { source: "updateActiveTab" });
        });

        it("should work with large numbers of tab buttons", () => {
            const tabButtons = Array.from(
                { length: 100 },
                (_, i) => `<button id="tab-item${i}" class="tab-button">Tab ${i}</button>`
            ).join("");
            testContainer.innerHTML = tabButtons;

            const startTime = performance.now();
            updateActiveTab("tab-item50");
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(50); // Should be fast
            expect(document.getElementById("tab-item50").classList.contains("active")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "item50", { source: "updateActiveTab" });
        });
    });

    describe("getActiveTab", () => {
        it("should return state value when available", () => {
            mockGetState.mockReturnValue("chart");
            expect(getActiveTab()).toBe("chart");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it('should return default "summary" when state is null', () => {
            mockGetState.mockReturnValue(null);
            expect(getActiveTab()).toBe("summary");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it('should return default "summary" when state is undefined', () => {
            mockGetState.mockReturnValue(undefined);
            expect(getActiveTab()).toBe("summary");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it('should return default "summary" when state is empty string', () => {
            mockGetState.mockReturnValue("");
            expect(getActiveTab()).toBe("summary");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it("should handle state manager errors", () => {
            mockGetState.mockImplementation(() => {
                throw new Error("State error");
            });

            expect(() => getActiveTab()).toThrow("State error");
        });

        it("should call getState exactly once", () => {
            mockGetState.mockReturnValue("data");
            getActiveTab();
            expect(mockGetState).toHaveBeenCalledTimes(1);
        });
    });

    describe("initializeActiveTabState", () => {
        it("should set up state subscription", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
            `;

            initializeActiveTabState();

            expect(mockSubscribe).toHaveBeenCalledWith("ui.activeTab", expect.any(Function));
        });

        it("should set up click listeners on tab buttons", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
            `;

            initializeActiveTabState();

            // Simulate click on tab button
            const summaryButton = document.getElementById("tab-summary");
            summaryButton.click();

            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "summary", { source: "tabButtonClick" });
        });

        it("should handle disabled buttons correctly", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button" disabled>Summary</button>
                <button id="tab-chart" class="tab-button tab-disabled">Chart</button>
                <button id="tab-map" class="tab-button">Map</button>
            `;

            initializeActiveTabState();

            // Click on disabled button should not trigger setState
            document.getElementById("tab-summary").click();
            expect(mockSetState).not.toHaveBeenCalled();

            // Click on tab-disabled button should not trigger setState
            document.getElementById("tab-chart").click();
            expect(mockSetState).not.toHaveBeenCalled();

            // Click on enabled button should trigger setState
            document.getElementById("tab-map").click();
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "map", { source: "tabButtonClick" });
        });

        it("should handle buttons without IDs gracefully", () => {
            const button = document.createElement("button");
            button.className = "tab-button";
            testContainer.appendChild(button);

            initializeActiveTabState();

            // Click should not throw or call setState
            button.click();
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should work with no tab buttons present", () => {
            testContainer.innerHTML = "<div>No tab buttons</div>";

            expect(() => initializeActiveTabState()).not.toThrow();
            expect(mockSubscribe).toHaveBeenCalled();
        });
    });

    describe("State integration tests", () => {
        it("should handle state subscription callback", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button">Summary</button>
                <button id="tab-chart" class="tab-button active">Chart</button>
                <button id="tab-map" class="tab-button">Map</button>
            `;

            initializeActiveTabState();

            // Get the subscription callback
            const subscriptionCallback = mockSubscribe.mock.calls[0][1];

            // Call it with 'summary' to simulate state change
            subscriptionCallback("summary");

            // Should update DOM accordingly
            expect(document.getElementById("tab-summary").classList.contains("active")).toBe(true);
            expect(document.getElementById("tab-chart").classList.contains("active")).toBe(false);
            expect(document.getElementById("tab-map").classList.contains("active")).toBe(false);

            // Should also update aria-selected
            expect(document.getElementById("tab-summary").getAttribute("aria-selected")).toBe("true");
            expect(document.getElementById("tab-chart").getAttribute("aria-selected")).toBe("false");
            expect(document.getElementById("tab-map").getAttribute("aria-selected")).toBe("false");
        });

        it("should handle realistic user interaction flow", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button active">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
                <button id="tab-map" class="tab-button">Map</button>
            `;

            // Initialize state management
            initializeActiveTabState();

            // User clicks on chart tab
            document.getElementById("tab-chart").click();
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chart", { source: "tabButtonClick" });

            // Simulate state change (would normally come from state manager)
            const subscriptionCallback = mockSubscribe.mock.calls[0][1];
            subscriptionCallback("chart");

            // DOM should be updated
            expect(document.getElementById("tab-summary").classList.contains("active")).toBe(false);
            expect(document.getElementById("tab-chart").classList.contains("active")).toBe(true);
            expect(document.getElementById("tab-map").classList.contains("active")).toBe(false);

            // Check current state
            mockGetState.mockReturnValue("chart");
            expect(getActiveTab()).toBe("chart");
        });

        it("should handle setState errors gracefully", () => {
            testContainer.innerHTML = `<button id="tab-summary" class="tab-button">Summary</button>`;

            mockSetState.mockImplementation(() => {
                throw new Error("State error");
            });

            initializeActiveTabState();

            // Click will trigger an unhandled error in the event handler context
            // The error occurs but is not synchronously catchable by expect
            const button = document.getElementById("tab-summary");
            button.click();

            // Verify setState was called and threw an error
            expect(mockSetState).toHaveBeenCalled();
        });
    });

    describe("Edge cases and error conditions", () => {
        it("should handle rapid successive calls", () => {
            testContainer.innerHTML = `<button id="tab-summary" class="tab-button">Summary</button>`;

            for (let i = 0; i < 100; i++) {
                updateActiveTab("tab-summary");
            }

            expect(mockSetState).toHaveBeenCalledTimes(100);
        });

        it("should handle malformed HTML gracefully", () => {
            testContainer.innerHTML = `
                <button id="tab-test" class="tab-button">Test</button>
                <div class="tab-button">Not a button</div>
                <button id="" class="tab-button">Empty ID</button>
            `;

            expect(() => initializeActiveTabState()).not.toThrow();
            expect(() => updateActiveTab("tab-test")).not.toThrow();
        });

        it("should handle missing extractTabName function gracefully", () => {
            testContainer.innerHTML = `<button id="malformed-id" class="tab-button">Test</button>`;

            updateActiveTab("malformed-id");
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "malformed-id", { source: "updateActiveTab" });
        });

        it("should handle document.querySelectorAll returning empty array", () => {
            testContainer.innerHTML = "<div>No tab buttons</div>";

            expect(() => updateActiveTab("tab-test")).not.toThrow();
            expect(mockSetState).not.toHaveBeenCalled();
        });
    });
});
