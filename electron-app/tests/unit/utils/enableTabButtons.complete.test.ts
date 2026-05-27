// @vitest-environment jsdom
/**
 * Comprehensive test suite for enableTabButtons module Testing tab button state
 * management, DOM manipulation, and debugging functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the state manager
vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(() => () => {}),
}));

// Mock DOM helpers
vi.mock("../../../utils/dom/index.js", () => ({
    isHTMLElement: vi.fn(),
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
} from "../../../utils/ui/controls/enableTabButtons.js";

import {
    getState,
    setState,
    subscribe,
} from "../../../utils/state/core/stateManager.js";
import { isHTMLElement } from "../../../utils/dom/index.js";

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

describe("enableTabButtons.js - Complete Test Suite", () => {
    let originalConsoleLog: typeof console.log;
    let originalConsoleWarn: typeof console.warn;
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
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
        originalConsoleLog = console.log;
        originalConsoleWarn = console.warn;
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        // Mock isHTMLElement to return true for HTMLElements
        mockIsHTMLElement.mockImplementation((el) => el instanceof HTMLElement);

        // Default state mocks
        mockGetState.mockReturnValue(false);

        // Mock window properties
        (global as any).window = {
            ...global.window,
            getComputedStyle: vi.fn().mockReturnValue({
                pointerEvents: "auto",
                cursor: "pointer",
                opacity: "1",
            }),
            MutationObserver: vi.fn().mockImplementation(() => ({
                observe: vi.fn(),
                disconnect: vi.fn(),
            })),
        };

        // CRITICAL: Sync globalThis.window to match global.window for scope consistency
        globalThis.window = global.window;

        // CRITICAL: Property descriptor pattern for tabButtonsCurrentlyEnabled scope synchronization
        let tabButtonsCurrentlyEnabledValue: boolean | undefined;
        Object.defineProperty(global.window, "tabButtonsCurrentlyEnabled", {
            get: () => tabButtonsCurrentlyEnabledValue,
            set: (value) => {
                tabButtonsCurrentlyEnabledValue = value;
            },
            configurable: true,
        });
        Object.defineProperty(globalThis, "tabButtonsCurrentlyEnabled", {
            get: () => tabButtonsCurrentlyEnabledValue,
            set: (value) => {
                tabButtonsCurrentlyEnabledValue = value;
            },
            configurable: true,
        });
    });

    afterEach(() => {
        // Clean up DOM
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }

        // Restore console methods
        console.log = originalConsoleLog;
        console.warn = originalConsoleWarn;

        // Clean up global window properties
        if ((global as any).window.tabButtonsCurrentlyEnabled !== undefined) {
            delete (global as any).window.tabButtonsCurrentlyEnabled;
        }
        if ((global as any).window.tabButtonObserver) {
            delete (global as any).window.tabButtonObserver;
        }

        vi.resetAllMocks();
    });

    describe("setTabButtonsEnabled function", () => {
        it("should disable all tab buttons except open file button", () => {
            appendTabButtons([
                { id: "openFileBtn", text: "Open File" },
                { id: "tab-summary", text: "Summary" },
                { id: "tab-chart", text: "Chart" },
                { id: "tab-map", text: "Map" },
            ]);

            setTabButtonsEnabled(false);

            const openFileBtn = document.getElementById("openFileBtn");
            const summaryBtn = document.getElementById("tab-summary");
            const chartBtn = document.getElementById("tab-chart");
            const mapBtn = document.getElementById("tab-map");

            // Open file button should remain enabled
            expect(openFileBtn?.hasAttribute("disabled")).toBe(false);

            // Other buttons should be disabled
            expect(summaryBtn?.hasAttribute("disabled")).toBe(true);
            expect(chartBtn?.hasAttribute("disabled")).toBe(true);
            expect(mapBtn?.hasAttribute("disabled")).toBe(true);

            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                false,
                {
                    source: "setTabButtonsEnabled",
                }
            );
        });

        it("should enable all tab buttons except open file button", () => {
            appendTabButtons([
                { id: "openFileBtn", text: "Open File" },
                { id: "tab-summary", disabled: true, text: "Summary" },
                { id: "tab-chart", disabled: true, text: "Chart" },
            ]);

            setTabButtonsEnabled(true);

            const summaryBtn = document.getElementById("tab-summary");
            const chartBtn = document.getElementById("tab-chart");

            expect(summaryBtn?.hasAttribute("disabled")).toBe(false);
            expect(chartBtn?.hasAttribute("disabled")).toBe(false);

            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                true,
                { source: "setTabButtonsEnabled" }
            );
        });

        it("should handle multiple open file button ID variants", () => {
            appendTabButtons([
                { id: "open-file-btn", text: "Open File" },
                {
                    className: "tab-button open-file-btn",
                    text: "Open File Alt",
                },
                { id: "tab-summary", text: "Summary" },
            ]);

            setTabButtonsEnabled(false);

            const openFileBtn1 = document.getElementById("open-file-btn");
            const openFileBtn2 = document.querySelector(".open-file-btn");
            const summaryBtn = document.getElementById("tab-summary");

            // Open file buttons should remain enabled
            expect(openFileBtn1?.hasAttribute("disabled")).toBe(false);
            expect(openFileBtn2?.hasAttribute("disabled")).toBe(false);

            // Other buttons should be disabled
            expect(summaryBtn?.hasAttribute("disabled")).toBe(true);
        });

        it("should set window global state for debugging", () => {
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            // Debug scope relationships
            console.log("Before setTabButtonsEnabled:");
            console.log(
                "globalThis === global.window:",
                globalThis === (global as any).window
            );
            console.log(
                "globalThis.window === global.window:",
                globalThis.window === (global as any).window
            );
            console.log(
                "window === global.window:",
                window === (global as any).window
            );

            setTabButtonsEnabled(true);

            // Debug what gets set where
            console.log("After setTabButtonsEnabled:");
            console.log(
                "globalThis.tabButtonsCurrentlyEnabled:",
                (globalThis as any).tabButtonsCurrentlyEnabled
            );
            console.log(
                "window.tabButtonsCurrentlyEnabled:",
                (window as any).tabButtonsCurrentlyEnabled
            );
            console.log(
                "global.window.tabButtonsCurrentlyEnabled:",
                (global as any).window.tabButtonsCurrentlyEnabled
            );

            expect((global as any).window.tabButtonsCurrentlyEnabled).toBe(
                true
            );
        });

        it("should apply comprehensive styling when disabling", () => {
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            setTabButtonsEnabled(false);

            const testBtn = document.getElementById("tab-test");
            expect(testBtn?.classList.contains("tab-disabled")).toBe(true);
            expect(testBtn?.getAttribute("aria-disabled")).toBe("true");
            expect(testBtn?.style.pointerEvents).toBe("none");
        });

        it("should apply comprehensive styling when enabling", () => {
            appendTabButtons([
                {
                    id: "tab-test",
                    className: "tab-button tab-disabled",
                    disabled: true,
                    text: "Test",
                },
            ]);

            setTabButtonsEnabled(true);

            const testBtn = document.getElementById("tab-test");
            expect(testBtn?.classList.contains("tab-disabled")).toBe(false);
            expect(testBtn?.getAttribute("aria-disabled")).toBe("false");
            expect(testBtn?.style.pointerEvents).toBe("auto");
            expect(testBtn?.style.cursor).toBe("pointer");
            expect(testBtn?.style.opacity).toBe("1");
        });

        it("should handle elements that are not HTMLElements gracefully", () => {
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            // Mock isHTMLElement to return false
            mockIsHTMLElement.mockReturnValue(false);

            expect(setTabButtonsEnabled(false)).toBeUndefined();

            // Should still call setState
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                false,
                {
                    source: "setTabButtonsEnabled",
                }
            );
            expect(
                document.getElementById("tab-test")?.hasAttribute("disabled")
            ).toBe(false);
        });

        it("should handle nuclear option for stubborn disabled attributes", () => {
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

            const mockParent = { replaceChild: vi.fn() } as any;
            vi.spyOn(testBtn, "parentNode", "get").mockReturnValue(mockParent);
            vi.spyOn(testBtn, "cloneNode").mockReturnValue(testBtn);

            setTabButtonsEnabled(true);

            // Should attempt nuclear option
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining("nuclear option")
            );
            expect(testBtn?.style.pointerEvents).toBe("auto");
        });
    });

    describe("initializeTabButtonState function", () => {
        it("should set up state subscription and initial disabled state", () => {
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            initializeTabButtonState();

            expect(mockSubscribe).toHaveBeenCalledWith(
                "globalData",
                expect.any(Function)
            );
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                false,
                {
                    source: "setTabButtonsEnabled",
                }
            );
            expect(
                document.getElementById("tab-test")?.hasAttribute("disabled")
            ).toBe(true);
        });

        it("should enable tabs when globalData is present", () => {
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            initializeTabButtonState();

            // Get the subscription callback
            const subscriptionCallback = mockSubscribe.mock.calls[0]?.[1] as
                | ((data: unknown) => void)
                | undefined;
            expect(typeof subscriptionCallback).toBe("function");

            subscriptionCallback?.({ someData: true });

            expect(
                document.getElementById("tab-test")?.hasAttribute("disabled")
            ).toBe(false);
            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                true,
                {
                    source: "setTabButtonsEnabled",
                }
            );
        });

        it("should disable tabs when globalData is null/undefined", () => {
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            initializeTabButtonState();

            const subscriptionCallback = mockSubscribe.mock.calls[0]?.[1] as
                | ((data: unknown) => void)
                | undefined;
            expect(typeof subscriptionCallback).toBe("function");

            subscriptionCallback?.(null);
            expect(
                document.getElementById("tab-test")?.hasAttribute("disabled")
            ).toBe(true);

            document.getElementById("tab-test")?.removeAttribute("disabled");
            subscriptionCallback?.(undefined);

            expect(getRequiredButton("tab-test").disabled).toBe(true);
            expect(
                mockSetState.mock.calls.filter(([, value]) => value === false)
            ).toHaveLength(3);
        });

        it("should set up MutationObserver when window is available", () => {
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            const mockObserver = {
                observe: vi.fn(),
                disconnect: vi.fn(),
            };

            // Ensure clean state - the key is to ensure no existing observer
            delete (global as any).window.tabButtonObserver;
            delete (global as any).tabButtonObserver;

            // Verify clean state
            expect((global as any).window.tabButtonObserver).toBeUndefined();

            // Mock both global and window MutationObserver (implementation checks both)
            const originalMutationObserver = global.MutationObserver;
            const originalWindowMutationObserver =
                global.window.MutationObserver;
            const MutationObserverSpy = vi
                .fn()
                .mockImplementation(function MutationObserverMock() {
                    return mockObserver;
                });

            // Mock both scopes to ensure the implementation finds our spy
            global.MutationObserver = MutationObserverSpy as any;
            global.window.MutationObserver = MutationObserverSpy as any;

            initializeTabButtonState();

            // Restore originals
            global.MutationObserver = originalMutationObserver;
            global.window.MutationObserver = originalWindowMutationObserver;

            expect(MutationObserverSpy).toHaveBeenCalledWith(
                expect.any(Function)
            );
            expect(mockObserver.observe).toHaveBeenCalled();
            expect((globalThis as any).tabButtonObserver).toBe(mockObserver);
        });

        it("should not create duplicate MutationObserver", () => {
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            // Set up existing observer
            const existingObserver = { existing: true };
            (globalThis as any).tabButtonObserver = existingObserver;

            const mockObserver = {
                observe: vi.fn(),
                disconnect: vi.fn(),
            };
            global.window.MutationObserver = vi
                .fn()
                .mockReturnValue(mockObserver);

            initializeTabButtonState();

            expect(global.window.MutationObserver).not.toHaveBeenCalled();
            expect((globalThis as any).tabButtonObserver).toBe(
                existingObserver
            );
        });
    });

    describe("areTabButtonsEnabled function", () => {
        it("should return current state value", () => {
            mockGetState.mockReturnValue(true);

            const result = areTabButtonsEnabled();

            expect(result).toBe(true);
            expect(mockGetState).toHaveBeenCalledWith("ui.tabButtonsEnabled");
        });

        it("should return false when state is falsy", () => {
            mockGetState.mockReturnValue(null);

            const result = areTabButtonsEnabled();

            expect(result).toBe(false);
            expect(result).not.toBe(true);
        });
    });

    describe("debugTabButtons function", () => {
        it("should log debug information for all tab buttons", () => {
            appendTabButtons([
                { id: "openFileBtn", text: "Open File" },
                { id: "tab-summary", text: "Summary" },
            ]);

            mockGetState.mockImplementation((key) => {
                const state = new Map<string, unknown>([
                    ["globalData", { test: true }],
                    ["isLoading", false],
                    ["ui.tabButtonsEnabled", true],
                ]);

                return typeof key === "string"
                    ? (state.get(key) ?? null)
                    : null;
            });

            debugTabButtons();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining("DEBUG TAB BUTTONS")
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining("SKIPPING open file button")
            );
            expect(mockGetState).toHaveBeenCalledWith("globalData");
            expect(mockGetState).toHaveBeenCalledWith("isLoading");
            expect(mockGetState).toHaveBeenCalledWith("ui.tabButtonsEnabled");
            expect(getRequiredButton("tab-summary").disabled).toBe(false);
        });

        it("should handle buttons without IDs gracefully", () => {
            appendTabButtons([{ text: "No ID" }]);

            expect(debugTabButtons()).toBeUndefined();
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining("Button No ID:"),
                expect.objectContaining({ disabled: false })
            );
        });
    });

    describe("forceEnableTabButtons function", () => {
        it("should aggressively enable all tab buttons", () => {
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

            const summaryBtn = document.getElementById("tab-summary");
            expect(summaryBtn?.hasAttribute("disabled")).toBe(false);
            expect(summaryBtn?.classList.contains("tab-disabled")).toBe(false);
            expect(summaryBtn?.style.pointerEvents).toBe("auto");

            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                true,
                {
                    source: "forceEnableTabButtons",
                }
            );
        });

        it("should skip open file buttons", () => {
            appendTabButtons([
                { id: "openFileBtn", text: "Open File" },
                { id: "tab-summary", text: "Summary" },
            ]);

            forceEnableTabButtons();

            expect(
                document.getElementById("openFileBtn")?.style.pointerEvents
            ).not.toBe("auto");
            expect(
                document.getElementById("tab-summary")?.style.pointerEvents
            ).toBe("auto");
            expect(consoleLogSpy).not.toHaveBeenCalledWith(
                expect.stringContaining("Force enabled: openFileBtn")
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining("Force enabled: tab-summary")
            );
        });
    });

    describe("testTabButtonClicks function", () => {
        it("should add test click handlers to tab buttons", () => {
            appendTabButtons([
                { id: "openFileBtn", text: "Open File" },
                { id: "tab-summary", text: "Summary" },
            ]);

            expect(testTabButtonClicks()).toBeUndefined();
            getRequiredButton("tab-summary").click();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining("Added test handler to: tab-summary")
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining("TEST CLICK DETECTED on tab-summary!"),
                expect.any(PointerEvent)
            );
        });

        it("should skip open file buttons", () => {
            appendTabButtons([{ id: "openFileBtn", text: "Open File" }]);

            expect(testTabButtonClicks()).toBeUndefined();
            expect(consoleLogSpy).not.toHaveBeenCalledWith(
                expect.stringContaining("Added test handler to: openFileBtn")
            );
        });

        it("should remove test handlers after timeout", () => {
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

            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                "click",
                expect.any(Function)
            );
            expect(summaryBtn.isConnected).toBe(true);

            vi.useRealTimers();
        });
    });

    describe("debugTabState function", () => {
        it("should log current tab states and application state", () => {
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
                    ["globalData", { test: true }],
                    ["ui.tabButtonsEnabled", true],
                ]);

                return typeof key === "string"
                    ? (state.get(key) ?? null)
                    : null;
            });

            debugTabState();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining("CURRENT TAB STATE")
            );
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
            expect(mockGetState).toHaveBeenCalledWith("globalData");
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

            const summaryBtn = document.getElementById("tab-summary");
            expect(summaryBtn?.hasAttribute("disabled")).toBe(false);
            expect(summaryBtn?.classList.contains("tab-disabled")).toBe(false);
            expect(summaryBtn?.style.pointerEvents).toBe("auto");
            expect(summaryBtn?.style.cursor).toBe("pointer");
            expect(summaryBtn?.style.filter).toBe("none");
            expect(summaryBtn?.style.opacity).toBe("1");
            expect(
                document.getElementById("openFileBtn")?.style.pointerEvents
            ).not.toBe("auto");

            expect(mockSetState).toHaveBeenCalledWith(
                "ui.tabButtonsEnabled",
                true,
                { source: "forceFixTabButtons" }
            );
        });

        it("should log before and after states", () => {
            appendTabButtons([{ id: "tab-summary", text: "Summary" }]);

            forceFixTabButtons();

            expect(
                document.getElementById("tab-summary")?.style.pointerEvents
            ).toBe("auto");
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining("BEFORE FIX: tab-summary")
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining("AFTER FIX: tab-summary")
            );
        });
    });

    describe("Edge cases and error conditions", () => {
        it("should handle empty DOM gracefully", () => {
            testContainer.replaceChildren();

            expect(setTabButtonsEnabled(true)).toBeUndefined();
            expect(debugTabButtons()).toBeUndefined();
            expect(forceEnableTabButtons()).toBeUndefined();
            expect(testContainer.childElementCount).toBe(0);
        });

        it("should handle buttons without parent nodes in nuclear option", () => {
            appendTabButtons([
                { id: "tab-test", disabled: true, text: "Test" },
            ]);

            const testBtn = getRequiredButton("tab-test");
            vi.spyOn(testBtn, "hasAttribute").mockReturnValue(true);
            vi.spyOn(testBtn, "parentNode", "get").mockReturnValue(null);
            vi.spyOn(testBtn, "cloneNode").mockReturnValue(testBtn);

            expect(setTabButtonsEnabled(true)).toBeUndefined();
            expect(testBtn.style.pointerEvents).toBe("auto");
        });

        it("should handle missing getComputedStyle", () => {
            // Mock getComputedStyle to throw an error - need to mock globalThis.getComputedStyle
            const originalGetComputedStyle = globalThis.getComputedStyle;
            globalThis.getComputedStyle = vi.fn().mockImplementation(() => {
                throw new Error("getComputedStyle not available");
            });

            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            expect(() => debugTabButtons()).toThrow(
                "getComputedStyle not available"
            );

            // Restore original
            globalThis.getComputedStyle = originalGetComputedStyle;
        });

        it("should handle undefined window object", () => {
            const originalWindow = global.window;
            (global as any).window = undefined;

            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            expect(setTabButtonsEnabled(true)).toBeUndefined();
            expect(initializeTabButtonState()).toBeUndefined();
            expect(
                document.getElementById("tab-test")?.hasAttribute("disabled")
            ).toBe(true);

            global.window = originalWindow;
        });
    });

    describe("Integration scenarios", () => {
        it("should handle complete enable/disable cycle", () => {
            appendTabButtons([
                { id: "tab-summary", text: "Summary" },
                { id: "tab-chart", text: "Chart" },
            ]);

            // Start with disable
            setTabButtonsEnabled(false);

            const summaryBtn = document.getElementById("tab-summary");
            const chartBtn = document.getElementById("tab-chart");

            expect(summaryBtn?.hasAttribute("disabled")).toBe(true);
            expect(chartBtn?.hasAttribute("disabled")).toBe(true);
            expect(summaryBtn?.style.pointerEvents).not.toBe("auto");

            // Then enable
            setTabButtonsEnabled(true);

            expect(summaryBtn?.hasAttribute("disabled")).toBe(false);
            expect(chartBtn?.hasAttribute("disabled")).toBe(false);

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
            appendTabButtons([{ id: "tab-test", text: "Test" }]);

            // Ensure clean state first
            delete (global as any).window.tabButtonObserver;
            delete (global as any).tabButtonObserver;

            let mutationCallback:
                | ((mutations: readonly Partial<MutationRecord>[]) => void)
                | undefined;
            const originalMutationObserver = global.MutationObserver;
            const originalWindowMutationObserver =
                global.window.MutationObserver;

            // Mock both global and window scope MutationObserver to capture callback
            const MockObserverClass = vi
                .fn()
                .mockImplementation(function MutationObserverMock(callback) {
                    mutationCallback = callback;
                    return {
                        observe: vi.fn(),
                        disconnect: vi.fn(),
                    };
                });

            global.MutationObserver = MockObserverClass as any;
            global.window.MutationObserver = MockObserverClass as any;
            (global as any).window.tabButtonsCurrentlyEnabled = true;

            initializeTabButtonState();

            // Restore originals
            global.MutationObserver = originalMutationObserver;
            global.window.MutationObserver = originalWindowMutationObserver;

            // Sanity check to ensure setup is correct
            const testBtn = getRequiredButton("tab-test");
            expect(typeof mutationCallback).toBe("function");

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
                expect.stringContaining("UNAUTHORIZED")
            );
            expect(removeAttributeSpy).toHaveBeenCalledWith("disabled");
            expect(testBtn.disabled).toBe(false);
        });
    });
});
