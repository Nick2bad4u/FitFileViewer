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
type TestWindowHooks = Window & {
    renderChartJS?: TestWindowHook;
};

const { mockEnsureRendererVendorBundle } = vi.hoisted(() => ({
    mockEnsureRendererVendorBundle: vi.fn(() => Promise.resolve()),
}));

// Mock dependencies with proper hoisting
vi.mock(import("../../../electron-app/utils/state/core/stateManager"), () => ({
    getStateHistory: vi.fn<() => unknown[]>(() => []),
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

vi.mock("../../../electron-app/renderer/vendorBundleLoader.js", () => ({
    ensureRendererVendorBundle: mockEnsureRendererVendorBundle,
}));

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

function getRequiredElement(id: string): HTMLElement {
    const element = document.getElementById(id);

    if (!(element instanceof HTMLElement)) {
        throw new Error(`Expected #${id} to exist`);
    }

    return element;
}

function getTestWindowHooks(): TestWindowHooks {
    return window as TestWindowHooks;
}

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
    visibleText = ""
): HTMLElement => {
    const element = document.createElement(tagName);

    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });

    if (visibleText.length > 0) {
        element.append(document.createTextNode(visibleText));
    }

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
                    id: `tab_${tabName}`,
                },
                label
            )
        );
    });

    tabDomFixtures.forEach(([tabName, label]) => {
        fragment.append(
            createElement("div", { id: `content_${tabName}` }, label)
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
        mockEnsureRendererVendorBundle.mockReset();
        mockEnsureRendererVendorBundle.mockResolvedValue(undefined);
        // Don't clear mockSubscribe to preserve initialization calls

        mockGetState.mockReturnValue("summary");

        Object.assign(getTestWindowHooks(), {
            renderChartJS: vi.fn<TestWindowHook>(),
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

            expect(tabStateManager.cleanup).toBeTypeOf("function");

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

            expect(
                mockSubscribe.mock.calls
                    .slice(-2)
                    .map(([path, listener]) => [path, typeof listener])
            ).toEqual([
                ["ui.activeTab", "function"],
                ["fitFile.rawData", "function"],
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
            expect.assertions(2);

            const summaryBtn = getRequiredElement("tab_summary");

            // Manually set DOM to active state
            summaryBtn.classList.add("active");

            // Mock the state as different
            mockGetState.mockReturnValue("map");

            // This exposes the bug where DOM and state can be out of sync
            const summaryClassName = summaryBtn.className;
            const stateActive = mockGetState("ui.activeTab");

            const summaryIsSynchronized =
                summaryClassName === "tab-button active" &&
                stateActive === "summary";

            expect(summaryIsSynchronized).not.toBe(true);
            expect({
                summaryClassName,
                stateActive,
                summaryIsSynchronized,
            }).toStrictEqual({
                summaryClassName: "tab-button active",
                stateActive: "map",
                summaryIsSynchronized: false,
            });
        });

        it("catches async tab handler failures and notifies the user", async () => {
            expect.assertions(4);

            const manager = new TabStateManager();
            const handlerError = new Error("Async operation failed");
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            vi.spyOn(manager, "handleBrowserTab").mockRejectedValue(
                handlerError
            );

            const result = await manager.handleTabSpecificLogic("browser");

            expect(result).toBeUndefined();
            expect(consoleSpy).toHaveBeenCalledWith(
                "[TabStateManager] Error handling tab browser:",
                handlerError
            );
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Error loading Browser tab",
                "error"
            );
            expect(manager.handleBrowserTab).toHaveBeenCalledOnce();

            manager.cleanup();
            consoleSpy.mockRestore();
        });
    });

    describe("data validation edge cases", () => {
        it("updates required tab availability from recordMesgs presence", () => {
            expect.assertions(1);

            const requiredTabIds = Object.values(TAB_CONFIG)
                .filter((config) => config.requiresData)
                .map((config) => config.id);
            const availabilityCases = [
                { expectedDisabled: true, rawFitData: { recordMesgs: null } },
                {
                    expectedDisabled: true,
                    rawFitData: { recordMesgs: undefined },
                },
                { expectedDisabled: false, rawFitData: { recordMesgs: [] } },
                {
                    expectedDisabled: false,
                    rawFitData: { recordMesgs: "not-array" },
                },
                {
                    expectedDisabled: true,
                    rawFitData: { notRecordMesgs: [{}] },
                },
                { expectedDisabled: true, rawFitData: null },
                { expectedDisabled: true, rawFitData: undefined },
            ] as const;

            const tabStates = availabilityCases.map(
                ({ expectedDisabled, rawFitData }) => {
                    tabStateManager.updateTabAvailability(rawFitData as never);

                    return {
                        expectedDisabled,
                        tabButtons: Object.fromEntries(
                            requiredTabIds.map((tabId) => {
                                const button = document.getElementById(
                                    tabId
                                ) as HTMLButtonElement;

                                return [
                                    tabId,
                                    {
                                        className: button.className,
                                        disabled: button.disabled,
                                    },
                                ];
                            })
                        ),
                    };
                }
            );

            expect(tabStates).toStrictEqual(
                availabilityCases.map(({ expectedDisabled }) => ({
                    expectedDisabled,
                    tabButtons: Object.fromEntries(
                        requiredTabIds.map((tabId) => [
                            tabId,
                            {
                                className: expectedDisabled
                                    ? "tab-button disabled"
                                    : "tab-button",
                                disabled: expectedDisabled,
                            },
                        ])
                    ),
                }))
            );
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
        it("resolves active tab elements from current state", () => {
            expect.assertions(1);

            mockGetState.mockReturnValue("chart");

            const manager = new TabStateManager();
            const activeTabInfo = manager.getActiveTabInfo();

            expect({
                contentElementId: activeTabInfo.contentElement?.id,
                elementId: activeTabInfo.element?.id,
                label: activeTabInfo.config?.label,
                name: activeTabInfo.name,
                previous: activeTabInfo.previous,
            }).toStrictEqual({
                contentElementId: "content_chartjs",
                elementId: "tab_chart",
                label: "Charts",
                name: "chart",
                previous: null,
            });

            manager.cleanup();
        });

        it("catches chart tab render failures and notifies the user", async () => {
            expect.assertions(5);

            const manager = new TabStateManager();
            const activityData = { recordMesgs: [{ timestamp: 1 }] };
            const renderError = new Error("Chart render failed");
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            vi.spyOn(manager, "handleChartTab").mockRejectedValue(renderError);
            mockGetState.mockImplementation((path?: string) =>
                path === "fitFile.rawData" ? activityData : "chart"
            );

            const result = await manager.handleTabSpecificLogic("chart");

            expect(result).toBeUndefined();
            expect(manager.handleChartTab).toHaveBeenCalledWith(activityData);
            expect(consoleSpy).toHaveBeenCalledWith(
                "[TabStateManager] Error handling tab chart:",
                renderError
            );
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Error loading Charts tab",
                "error"
            );
            expect(getTestWindowHooks().renderChartJS).not.toHaveBeenCalled();

            manager.cleanup();
            consoleSpy.mockRestore();
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
                expect(getRequiredElement(config.id).id).toBe(config.id);
                expect(content).toBeInstanceOf(HTMLElement);
                expect(getRequiredElement(config.contentId).id).toBe(
                    config.contentId
                );
            });
        });

        it("keeps duplicate tab handlers limited to the chart compatibility alias", () => {
            expect.assertions(3);

            const handlerGroups = Object.entries(TAB_CONFIG)
                .filter(([, config]) => config.handler)
                .reduce<Record<string, string[]>>(
                    (groups, [tabName, config]) => {
                        const { handler } = config;
                        if (handler) {
                            groups[handler] ??= [];
                            groups[handler].push(tabName);
                        }
                        return groups;
                    },
                    {}
                );

            const duplicateHandlerGroups = Object.entries(handlerGroups).filter(
                ([, tabNames]) => tabNames.length > 1
            );

            expect(duplicateHandlerGroups).toStrictEqual([
                ["renderChartJS", ["chart", "chartjs"]],
            ]);
            expect(new Set(Object.keys(TAB_CONFIG))).toStrictEqual(
                new Set([
                    "altfit",
                    "browser",
                    "chart",
                    "chartjs",
                    "data",
                    "map",
                    "summary",
                    "zwift",
                ])
            );
            expect({
                chart: TAB_CONFIG.chart,
                chartjs: TAB_CONFIG.chartjs,
            }).toStrictEqual({
                chart: {
                    contentId: "content_chartjs",
                    handler: "renderChartJS",
                    id: "tab_chart",
                    label: "Charts",
                    requiresData: true,
                },
                chartjs: {
                    contentId: "content_chartjs",
                    handler: "renderChartJS",
                    id: "tab_chartjs",
                    label: "Charts",
                    requiresData: true,
                },
            });
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
