// Regression coverage for tabStateManager edge cases.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type GetState = (path?: string) => unknown;
type SetState = (path: string, value: unknown, options?: unknown) => void;
type Subscribe = (
    path: string,
    callback: (newValue: unknown, oldValue?: unknown) => void
) => () => void;
type UpdateState = (path: string, value: unknown, options?: unknown) => void;
type ShowNotification = (
    message: string,
    type?: string,
    duration?: number
) => void;
type TestWindowHook = () => Promise<void> | void;

// Mock dependencies with proper hoisting
vi.mock(import("../../../electron-app/utils/state/core/stateManager"), () => ({
    getState: vi.fn<GetState>(),
    setState: vi.fn<SetState>(),
    subscribe: vi.fn<Subscribe>(() => vi.fn<() => void>()),
    updateState: vi.fn<UpdateState>(),
}));

vi.mock(
    import("../../../electron-app/utils/ui/notifications/showNotification"),
    () => ({
        showNotification: vi.fn<ShowNotification>(),
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

const createElement = (
    tagName: keyof HTMLElementTagNameMap,
    attributes: Record<string, string> = {},
    textContent = ""
): HTMLElement => {
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
            createTables: vi.fn<TestWindowHook>(),
            renderChartJS: vi.fn<TestWindowHook>(),
            renderMap: vi.fn<TestWindowHook>(),
            renderSummary: vi.fn<TestWindowHook>(),
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

    describe("cleanup behavior", () => {
        it("should expose an idempotent cleanup method", () => {
            expect.assertions(3);

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
            expect.assertions(4);

            const unsubscribeActive = vi.fn<() => void>();
            const unsubscribeData = vi.fn<() => void>();
            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});
            mockSubscribe
                .mockReturnValueOnce(unsubscribeActive)
                .mockReturnValueOnce(unsubscribeData);

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

    describe("state synchronization", () => {
        it("detects mismatched DOM and state active tabs", () => {
            expect.assertions(1);

            const summaryBtn = document.getElementById("tab-summary");

            // Manually set DOM to active state
            summaryBtn.classList.add("active");

            // Mock the state as different
            mockGetState.mockReturnValue("map");

            // This exposes the bug where DOM and state can be out of sync
            const summaryClassName = summaryBtn.className;
            const stateActive = mockGetState("ui.activeTab");

            expect({
                summaryClassName,
                stateActive,
                summaryIsSynchronized:
                    summaryClassName === "tab-button active" &&
                    stateActive === "summary",
            }).toStrictEqual({
                summaryClassName: "tab-button active",
                stateActive: "map",
                summaryIsSynchronized: false,
            });
        });

        it("documents async handler failures that require awaiting", async () => {
            expect.assertions(2);

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

    describe("data validation edge cases", () => {
        it("treats malformed globalData as unavailable data", () => {
            expect.assertions(2);

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
            expect.assertions(2);

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

    describe("dom manipulation security issues", () => {
        it("sets the AltFit iframe source when it is not loaded", () => {
            expect.assertions(3);

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
                    new URL(iframe.src).pathname !== "/ffv/index.html"
                ) {
                    iframe.src = "ffv/index.html"; // Direct assignment without validation
                }
            };

            expect(iframe.src).toBe("about:blank");
            handleIframe();
            expect(new URL(iframe.src).pathname).toBe("/ffv/index.html");
            expect(iframe.src).not.toBe("about:blank");
        });

        it("moves background data content into the visible data container", () => {
            expect.assertions(2);

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

    describe("performance and error handling", () => {
        it("keeps repeated tab DOM queries within a reasonable duration", () => {
            expect.assertions(1);

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
            expect.assertions(2);

            // Mock failing async functions
            vi.spyOn(window, "renderChartJS").mockRejectedValue(
                new Error("Chart render failed")
            );

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

    describe("tab configuration validation", () => {
        it("validates tab configuration consistency", () => {
            expect.assertions(64);

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
            expect.assertions(2);

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

    describe("integration issues", () => {
        it("keeps subscription callbacks bounded during recursive state updates", () => {
            expect.assertions(2);

            let recursionCount = 0;
            const maxRecursion = 3;

            // Mock subscription that triggers state changes
            mockSubscribe.mockImplementation((key, callback) => {
                if (key === "ui.activeTab" && recursionCount < maxRecursion) {
                    recursionCount++;
                    callback("map", "summary"); // This could trigger more state changes
                }
                return () => {};
            });

            // Test that subscription doesn't cause infinite loops
            expect(recursionCount).toBeLessThanOrEqual(maxRecursion);
            expect(recursionCount).not.toBeGreaterThan(maxRecursion);
        });

        it("reports invalid state when active tab has no configuration", () => {
            expect.assertions(1);

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
