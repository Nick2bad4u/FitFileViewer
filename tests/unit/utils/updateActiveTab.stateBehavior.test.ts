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

vi.mock(
    import("../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: undefined,
        setState: undefined,
        subscribe: undefined,
    })
);

import {
    getActiveTab,
    initializeActiveTabState,
    updateActiveTab,
} from "../../../electron-app/utils/ui/tabs/updateActiveTab.js";

const { mockGetState, mockSetState, mockSubscribe } = vi.hoisted(() => ({
    mockGetState: vi.fn<GetState>(),
    mockSetState: vi.fn<SetState>(),
    mockSubscribe: vi.fn<Subscribe>(),
}));

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
    expect(getRequiredElement(id).classList.contains("active")).toBe(expected);
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

describe("updateActiveTab state behavior", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.replaceChildren();

        testContainer = document.createElement("div");
        testContainer.id = "test-container";
        document.body.appendChild(testContainer);

        mockGetState.mockReturnValue("summary");
        mockSubscribe.mockReturnValue(() => undefined);
        Object.assign(globalThis, {
            __vitest_effective_stateManager__: {
                getState: mockGetState,
                setState: mockSetState,
                subscribe: mockSubscribe,
            },
        });

        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        testContainer.remove();
        Reflect.deleteProperty(globalThis, "__vitest_effective_stateManager__");
        vi.restoreAllMocks();
        vi.resetAllMocks();
    });

    describe(updateActiveTab, () => {
        it("should keep the requested tab active when it is already selected", () => {
            expect.hasAssertions();

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
            expect.hasAssertions();

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

        it("should handle all tab ID patterns correctly", () => {
            expect.hasAssertions();

            appendTabElements([
                { id: "tab-test1", text: "Tab Pattern" },
                { id: "test2-tab", text: "Reverse Tab" },
                { id: "btn-test3", text: "Btn Pattern" },
                { id: "test4-btn", text: "Reverse Btn" },
                { id: "custom-element", text: "Fallback" },
            ]);

            expect(updateActiveTab("tab-test1")).toStrictEqual(true);
            expectActiveState("tab-test1", true);
            expect(mockSetState).toHaveBeenLastCalledWith(
                "ui.activeTab",
                "test1",
                { source: "updateActiveTab" }
            );

            expect(updateActiveTab("test2-tab")).toStrictEqual(true);
            expectActiveState("test2-tab", true);
            expect(mockSetState).toHaveBeenLastCalledWith(
                "ui.activeTab",
                "test2",
                { source: "updateActiveTab" }
            );

            expect(updateActiveTab("btn-test3")).toStrictEqual(true);
            expectActiveState("btn-test3", true);
            expect(mockSetState).toHaveBeenLastCalledWith(
                "ui.activeTab",
                "test3",
                { source: "updateActiveTab" }
            );

            expect(updateActiveTab("test4-btn")).toStrictEqual(true);
            expectActiveState("test4-btn", true);
            expect(mockSetState).toHaveBeenLastCalledWith(
                "ui.activeTab",
                "test4",
                { source: "updateActiveTab" }
            );

            expect(updateActiveTab("custom-element")).toStrictEqual(true);
            expectActiveState("custom-element", true);
            expect(mockSetState).toHaveBeenLastCalledWith(
                "ui.activeTab",
                "custom-element",
                { source: "updateActiveTab" }
            );
        });

        it("should remove active class from all tab buttons before setting new one", () => {
            expect.hasAssertions();

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
            expect.hasAssertions();

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
            expect.hasAssertions();

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
            expect.hasAssertions();

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
            expect.hasAssertions();

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

        it("should handle special characters in tab IDs", () => {
            expect.hasAssertions();

            const specialId = "test-special_chars.with+symbols";
            appendTabElement({
                id: `tab-${specialId}`,
                text: "Special",
            });

            const updated = updateActiveTab(`tab-${specialId}`);

            expect({
                updated,
            }).toStrictEqual({
                updated: true,
            });
            expectActiveState(`tab-${specialId}`, true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                specialId,
                { source: "updateActiveTab" }
            );
        });

        it("should work with large numbers of tab buttons", () => {
            expect.hasAssertions();

            for (let index = 0; index < 100; index += 1) {
                appendTabElement({
                    id: `tab-item${index}`,
                    text: `Tab ${index}`,
                });
            }

            const startTime = performance.now();
            const updated = updateActiveTab("tab-item50");
            const endTime = performance.now();

            expect({
                updated,
            }).toStrictEqual({
                updated: true,
            });
            expect(endTime - startTime).toBeLessThan(50);
            expectActiveState("tab-item50", true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "item50",
                { source: "updateActiveTab" }
            );
        });
    });

    describe(getActiveTab, () => {
        it("should return state value when available", () => {
            expect.hasAssertions();

            mockGetState.mockReturnValue("chart");

            expect(getActiveTab()).toBe("chart");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it('should return default "summary" when state is null', () => {
            expect.hasAssertions();

            mockGetState.mockReturnValue(null);

            expect(getActiveTab()).toBe("summary");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it('should return default "summary" when state is undefined', () => {
            expect.hasAssertions();

            mockGetState.mockReturnValue(undefined);

            expect(getActiveTab()).toBe("summary");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it('should return default "summary" when state is empty string', () => {
            expect.hasAssertions();

            mockGetState.mockReturnValue("");

            expect(getActiveTab()).toBe("summary");
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
        });

        it("should handle state manager errors", () => {
            expect.hasAssertions();

            mockGetState.mockImplementation(() => {
                throw new Error("State error");
            });

            expect(() => getActiveTab()).toThrow("State error");
        });

        it("should call getState exactly once", () => {
            expect.hasAssertions();

            mockGetState.mockReturnValue("data");

            expect(getActiveTab()).toBe("data");
            expect(mockGetState).toHaveBeenCalledOnce();
        });
    });

    describe(initializeActiveTabState, () => {
        it("should set up state subscription", () => {
            expect.hasAssertions();

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
            expect(mockSubscribe).toHaveBeenCalledWith(
                "ui.activeTab",
                expect.any(Function)
            );
        });

        it("should set up click listeners on tab buttons", () => {
            expect.hasAssertions();

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
            expect.hasAssertions();

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
            ).toStrictEqual(true);
            expect(mockSetState).toHaveBeenCalledTimes(0);

            getRequiredElement("tab-map").click();
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "map", {
                source: "tabButtonClick",
            });
        });

        it("should handle buttons without IDs gracefully", () => {
            expect.hasAssertions();

            const button = appendTabElement({ text: "No ID" });

            initializeActiveTabState();
            button.click();

            expect(button.id).toBe("");
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should work with no tab buttons present", () => {
            expect.hasAssertions();

            const placeholder = document.createElement("div");
            placeholder.textContent = "No tab buttons";
            testContainer.appendChild(placeholder);

            initializeActiveTabState();
            expect(testContainer.querySelectorAll(".tab-button")).toHaveLength(
                0
            );
            expect(mockSubscribe).toHaveBeenCalledWith(
                "ui.activeTab",
                expect.any(Function)
            );
        });
    });

    describe("state integration", () => {
        it("should handle state subscription callback", () => {
            expect.hasAssertions();

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
            expect([
                ...getRequiredElement("tab-chart").classList,
            ]).not.toContain("active");
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
            expect.hasAssertions();

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
            expect.hasAssertions();

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
            expect.hasAssertions();

            appendTabElement({ id: "tab-summary", text: "Summary" });

            for (let index = 0; index < 100; index += 1) {
                updateActiveTab("tab-summary");
            }

            expect(
                getRequiredElement("tab-summary").classList.contains("active")
            ).toStrictEqual(true);
            expect(mockSetState).toHaveBeenCalledTimes(100);
        });

        it("should handle malformed HTML gracefully", () => {
            expect.hasAssertions();

            appendTabElements([
                { id: "tab-test", text: "Test" },
                { tagName: "div", text: "Not a button" },
                { id: "", text: "Empty ID" },
            ]);

            initializeActiveTabState();
            expect(mockSubscribe).toHaveBeenCalledWith(
                "ui.activeTab",
                expect.any(Function)
            );
            expect(testContainer.querySelectorAll(".tab-button")).toHaveLength(
                3
            );
            expect(updateActiveTab("tab-test")).toStrictEqual(true);
            expectActiveState("tab-test", true);
        });

        it("should handle missing extractTabName function gracefully", () => {
            expect.hasAssertions();

            appendTabElement({ id: "malformed-id", text: "Test" });

            const updated = updateActiveTab("malformed-id");

            expect({
                updated,
            }).toStrictEqual({
                updated: true,
            });
            expectActiveState("malformed-id", true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "malformed-id",
                { source: "updateActiveTab" }
            );
        });

        it("should handle document.querySelectorAll returning empty array", () => {
            expect.hasAssertions();

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
