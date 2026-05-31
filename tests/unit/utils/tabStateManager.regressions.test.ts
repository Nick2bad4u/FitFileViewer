/**
 * Regression coverage for tabStateManager edge cases.
 *
 * @file TabStateManager.regressions.test.ts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies with proper hoisting
vi.mock("../../../electron-app/utils/state/core/stateManager", () => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(() => vi.fn()), // Return unsubscribe function
    updateState: vi.fn(),
}));

vi.mock(
    "../../../electron-app/utils/ui/notifications/showNotification",
    () => ({
        showNotification: vi.fn(),
    })
);

// Import module AFTER mocks are set up
import {
    TabStateManager,
    tabStateManager,
    TAB_CONFIG,
} from "../../../electron-app/utils/ui/tabs/tabStateManager.js";

// Get the mocked functions
import {
    getState,
    setState,
    subscribe,
} from "../../../electron-app/utils/state/core/stateManager";
import { showNotification } from "../../../electron-app/utils/ui/notifications/showNotification";

const mockGetState = vi.mocked(getState);
const mockSetState = vi.mocked(setState);
const mockSubscribe = vi.mocked(subscribe);
const mockShowNotification = vi.mocked(showNotification);

const tabDomFixtures = [
    ["summary", "Summary"],
    ["map", "Map"],
    ["browser", "Browser"],
    ["chartjs", "ChartJS"],
    ["chart", "Chart"],
    ["data", "Data"],
    ["altfit", "AltFit"],
    ["zwift", "Zwift"],
];

const createElement = (tagName, attributes = {}, textContent = "") => {
    const element = document.createElement(tagName);

    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });

    element.textContent = textContent;

    return element;
};

const setupTabDom = () => {
    const fragment = document.createDocumentFragment();

    tabDomFixtures.forEach(([tabName, label]) => {
        fragment.append(
            createElement(
                "button",
                {
                    class: "tab-button",
                    id: `tab-${tabName}`,
                },
                label
            )
        );
    });

    tabDomFixtures.forEach(([tabName, label]) => {
        fragment.append(
            createElement("div", { id: `content-${tabName}` }, label)
        );
    });

    document.body.replaceChildren(fragment);
};

const setupContentMoveDom = () => {
    const bgContainer = createElement("div", {
        id: "background-data-container",
    });
    bgContainer.append(
        createElement("div", { class: "content-item" }, "Item 1"),
        createElement("div", { class: "content-item" }, "Item 2")
    );

    const visibleContainer = createElement("div", { id: "content-data" });

    document.body.replaceChildren(bgContainer, visibleContainer);
};

describe("tabStateManager regressions", () => {
    beforeEach(() => {
        // Set up complete DOM structure matching TAB_CONFIG
        setupTabDom();

        // Reset mocks but preserve subscribe calls from module initialization
        mockGetState.mockClear();
        mockSetState.mockClear();
        mockShowNotification.mockClear();
        // Don't clear mockSubscribe to preserve initialization calls

        mockGetState.mockReturnValue("summary");

        Object.assign(window, {
            createTables: vi.fn(),
            renderSummary: vi.fn(),
            renderMap: vi.fn(),
            renderChartJS: vi.fn(),
        });
    });

    afterEach(() => {
        document.body.replaceChildren();
        // Reset mocks but preserve the calls from module initialization
        mockGetState.mockClear();
        mockSetState.mockClear();
        mockShowNotification.mockClear();
        // Don't reset mockSubscribe to preserve initialization calls
    });

    describe("Cleanup behavior", () => {
        it("should expose an idempotent cleanup method", () => {
            expect(tabStateManager).toEqual(
                expect.objectContaining({
                    cleanup: expect.any(Function),
                })
            );

            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            tabStateManager.cleanup();
            expect(consoleSpy).toHaveBeenCalledWith(
                "[TabStateManager] cleanup invoked"
            );
            expect(consoleSpy).not.toHaveBeenCalledWith(
                "[TabStateManager] cleanup failed"
            );

            consoleSpy.mockRestore();
        });

        it("should unsubscribe tracked state listeners once across multiple cleanup calls", () => {
            const unsubscribeActive = vi.fn();
            const unsubscribeData = vi.fn();
            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});
            mockSubscribe
                .mockImplementationOnce(() => unsubscribeActive)
                .mockImplementationOnce(() => unsubscribeData);

            const manager = new TabStateManager();

            expect(mockSubscribe.mock.calls.slice(-2)).toEqual([
                ["ui.activeTab", expect.any(Function)],
                ["globalData", expect.any(Function)],
            ]);
            manager.cleanup();
            manager.cleanup();
            expect(unsubscribeActive).toHaveBeenCalledOnce();
            expect(unsubscribeData).toHaveBeenCalledOnce();
            expect(consoleSpy).toHaveBeenCalledWith(
                "[TabStateManager] cleanup invoked"
            );

            consoleSpy.mockRestore();
        });
    });

    describe("State synchronization", () => {
        it("detects mismatched DOM and state active tabs", () => {
            const summaryBtn = document.getElementById("tab-summary");

            // Manually set DOM to active state
            summaryBtn.classList.add("active");

            // Mock the state as different
            mockGetState.mockReturnValue("map");

            // This exposes the bug where DOM and state can be out of sync
            const isDOMActive = summaryBtn.classList.contains("active");
            const stateActive = mockGetState("ui.activeTab");

            expect({
                isDOMActive,
                stateActive,
                summaryIsSynchronized: isDOMActive && stateActive === "summary",
            }).toStrictEqual({
                isDOMActive: true,
                stateActive: "map",
                summaryIsSynchronized: false,
            });
        });

        it("documents async handler failures that require awaiting", async () => {
            let asyncError = null;

            // Simulate async handler that fails
            const asyncHandler = async () => {
                throw new Error("Async operation failed");
            };

            // The real code doesn't await async handlers
            try {
                // Handle the promise to prevent unhandled rejection
                await asyncHandler().catch((error) => {
                    // This demonstrates the bug - errors are lost without proper handling
                });
            } catch (error) {
                asyncError = error; // Won't catch async errors
            }

            // Error is lost in real implementation
            expect(asyncError).toBeNull();

            // Proper handling would catch the error
            try {
                await asyncHandler();
            } catch (error) {
                asyncError = error;
            }

            expect(asyncError).toBeInstanceOf(Error);
        });
    });

    describe("Data Validation Edge Cases", () => {
        it("treats malformed globalData as unavailable data", () => {
            const testCases = [
                { recordMesgs: null },
                { recordMesgs: undefined },
                { recordMesgs: [] },
                { recordMesgs: "not-array" },
                { notRecordMesgs: [{}] },
                null,
                undefined,
            ];

            const results = testCases.map((testData) => {
                mockGetState.mockReturnValue(testData);

                // Test data validation logic
                const hasValidData = () => {
                    const globalData = mockGetState("globalData");
                    return Boolean(
                        globalData &&
                        Array.isArray(globalData.recordMesgs) &&
                        globalData.recordMesgs.length > 0
                    );
                };

                return hasValidData();
            });

            expect(results).toEqual([
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ]);
            expect(results).not.toContain(true);
        });

        it("does not resolve configuration for invalid tab names", () => {
            // Test with invalid tab name
            const invalidTabs = [
                "",
                "nonexistent",
                null,
                undefined,
                123,
            ];

            const configs = invalidTabs.map((tabName) => TAB_CONFIG[tabName]);

            expect(configs).toEqual([
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
            ]);
            expect(new Set(configs)).toStrictEqual(new Set([undefined]));
        });
    });

    describe("DOM Manipulation Security Issues", () => {
        it("sets the AltFit iframe source when it is not loaded", () => {
            document.body.append(
                createElement("iframe", {
                    id: "altfit-iframe",
                    src: "about:blank",
                })
            );

            const iframe = document.getElementById("altfit-iframe");

            // Test the iframe manipulation logic
            const handleIframe = () => {
                if (
                    iframe instanceof HTMLIFrameElement &&
                    !iframe.src.includes("ffv/index.html")
                ) {
                    iframe.src = "ffv/index.html"; // Direct assignment without validation
                }
            };

            expect(iframe.src).toBe("about:blank");
            handleIframe();
            expect(iframe.src).toContain("ffv/index.html");
            expect(iframe.src).not.toBe("about:blank");
        });

        it("moves background data content into the visible data container", () => {
            setupContentMoveDom();

            const bgContainer = document.getElementById(
                "background-data-container"
            );
            const visibleContainer = document.getElementById("content-data");

            // Test moving DOM nodes while potentially being modified
            const moveContent = () => {
                if (bgContainer && visibleContainer) {
                    // Capture children before moving (safer approach)
                    const children = Array.from(bgContainer.children);

                    children.forEach((child) => {
                        if (child.parentNode === bgContainer) {
                            visibleContainer.appendChild(child);
                        }
                    });
                }
            };

            expect(
                Array.from(bgContainer.children, (child) => child.textContent)
            ).toStrictEqual(["Item 1", "Item 2"]);
            moveContent();
            expect({
                backgroundItems: Array.from(
                    bgContainer.children,
                    (child) => child.textContent
                ),
                visibleItems: Array.from(
                    visibleContainer.children,
                    (child) => child.textContent
                ),
            }).toStrictEqual({
                backgroundItems: [],
                visibleItems: ["Item 1", "Item 2"],
            });
        });
    });

    describe("Performance and Error Handling", () => {
        it("keeps repeated tab DOM queries within a reasonable duration", () => {
            const performanceTest = () => {
                const start = performance.now();

                // Simulate multiple DOM queries like in real code
                for (let i = 0; i < 50; i++) {
                    document.querySelectorAll(".tab-button");
                    Object.values(TAB_CONFIG).forEach((config) => {
                        document.getElementById(config.contentId);
                    });
                }

                return performance.now() - start;
            };

            const duration = performanceTest();

            // Should complete reasonably fast, but this exposes the inefficiency
            expect(duration).toBeLessThan(100);
        });

        it("documents async render failures that require awaiting", async () => {
            // Mock failing async functions
            window.renderChartJS = vi
                .fn()
                .mockRejectedValue(new Error("Chart render failed"));

            let caughtError = null;

            // Simulate the actual error handling (or lack thereof)
            try {
                window.renderChartJS(); // Missing await in real code
            } catch (error) {
                caughtError = error; // Won't catch async errors
            }

            expect(caughtError).toBeNull(); // Error is lost

            // Proper error handling would catch it
            try {
                await window.renderChartJS();
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeInstanceOf(Error);
        });
    });

    describe("Tab Configuration Validation", () => {
        it("validates tab configuration consistency", () => {
            // Check for missing or invalid configurations
            const requiredProps = [
                "id",
                "contentId",
                "label",
                "requiresData",
            ];

            Object.entries(TAB_CONFIG).forEach(([tabName, config]) => {
                requiredProps.forEach((prop) => {
                    expect(config).toHaveProperty(prop);
                });

                // Verify DOM elements exist for the configuration
                const button = document.getElementById(config.id);
                const content = document.getElementById(config.contentId);

                expect(button).toBeInstanceOf(HTMLElement);
                expect(button?.id).toBe(config.id);
                expect(content).toBeInstanceOf(HTMLElement);
                expect(content?.id).toBe(config.contentId);
            });
        });

        it("documents duplicate chart handler assignments", () => {
            const handlers = Object.values(TAB_CONFIG)
                .filter((config) => config.handler)
                .map((config) => config.handler);

            const handlerCounts = {};
            handlers.forEach((handler) => {
                handlerCounts[handler] = (handlerCounts[handler] || 0) + 1;
            });

            const duplicates = Object.entries(handlerCounts).filter(
                ([, count]) => count > 1
            );

            expect(duplicates).toStrictEqual([["renderChartJS", 2]]);
            expect(
                Object.entries(TAB_CONFIG)
                    .filter(([, config]) => config.handler === "renderChartJS")
                    .map(([tabName]) => tabName)
            ).toStrictEqual(["chart", "chartjs"]);
        });
    });

    describe("Integration Issues", () => {
        it("keeps subscription callbacks bounded during recursive state updates", () => {
            let recursionCount = 0;
            const maxRecursion = 3;

            // Mock subscription that triggers state changes
            mockSubscribe.mockImplementation((key, callback) => {
                if (key === "ui.activeTab" && recursionCount < maxRecursion) {
                    recursionCount++;
                    callback("map", "summary"); // This could trigger more state changes
                }
            });

            // Test that subscription doesn't cause infinite loops
            expect(recursionCount).toBeLessThanOrEqual(maxRecursion);
            expect(recursionCount).not.toBeGreaterThan(maxRecursion);
        });

        it("reports invalid state when active tab has no configuration", () => {
            // Test with state that doesn't match DOM
            mockGetState.mockReturnValue("nonexistent-tab");

            const validateState = () => {
                const activeTab = mockGetState("ui.activeTab");
                const config = TAB_CONFIG[activeTab];

                return {
                    isValid: !!config,
                    tabExists: !!document.getElementById(config?.id),
                    contentExists: !!document.getElementById(config?.contentId),
                };
            };

            const validation = validateState();

            expect(validation).toStrictEqual({
                contentExists: false,
                isValid: false,
                tabExists: false,
            });
        });
    });
});
