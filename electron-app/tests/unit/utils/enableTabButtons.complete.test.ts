/**
 * @vitest-environment jsdom
 * Comprehensive test suite for enableTabButtons module
 * Testing tab button state management, DOM manipulation, and debugging functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the state manager
vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(),
}));

// Mock DOM helpers
vi.mock("../../../utils/dom/domHelpers.js", () => ({
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

import { getState, setState, subscribe } from "../../../utils/state/core/stateManager.js";
import { isHTMLElement } from "../../../utils/dom/domHelpers.js";

const mockGetState = vi.mocked(getState);
const mockSetState = vi.mocked(setState);
const mockSubscribe = vi.mocked(subscribe);
const mockIsHTMLElement = vi.mocked(isHTMLElement);

describe("enableTabButtons.js - Complete Test Suite", () => {
    let testContainer;
    let originalConsoleLog;
    let originalConsoleWarn;
    let consoleLogSpy;
    let consoleWarnSpy;

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
        global.window = {
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
        Object.defineProperty(global.window, 'tabButtonsCurrentlyEnabled', {
            get: () => tabButtonsCurrentlyEnabledValue,
            set: (value) => { tabButtonsCurrentlyEnabledValue = value; },
            configurable: true
        });
        Object.defineProperty(globalThis, 'tabButtonsCurrentlyEnabled', {
            get: () => tabButtonsCurrentlyEnabledValue,
            set: (value) => { tabButtonsCurrentlyEnabledValue = value; },
            configurable: true
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
            testContainer.innerHTML = `
                <button id="openFileBtn" class="tab-button">Open File</button>
                <button id="tab-summary" class="tab-button">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
                <button id="tab-map" class="tab-button">Map</button>
            `;

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

            expect(mockSetState).toHaveBeenCalledWith("ui.tabButtonsEnabled", false, {
                source: "setTabButtonsEnabled",
            });
        });

        it("should enable all tab buttons except open file button", () => {
            testContainer.innerHTML = `
                <button id="openFileBtn" class="tab-button">Open File</button>
                <button id="tab-summary" class="tab-button" disabled>Summary</button>
                <button id="tab-chart" class="tab-button" disabled>Chart</button>
            `;

            setTabButtonsEnabled(true);

            const summaryBtn = document.getElementById("tab-summary");
            const chartBtn = document.getElementById("tab-chart");

            expect(summaryBtn?.hasAttribute("disabled")).toBe(false);
            expect(chartBtn?.hasAttribute("disabled")).toBe(false);

            expect(mockSetState).toHaveBeenCalledWith("ui.tabButtonsEnabled", true, { source: "setTabButtonsEnabled" });
        });

        it("should handle multiple open file button ID variants", () => {
            testContainer.innerHTML = `
                <button id="open-file-btn" class="tab-button">Open File</button>
                <button class="tab-button open-file-btn">Open File Alt</button>
                <button id="tab-summary" class="tab-button">Summary</button>
            `;

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
            testContainer.innerHTML = `<button id="tab-test" class="tab-button">Test</button>`;

            // Debug scope relationships
            console.log('Before setTabButtonsEnabled:');
            console.log('globalThis === global.window:', globalThis === (global as any).window);
            console.log('globalThis.window === global.window:', globalThis.window === (global as any).window);
            console.log('window === global.window:', window === (global as any).window);

            setTabButtonsEnabled(true);

            // Debug what gets set where
            console.log('After setTabButtonsEnabled:');
            console.log('globalThis.tabButtonsCurrentlyEnabled:', (globalThis as any).tabButtonsCurrentlyEnabled);
            console.log('window.tabButtonsCurrentlyEnabled:', (window as any).tabButtonsCurrentlyEnabled);
            console.log('global.window.tabButtonsCurrentlyEnabled:', (global as any).window.tabButtonsCurrentlyEnabled);

            expect((global as any).window.tabButtonsCurrentlyEnabled).toBe(true);
        });

        it("should apply comprehensive styling when disabling", () => {
            testContainer.innerHTML = `<button id="tab-test" class="tab-button">Test</button>`;

            setTabButtonsEnabled(false);

            const testBtn = document.getElementById("tab-test");
            expect(testBtn?.classList.contains("tab-disabled")).toBe(true);
            expect(testBtn?.getAttribute("aria-disabled")).toBe("true");
            expect(testBtn?.style.pointerEvents).toBe("none");
        });

        it("should apply comprehensive styling when enabling", () => {
            testContainer.innerHTML = `<button id="tab-test" class="tab-button tab-disabled" disabled>Test</button>`;

            setTabButtonsEnabled(true);

            const testBtn = document.getElementById("tab-test");
            expect(testBtn?.classList.contains("tab-disabled")).toBe(false);
            expect(testBtn?.getAttribute("aria-disabled")).toBe("false");
            expect(testBtn?.style.pointerEvents).toBe("auto");
            expect(testBtn?.style.cursor).toBe("pointer");
            expect(testBtn?.style.opacity).toBe("1");
        });

        it("should handle elements that are not HTMLElements gracefully", () => {
            testContainer.innerHTML = `<button id="tab-test" class="tab-button">Test</button>`;

            // Mock isHTMLElement to return false
            mockIsHTMLElement.mockReturnValue(false);

            expect(() => setTabButtonsEnabled(false)).not.toThrow();

            // Should still call setState
            expect(mockSetState).toHaveBeenCalledWith("ui.tabButtonsEnabled", false, {
                source: "setTabButtonsEnabled",
            });
        });

        it("should handle nuclear option for stubborn disabled attributes", () => {
            testContainer.innerHTML = `<button id="tab-test" class="tab-button" disabled>Test</button>`;

            // Mock a button that keeps its disabled attribute
            const testBtn = document.getElementById("tab-test");
            const originalHasAttribute = testBtn?.hasAttribute.bind(testBtn);
            if (testBtn) {
                vi.spyOn(testBtn, "hasAttribute").mockImplementation((attr) => {
                    if (attr === "disabled") return true;
                    return originalHasAttribute?.(attr) || false;
                });

                const mockParent = { replaceChild: vi.fn() };
                vi.spyOn(testBtn, "parentNode", "get").mockReturnValue(mockParent);
                vi.spyOn(testBtn, "cloneNode").mockReturnValue(testBtn);
            }

            setTabButtonsEnabled(true);

            // Should attempt nuclear option
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("nuclear option"));
        });
    });

    describe("initializeTabButtonState function", () => {
        it("should set up state subscription and initial disabled state", () => {
            testContainer.innerHTML = `<button id="tab-test" class="tab-button">Test</button>`;

            initializeTabButtonState();

            expect(mockSubscribe).toHaveBeenCalledWith("globalData", expect.any(Function));
            expect(mockSetState).toHaveBeenCalledWith("ui.tabButtonsEnabled", false, {
                source: "setTabButtonsEnabled",
            });
        });

        it("should enable tabs when globalData is present", () => {
            testContainer.innerHTML = `<button id="tab-test" class="tab-button">Test</button>`;

            initializeTabButtonState();

            // Get the subscription callback
            const subscriptionCallback = mockSubscribe.mock.calls?.[0]?.[1];

            if (subscriptionCallback) {
                // Simulate globalData being set
                subscriptionCallback({ someData: true });

                expect(mockSetState).toHaveBeenCalledWith("ui.tabButtonsEnabled", true, {
                    source: "setTabButtonsEnabled",
                });
            }
        });

        it("should disable tabs when globalData is null/undefined", () => {
            testContainer.innerHTML = `<button id="tab-test" class="tab-button">Test</button>`;

            initializeTabButtonState();

            const subscriptionCallback = mockSubscribe.mock.calls?.[0]?.[1];

            if (subscriptionCallback) {
                // Simulate globalData being null
                subscriptionCallback(null);

                expect(mockSetState).toHaveBeenCalledWith("ui.tabButtonsEnabled", false, {
                    source: "setTabButtonsEnabled",
                });

                // Test undefined as well
                subscriptionCallback(undefined);

                expect(mockSetState).toHaveBeenCalledWith("ui.tabButtonsEnabled", false, {
                    source: "setTabButtonsEnabled",
                });
            }
        });

        it("should set up MutationObserver when window is available", () => {
            testContainer.innerHTML = `<button id="tab-test" class="tab-button">Test</button>`;

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
            const originalWindowMutationObserver = global.window.MutationObserver;
            const MutationObserverSpy = vi.fn().mockImplementation(() => mockObserver);

            // Mock both scopes to ensure the implementation finds our spy
            global.MutationObserver = MutationObserverSpy;
            global.window.MutationObserver = MutationObserverSpy;

            initializeTabButtonState();

            // Restore originals
            global.MutationObserver = originalMutationObserver;
            global.window.MutationObserver = originalWindowMutationObserver;

            expect(MutationObserverSpy).toHaveBeenCalledWith(expect.any(Function));
            expect(mockObserver.observe).toHaveBeenCalled();
        });

        it("should not create duplicate MutationObserver", () => {
            testContainer.innerHTML = `<button id="tab-test" class="tab-button">Test</button>`;

            // Set up existing observer
            global.window.tabButtonObserver = { existing: true };

            const mockObserver = {
                observe: vi.fn(),
                disconnect: vi.fn(),
            };
            global.window.MutationObserver = vi.fn().mockReturnValue(mockObserver);

            initializeTabButtonState();

            expect(global.window.MutationObserver).not.toHaveBeenCalled();
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
        });
    });

    describe("debugTabButtons function", () => {
        it("should log debug information for all tab buttons", () => {
            testContainer.innerHTML = `
                <button id="openFileBtn" class="tab-button">Open File</button>
                <button id="tab-summary" class="tab-button">Summary</button>
            `;

            mockGetState.mockImplementation((key) => {
                if (key === "globalData") return { test: true };
                if (key === "ui.isLoading") return false;
                if (key === "ui.tabButtonsEnabled") return true;
                return null;
            });

            debugTabButtons();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("DEBUG TAB BUTTONS"));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("SKIPPING open file button"));
            expect(mockGetState).toHaveBeenCalledWith("globalData");
            expect(mockGetState).toHaveBeenCalledWith("ui.isLoading");
            expect(mockGetState).toHaveBeenCalledWith("ui.tabButtonsEnabled");
        });

        it("should handle buttons without IDs gracefully", () => {
            testContainer.innerHTML = `<button class="tab-button">No ID</button>`;

            expect(() => debugTabButtons()).not.toThrow();
        });
    });

    describe("forceEnableTabButtons function", () => {
        it("should aggressively enable all tab buttons", () => {
            testContainer.innerHTML = `
                <button id="openFileBtn" class="tab-button">Open File</button>
                <button id="tab-summary" class="tab-button tab-disabled" disabled>Summary</button>
            `;

            forceEnableTabButtons();

            const summaryBtn = document.getElementById("tab-summary");
            expect(summaryBtn?.hasAttribute("disabled")).toBe(false);
            expect(summaryBtn?.classList.contains("tab-disabled")).toBe(false);
            expect(summaryBtn?.style.pointerEvents).toBe("auto");

            expect(mockSetState).toHaveBeenCalledWith("ui.tabButtonsEnabled", true, {
                source: "forceEnableTabButtons",
            });
        });

        it("should skip open file buttons", () => {
            testContainer.innerHTML = `
                <button id="openFileBtn" class="tab-button">Open File</button>
                <button id="tab-summary" class="tab-button">Summary</button>
            `;

            forceEnableTabButtons();

            expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining("Force enabled: openFileBtn"));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Force enabled: tab-summary"));
        });
    });

    describe("testTabButtonClicks function", () => {
        it("should add test click handlers to tab buttons", () => {
            testContainer.innerHTML = `
                <button id="openFileBtn" class="tab-button">Open File</button>
                <button id="tab-summary" class="tab-button">Summary</button>
            `;

            expect(() => testTabButtonClicks()).not.toThrow();
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Added test handler to: tab-summary"));
        });

        it("should skip open file buttons", () => {
            testContainer.innerHTML = `<button id="openFileBtn" class="tab-button">Open File</button>`;

            expect(() => testTabButtonClicks()).not.toThrow();
        });

        it("should remove test handlers after timeout", () => {
            vi.useFakeTimers();

            testContainer.innerHTML = `<button id="tab-summary" class="tab-button">Summary</button>`;

            const summaryBtn = document.getElementById("tab-summary");
            const removeEventListenerSpy = vi.spyOn(summaryBtn, "removeEventListener");

            testTabButtonClicks();

            // Fast forward time
            vi.advanceTimersByTime(30000);

            expect(removeEventListenerSpy).toHaveBeenCalledWith("click", expect.any(Function));

            vi.useRealTimers();
        });
    });

    describe("debugTabState function", () => {
        it("should log current tab states and application state", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button active" aria-selected="true">Summary</button>
            `;

            mockGetState.mockImplementation((key) => {
                if (key === "ui.activeTab") return "summary";
                if (key === "globalData") return { test: true };
                if (key === "ui.tabButtonsEnabled") return true;
                return null;
            });

            debugTabState();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("CURRENT TAB STATE"));
            expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
            expect(mockGetState).toHaveBeenCalledWith("globalData");
            expect(mockGetState).toHaveBeenCalledWith("ui.tabButtonsEnabled");
        });
    });

    describe("forceFixTabButtons function", () => {
        it("should aggressively fix all tab button states", () => {
            testContainer.innerHTML = `
                <button id="openFileBtn" class="tab-button">Open File</button>
                <button id="tab-summary" class="tab-button tab-disabled" disabled>Summary</button>
            `;

            forceFixTabButtons();

            const summaryBtn = document.getElementById("tab-summary");
            expect(summaryBtn?.hasAttribute("disabled")).toBe(false);
            expect(summaryBtn?.classList.contains("tab-disabled")).toBe(false);
            expect(summaryBtn?.style.pointerEvents).toBe("auto");
            expect(summaryBtn?.style.cursor).toBe("pointer");
            expect(summaryBtn?.style.filter).toBe("none");
            expect(summaryBtn?.style.opacity).toBe("1");

            expect(mockSetState).toHaveBeenCalledWith("ui.tabButtonsEnabled", true, { source: "forceFixTabButtons" });
        });

        it("should log before and after states", () => {
            testContainer.innerHTML = `<button id="tab-summary" class="tab-button">Summary</button>`;

            forceFixTabButtons();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("BEFORE FIX: tab-summary"));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("AFTER FIX: tab-summary"));
        });
    });

    describe("Edge cases and error conditions", () => {
        it("should handle empty DOM gracefully", () => {
            testContainer.innerHTML = "";

            expect(() => setTabButtonsEnabled(true)).not.toThrow();
            expect(() => debugTabButtons()).not.toThrow();
            expect(() => forceEnableTabButtons()).not.toThrow();
        });

        it("should handle buttons without parent nodes in nuclear option", () => {
            testContainer.innerHTML = `<button id="tab-test" class="tab-button" disabled>Test</button>`;

            const testBtn = document.getElementById("tab-test");
            if (testBtn) {
                vi.spyOn(testBtn, "hasAttribute").mockReturnValue(true);
                vi.spyOn(testBtn, "parentNode", "get").mockReturnValue(null);
                vi.spyOn(testBtn, "cloneNode").mockReturnValue(testBtn);
            }

            expect(() => setTabButtonsEnabled(true)).not.toThrow();
        });

        it("should handle missing getComputedStyle", () => {
            // Mock getComputedStyle to throw an error - need to mock globalThis.getComputedStyle
            const originalGetComputedStyle = globalThis.getComputedStyle;
            globalThis.getComputedStyle = vi.fn().mockImplementation(() => {
                throw new Error("getComputedStyle not available");
            });

            testContainer.innerHTML = `<button id="tab-test" class="tab-button">Test</button>`;

            expect(() => debugTabButtons()).toThrow();

            // Restore original
            globalThis.getComputedStyle = originalGetComputedStyle;
        });

        it("should handle undefined window object", () => {
            const originalWindow = global.window;
            global.window = undefined;

            testContainer.innerHTML = `<button id="tab-test" class="tab-button">Test</button>`;

            expect(() => setTabButtonsEnabled(true)).not.toThrow();
            expect(() => initializeTabButtonState()).not.toThrow();

            global.window = originalWindow;
        });
    });

    describe("Integration scenarios", () => {
        it("should handle complete enable/disable cycle", () => {
            testContainer.innerHTML = `
                <button id="tab-summary" class="tab-button">Summary</button>
                <button id="tab-chart" class="tab-button">Chart</button>
            `;

            // Start with disable
            setTabButtonsEnabled(false);

            const summaryBtn = document.getElementById("tab-summary");
            const chartBtn = document.getElementById("tab-chart");

            expect(summaryBtn?.hasAttribute("disabled")).toBe(true);
            expect(chartBtn?.hasAttribute("disabled")).toBe(true);

            // Then enable
            setTabButtonsEnabled(true);

            expect(summaryBtn?.hasAttribute("disabled")).toBe(false);
            expect(chartBtn?.hasAttribute("disabled")).toBe(false);

            // Verify state calls
            expect(mockSetState).toHaveBeenCalledWith("ui.tabButtonsEnabled", false, {
                source: "setTabButtonsEnabled",
            });
            expect(mockSetState).toHaveBeenCalledWith("ui.tabButtonsEnabled", true, { source: "setTabButtonsEnabled" });
        });

        it("should handle MutationObserver callback for unauthorized changes", () => {
            testContainer.innerHTML = `<button id="tab-test" class="tab-button">Test</button>`;

            // Ensure clean state first
            delete (global as any).window.tabButtonObserver;
            delete (global as any).tabButtonObserver;

            let mutationCallback: any;
            const originalMutationObserver = global.MutationObserver;
            const originalWindowMutationObserver = global.window.MutationObserver;

            // Mock both global and window scope MutationObserver to capture callback
            const MockObserverClass = vi.fn().mockImplementation((callback) => {
                mutationCallback = callback;
                return {
                    observe: vi.fn(),
                    disconnect: vi.fn(),
                };
            });

            global.MutationObserver = MockObserverClass;
            global.window.MutationObserver = MockObserverClass;
            (global as any).window.tabButtonsCurrentlyEnabled = true;

            initializeTabButtonState();

            // Restore originals
            global.MutationObserver = originalMutationObserver;
            global.window.MutationObserver = originalWindowMutationObserver;

            // Sanity check to ensure setup is correct
            const testBtn = document.getElementById("tab-test");
            expect(testBtn).not.toBeNull();
            expect(mutationCallback).toBeDefined();

            // Simulate unauthorized disabled attribute addition
            if (testBtn && mutationCallback) {
                const mockMutation = {
                    type: "attributes",
                    attributeName: "disabled",
                    target: testBtn,
                };

                // Mock hasAttribute to return true (unauthorized disabled)
                vi.spyOn(testBtn, "hasAttribute").mockReturnValue(true);
                vi.spyOn(testBtn, "removeAttribute");
                testBtn.classList.add("tab-button"); // Ensure the element has the expected class

                mutationCallback([mockMutation]);

                expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("UNAUTHORIZED"));
                expect(testBtn.removeAttribute).toHaveBeenCalledWith("disabled");
            }
        });
    });
});
