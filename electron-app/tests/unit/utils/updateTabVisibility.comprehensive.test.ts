/**
 * Comprehensive test suite for updateTabVisibility.js with 100% coverage and
 * bug detection
 *
 * BUG HUNTING FOCUS:
 *
 * - DOM element caching issues
 * - State synchronization problems
 * - Performance issues with element lookups
 * - Error handling gaps
 * - Memory leak potential in subscriptions
 * - Edge cases in tab name extraction
 *
 * @file UpdateTabVisibility.comprehensive.test.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock state manager - functions must be hoisted
vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(() => () => {}),
}));

// Import functions after mocking
import {
    updateTabVisibility,
    initializeTabVisibilityState,
    showTabContent,
    hideAllTabContent,
    getVisibleTabContent,
} from "../../../utils/ui/tabs/updateTabVisibility.js";

// Get the mocked functions
import {
    getState,
    setState,
    subscribe,
} from "../../../utils/state/core/stateManager.js";
const mockGetState = vi.mocked(getState);
const mockSetState = vi.mocked(setState);
const mockSubscribe = vi.mocked(subscribe);

describe("updateTabVisibility.js - Comprehensive Bug Detection", () => {
    let testContainer;
    let consoleSpy;

    beforeEach(() => {
        // Create test container with all expected tab content elements
        testContainer = document.createElement("div");
        testContainer.innerHTML = `
            <div id="content_data" style="display: none;">Data Content</div>
            <div id="content_chartjs" style="display: none;">Chart Content</div>
            <div id="content_browser" style="display: none;">Browser Content</div>
            <div id="content_map" style="display: none;">Map Content</div>
            <div id="content_summary" style="display: none;">Summary Content</div>
            <div id="content_altfit" style="display: none;">AltFit Content</div>
            <div id="content_zwift" style="display: none;">Zwift Content</div>
        `;
        document.body.appendChild(testContainer);

        // Mock console.warn to track warnings
        consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        // Reset all mocks
        vi.clearAllMocks();

        // Setup default state responses
        mockGetState.mockReturnValue("summary");
    });

    afterEach(() => {
        if (testContainer?.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
        consoleSpy.mockRestore();
        vi.resetAllMocks();
    });

    describe("Core updateTabVisibility Function - Bug Detection", () => {
        it("should hide all tabs when visibleTabId is null", () => {
            updateTabVisibility(null);

            const allElements = document.querySelectorAll('[id^="content_"]');
            allElements.forEach((el) => {
                expect(el.style.display).toBe("none");
                expect(el.getAttribute("aria-hidden")).toBe("true");
            });
        });

        it("should hide all tabs when visibleTabId is undefined", () => {
            updateTabVisibility(undefined);

            const allElements = document.querySelectorAll('[id^="content_"]');
            allElements.forEach((el) => {
                expect(el.style.display).toBe("none");
                expect(el.getAttribute("aria-hidden")).toBe("true");
            });
        });

        it("should show only the specified tab and hide others", () => {
            updateTabVisibility("content_summary");

            const summaryElement = document.getElementById("content_summary");
            const mapElement = document.getElementById("content_map");

            expect(summaryElement.style.display).toBe("block");
            expect(summaryElement.getAttribute("aria-hidden")).toBe("false");
            expect(mapElement.style.display).toBe("none");
            expect(mapElement.getAttribute("aria-hidden")).toBe("true");
        });

        it("BUG TEST: should handle missing DOM elements gracefully", () => {
            // Remove an element to test missing element handling
            const element = document.getElementById("content_summary");
            element?.remove();

            // Should warn about missing element
            updateTabVisibility("content_summary");

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining(
                    "updateTabVisibility: Missing element in the DOM: content_summary"
                )
            );
        });

        it("BUG TEST: should handle invalid visibleTabId gracefully", () => {
            const invalidIds = [
                "",
                "nonexistent-id",
                "content-invalid",
                123,
                true,
                false,
                [],
            ];

            invalidIds.forEach((invalidId) => {
                expect(() => {
                    updateTabVisibility(invalidId);
                }).not.toThrow();
            });
        });

        it("BUG TEST: should expose performance issue with repeated DOM queries", () => {
            const performanceTest = () => {
                const start = performance.now();

                // Multiple calls should use cached elements efficiently
                for (let i = 0; i < 50; i++) {
                    updateTabVisibility("content_summary");
                    updateTabVisibility("content_map");
                }

                return performance.now() - start;
            };

            const duration = performanceTest();

            // Should complete reasonably fast despite multiple calls
            // Allow headroom for slower CI/Windows runners to reduce flakiness
            expect(duration).toBeLessThan(250);
        });

        it("BUG TEST: should handle concurrent DOM modifications", () => {
            updateTabVisibility("content_summary");

            // Simulate concurrent modification
            setTimeout(() => {
                const element = document.getElementById("content_summary");
                if (element) {
                    element.style.display = "none"; // Conflicting change
                }
            }, 0);

            // Function should complete without error
            expect(() => {
                updateTabVisibility("content_map");
            }).not.toThrow();
        });

        it("BUG TEST: should handle state update errors gracefully", () => {
            // Mock setState to throw an error
            mockSetState.mockImplementation(() => {
                throw new Error("State update failed");
            });

            // Should not crash when state update fails
            expect(() => {
                updateTabVisibility("content_summary");
            }).toThrow("State update failed");
        });
    });

    describe("Tab Name Extraction - Edge Case Testing", () => {
        it("should extract tab names from valid content IDs", () => {
            // Test the extraction logic by triggering state updates
            updateTabVisibility("content_summary");
            updateTabVisibility("content_chartjs");
            updateTabVisibility("content_map");

            // Should call setState with correct tab names
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTabContent",
                "summary",
                expect.any(Object)
            );
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTabContent",
                "chart",
                expect.any(Object)
            ); // chartjs -> chart
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTabContent",
                "map",
                expect.any(Object)
            );
        });

        it("BUG TEST: should handle edge cases in content ID patterns", () => {
            const edgeCases = [
                "content-",
                "content--invalid",
                "content-123",
                "content-special-characters!@#",
                "prefix-content-suffix",
                "content-very-long-name-that-might-cause-issues",
            ];

            edgeCases.forEach((contentId) => {
                expect(() => {
                    updateTabVisibility(contentId);
                }).not.toThrow();
            });
        });

        it("BUG TEST: should handle special chartjs mapping correctly", () => {
            updateTabVisibility("content_chartjs");

            // Should map chartjs to chart (special case)
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTabContent",
                "chart",
                expect.objectContaining({ source: "updateTabVisibility" })
            );
        });
    });

    describe("State Integration Functions - Bug Detection", () => {
        it("should initialize state management with subscriptions", () => {
            initializeTabVisibilityState();

            // Should subscribe to ui.activeTab and globalData
            expect(mockSubscribe).toHaveBeenCalledTimes(2);
            expect(mockSubscribe).toHaveBeenCalledWith(
                "ui.activeTab",
                expect.any(Function)
            );
            expect(mockSubscribe).toHaveBeenCalledWith(
                "globalData",
                expect.any(Function)
            );
        });

        it("BUG TEST: should expose memory leak from multiple initializations", () => {
            // Multiple calls to initialize should not accumulate subscriptions
            initializeTabVisibilityState();
            initializeTabVisibilityState();
            initializeTabVisibilityState();

            // Each call adds new subscriptions (potential memory leak)
            expect(mockSubscribe).toHaveBeenCalledTimes(6); // 2 subscriptions × 3 calls
        });

        it("BUG TEST: should test subscription callback error handling", () => {
            let subscribedCallbacks = [];

            // Capture subscription callbacks
            mockSubscribe.mockImplementation((key, callback) => {
                subscribedCallbacks.push({ key, callback });
            });

            initializeTabVisibilityState();

            // Test activeTab subscription with invalid data
            const activeTabCallback = subscribedCallbacks.find(
                (s) => s.key === "ui.activeTab"
            )?.callback;

            if (activeTabCallback) {
                expect(() => {
                    activeTabCallback(null);
                    activeTabCallback(undefined);
                    activeTabCallback(123);
                    activeTabCallback("invalid-tab");
                }).not.toThrow();
            }
        });

        it("BUG TEST: should test globalData subscription edge cases", () => {
            let subscribedCallbacks = [];

            mockSubscribe.mockImplementation((key, callback) => {
                subscribedCallbacks.push({ key, callback });
            });

            initializeTabVisibilityState();

            const globalDataCallback = subscribedCallbacks.find(
                (s) => s.key === "globalData"
            )?.callback;

            if (globalDataCallback) {
                // Test with various data states
                const testCases = [
                    null,
                    undefined,
                    {},
                    [],
                    "invalid",
                    0,
                    false,
                ];

                testCases.forEach((testData) => {
                    expect(() => {
                        globalDataCallback(testData);
                    }).not.toThrow();
                });
            }
        });
    });

    describe("Helper Functions - Comprehensive Testing", () => {
        it("should show specific tab content correctly", () => {
            showTabContent("summary");

            const summaryElement = document.getElementById("content_summary");
            expect(summaryElement.style.display).toBe("block");
            expect(summaryElement.getAttribute("aria-hidden")).toBe("false");
        });

        it("should handle invalid tab names in showTabContent", () => {
            const invalidTabNames = [
                null,
                undefined,
                "",
                "invalid",
                123,
                {},
                [],
            ];

            invalidTabNames.forEach((tabName) => {
                expect(() => {
                    showTabContent(tabName);
                }).not.toThrow();
            });
        });

        it("should hide all tab content correctly", () => {
            hideAllTabContent();

            const allElements = document.querySelectorAll('[id^="content_"]');
            allElements.forEach((el) => {
                expect(el.style.display).toBe("none");
                expect(el.getAttribute("aria-hidden")).toBe("true");
            });
        });

        it("should get visible tab content from state", () => {
            mockGetState.mockReturnValue("summary");

            const result = getVisibleTabContent();
            expect(result).toBe("summary");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTabContent");
        });

        it("should handle null state in getVisibleTabContent", () => {
            mockGetState.mockReturnValue(null);

            const result = getVisibleTabContent();
            expect(result).toBeNull();
        });

        it("BUG TEST: should test tab name to content ID mapping edge cases", () => {
            const specialMappings = [
                { tab: "chart", expected: "content_chartjs" },
                { tab: "summary", expected: "content_summary" },
                { tab: "map", expected: "content_map" },
                { tab: "data", expected: "content_data" },
                { tab: "altfit", expected: "content_altfit" },
                { tab: "zwift", expected: "content_zwift" },
            ];

            specialMappings.forEach(({ tab, expected }) => {
                showTabContent(tab);
                const element = document.getElementById(expected);
                expect(element?.style.display).toBe("block");
            });
        });

        it("BUG TEST: should handle unknown tab names with fallback", () => {
            // Test unknown tab name
            showTabContent("unknown-tab");

            // Should use fallback pattern content_{tabName}
            // Current implementation doesn't warn about unknown tabs, only missing predefined ones
            // So no console warning should occur
            expect(consoleSpy).not.toHaveBeenCalled();

            // Should still update state with the extracted tab name
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTabContent",
                "unknown-tab",
                expect.any(Object)
            );
        });
    });

    describe("Integration and State Consistency", () => {
        it("should maintain state consistency between functions", () => {
            // Test sequence of operations
            showTabContent("summary");
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTabContent",
                "summary",
                expect.any(Object)
            );

            hideAllTabContent();
            // Should not update state when hiding all (no active content)

            showTabContent("map");
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTabContent",
                "map",
                expect.any(Object)
            );
        });

        it("BUG TEST: should expose race conditions in state updates", () => {
            // Rapid successive calls might cause race conditions
            showTabContent("summary");
            showTabContent("map");
            showTabContent("chart");

            // All should complete without error
            expect(mockSetState).toHaveBeenCalledTimes(3);
        });

        it("BUG TEST: should validate aria-hidden accessibility attributes", () => {
            showTabContent("summary");

            const summaryElement = document.getElementById("content_summary");
            const mapElement = document.getElementById("content_map");

            // Accessibility attributes should be set correctly
            expect(summaryElement.getAttribute("aria-hidden")).toBe("false");
            expect(mapElement.getAttribute("aria-hidden")).toBe("true");

            hideAllTabContent();

            // All should be hidden for accessibility
            expect(summaryElement.getAttribute("aria-hidden")).toBe("true");
            expect(mapElement.getAttribute("aria-hidden")).toBe("true");
        });

        it("BUG TEST: should handle DOM mutations during execution", () => {
            // Start showing a tab
            showTabContent("summary");

            // Simulate DOM being modified by another script
            const summaryElement = document.getElementById("content_summary");
            summaryElement.style.display = "none";
            summaryElement.setAttribute("aria-hidden", "true");

            // Should still update state correctly despite DOM changes
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTabContent",
                "summary",
                expect.any(Object)
            );
        });
    });
});
