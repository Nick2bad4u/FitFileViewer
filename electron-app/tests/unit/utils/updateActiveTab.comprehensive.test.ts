/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the state manager module first
vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(() => () => {}),
}));

// Then import the modules
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

// Get the mocked functions
const mockGetState = vi.mocked(getState);
const mockSetState = vi.mocked(setState);
const mockSubscribe = vi.mocked(subscribe);
let testContainer: HTMLDivElement;

type TestButtonOptions = {
    readonly ariaDisabled?: string;
    readonly ariaSelected?: string;
    readonly className?: string;
    readonly disabled?: boolean;
    readonly id?: string;
    readonly role?: string;
    readonly text?: string;
    readonly type?: "button" | "reset" | "submit";
};

function createTestButton({
    ariaDisabled,
    ariaSelected,
    className = "tab-button",
    disabled = false,
    id = "",
    role,
    text = "",
    type,
}: TestButtonOptions): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = className;
    button.disabled = disabled;
    button.id = id;
    button.textContent = text;

    if (ariaDisabled !== undefined) {
        button.setAttribute("aria-disabled", ariaDisabled);
    }
    if (ariaSelected !== undefined) {
        button.setAttribute("aria-selected", ariaSelected);
    }
    if (role !== undefined) {
        button.setAttribute("role", role);
    }
    if (type !== undefined) {
        button.type = type;
    }

    return button;
}

function createTestDiv({
    className = "",
    id = "",
    text = "",
}: {
    readonly className?: string;
    readonly id?: string;
    readonly text?: string;
} = {}): HTMLDivElement {
    const div = document.createElement("div");
    div.className = className;
    div.id = id;
    div.textContent = text;
    return div;
}

function appendTestContent(...children: Node[]): void {
    testContainer.replaceChildren(...children);
}

function appendTabButtons(buttons: readonly TestButtonOptions[]): void {
    appendTestContent(...buttons.map((button) => createTestButton(button)));
}

describe("updateActiveTab.js - Comprehensive Tests", () => {
    beforeEach(() => {
        // Clear all mock calls before each test
        vi.clearAllMocks();

        // Set up fresh DOM
        document.body.replaceChildren();
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
            appendTabButtons([
                {
                    id: "tab-summary",
                    className: "tab-button active",
                    text: "Summary",
                },
                { id: "tab-chart", text: "Chart" },
                { id: "tab-map", text: "Map" },
                { id: "tab-data", text: "Data" },
                { id: "tab-export", text: "Export" },
            ]);

            // Test updating to summary tab (pass full element ID)
            const updateResult = updateActiveTab("tab-summary");

            const summaryTab = document.getElementById("tab-summary");
            const chartTab = document.getElementById("tab-chart");
            const mapTab = document.getElementById("tab-map");

            expect(updateResult).toBe(true);
            expect(summaryTab?.classList.contains("active")).toBe(true);
            expect(chartTab?.classList.contains("active")).toBe(false);
            expect(mapTab?.classList.contains("active")).toBe(false);

            // Verify state manager was called with extracted tab name
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "summary",
                { source: "updateActiveTab" }
            );
        });

        it("should handle switching between different tabs", () => {
            appendTabButtons([
                {
                    id: "tab-summary",
                    className: "tab-button active",
                    text: "Summary",
                },
                { id: "tab-chart", text: "Chart" },
                { id: "tab-data", text: "Data" },
                { id: "tab-export", text: "Export" },
            ]);

            expect(updateActiveTab("tab-chart")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chart", {
                source: "updateActiveTab",
            });

            expect(updateActiveTab("tab-summary")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "summary",
                { source: "updateActiveTab" }
            );

            expect(updateActiveTab("tab-data")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "data", {
                source: "updateActiveTab",
            });

            expect(updateActiveTab("tab-export")).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "export",
                { source: "updateActiveTab" }
            );
            expect(document.getElementById("tab-export")?.className).toBe(
                "tab-button active"
            );
        });

        it("should remove active class from multiple active tabs", () => {
            appendTabButtons([
                {
                    id: "tab-summary",
                    className: "tab-button active",
                    text: "Summary",
                },
                { id: "tab-chart", text: "Chart" },
                { id: "tab-map", className: "tab-button active", text: "Map" },
            ]);

            // Both summary and map are active initially
            document.getElementById("tab-summary")?.classList.add("active");
            document.getElementById("tab-map")?.classList.add("active");

            expect(updateActiveTab("tab-chart")).toBe(true);

            expect(
                document
                    .getElementById("tab-summary")
                    ?.classList.contains("active")
            ).toBe(false);
            expect(
                document
                    .getElementById("tab-chart")
                    ?.classList.contains("active")
            ).toBe(true);
            expect(
                document.getElementById("tab-map")?.classList.contains("active")
            ).toBe(false);
        });

        it("should handle invalid tab IDs gracefully", () => {
            appendTabButtons([{ id: "tab-summary", text: "Summary" }]);

            const results = [
                updateActiveTab(null),
                updateActiveTab(undefined),
                updateActiveTab(""),
                updateActiveTab("   "),
                updateActiveTab("nonexistent"),
            ];

            expect(results).toEqual([
                false,
                false,
                false,
                false,
                false,
            ]);
            expect(
                document
                    .getElementById("tab-summary")
                    ?.classList.contains("active")
            ).toBe(false);
            expect(console.warn).toHaveBeenCalledWith(
                "[updateActiveTab] Invalid tabId:",
                null
            );
            expect(console.error).toHaveBeenCalledWith(
                'Element with ID "nonexistent" not found in the DOM or missing classList.'
            );
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should work with no tab buttons in DOM", () => {
            appendTestContent(createTestDiv({ text: "No tabs here" }));

            expect(updateActiveTab("tab-summary")).toBe(false);

            // Should log error and not call setState for nonexistent element
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should handle tab IDs with special characters", () => {
            appendTabButtons([
                { id: "tab-special-chars_123", text: "Special" },
                { id: "tab-with-dashes", text: "Dashes" },
                { id: "tab_with_underscores", text: "Underscores" },
            ]);

            expect(updateActiveTab("tab-special-chars_123")).toBe(true);
            expect(
                document
                    .getElementById("tab-special-chars_123")
                    ?.classList.contains("active")
            ).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "special-chars_123",
                {
                    source: "updateActiveTab",
                }
            );

            expect(updateActiveTab("tab-with-dashes")).toBe(true);
            expect(
                document
                    .getElementById("tab-with-dashes")
                    ?.classList.contains("active")
            ).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "with-dashes",
                { source: "updateActiveTab" }
            );

            expect(updateActiveTab("tab_with_underscores")).toBe(true);
            expect(
                document
                    .getElementById("tab_with_underscores")
                    ?.classList.contains("active")
            ).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "tab_with_underscores",
                {
                    source: "updateActiveTab",
                }
            );
        });

        it("should handle case sensitivity in tab IDs", () => {
            appendTabButtons([
                { id: "tab-Summary", text: "Summary" },
                { id: "tab-CHART", text: "Chart" },
            ]);

            expect(updateActiveTab("tab-Summary")).toBe(true);
            expect(
                document
                    .getElementById("tab-Summary")
                    ?.classList.contains("active")
            ).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "Summary",
                { source: "updateActiveTab" }
            );

            expect(updateActiveTab("tab-CHART")).toBe(true);
            expect(
                document
                    .getElementById("tab-CHART")
                    ?.classList.contains("active")
            ).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "CHART", {
                source: "updateActiveTab",
            });

            // These should not match due to case sensitivity
            expect(updateActiveTab("tab-summary")).toBe(false);
            expect(mockSetState).toHaveBeenCalledTimes(2); // Should not increment
        });

        it("should handle repeated calls with same tab ID", () => {
            appendTabButtons([
                { id: "tab-summary", text: "Summary" },
                {
                    id: "tab-chart",
                    className: "tab-button active",
                    text: "Chart",
                },
            ]);

            updateActiveTab("tab-summary");
            updateActiveTab("tab-summary");
            updateActiveTab("tab-summary");

            expect(mockSetState).toHaveBeenCalledTimes(3);
            expect(
                document
                    .getElementById("tab-summary")
                    ?.classList.contains("active")
            ).toBe(true);
        });

        it("should handle pattern extraction correctly", () => {
            appendTabButtons([
                { id: "tab-summary", text: "Tab Pattern" },
                { id: "summary-tab", text: "Reverse Tab Pattern" },
                { id: "btn-chart", text: "Btn Pattern" },
                { id: "map-btn", text: "Reverse Btn Pattern" },
                { id: "custom-element", text: "Fallback Pattern" },
            ]);

            const results = [
                updateActiveTab("tab-summary"),
                updateActiveTab("summary-tab"),
                updateActiveTab("btn-chart"),
                updateActiveTab("map-btn"),
                updateActiveTab("custom-element"),
            ];

            expect(results).toEqual([
                true,
                true,
                true,
                true,
                true,
            ]);
            expect(
                document
                    .getElementById("custom-element")
                    ?.classList.contains("active")
            ).toBe(true);
            expect(
                document.getElementById("map-btn")?.classList.contains("active")
            ).toBe(false);
            expect(mockSetState.mock.calls.map(([, value]) => value)).toEqual([
                "summary",
                "summary",
                "chart",
                "map",
                "custom-element",
            ]);
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
            appendTabButtons([
                { id: "tab-summary", text: "Summary" },
                {
                    id: "tab-chart",
                    className: "tab-button active",
                    text: "Chart",
                },
                { id: "tab-map", text: "Map" },
            ]);

            initializeActiveTabState();

            expect(mockSubscribe).toHaveBeenCalledWith(
                "ui.activeTab",
                expect.any(Function)
            );
            const [, onActiveTabChange] = mockSubscribe.mock.calls[0] as [
                string,
                (activeTab: string) => void,
            ];
            onActiveTabChange("map");

            expect(
                document.getElementById("tab-map")?.classList.contains("active")
            ).toBe(true);
            expect(
                document
                    .getElementById("tab-chart")
                    ?.classList.contains("active")
            ).toBe(false);
        });

        it("should set up click listeners when tab buttons exist", () => {
            appendTabButtons([
                { id: "tab-summary", text: "Summary" },
                { id: "tab-chart", text: "Chart" },
            ]);

            // Spy on addEventListener
            const buttons = testContainer.querySelectorAll(".tab-button");
            const addEventListenerSpies = Array.from(buttons, (btn) =>
                vi.spyOn(btn, "addEventListener")
            );

            initializeActiveTabState();

            // Verify each button got a click listener (with options parameter for cleanup)
            addEventListenerSpies.forEach((spy) => {
                expect(spy).toHaveBeenCalledWith(
                    "click",
                    expect.any(Function),
                    expect.anything()
                );
            });
            expect(
                document.getElementById("tab-chart")?.dispatchEvent(
                    new MouseEvent("click", {
                        bubbles: true,
                        cancelable: true,
                    })
                )
            ).toBe(true);
        });

        it("should warn when no tab buttons found", () => {
            appendTestContent(createTestDiv({ text: "No tabs here" }));
            const consoleWarnSpy = vi.spyOn(console, "warn");

            expect(() => initializeActiveTabState()).not.toThrow();

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
            document.querySelectorAll = vi
                .fn()
                .mockReturnValue([invalidElement]);

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
            appendTabButtons([
                { id: "tab-summary", text: "Summary" },
                { id: "tab-chart", text: "Chart" },
            ]);

            initializeActiveTabState();

            // Simulate click on summary tab
            const summaryButton = document.getElementById("tab-summary");
            const clickResult = summaryButton?.dispatchEvent(
                new MouseEvent("click", { bubbles: true, cancelable: true })
            );

            expect(clickResult).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "summary",
                { source: "tabButtonClick" }
            );
        });

        it("should ignore clicks on disabled buttons", () => {
            appendTabButtons([
                { id: "tab-summary", disabled: true, text: "Summary" },
                {
                    id: "tab-chart",
                    className: "tab-button tab-disabled",
                    text: "Chart",
                },
            ]);

            initializeActiveTabState();

            // Simulate clicks on disabled buttons
            const summaryButton = document.getElementById("tab-summary");
            const chartButton = document.getElementById("tab-chart");

            const summaryClickResult = summaryButton?.dispatchEvent(
                new MouseEvent("click", { bubbles: true, cancelable: true })
            );
            const chartClickResult = chartButton?.dispatchEvent(
                new MouseEvent("click", { bubbles: true, cancelable: true })
            );

            expect(summaryClickResult).toBe(false);
            expect(chartClickResult).toBe(false);
            expect(
                document
                    .getElementById("tab-summary")
                    ?.classList.contains("active")
            ).toBe(false);
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should log initialization message", () => {
            const consoleLogSpy = vi.spyOn(console, "log");

            expect(() => initializeActiveTabState()).not.toThrow();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[ActiveTab] State management initialized"
            );
        });
    });

    describe("getActiveTab", () => {
        it("should return current state from state manager", () => {
            mockGetState.mockReturnValue("chart");

            const result = getActiveTab();

            expect(result).toBe("chart");
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
            expect(getActiveTab()).toBe("chart");

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

            const activeTab = getActiveTab();

            expect(activeTab).toBe("data");
            expect(mockGetState).toHaveBeenCalledTimes(1);
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });
    });

    describe("Integration Tests", () => {
        it("should work with realistic tab switching scenario", () => {
            const tabContainer = createTestDiv({ className: "tab-container" });
            tabContainer.append(
                createTestButton({
                    id: "tab-summary",
                    className: "tab-button active",
                    text: "Summary",
                }),
                createTestButton({ id: "tab-chart", text: "Chart" }),
                createTestButton({ id: "tab-map", text: "Map" }),
                createTestButton({ id: "tab-data", text: "Data" })
            );
            appendTestContent(tabContainer);

            // Initialize listeners
            initializeActiveTabState();
            expect(mockSubscribe).toHaveBeenCalledWith(
                "ui.activeTab",
                expect.any(Function)
            );

            // Switch to chart
            expect(updateActiveTab("tab-chart")).toBe(true);
            expect(
                document
                    .getElementById("tab-summary")
                    ?.classList.contains("active")
            ).toBe(false);
            expect(
                document
                    .getElementById("tab-chart")
                    ?.classList.contains("active")
            ).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chart", {
                source: "updateActiveTab",
            });

            // Switch to map
            expect(updateActiveTab("tab-map")).toBe(true);
            expect(
                document
                    .getElementById("tab-chart")
                    ?.classList.contains("active")
            ).toBe(false);
            expect(
                document.getElementById("tab-map")?.classList.contains("active")
            ).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "map", {
                source: "updateActiveTab",
            });

            // Get current state
            mockGetState.mockReturnValue("map");
            expect(getActiveTab()).toBe("map");
        });

        it("should handle state manager integration errors gracefully", () => {
            appendTabButtons([{ id: "tab-summary", text: "Summary" }]);

            // Mock setState to throw error
            mockSetState.mockImplementation(() => {
                throw new Error("State error");
            });

            expect(() => updateActiveTab("tab-summary")).toThrow("State error");

            // initializeActiveTabState should NOT throw because it doesn't call setState directly
            expect(() => initializeActiveTabState()).not.toThrow();
        });

        it("should handle complex DOM structures", () => {
            const app = createTestDiv({ className: "app" });
            const navigation = document.createElement("nav");
            navigation.className = "navigation";
            const tabGroup = createTestDiv({ className: "tab-group" });
            tabGroup.append(
                createTestButton({ id: "tab-summary", text: "Summary" }),
                createTestButton({
                    id: "tab-chart",
                    className: "tab-button active",
                    text: "Chart",
                })
            );
            const otherButtons = createTestDiv({ className: "other-buttons" });
            otherButtons.append(
                createTestButton({
                    id: "not-a-tab",
                    className: "",
                    text: "Other",
                })
            );
            navigation.append(tabGroup, otherButtons);

            const content = createTestDiv({ className: "content" });
            content.append(
                createTestButton({ id: "tab-nested", text: "Nested" })
            );
            app.append(navigation, content);
            appendTestContent(app);

            expect(updateActiveTab("tab-summary")).toBe(true);
            expect(
                document
                    .getElementById("tab-summary")
                    ?.classList.contains("active")
            ).toBe(true);
            expect(
                document
                    .getElementById("tab-chart")
                    ?.classList.contains("active")
            ).toBe(false);

            expect(updateActiveTab("tab-nested")).toBe(true);
            expect(
                document
                    .getElementById("tab-nested")
                    ?.classList.contains("active")
            ).toBe(true);
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
            expect(updateActiveTab("tab-summary")).toBe(false);
            expect(mockSetState).not.toHaveBeenCalled();

            // initializeActiveTabState should warn about no tab buttons
            const consoleWarnSpy = vi.spyOn(console, "warn");
            expect(() => initializeActiveTabState()).not.toThrow();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "initializeActiveTabState: No tab buttons found in DOM. Click listeners not set up."
            );

            // Restore
            document.querySelectorAll = originalQuerySelectorAll;
            document.getElementById = originalGetElementById;
        });

        it("should handle very long tab IDs", () => {
            const longId = "a".repeat(1000);
            appendTabButtons([{ id: `tab-${longId}`, text: "Long" }]);

            expect(updateActiveTab(`tab-${longId}`)).toBe(true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", longId, {
                source: "updateActiveTab",
            });
        });

        it("should handle tab IDs with special regex characters", () => {
            const specialId =
                "test.with+special*chars?and[brackets]and(parens)and{braces}";
            appendTabButtons([{ id: `tab-${specialId}`, text: "Special" }]);

            expect(updateActiveTab(`tab-${specialId}`)).toBe(true);
            expect(
                document
                    .getElementById(`tab-${specialId}`)
                    ?.classList.contains("active")
            ).toBe(true);
        });

        it("should handle concurrent tab updates", async () => {
            appendTabButtons([
                { id: "tab-summary", text: "Summary" },
                { id: "tab-chart", text: "Chart" },
            ]);

            // Simulate concurrent updates
            const promises = [
                Promise.resolve(updateActiveTab("tab-summary")),
                Promise.resolve(updateActiveTab("tab-chart")),
                Promise.resolve(updateActiveTab("tab-summary")),
            ];

            const results = await Promise.all(promises);

            expect(results).toEqual([
                true,
                true,
                true,
            ]);
            expect(
                document
                    .getElementById("tab-summary")
                    ?.classList.contains("active")
            ).toBe(true);
            expect(
                document
                    .getElementById("tab-chart")
                    ?.classList.contains("active")
            ).toBe(false);
            expect(mockSetState).toHaveBeenCalledTimes(3);
        });

        it("should handle memory cleanup scenarios", () => {
            appendTabButtons([{ id: "tab-summary", text: "Summary" }]);

            // Create many operations to test memory handling
            let lastResult = false;
            for (let i = 0; i < 100; i++) {
                lastResult = updateActiveTab("tab-summary");
            }

            expect(lastResult).toBe(true);
            expect(
                document
                    .getElementById("tab-summary")
                    ?.classList.contains("active")
            ).toBe(true);
            expect(mockSetState).toHaveBeenCalledTimes(100);
        });
    });

    describe("Performance Tests", () => {
        it("should handle large number of tab elements efficiently", () => {
            // Create many tab elements
            appendTestContent(
                ...Array.from({ length: 1000 }, (_, i) =>
                    createTestButton({
                        id: `tab-item${i}`,
                        text: `Tab ${i}`,
                    })
                )
            );

            const startTime = performance.now();
            expect(updateActiveTab("tab-item500")).toBe(true);
            const endTime = performance.now();

            // Should complete quickly even with many elements
            // Note: Allow some headroom for slower CI/Windows runners to avoid flaky failures.
            expect(endTime - startTime).toBeLessThan(250); // <= 250ms threshold
            expect(
                document
                    .getElementById("tab-item500")
                    ?.classList.contains("active")
            ).toBe(true);
            expect(
                document
                    .getElementById("tab-item499")
                    ?.classList.contains("active")
            ).not.toBe(true);
        });

        it("should handle rapid successive calls efficiently", () => {
            appendTabButtons([{ id: "tab-summary", text: "Summary" }]);

            const startTime = performance.now();
            let lastResult = false;
            for (let i = 0; i < 1000; i++) {
                lastResult = updateActiveTab("tab-summary");
            }
            const endTime = performance.now();

            expect(lastResult).toBe(true);
            expect(endTime - startTime).toBeLessThan(1000); // 1s threshold
            expect(mockSetState).toHaveBeenCalledTimes(1000);
        });
    });

    describe("Accessibility and Standards Compliance", () => {
        it("should preserve ARIA attributes when updating tabs", () => {
            appendTabButtons([
                {
                    id: "tab-summary",
                    className: "tab-button active",
                    ariaSelected: "true",
                    role: "tab",
                    text: "Summary",
                },
                {
                    id: "tab-chart",
                    ariaSelected: "false",
                    role: "tab",
                    text: "Chart",
                },
            ]);

            expect(updateActiveTab("tab-chart")).toBe(true);

            // Verify ARIA attributes are preserved
            expect(
                document
                    .getElementById("tab-summary")
                    ?.getAttribute("aria-selected")
            ).toBe("true");
            expect(
                document
                    .getElementById("tab-chart")
                    ?.getAttribute("aria-selected")
            ).toBe("false");
            expect(
                document.getElementById("tab-summary")?.getAttribute("role")
            ).toBe("tab");
            expect(
                document.getElementById("tab-chart")?.getAttribute("role")
            ).toBe("tab");
            expect(
                document
                    .getElementById("tab-summary")
                    ?.classList.contains("active")
            ).not.toBe(true);
        });

        it("should work with various HTML5 button types", () => {
            appendTabButtons([
                { id: "tab-summary", text: "Summary", type: "button" },
                { id: "tab-chart", text: "Chart", type: "submit" },
                { id: "tab-map", text: "Map", type: "reset" },
            ]);

            updateActiveTab("tab-summary");
            expect(
                document
                    .getElementById("tab-summary")
                    ?.classList.contains("active")
            ).toBe(true);

            updateActiveTab("tab-chart");
            expect(
                document
                    .getElementById("tab-chart")
                    ?.classList.contains("active")
            ).toBe(true);

            updateActiveTab("tab-map");
            expect(
                document.getElementById("tab-map")?.classList.contains("active")
            ).toBe(true);
        });
    });
});
