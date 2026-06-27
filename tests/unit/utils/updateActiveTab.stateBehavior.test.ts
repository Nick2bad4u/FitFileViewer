// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type StateSetOptions = {
    source: string;
};
type GetState = (path?: string) => unknown;
type SetState = (
    path: string,
    value: unknown,
    options?: StateSetOptions
) => void;
type SubscriptionCallback = (newValue: unknown) => void;
type Subscribe = (path: string, callback: SubscriptionCallback) => () => void;

const { mockGetState, mockSetState, mockSubscribe } = vi.hoisted(() => ({
    mockGetState: vi.fn<GetState>(),
    mockSetState: vi.fn<SetState>(),
    mockSubscribe: vi.fn<Subscribe>(),
}));

vi.mock(
    import("../../../electron-app/utils/state/domain/rendererStateManagerAccess.js"),
    () => ({
        getRendererCoreStateManager: vi.fn(() => ({
            getState: mockGetState,
            setState: mockSetState,
            subscribe: mockSubscribe,
        })),
        getRendererCoreSubscribeSingleton: vi.fn(() => undefined),
        getRequiredRendererCoreStateManager: vi.fn(() => ({
            getState: mockGetState,
            setState: mockSetState,
            subscribe: mockSubscribe,
        })),
    })
);

import {
    cleanupActiveTabState,
    getActiveTab,
    initializeActiveTabState,
    updateActiveTab,
} from "../../../electron-app/utils/ui/tabs/updateActiveTab.js";

type TabElement = HTMLButtonElement | HTMLDivElement;

type TabElementOptions = {
    readonly active?: boolean;
    readonly className?: string;
    readonly disabled?: boolean;
    readonly id?: string;
    readonly tagName?: "button" | "div";
    readonly text?: string;
};

let testContainer: HTMLDivElement;

function appendTabElement({
    active = false,
    className = "tab-button",
    disabled = false,
    id,
    tagName = "button",
    text = id ?? "Tab",
}: TabElementOptions): TabElement {
    const element = document.createElement(tagName);
    element.className = active ? `${className} active` : className;
    element.textContent = text;

    if (id !== undefined) {
        element.id = id;
    }

    if (disabled && element instanceof HTMLButtonElement) {
        element.disabled = true;
    }

    testContainer.appendChild(element);

    return element;
}

function appendTabElements(
    options: readonly TabElementOptions[]
): TabElement[] {
    return options.map((option) => appendTabElement(option));
}

function getRequiredElement(id: string): HTMLElement {
    const element = document.getElementById(id);

    if (!(element instanceof HTMLElement)) {
        throw new TypeError(`Expected #${id} to exist in the test DOM`);
    }

    return element;
}

function expectActiveState(id: string, expected: boolean): void {
    const hasActiveClass = getRequiredElement(id).classList.contains("active");

    if (expected) {
        expect(hasActiveClass).toBe(true);
    } else {
        expect(hasActiveClass).toBe(false);
    }
}

function getTabClassState(...ids: string[]) {
    return Object.fromEntries(
        ids.map((id) => {
            const element = getRequiredElement(id);
            return [
                id,
                {
                    ariaSelected: element.getAttribute("aria-selected"),
                    classes: [...element.classList],
                },
            ];
        })
    );
}

function getSubscriptionCallback(): SubscriptionCallback {
    const callback = mockSubscribe.mock.calls[0]?.[1];

    if (typeof callback !== "function") {
        throw new TypeError("Expected active tab subscription callback");
    }

    return callback as SubscriptionCallback;
}

function expectActiveTabSubscriptionRegistered(): void {
    expect(
        mockSubscribe.mock.calls.map(([path, callback]) => [
            path,
            typeof callback,
        ])
    ).toStrictEqual([["ui.activeTab", "function"]]);
}

describe("updateActiveTab state behavior", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.replaceChildren();

        testContainer = document.createElement("div");
        testContainer.id = "test-container";
        document.body.appendChild(testContainer);

        mockGetState.mockReturnValue("summary");
        mockSubscribe.mockReturnValue(() => undefined);
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        cleanupActiveTabState();
        testContainer.remove();
        vi.restoreAllMocks();
        vi.resetAllMocks();
    });

    describe(updateActiveTab, () => {
        it("should keep the requested tab active when it is already selected", () => {
            expect.assertions(2);

            appendTabElements([
                { active: true, id: "tab-summary", text: "Summary" },
                { id: "tab-chart", text: "Chart" },
            ]);

            const updated = updateActiveTab("tab-summary");

            expect({
                tabState: getTabClassState("tab-summary", "tab-chart"),
                updated,
            }).toStrictEqual({
                tabState: {
                    "tab-chart": {
                        ariaSelected: null,
                        classes: ["tab-button"],
                    },
                    "tab-summary": {
                        ariaSelected: null,
                        classes: ["tab-button", "active"],
                    },
                },
                updated: true,
            });
            expect(mockSetState).toHaveBeenCalledExactlyOnceWith(
                "ui.activeTab",
                "summary",
                { source: "updateActiveTab" }
            );
        });

        it("should update tab classes correctly for standard tab pattern", () => {
            expect.assertions(2);

            appendTabElements([
                { active: true, id: "tab-summary", text: "Summary" },
                { id: "tab-chart", text: "Chart" },
                { id: "tab-map", text: "Map" },
            ]);

            const updated = updateActiveTab("tab-chart");

            expect({
                tabState: getTabClassState(
                    "tab-summary",
                    "tab-chart",
                    "tab-map"
                ),
                updated,
            }).toStrictEqual({
                tabState: {
                    "tab-chart": {
                        ariaSelected: null,
                        classes: ["tab-button", "active"],
                    },
                    "tab-map": {
                        ariaSelected: null,
                        classes: ["tab-button"],
                    },
                    "tab-summary": {
                        ariaSelected: null,
                        classes: ["tab-button"],
                    },
                },
                updated: true,
            });
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chart", {
                source: "updateActiveTab",
            });
        });

        it("should handle configured tab ID patterns correctly", () => {
            expect.assertions(12);

            appendTabElements([
                { id: "tab-summary", text: "Tab Pattern" },
                { id: "data-tab", text: "Reverse Tab" },
                { id: "btn-map", text: "Btn Pattern" },
                { id: "chart-btn", text: "Reverse Btn" },
            ]);

            expect(updateActiveTab("tab-summary")).toStrictEqual(true);
            expectActiveState("tab-summary", true);
            expect(mockSetState).toHaveBeenLastCalledWith(
                "ui.activeTab",
                "summary",
                { source: "updateActiveTab" }
            );

            expect(updateActiveTab("data-tab")).toStrictEqual(true);
            expectActiveState("data-tab", true);
            expect(mockSetState).toHaveBeenLastCalledWith(
                "ui.activeTab",
                "data",
                { source: "updateActiveTab" }
            );

            expect(updateActiveTab("btn-map")).toStrictEqual(true);
            expectActiveState("btn-map", true);
            expect(mockSetState).toHaveBeenLastCalledWith(
                "ui.activeTab",
                "map",
                { source: "updateActiveTab" }
            );

            expect(updateActiveTab("chart-btn")).toStrictEqual(true);
            expectActiveState("chart-btn", true);
            expect(mockSetState).toHaveBeenLastCalledWith(
                "ui.activeTab",
                "chart",
                { source: "updateActiveTab" }
            );
        });

        it("should reject tab IDs that extract unknown tab names", () => {
            expect.assertions(4);

            appendTabElement({
                active: true,
                id: "tab-summary",
                text: "Summary",
            });
            appendTabElement({ id: "tab-test", text: "Test" });

            expect(updateActiveTab("tab-test")).toStrictEqual(false);
            expectActiveState("tab-summary", true);
            expectActiveState("tab-test", false);
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should remove active class from all tab buttons before setting new one", () => {
            expect.assertions(4);

            appendTabElements([
                { active: true, id: "tab-summary", text: "Summary" },
                { active: true, id: "tab-chart", text: "Chart" },
                { active: true, id: "tab-map", text: "Map" },
            ]);

            expectActiveState("tab-summary", true);
            expectActiveState("tab-chart", true);
            expectActiveState("tab-map", true);

            const updated = updateActiveTab("tab-chart");

            expect({
                tabState: getTabClassState(
                    "tab-summary",
                    "tab-chart",
                    "tab-map"
                ),
                updated,
            }).toStrictEqual({
                tabState: {
                    "tab-chart": {
                        ariaSelected: null,
                        classes: ["tab-button", "active"],
                    },
                    "tab-map": {
                        ariaSelected: null,
                        classes: ["tab-button"],
                    },
                    "tab-summary": {
                        ariaSelected: null,
                        classes: ["tab-button"],
                    },
                },
                updated: true,
            });
        });

        it("should handle null/undefined/empty tab IDs gracefully", () => {
            expect.assertions(3);

            appendTabElement({ id: "tab-test", text: "Test" });

            const results = [
                updateActiveTab(null),
                updateActiveTab(undefined),
                updateActiveTab(""),
                updateActiveTab("   "),
            ];

            expect(results).toStrictEqual([
                false,
                false,
                false,
                false,
            ]);
            expectActiveState("tab-test", false);
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should handle non-existent elements gracefully", () => {
            expect.assertions(3);

            appendTabElement({ id: "tab-exists", text: "Exists" });

            const updated = updateActiveTab("tab-nonexistent");

            expect({
                updated,
            }).toStrictEqual({
                updated: false,
            });
            expectActiveState("tab-exists", false);
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should handle elements without classList", () => {
            expect.assertions(2);

            const mockElement = { classList: null, id: "tab-test" };
            const originalGetElementById =
                Document.prototype.getElementById.bind(document);
            vi.spyOn(document, "getElementById").mockImplementation(
                (id: string) =>
                    id === "tab-test"
                        ? (mockElement as unknown as HTMLElement)
                        : originalGetElementById(id)
            );

            const updated = updateActiveTab("tab-test");

            expect({
                updated,
            }).toStrictEqual({
                updated: false,
            });
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should not call setState when no target tab exists", () => {
            expect.assertions(2);

            const placeholder = document.createElement("div");
            placeholder.textContent = "No tab buttons";
            testContainer.appendChild(placeholder);

            const updated = updateActiveTab("tab-nonexistent");

            expect({
                childElementCount: testContainer.childElementCount,
                updated,
            }).toStrictEqual({
                childElementCount: 1,
                updated: false,
            });
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should reject special-character IDs that do not name a configured tab", () => {
            expect.assertions(3);

            const specialId = "test-special_chars.with+symbols";
            appendTabElement({
                id: `tab-${specialId}`,
                text: "Special",
            });

            const updated = updateActiveTab(`tab-${specialId}`);

            expect({
                updated,
            }).toStrictEqual({
                updated: false,
            });
            expectActiveState(`tab-${specialId}`, false);
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should work with large numbers of tab buttons", () => {
            expect.assertions(4);

            for (let index = 0; index < 100; index += 1) {
                appendTabElement({
                    id: index === 50 ? "tab-map" : `tab-item${index}`,
                    text: `Tab ${index}`,
                });
            }

            const startTime = performance.now();
            const updated = updateActiveTab("tab-map");
            const endTime = performance.now();

            expect({
                updated,
            }).toStrictEqual({
                updated: true,
            });
            expect(endTime - startTime).toBeLessThan(50);
            expectActiveState("tab-map", true);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "map", {
                source: "updateActiveTab",
            });
        });
    });

    describe(getActiveTab, () => {
        it("should return state value when available", () => {
            expect.assertions(2);

            mockGetState.mockReturnValue("chart");

            expect(getActiveTab()).toBe("chart");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it('should return default "summary" when state is null', () => {
            expect.assertions(2);

            mockGetState.mockReturnValue(null);

            expect(getActiveTab()).toBe("summary");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it('should return default "summary" when state is undefined', () => {
            expect.assertions(2);

            mockGetState.mockReturnValue(undefined);

            expect(getActiveTab()).toBe("summary");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it('should return default "summary" when state is empty string', () => {
            expect.assertions(2);

            mockGetState.mockReturnValue("");

            expect(getActiveTab()).toBe("summary");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it('should return default "summary" when state has an unknown tab name', () => {
            expect.assertions(2);

            mockGetState.mockReturnValue("nonexistent");

            expect(getActiveTab()).toBe("summary");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it("should handle state manager errors", () => {
            expect.assertions(1);

            mockGetState.mockImplementation(() => {
                throw new Error("State error");
            });

            expect(() => getActiveTab()).toThrow("State error");
        });

        it("should call getState exactly once", () => {
            expect.assertions(2);

            mockGetState.mockReturnValue("data");

            expect(getActiveTab()).toBe("data");
            expect(mockGetState).toHaveBeenCalledOnce();
        });
    });

    describe(initializeActiveTabState, () => {
        it("should set up state subscription", () => {
            expect.assertions(3);

            appendTabElements([
                { id: "tab-summary", text: "Summary" },
                { active: true, id: "tab-chart", text: "Chart" },
            ]);

            initializeActiveTabState();
            getSubscriptionCallback()("summary");

            expect(
                getRequiredElement("tab-summary").classList.contains("active")
            ).toBe(true);
            expect(
                getRequiredElement("tab-chart").classList.contains("active")
            ).toBe(false);
            expectActiveTabSubscriptionRegistered();
        });

        it("should set up click listeners on tab buttons", () => {
            expect.assertions(2);

            appendTabElements([
                { id: "tab-summary", text: "Summary" },
                { id: "tab-chart", text: "Chart" },
            ]);

            initializeActiveTabState();
            getRequiredElement("tab-summary").click();

            expect(testContainer.querySelectorAll(".tab-button")).toHaveLength(
                2
            );
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "summary",
                { source: "tabButtonClick" }
            );
        });

        it("should handle disabled buttons correctly", () => {
            expect.assertions(4);

            appendTabElements([
                {
                    disabled: true,
                    id: "tab-summary",
                    text: "Summary",
                },
                {
                    className: "tab-button tab-disabled",
                    id: "tab-chart",
                    text: "Chart",
                },
                { id: "tab-map", text: "Map" },
            ]);

            initializeActiveTabState();

            getRequiredElement("tab-summary").click();
            expect(
                (getRequiredElement("tab-summary") as HTMLButtonElement)
                    .disabled
            ).toStrictEqual(true);

            getRequiredElement("tab-chart").click();
            expect(
                getRequiredElement("tab-chart").classList.contains(
                    "tab-disabled"
                )
            ).toBe(true);
            expect(mockSetState).toHaveBeenCalledTimes(0);

            getRequiredElement("tab-map").click();
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "map", {
                source: "tabButtonClick",
            });
        });

        it("should handle buttons without IDs gracefully", () => {
            expect.assertions(2);

            const button = appendTabElement({ text: "No ID" });

            initializeActiveTabState();
            button.click();

            expect(button.id).toBe("");
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should work with no tab buttons present", () => {
            expect.assertions(2);

            const placeholder = document.createElement("div");
            placeholder.textContent = "No tab buttons";
            testContainer.appendChild(placeholder);

            initializeActiveTabState();
            expect(testContainer.querySelectorAll(".tab-button")).toHaveLength(
                0
            );
            expectActiveTabSubscriptionRegistered();
        });

        it("should clean previous subscription and listeners before reinitializing", () => {
            expect.assertions(4);

            appendTabElement({ id: "tab-summary", text: "Summary" });
            const unsubscribes = [vi.fn<() => void>(), vi.fn<() => void>()];
            mockSubscribe
                .mockReturnValueOnce(unsubscribes[0])
                .mockReturnValueOnce(unsubscribes[1]);

            initializeActiveTabState();
            initializeActiveTabState();
            getRequiredElement("tab-summary").click();

            expect(mockSubscribe).toHaveBeenCalledTimes(2);
            expect(mockSetState).toHaveBeenCalledExactlyOnceWith(
                "ui.activeTab",
                "summary",
                { source: "tabButtonClick" }
            );
            expect(
                unsubscribes.map((unsubscribe) => unsubscribe.mock.calls.length)
            ).toStrictEqual([1, 0]);

            cleanupActiveTabState();

            expect(
                unsubscribes.map((unsubscribe) => unsubscribe.mock.calls.length)
            ).toStrictEqual([1, 1]);
        });
    });

    describe("state integration", () => {
        it("should handle state subscription callback", () => {
            expect.assertions(7);

            appendTabElements([
                { id: "tab-summary", text: "Summary" },
                { active: true, id: "tab-chart", text: "Chart" },
                { id: "tab-map", text: "Map" },
            ]);

            initializeActiveTabState();
            getSubscriptionCallback()("summary");

            expectActiveState("tab-summary", true);
            expectActiveState("tab-chart", false);
            expectActiveState("tab-map", false);
            expect(
                getRequiredElement("tab-chart").classList.contains("active")
            ).not.toBe(true);
            expect(
                getRequiredElement("tab-summary").getAttribute("aria-selected")
            ).toBe("true");
            expect(
                getRequiredElement("tab-chart").getAttribute("aria-selected")
            ).toBe("false");
            expect(
                getRequiredElement("tab-map").getAttribute("aria-selected")
            ).toBe("false");
        });

        it("should handle realistic user interaction flow", () => {
            expect.assertions(5);

            appendTabElements([
                { active: true, id: "tab-summary", text: "Summary" },
                { id: "tab-chart", text: "Chart" },
                { id: "tab-map", text: "Map" },
            ]);

            initializeActiveTabState();
            getRequiredElement("tab-chart").click();

            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chart", {
                source: "tabButtonClick",
            });

            getSubscriptionCallback()("chart");

            expectActiveState("tab-summary", false);
            expectActiveState("tab-chart", true);
            expectActiveState("tab-map", false);

            mockGetState.mockReturnValue("chart");
            expect(getActiveTab()).toBe("chart");
        });

        it("should handle setState errors gracefully", () => {
            expect.assertions(2);

            appendTabElement({ id: "tab-summary", text: "Summary" });
            mockSetState.mockImplementation(() => {
                throw new Error("State error");
            });

            initializeActiveTabState();
            getRequiredElement("tab-summary").click();

            expect(getRequiredElement("tab-summary").id).toBe("tab-summary");
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "summary",
                { source: "tabButtonClick" }
            );
        });
    });

    describe("edge cases and error conditions", () => {
        it("should handle rapid successive calls", () => {
            expect.assertions(2);

            appendTabElement({ id: "tab-summary", text: "Summary" });

            for (let index = 0; index < 100; index += 1) {
                updateActiveTab("tab-summary");
            }

            expect(
                getRequiredElement("tab-summary").classList.contains("active")
            ).toBe(true);
            expect(mockSetState).toHaveBeenCalledTimes(100);
        });

        it("should handle malformed HTML gracefully", () => {
            expect.assertions(4);

            appendTabElements([
                { id: "tab-summary", text: "Summary" },
                { tagName: "div", text: "Not a button" },
                { id: "", text: "Empty ID" },
            ]);

            initializeActiveTabState();
            expectActiveTabSubscriptionRegistered();
            expect(testContainer.querySelectorAll(".tab-button")).toHaveLength(
                3
            );
            expect(updateActiveTab("tab-summary")).toStrictEqual(true);
            expectActiveState("tab-summary", true);
        });

        it("should reject malformed IDs that do not extract configured tab names", () => {
            expect.assertions(3);

            appendTabElement({ id: "malformed-id", text: "Test" });

            const updated = updateActiveTab("malformed-id");

            expect({
                updated,
            }).toStrictEqual({
                updated: false,
            });
            expectActiveState("malformed-id", false);
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should handle document.querySelectorAll returning empty array", () => {
            expect.assertions(3);

            const placeholder = document.createElement("div");
            placeholder.textContent = "No tab buttons";
            testContainer.appendChild(placeholder);

            const updated = updateActiveTab("tab-test");

            expect({
                updated,
            }).toStrictEqual({
                updated: false,
            });
            expect(testContainer.querySelectorAll(".tab-button")).toHaveLength(
                0
            );
            expect(mockSetState).not.toHaveBeenCalled();
        });
    });
});
