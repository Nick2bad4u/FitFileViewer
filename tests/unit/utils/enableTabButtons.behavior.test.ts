// @vitest-environment jsdom
/**
 * Covers enableTabButtons state management, DOM manipulation, and diagnostic
 * helpers.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
    getState as getStateSignature,
    setState as setStateSignature,
    subscribe as subscribeSignature,
} from "../../../electron-app/utils/state/core/stateManager.js";
import type { isHTMLElement as isHTMLElementSignature } from "../../../electron-app/utils/dom/index.js";

// Mock the state manager
vi.mock(
    import("../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: vi.fn<typeof getStateSignature>(),
        setState: vi.fn<typeof setStateSignature>(),
        subscribe: vi.fn<typeof subscribeSignature>(() => () => {}),
    })
);

// Mock DOM helpers
vi.mock(import("../../../electron-app/utils/dom/index.js"), () => ({
    isHTMLElement: vi.fn<typeof isHTMLElementSignature>(),
}));

import {
    setTabButtonsEnabled,
    initializeTabButtonState,
    areTabButtonsEnabled,
    debugTabButtons,
    forceEnableTabButtons,
    testTabButtonClicks,
    debugTabState,
    forceFixTabButtons,
    __resetTabButtonStateForTests,
} from "../../../electron-app/utils/ui/controls/enableTabButtons.js";

import {
    getState,
    setState,
    subscribe,
} from "../../../electron-app/utils/state/core/stateManager.js";
import { isHTMLElement } from "../../../electron-app/utils/dom/index.js";

const mockGetState = vi.mocked(getState);
const mockSetState = vi.mocked(setState);
const mockSubscribe = vi.mocked(subscribe);
const mockIsHTMLElement = vi.mocked(isHTMLElement);
let testContainer: HTMLElement;

type TestButtonOptions = {
    readonly ariaSelected?: string;
    readonly className?: string;
    readonly disabled?: boolean;
    readonly id?: string;
    readonly text?: string;
    readonly type?: "button" | "reset" | "submit";
};

type MutationObserverMock = Pick<MutationObserver, "disconnect" | "observe">;

type TestGlobalProperty = "getComputedStyle" | "MutationObserver" | "window";
type TestWindowProperty = "MutationObserver";

const originalGlobalDescriptors = new Map<
    TestGlobalProperty,
    PropertyDescriptor
>();
const originalWindowDescriptors = new Map<
    TestWindowProperty,
    PropertyDescriptor
>();

function createMutationObserverMock(): MutationObserverMock {
    return {
        disconnect: vi.fn<MutationObserver["disconnect"]>(),
        observe: vi.fn<MutationObserver["observe"]>(),
    };
}

function setTestGlobal(name: TestGlobalProperty, value: unknown): void {
    if (!originalGlobalDescriptors.has(name)) {
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);

        if (!descriptor) {
            throw new Error(`Expected globalThis.${name} to exist`);
        }

        originalGlobalDescriptors.set(name, descriptor);
    }

    Object.defineProperty(globalThis, name, {
        configurable: true,
        value,
        writable: true,
    });
}

function restoreTestGlobals(): void {
    for (const [name, descriptor] of originalWindowDescriptors) {
        Object.defineProperty(globalThis.window, name, descriptor);
    }
    originalWindowDescriptors.clear();

    for (const [name, descriptor] of originalGlobalDescriptors) {
        Object.defineProperty(globalThis, name, descriptor);
    }
    originalGlobalDescriptors.clear();
}

function setTestWindowProperty(
    name: TestWindowProperty,
    value: unknown
): void {
    if (!originalWindowDescriptors.has(name)) {
        const descriptor = Object.getOwnPropertyDescriptor(
            globalThis.window,
            name
        );

        if (!descriptor) {
            throw new Error(`Expected window.${name} to exist`);
        }

        originalWindowDescriptors.set(name, descriptor);
    }

    Object.defineProperty(globalThis.window, name, {
        configurable: true,
        value,
        writable: true,
    });
}

function setTestMutationObserver(value: unknown): void {
    setTestGlobal("MutationObserver", value);
    setTestWindowProperty("MutationObserver", value);
}

function createTestButton({
    ariaSelected,
    className = "tab-button",
    disabled = false,
    id = "",
    text = "",
    type,
}: TestButtonOptions = {}): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = className;
    button.disabled = disabled;
    button.id = id;
    button.textContent = text;

    if (ariaSelected !== undefined) {
        button.setAttribute("aria-selected", ariaSelected);
    }
    if (type !== undefined) {
        button.type = type;
    }

    return button;
}

function appendTestContent(...children: Node[]): void {
    testContainer.replaceChildren(...children);
}

function appendTabButtons(buttons: readonly TestButtonOptions[]): void {
    appendTestContent(...buttons.map((button) => createTestButton(button)));
}

function getRequiredButton(id: string): HTMLButtonElement {
    const button = document.getElementById(id);
    if (!(button instanceof HTMLButtonElement)) {
        throw new Error(`Expected button #${id} to exist`);
    }

    return button;
}

function queryRequiredButton(selector: string): HTMLButtonElement {
    const button = testContainer.querySelector(selector);
    if (!(button instanceof HTMLButtonElement)) {
        throw new Error(`Expected button ${selector} to exist`);
    }

    return button;
}

describe("enableTabButtons behavior", () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        __resetTabButtonStateForTests();
        // Reset all mocks
        vi.clearAllMocks();

        // Ensure document.body exists
        if (!document.body) {
            const body = document.createElement("body");
            document.appendChild(body);
        }

        // Set up DOM
        testContainer = document.createElement("div");
        testContainer.id = "test-container";
        document.body.appendChild(testContainer);

        // Mock console methods to reduce noise
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        // Mock isHTMLElement to return true for HTMLElements
        mockIsHTMLElement.mockImplementation((el) => el instanceof HTMLElement);

        // Default state mocks
        mockGetState.mockReturnValue(false);

        const testWindow = {
            ...global.window,
            getComputedStyle: vi
                .fn<typeof globalThis.getComputedStyle>()
                .mockReturnValue({
                    pointerEvents: "auto",
                    cursor: "pointer",
                    opacity: "1",
                } as CSSStyleDeclaration),
            MutationObserver: vi
                .fn<(callback: MutationCallback) => MutationObserver>()
                .mockReturnValue(
                    createMutationObserverMock() as MutationObserver
                ),
        };

        // CRITICAL: keep global window lookups scoped to the same fixture.
        setTestGlobal("window", testWindow);
    });

    afterEach(() => {
        // Clean up DOM
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }

        consoleLogSpy.mockRestore();
        consoleWarnSpy.mockRestore();

        vi.resetAllMocks();
        restoreTestGlobals();
    });

    it("does not publish tab-button helpers globally", () => {
        expect.assertions(1);

        expect({
            areTabButtonsEnabled: Reflect.has(
                globalThis,
                "areTabButtonsEnabled"
            ),
            debugTabButtons: Reflect.has(globalThis, "debugTabButtons"),
            debugTabState: Reflect.has(globalThis, "debugTabState"),
            forceEnableTabButtons: Reflect.has(
                globalThis,
                "forceEnableTabButtons"
            ),
            forceFixTabButtons: Reflect.has(globalThis, "forceFixTabButtons"),
            setTabButtonsEnabled: Reflect.has(
                globalThis,
                "setTabButtonsEnabled"
            ),
            tabButtonObserver: Reflect.has(globalThis, "tabButtonObserver"),
            tabButtonsCurrentlyEnabled: Reflect.has(
                globalThis,
                "tabButtonsCurrentlyEnabled"
            ),
            testTabButtonClicks: Reflect.has(globalThis, "testTabButtonClicks"),
        }).toStrictEqual({
            areTabButtonsEnabled: false,
            debugTabButtons: false,
            debugTabState: false,
            forceEnableTabButtons: false,
            forceFixTabButtons: false,
            setTabButtonsEnabled: false,
            tabButtonObserver: false,
            tabButtonsCurrentlyEnabled: false,
            testTabButtonClicks: false,
        });
    });

    describe("setTabButtonsEnabled function", () => {
        it("should disable all tab buttons except open file button", () => {
            expect.assertions(2);
            appendTabButtons([
                { id: "openFileBtn", text: "Open File" },
                { id: "tab-summary", text: "Summary" },
                { id: "tab-chart", text: "Chart" },
                { id: "tab-map", text: "Map" },
            ]);

            setTabButtonsEnabled(false);

            const openFileBtn = getRequiredButton("openFileBtn");
            const summaryBtn = getRequiredButton("tab-summary");
            const chartBtn = getRequiredButton("tab-chart");
            const mapBtn = getRequiredButton("tab-map");

            expect({
                chartDisabled: chartBtn.hasAttribute("disabled"),
                mapDisabled: mapBtn.hasAttribute("disabled"),
                openFileDisabled: openFileBtn.hasAttribute("disabled"),
                summaryDisabled: summaryBtn.hasAttribute("disabled"),
            }).toStrictEqual({
                chartDisabled: true,
                mapDisabled: true,
                openFileDisabled: false,
                summaryDisabled: true,
            });

            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                false,
                {
                    source: "setTabButtonsEnabled",
                }
            );
        });

        it("should enable all tab buttons except open file button", () => {
            expect.assertions(2);
            appendTabButtons([
                { id: "openFileBtn", text: "Open File" },
                { id: "tab-summary", disabled: true, text: "Summary" },
                { id: "tab-chart", disabled: true, text: "Chart" },
            ]);

            setTabButtonsEnabled(true);

            const summaryBtn = getRequiredButton("tab-summary");
            const chartBtn = getRequiredButton("tab-chart");

            expect({
                chartDisabled: chartBtn.hasAttribute("disabled"),
                summaryDisabled: summaryBtn.hasAttribute("disabled"),
            }).toStrictEqual({
                chartDisabled: false,
                summaryDisabled: false,
            });

            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                true,
                { source: "setTabButtonsEnabled" }
            );
        });

        it("should handle multiple open file button ID variants", () => {
            expect.assertions(1);
            appendTabButtons([
                { id: "open-file-btn", text: "Open File" },
                {
                    className: "tab-button open-file-btn",
                    text: "Open File Alt",
                },
                { id: "tab-summary", text: "Summary" },
            ]);

            setTabButtonsEnabled(false);

            const openFileBtn1 = getRequiredButton("open-file-btn");
            const openFileBtn2 = queryRequiredButton(".open-file-btn");
            const summaryBtn = getRequiredButton("tab-summary");

            expect({
                openFileButtonDisabled: openFileBtn1.hasAttribute("disabled"),
                openFileClassDisabled: openFileBtn2.hasAttribute("disabled"),
                summaryDisabled: summaryBtn.hasAttribute("disabled"),
            }).toStrictEqual({
                openFileButtonDisabled: false,
                openFileClassDisabled: false,
                summaryDisabled: true,
            });
        });

        it("should update state without publishing private enabled state globally", () => {
            expect.assertions(1);
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            setTabButtonsEnabled(true);

            const tabButtonGlobal = globalThis as typeof globalThis & {
                tabButtonsCurrentlyEnabled?: boolean;
            };
            const tabButtonWindow = window as Window & {
                tabButtonsCurrentlyEnabled?: boolean;
            };
            const nodeGlobalWindow = (
                global as typeof globalThis & {
                    window: Window & { tabButtonsCurrentlyEnabled?: boolean };
                }
            ).window;

            expect({
                globalThisTabButtonsEnabled:
                    tabButtonGlobal.tabButtonsCurrentlyEnabled,
                globalThisWindowIsNodeGlobalWindow:
                    globalThis.window === nodeGlobalWindow,
                nodeGlobalWindowTabButtonsEnabled:
                    nodeGlobalWindow.tabButtonsCurrentlyEnabled,
                stateWrite: mockSetState.mock.calls.at(-1),
                windowIsNodeGlobalWindow: window === nodeGlobalWindow,
                windowTabButtonsEnabled:
                    tabButtonWindow.tabButtonsCurrentlyEnabled,
            }).toStrictEqual({
                globalThisTabButtonsEnabled: undefined,
                globalThisWindowIsNodeGlobalWindow: true,
                nodeGlobalWindowTabButtonsEnabled: undefined,
                stateWrite: [
                    "ui.tabButtonsEnabled",
                    true,
                    { source: "setTabButtonsEnabled" },
                ],
                windowIsNodeGlobalWindow: true,
                windowTabButtonsEnabled: undefined,
            });
        });

        it("should apply comprehensive styling when disabling", () => {
            expect.assertions(3);
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            setTabButtonsEnabled(false);

            const testBtn = getRequiredButton("tab-test");
            expect(testBtn.getAttribute("aria-disabled")).toBe("true");
            expect([...testBtn.classList]).toStrictEqual([
                "tab-button",
                "tab-disabled",
            ]);
            expect(testBtn.style.pointerEvents).toBe("none");
        });

        it("should apply comprehensive styling when enabling", () => {
            expect.assertions(5);
            appendTabButtons([
                {
                    id: "tab-test",
                    className: "tab-button tab-disabled",
                    disabled: true,
                    text: "Test",
                },
            ]);

            setTabButtonsEnabled(true);

            const testBtn = getRequiredButton("tab-test");
            expect(testBtn.getAttribute("aria-disabled")).toBe("false");
            expect([...testBtn.classList]).toStrictEqual(["tab-button"]);
            expect(testBtn.style.cursor).toBe("pointer");
            expect(testBtn.style.opacity).toBe("1");
            expect(testBtn.style.pointerEvents).toBe("auto");
        });

        it("should handle elements that are not HTMLElements gracefully", () => {
            expect.assertions(3);
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            // Mock isHTMLElement to return false
            mockIsHTMLElement.mockReturnValue(false);

            setTabButtonsEnabled(false);

            // Should still call setState
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                false,
                {
                    source: "setTabButtonsEnabled",
                }
            );
            expect(
                getRequiredButton("tab-test").hasAttribute("disabled")
            ).toStrictEqual(false);
            expect(
                getRequiredButton("tab-test").hasAttribute("disabled")
            ).not.toStrictEqual(true);
        });

        it("should handle nuclear option for stubborn disabled attributes", () => {
            expect.assertions(2);
            appendTabButtons([
                { id: "tab-test", disabled: true, text: "Test" },
            ]);

            // Mock a button that keeps its disabled attribute
            const testBtn = getRequiredButton("tab-test");
            const originalHasAttribute = testBtn.hasAttribute.bind(testBtn);
            vi.spyOn(testBtn, "hasAttribute").mockImplementation((attr) => {
                if (attr === "disabled") return true;
                return originalHasAttribute(attr);
            });

            const mockParent = {
                replaceChild: vi.fn<Node["replaceChild"]>(),
            } as unknown as ParentNode;
            vi.spyOn(testBtn, "parentNode", "get").mockReturnValue(mockParent);
            vi.spyOn(testBtn, "cloneNode").mockReturnValue(testBtn);

            setTabButtonsEnabled(true);

            // Should attempt nuclear option
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[TabButtons] CRITICAL: Using nuclear option for tab-test"
            );
            expect(testBtn.style.pointerEvents).toBe("auto");
        });
    });

    describe("initializeTabButtonState function", () => {
        it("should set up state subscription and initial disabled state", () => {
            expect.assertions(3);
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            initializeTabButtonState();

            expect(
                mockSubscribe.mock.calls.map(([path, callback]) => [
                    path,
                    typeof callback,
                ])
            ).toStrictEqual([["fitFile.rawData", "function"]]);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                false,
                {
                    source: "setTabButtonsEnabled",
                }
            );
            expect(
                getRequiredButton("tab-test").hasAttribute("disabled")
            ).toStrictEqual(true);
        });

        it("should enable tabs when FIT raw data is present", () => {
            expect.assertions(3);
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            initializeTabButtonState();

            // Get the subscription callback
            const subscriptionCallback = mockSubscribe.mock.calls[0]?.[1] as
                | ((data: unknown) => void)
                | undefined;
            expect(subscriptionCallback).toBeTypeOf("function");

            subscriptionCallback?.({ someData: true });

            expect(
                getRequiredButton("tab-test").hasAttribute("disabled")
            ).toStrictEqual(false);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                true,
                {
                    source: "setTabButtonsEnabled",
                }
            );
        });

        it("should disable tabs when FIT raw data is null/undefined", () => {
            expect.assertions(4);
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            initializeTabButtonState();

            const subscriptionCallback = mockSubscribe.mock.calls[0]?.[1] as
                | ((data: unknown) => void)
                | undefined;
            expect(subscriptionCallback).toBeTypeOf("function");

            subscriptionCallback?.(null);
            expect(
                getRequiredButton("tab-test").hasAttribute("disabled")
            ).toStrictEqual(true);

            getRequiredButton("tab-test").removeAttribute("disabled");
            subscriptionCallback?.(undefined);

            expect(getRequiredButton("tab-test").disabled).toStrictEqual(true);
            expect(
                mockSetState.mock.calls.filter(([, value]) => value === false)
            ).toHaveLength(3);
        });

        it("should set up MutationObserver when window is available", () => {
            expect.assertions(3);
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            const mockObserver = createMutationObserverMock();

            const MutationObserverSpy = vi
                .fn<(callback: MutationCallback) => MutationObserver>()
                .mockImplementation(function MutationObserverMock(callback) {
                    void callback;
                    return mockObserver as MutationObserver;
                });

            // Mock both scopes to ensure the implementation finds our spy
            setTestMutationObserver(MutationObserverSpy);

            initializeTabButtonState();

            expect(
                MutationObserverSpy.mock.calls.map(([callback]) => [
                    typeof callback,
                ])
            ).toStrictEqual([["function"]]);
            expect(mockObserver.observe).toHaveBeenCalledWith(
                getRequiredButton("tab-test"),
                {
                    attributeFilter: ["disabled"],
                    attributes: true,
                }
            );
            expect(Reflect.has(globalThis, "tabButtonObserver")).toBe(false);
        });

        it("should not create duplicate MutationObserver", () => {
            expect.assertions(2);
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            const mockObserver = createMutationObserverMock();
            const mutationObserverSpy = vi
                .fn<(callback: MutationCallback) => MutationObserver>()
                .mockImplementation(function MutationObserverMock(callback) {
                    void callback;
                    return mockObserver as MutationObserver;
                });

            setTestMutationObserver(mutationObserverSpy);

            initializeTabButtonState();
            initializeTabButtonState();

            expect(mutationObserverSpy).toHaveBeenCalledOnce();
            expect(Reflect.has(globalThis, "tabButtonObserver")).toBe(false);
        });
    });

    describe("areTabButtonsEnabled function", () => {
        it("should return current state value", () => {
            expect.assertions(2);
            mockGetState.mockReturnValue(true);

            const result = areTabButtonsEnabled();

            expect(result).toStrictEqual(true);
            expect(mockGetState).toHaveBeenCalledWith("ui.tabButtonsEnabled");
        });

        it("should return false when state is falsy", () => {
            expect.assertions(2);
            mockGetState.mockReturnValue(null);

            const result = areTabButtonsEnabled();

            expect(result).toStrictEqual(false);
            expect(result).not.toStrictEqual(true);
        });
    });

    describe("debugTabButtons function", () => {
        it("should log debug information for all tab buttons", () => {
            expect.assertions(6);
            appendTabButtons([
                { id: "openFileBtn", text: "Open File" },
                { id: "tab-summary", text: "Summary" },
            ]);

            mockGetState.mockImplementation((key) => {
                const state = new Map<string, unknown>([
                    ["fitFile.rawData", { test: true }],
                    ["isLoading", false],
                    ["ui.tabButtonsEnabled", true],
                ]);

                return typeof key === "string"
                    ? (state.get(key) ?? null)
                    : null;
            });

            debugTabButtons();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[TabButtons] === DEBUG TAB BUTTONS ==="
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[TabButtons] SKIPPING open file button: openFileBtn"
            );
            expect(mockGetState).toHaveBeenCalledWith("fitFile.rawData");
            expect(mockGetState).toHaveBeenCalledWith("isLoading");
            expect(mockGetState).toHaveBeenCalledWith("ui.tabButtonsEnabled");
            expect(getRequiredButton("tab-summary").disabled).toStrictEqual(
                false
            );
        });

        it("should handle buttons without IDs gracefully", () => {
            expect.assertions(2);
            appendTabButtons([{ text: "No ID" }]);

            debugTabButtons();

            const buttonWithoutId = testContainer.querySelector(".tab-button");
            expect({
                disabled:
                    buttonWithoutId instanceof HTMLButtonElement
                        ? buttonWithoutId.disabled
                        : null,
                id: buttonWithoutId?.id,
                tabButtonCount:
                    testContainer.querySelectorAll(".tab-button").length,
            }).toStrictEqual({
                disabled: false,
                id: "",
                tabButtonCount: 1,
            });
            const noIdButtonLog = consoleLogSpy.mock.calls.find(([message]) =>
                String(message).includes("Button No ID:")
            );
            expect({
                disabled: (noIdButtonLog?.[1] as { disabled?: unknown })
                    ?.disabled,
                messageIncludesNoId: String(noIdButtonLog?.[0]).includes(
                    "Button No ID:"
                ),
            }).toStrictEqual({ disabled: false, messageIncludesNoId: true });
        });
    });

    describe("forceEnableTabButtons function", () => {
        it("should aggressively enable all tab buttons", () => {
            expect.assertions(4);
            appendTabButtons([
                { id: "openFileBtn", text: "Open File" },
                {
                    id: "tab-summary",
                    className: "tab-button tab-disabled",
                    disabled: true,
                    text: "Summary",
                },
            ]);

            forceEnableTabButtons();

            const summaryBtn = getRequiredButton("tab-summary");
            expect([...summaryBtn.classList]).toStrictEqual(["tab-button"]);
            expect(summaryBtn.hasAttribute("disabled")).toStrictEqual(false);
            expect(summaryBtn.style.pointerEvents).toBe("auto");

            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                true,
                {
                    source: "forceEnableTabButtons",
                }
            );
        });

        it("should skip open file buttons", () => {
            expect.assertions(4);
            appendTabButtons([
                { id: "openFileBtn", text: "Open File" },
                { id: "tab-summary", text: "Summary" },
            ]);

            forceEnableTabButtons();

            expect(
                getRequiredButton("openFileBtn").style.pointerEvents
            ).not.toBe("auto");
            expect(getRequiredButton("tab-summary").style.pointerEvents).toBe(
                "auto"
            );
            expect(consoleLogSpy).not.toHaveBeenCalledWith(
                "[TabButtons] Force enabled: openFileBtn"
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[TabButtons] Force enabled: tab-summary"
            );
        });
    });

    describe("testTabButtonClicks function", () => {
        it("should add test click handlers to tab buttons", () => {
            expect.assertions(3);
            appendTabButtons([
                { id: "openFileBtn", text: "Open File" },
                { id: "tab-summary", text: "Summary" },
            ]);

            testTabButtonClicks();
            const clickEvent = new PointerEvent("click", { bubbles: true });
            getRequiredButton("tab-summary").dispatchEvent(clickEvent);

            expect(getRequiredButton("tab-summary").isConnected).toStrictEqual(
                true
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[TabButtons] Added test handler to: tab-summary"
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[TabButtons] TEST CLICK DETECTED on tab-summary!",
                clickEvent
            );
        });

        it("should skip open file buttons", () => {
            expect.assertions(2);
            appendTabButtons([{ id: "openFileBtn", text: "Open File" }]);

            testTabButtonClicks();

            const openFileButton = getRequiredButton("openFileBtn");
            expect({
                disabled: openFileButton.disabled,
                pointerEvents: openFileButton.style.pointerEvents,
            }).toStrictEqual({
                disabled: false,
                pointerEvents: "",
            });
            expect(consoleLogSpy).not.toHaveBeenCalledWith(
                "[TabButtons] Added test handler to: openFileBtn"
            );
        });

        it("should remove test handlers after timeout", () => {
            expect.assertions(2);
            vi.useFakeTimers();

            appendTabButtons([{ id: "tab-summary", text: "Summary" }]);

            const summaryBtn = getRequiredButton("tab-summary");
            const removeEventListenerSpy = vi.spyOn(
                summaryBtn,
                "removeEventListener"
            );

            testTabButtonClicks();

            // Fast forward time
            vi.advanceTimersByTime(30000);

            expect(
                removeEventListenerSpy.mock.calls.map(
                    ([eventName, listener]) => [eventName, typeof listener]
                )
            ).toStrictEqual([["click", "function"]]);
            expect(summaryBtn.isConnected).toStrictEqual(true);

            vi.useRealTimers();
        });
    });

    describe("debugTabState function", () => {
        it("should log current tab states and application state", () => {
            expect.assertions(6);
            appendTabButtons([
                {
                    id: "tab-summary",
                    className: "tab-button active",
                    ariaSelected: "true",
                    text: "Summary",
                },
            ]);

            mockGetState.mockImplementation((key) => {
                const state = new Map<string, unknown>([
                    ["ui.activeTab", "summary"],
                    ["fitFile.rawData", { test: true }],
                    ["ui.tabButtonsEnabled", true],
                ]);

                return typeof key === "string"
                    ? (state.get(key) ?? null)
                    : null;
            });

            debugTabState();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[TabButtons] === CURRENT TAB STATE ==="
            );
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
            expect(mockGetState).toHaveBeenCalledWith("fitFile.rawData");
            expect(mockGetState).toHaveBeenCalledWith("ui.tabButtonsEnabled");
            expect(getRequiredButton("tab-summary").className).toBe(
                "tab-button active"
            );
            expect(
                getRequiredButton("tab-summary").getAttribute("aria-selected")
            ).not.toBe("false");
        });
    });

    describe("forceFixTabButtons function", () => {
        it("should aggressively fix all tab button states", () => {
            expect.assertions(8);
            appendTabButtons([
                { id: "openFileBtn", text: "Open File" },
                {
                    id: "tab-summary",
                    className: "tab-button tab-disabled",
                    disabled: true,
                    text: "Summary",
                },
            ]);

            forceFixTabButtons();

            const summaryBtn = getRequiredButton("tab-summary");
            expect([...summaryBtn.classList]).toStrictEqual(["tab-button"]);
            expect(summaryBtn.style.cursor).toBe("pointer");
            expect(summaryBtn.hasAttribute("disabled")).toStrictEqual(false);
            expect(summaryBtn.style.filter).toBe("none");
            expect(summaryBtn.style.opacity).toBe("1");
            expect(summaryBtn.style.pointerEvents).toBe("auto");
            expect(
                getRequiredButton("openFileBtn").style.pointerEvents
            ).not.toBe("auto");

            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                true,
                { source: "forceFixTabButtons" }
            );
        });

        it("should log before and after states", () => {
            expect.assertions(3);
            appendTabButtons([{ id: "tab-summary", text: "Summary" }]);

            forceFixTabButtons();

            expect(getRequiredButton("tab-summary").style.pointerEvents).toBe(
                "auto"
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[TabButtons] BEFORE FIX: tab-summary disabled=false"
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[TabButtons] AFTER FIX: tab-summary disabled=false"
            );
        });
    });

    describe("edge cases and error conditions", () => {
        it("should handle empty DOM gracefully", () => {
            expect.assertions(4);
            testContainer.replaceChildren();

            setTabButtonsEnabled(true);
            debugTabButtons();
            forceEnableTabButtons();

            expect(testContainer.childElementCount).toStrictEqual(0);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                true,
                { source: "setTabButtonsEnabled" }
            );
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                true,
                { source: "forceEnableTabButtons" }
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[TabButtons] === DEBUG TAB BUTTONS ==="
            );
        });

        it("should handle buttons without parent nodes in nuclear option", () => {
            expect.assertions(3);
            appendTabButtons([
                { id: "tab-test", disabled: true, text: "Test" },
            ]);

            const testBtn = getRequiredButton("tab-test");
            vi.spyOn(testBtn, "hasAttribute").mockReturnValue(true);
            vi.spyOn(testBtn, "parentNode", "get").mockReturnValue(null);
            const cloneNodeSpy = vi
                .spyOn(testBtn, "cloneNode")
                .mockReturnValue(testBtn);
            const replaceWithSpy = vi.spyOn(testBtn, "replaceWith");

            setTabButtonsEnabled(true);

            expect(testBtn.style.pointerEvents).toBe("auto");
            expect(cloneNodeSpy).toHaveBeenCalledWith(true);
            expect(replaceWithSpy).not.toHaveBeenCalled();
        });

        it("should handle missing getComputedStyle", () => {
            expect.assertions(1);
            // Mock getComputedStyle to throw an error for this coverage branch.
            setTestGlobal("getComputedStyle", () => {
                throw new Error("getComputedStyle not available");
            });

            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            expect(() => debugTabButtons()).toThrow(
                "getComputedStyle not available"
            );
        });

        it("should handle undefined window object", () => {
            expect.assertions(3);
            setTestGlobal("window", undefined);

            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            setTabButtonsEnabled(true);
            initializeTabButtonState();

            expect(
                getRequiredButton("tab-test").hasAttribute("disabled")
            ).toStrictEqual(true);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                true,
                { source: "setTabButtonsEnabled" }
            );
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                false,
                { source: "setTabButtonsEnabled" }
            );
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete enable/disable cycle", () => {
            expect.assertions(5);
            appendTabButtons([
                { id: "tab-summary", text: "Summary" },
                { id: "tab-chart", text: "Chart" },
            ]);

            // Start with disable
            setTabButtonsEnabled(false);

            const summaryBtn = getRequiredButton("tab-summary");
            const chartBtn = getRequiredButton("tab-chart");

            expect({
                chartDisabled: chartBtn.hasAttribute("disabled"),
                summaryDisabled: summaryBtn.hasAttribute("disabled"),
            }).toStrictEqual({
                chartDisabled: true,
                summaryDisabled: true,
            });
            expect(summaryBtn.style.pointerEvents).not.toBe("auto");

            // Then enable
            setTabButtonsEnabled(true);

            expect({
                chartDisabled: chartBtn.hasAttribute("disabled"),
                summaryDisabled: summaryBtn.hasAttribute("disabled"),
            }).toStrictEqual({
                chartDisabled: false,
                summaryDisabled: false,
            });

            // Verify state calls
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                false,
                {
                    source: "setTabButtonsEnabled",
                }
            );
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                true,
                { source: "setTabButtonsEnabled" }
            );
        });

        it("should handle MutationObserver callback for unauthorized changes", () => {
            expect.assertions(4);
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            let mutationCallback:
                | ((mutations: readonly Partial<MutationRecord>[]) => void)
                | undefined;

            // Mock both global and window scope MutationObserver to capture callback
            const MockObserverClass = vi
                .fn<(callback: MutationCallback) => MutationObserver>()
                .mockImplementation(function MutationObserverMock(callback) {
                    mutationCallback = callback;
                    return createMutationObserverMock() as MutationObserver;
                });

            setTestMutationObserver(MockObserverClass);
            setTabButtonsEnabled(true);

            initializeTabButtonState();

            // Sanity check to ensure setup is correct
            const testBtn = getRequiredButton("tab-test");
            expect(mutationCallback).toBeTypeOf("function");

            const mockMutation = {
                attributeName: "disabled",
                target: testBtn,
                type: "attributes",
            };

            vi.spyOn(testBtn, "hasAttribute").mockReturnValue(true);
            const removeAttributeSpy = vi.spyOn(testBtn, "removeAttribute");
            testBtn.classList.add("tab-button");

            mutationCallback?.([mockMutation]);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[TabButtons] UNAUTHORIZED: disabled attribute added to tab-test when tabs should be enabled!"
            );
            expect(removeAttributeSpy).toHaveBeenCalledWith("disabled");
            expect(testBtn.disabled).toStrictEqual(false);
        });
    });
});
