/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: undefined,
    setState: undefined,
    subscribe: undefined,
}));

import {
    getActiveTab,
    initializeActiveTabState,
    updateActiveTab,
} from "../../../utils/ui/tabs/updateActiveTab.js";

const { mockGetState, mockSetState, mockSubscribe } = vi.hoisted(() => ({
    mockGetState: vi.fn(),
    mockSetState: vi.fn(),
    mockSubscribe: vi.fn(),
}));

type SubscriptionCallback = (newValue: unknown) => void;
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

function getSubscriptionCallback(): SubscriptionCallback {
    const callback = mockSubscribe.mock.calls[0]?.[1];

    if (typeof callback !== "function") {
        throw new TypeError("Expected active tab subscription callback");
    }

    return callback as SubscriptionCallback;
}

describe("updateActiveTab", () => {
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

    describe("updateActiveTab", () => {
        it("should keep the requested tab active when it is already selected", () => {
            appendTabElements([
                { active: true, id: "tab-summary", text: "Summary" },
                { id: "tab-chart", text: "Chart" },
            ]);

            const updated = updateActiveTab("tab-summary");

            expect(updated).toBe(true);
            expectActiveState("tab-summary", true);
            expectActiveState("tab-chart", false);
            expect(mockSetState).toHaveBeenCalledOnce();
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "summary",
                { source: "updateActiveTab" }
            );
        });

        it("should update tab classes correctly for standard tab pattern", () => {
            appendTabElements([
                { active: true, id: "tab-summary", text: "Summary" },
                { id: "tab-chart", text: "Chart" },
                { id: "tab-map", text: "Map" },
            ]);

            const updated = updateActiveTab("tab-chart");

            expect(updated).toBe(true);
            expectActiveState("tab-summary", false);
            expectActiveState("tab-chart", true);
            expectActiveState("tab-map", false);
            expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "chart", {
                source: "updateActiveTab",
            });
        });

        it("should handle all tab ID patterns correctly", () => {
            appendTabElements([
                { id: "tab-test1", text: "Tab Pattern" },
                { id: "test2-tab", text: "Reverse Tab" },
                { id: "btn-test3", text: "Btn Pattern" },
                { id: "test4-btn", text: "Reverse Btn" },
                { id: "custom-element", text: "Fallback" },
            ]);

            expect(updateActiveTab("tab-test1")).toBe(true);
            expectActiveState("tab-test1", true);
            expect(mockSetState).toHaveBeenLastCalledWith(
                "ui.activeTab",
                "test1",
                { source: "updateActiveTab" }
            );

            expect(updateActiveTab("test2-tab")).toBe(true);
            expectActiveState("test2-tab", true);
            expect(mockSetState).toHaveBeenLastCalledWith(
                "ui.activeTab",
                "test2",
                { source: "updateActiveTab" }
            );

            expect(updateActiveTab("btn-test3")).toBe(true);
            expectActiveState("btn-test3", true);
            expect(mockSetState).toHaveBeenLastCalledWith(
                "ui.activeTab",
                "test3",
                { source: "updateActiveTab" }
            );

            expect(updateActiveTab("test4-btn")).toBe(true);
            expectActiveState("test4-btn", true);
            expect(mockSetState).toHaveBeenLastCalledWith(
                "ui.activeTab",
                "test4",
                { source: "updateActiveTab" }
            );

            expect(updateActiveTab("custom-element")).toBe(true);
            expectActiveState("custom-element", true);
            expect(mockSetState).toHaveBeenLastCalledWith(
                "ui.activeTab",
                "custom-element",
                { source: "updateActiveTab" }
            );
        });

        it("should remove active class from all tab buttons before setting new one", () => {
            appendTabElements([
                { active: true, id: "tab-summary", text: "Summary" },
                { active: true, id: "tab-chart", text: "Chart" },
                { active: true, id: "tab-map", text: "Map" },
            ]);

            expectActiveState("tab-summary", true);
            expectActiveState("tab-chart", true);
            expectActiveState("tab-map", true);

            const updated = updateActiveTab("tab-chart");

            expect(updated).toBe(true);
            expectActiveState("tab-summary", false);
            expectActiveState("tab-chart", true);
            expectActiveState("tab-map", false);
        });

        it("should handle null/undefined/empty tab IDs gracefully", () => {
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
            appendTabElement({ id: "tab-exists", text: "Exists" });

            const updated = updateActiveTab("tab-nonexistent");

            expect(updated).toBe(false);
            expectActiveState("tab-exists", false);
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should handle elements without classList", () => {
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

            expect(updated).toBe(false);
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should not call setState when no target tab exists", () => {
            const placeholder = document.createElement("div");
            placeholder.textContent = "No tab buttons";
            testContainer.appendChild(placeholder);

            const updated = updateActiveTab("tab-nonexistent");

            expect(updated).toBe(false);
            expect(testContainer.childElementCount).toBe(1);
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should handle special characters in tab IDs", () => {
            const specialId = "test-special_chars.with+symbols";
            appendTabElement({
                id: `tab-${specialId}`,
                text: "Special",
            });

            const updated = updateActiveTab(`tab-${specialId}`);

            expect(updated).toBe(true);
            expectActiveState(`tab-${specialId}`, true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                specialId,
                { source: "updateActiveTab" }
            );
        });

        it("should work with large numbers of tab buttons", () => {
            for (let index = 0; index < 100; index += 1) {
                appendTabElement({
                    id: `tab-item${index}`,
                    text: `Tab ${index}`,
                });
            }

            const startTime = performance.now();
            const updated = updateActiveTab("tab-item50");
            const endTime = performance.now();

            expect(updated).toBe(true);
            expect(endTime - startTime).toBeLessThan(50);
            expectActiveState("tab-item50", true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "item50",
                { source: "updateActiveTab" }
            );
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

            expect(getActiveTab()).toBe("data");
            expect(mockGetState).toHaveBeenCalledOnce();
        });
    });

    describe("initializeActiveTabState", () => {
        it("should set up state subscription", () => {
            appendTabElements([
                { id: "tab-summary", text: "Summary" },
                { id: "tab-chart", text: "Chart" },
            ]);

            const result = initializeActiveTabState();

            expect(result).toBeUndefined();
            expect(mockSubscribe).toHaveBeenCalledWith(
                "ui.activeTab",
                expect.any(Function)
            );
        });

        it("should set up click listeners on tab buttons", () => {
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
            ).toBe(true);

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
            const button = appendTabElement({ text: "No ID" });

            initializeActiveTabState();
            button.click();

            expect(button.id).toBe("");
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should work with no tab buttons present", () => {
            const placeholder = document.createElement("div");
            placeholder.textContent = "No tab buttons";
            testContainer.appendChild(placeholder);

            const result = initializeActiveTabState();

            expect(result).toBeUndefined();
            expect(testContainer.querySelectorAll(".tab-button")).toHaveLength(
                0
            );
            expect(mockSubscribe).toHaveBeenCalledWith(
                "ui.activeTab",
                expect.any(Function)
            );
        });
    });

    describe("State integration tests", () => {
        it("should handle state subscription callback", () => {
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

    describe("Edge cases and error conditions", () => {
        it("should handle rapid successive calls", () => {
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
            appendTabElements([
                { id: "tab-test", text: "Test" },
                { tagName: "div", text: "Not a button" },
                { id: "", text: "Empty ID" },
            ]);

            expect(initializeActiveTabState()).toBeUndefined();
            expect(mockSubscribe).toHaveBeenCalledWith(
                "ui.activeTab",
                expect.any(Function)
            );
            expect(testContainer.querySelectorAll(".tab-button")).toHaveLength(
                3
            );
            expect(updateActiveTab("tab-test")).toBe(true);
            expectActiveState("tab-test", true);
        });

        it("should handle missing extractTabName function gracefully", () => {
            appendTabElement({ id: "malformed-id", text: "Test" });

            const updated = updateActiveTab("malformed-id");

            expect(updated).toBe(true);
            expectActiveState("malformed-id", true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.activeTab",
                "malformed-id",
                { source: "updateActiveTab" }
            );
        });

        it("should handle document.querySelectorAll returning empty array", () => {
            const placeholder = document.createElement("div");
            placeholder.textContent = "No tab buttons";
            testContainer.appendChild(placeholder);

            const updated = updateActiveTab("tab-test");

            expect(updated).toBe(false);
            expect(testContainer.querySelectorAll(".tab-button")).toHaveLength(
                0
            );
            expect(mockSetState).not.toHaveBeenCalled();
        });
    });
});
