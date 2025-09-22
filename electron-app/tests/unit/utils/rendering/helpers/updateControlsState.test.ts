/**
 * Test suite for updateControlsState.js
 * Tests chart controls state management functionality
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    initializeControlsState,
    toggleChartControls,
    updateControlsState,
} from "../../../../../utils/rendering/helpers/updateControlsState.js";
import { getState, setState, subscribe } from "../../../../../utils/state/core/stateManager.js";

// Mock state manager
vi.mock("../../../../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(),
}));

// Get the mocked functions
const mockGetState = vi.mocked(getState);
const mockSetState = vi.mocked(setState);
const mockSubscribe = vi.mocked(subscribe);

// Mock console.log
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

// Mock DOM elements
const mockToggleButton = {
    textContent: "",
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
} as any;

const mockWrapper = {
    style: { display: "" },
    offsetParent: null as HTMLElement | null,
} as any;

const mockComputedStyle = {
    display: "block",
};

// Mock document.querySelector
const mockQuerySelector = vi.fn();

// Mock globalThis.getComputedStyle
const mockGetComputedStyle = vi.fn();

describe("updateControlsState", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset mock objects
        mockToggleButton.textContent = "";
        mockToggleButton.setAttribute.mockClear();
        mockToggleButton.getAttribute.mockClear();
        mockWrapper.style.display = "";
        mockWrapper.offsetParent = null;

        // Setup global mocks
        Object.defineProperty(globalThis, "document", {
            value: { querySelector: mockQuerySelector },
            writable: true,
        });

        Object.defineProperty(globalThis, "getComputedStyle", {
            value: mockGetComputedStyle,
            writable: true,
        });

        mockGetComputedStyle.mockReturnValue(mockComputedStyle);
    });

    describe("initializeControlsState", () => {
        it("should set up state subscription and initialize state", () => {
            // Setup - provide both required elements for updateControlsState call
            mockQuerySelector.mockImplementation((selector: string) => {
                if (selector === "#chart-controls-toggle") return mockToggleButton;
                if (selector === "#chartjs-settings-wrapper") return mockWrapper;
                return null;
            });

            // Execute
            initializeControlsState();

            // Verify subscription was set up
            expect(mockSubscribe).toHaveBeenCalledWith("charts.controlsVisible", expect.any(Function));
        });

        it("should update DOM when state changes to visible", () => {
            // Setup
            mockQuerySelector.mockImplementation((selector: string) => {
                if (selector === "#chart-controls-toggle") return mockToggleButton;
                if (selector === "#chartjs-settings-wrapper") return mockWrapper;
                return null;
            });

            // Execute
            initializeControlsState();

            // Get the subscription callback
            const subscriptionCallback = mockSubscribe.mock.calls[0][1];

            // Call the callback with visible = true
            subscriptionCallback(true);

            // Verify DOM updates for visible state
            expect(mockWrapper.style.display).toBe("block");
            expect(mockToggleButton.textContent).toBe("▼ Hide Controls");
            expect(mockToggleButton.setAttribute).toHaveBeenCalledWith("aria-expanded", "true");
        });

        it("should update DOM when state changes to hidden", () => {
            // Setup
            mockQuerySelector.mockImplementation((selector: string) => {
                if (selector === "#chart-controls-toggle") return mockToggleButton;
                if (selector === "#chartjs-settings-wrapper") return mockWrapper;
                return null;
            });

            // Execute
            initializeControlsState();

            // Get the subscription callback
            const subscriptionCallback = mockSubscribe.mock.calls[0][1];

            // Call the callback with visible = false
            subscriptionCallback(false);

            // Verify DOM updates for hidden state
            expect(mockWrapper.style.display).toBe("none");
            expect(mockToggleButton.textContent).toBe("▶ Show Controls");
            expect(mockToggleButton.setAttribute).toHaveBeenCalledWith("aria-expanded", "false");
        });

        it("should handle missing DOM elements gracefully", () => {
            // Setup - return null for DOM elements
            mockQuerySelector.mockReturnValue(null);

            // Execute - should not throw
            expect(() => initializeControlsState()).not.toThrow();

            // Verify subscription was still set up
            expect(mockSubscribe).toHaveBeenCalled();
        });
    });

    describe("toggleChartControls", () => {
        it("should toggle state from false to true", () => {
            // Setup
            mockGetState.mockReturnValue(false);

            // Execute
            toggleChartControls();

            // Verify
            expect(mockGetState).toHaveBeenCalledWith("charts.controlsVisible");
            expect(mockSetState).toHaveBeenCalledWith("charts.controlsVisible", true, {
                source: "toggleChartControls",
            });
        });

        it("should toggle state from true to false", () => {
            // Setup
            mockGetState.mockReturnValue(true);

            // Execute
            toggleChartControls();

            // Verify
            expect(mockGetState).toHaveBeenCalledWith("charts.controlsVisible");
            expect(mockSetState).toHaveBeenCalledWith("charts.controlsVisible", false, {
                source: "toggleChartControls",
            });
        });

        it("should handle undefined state", () => {
            // Setup
            mockGetState.mockReturnValue(undefined);

            // Execute
            toggleChartControls();

            // Verify - undefined becomes true when negated
            expect(mockSetState).toHaveBeenCalledWith("charts.controlsVisible", true, {
                source: "toggleChartControls",
            });
        });
    });

    describe("updateControlsState", () => {
        it("should return early if toggle button is missing", () => {
            // Setup
            mockQuerySelector.mockImplementation((selector: string) => {
                if (selector === "#chart-controls-toggle") return null;
                if (selector === "#chartjs-settings-wrapper") return mockWrapper;
                return null;
            });

            // Execute
            updateControlsState();

            // Verify early return - no state calls made
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should return early if wrapper is missing", () => {
            // Setup
            mockQuerySelector.mockImplementation((selector: string) => {
                if (selector === "#chart-controls-toggle") return mockToggleButton;
                if (selector === "#chartjs-settings-wrapper") return null;
                return null;
            });

            // Execute
            updateControlsState();

            // Verify early return - no state calls made
            expect(mockSetState).not.toHaveBeenCalled();
        });

        it("should detect visible controls and update state accordingly", () => {
            // Setup - wrapper is visible
            mockQuerySelector.mockImplementation((selector: string) => {
                if (selector === "#chart-controls-toggle") return mockToggleButton;
                if (selector === "#chartjs-settings-wrapper") return mockWrapper;
                return null;
            });

            mockWrapper.style.display = "block";
            mockWrapper.offsetParent = {} as HTMLElement; // Element is in DOM
            mockComputedStyle.display = "block";
            mockGetComputedStyle.mockReturnValue(mockComputedStyle);

            // Execute
            updateControlsState();

            // Verify visible state detection
            expect(mockSetState).toHaveBeenCalledWith("charts.controlsVisible", true, {
                silent: true,
                source: "updateControlsState",
            });
            expect(mockToggleButton.textContent).toBe("▼ Hide Controls");
            expect(mockToggleButton.setAttribute).toHaveBeenCalledWith("aria-expanded", "true");
            expect(mockWrapper.style.display).toBe("block");
        });

        it("should detect hidden controls (style.display = none) and update state", () => {
            // Setup - wrapper is hidden via style.display
            mockQuerySelector.mockImplementation((selector: string) => {
                if (selector === "#chart-controls-toggle") return mockToggleButton;
                if (selector === "#chartjs-settings-wrapper") return mockWrapper;
                return null;
            });

            mockWrapper.style.display = "none";
            mockWrapper.offsetParent = {} as HTMLElement;
            mockComputedStyle.display = "block";
            mockGetComputedStyle.mockReturnValue(mockComputedStyle);

            // Execute
            updateControlsState();

            // Verify hidden state detection
            expect(mockSetState).toHaveBeenCalledWith("charts.controlsVisible", false, {
                silent: true,
                source: "updateControlsState",
            });
            expect(mockToggleButton.textContent).toBe("▶ Show Controls");
            expect(mockToggleButton.setAttribute).toHaveBeenCalledWith("aria-expanded", "false");
            expect(mockWrapper.style.display).toBe("none");
        });

        it("should detect hidden controls (computed style = none) and update state", () => {
            // Setup - wrapper is hidden via computed style
            mockQuerySelector.mockImplementation((selector: string) => {
                if (selector === "#chart-controls-toggle") return mockToggleButton;
                if (selector === "#chartjs-settings-wrapper") return mockWrapper;
                return null;
            });

            mockWrapper.style.display = "block";
            mockWrapper.offsetParent = {} as HTMLElement;
            mockComputedStyle.display = "none";
            mockGetComputedStyle.mockReturnValue(mockComputedStyle);

            // Execute
            updateControlsState();

            // Verify hidden state detection
            expect(mockSetState).toHaveBeenCalledWith("charts.controlsVisible", false, {
                silent: true,
                source: "updateControlsState",
            });
            expect(mockToggleButton.textContent).toBe("▶ Show Controls");
            expect(mockToggleButton.setAttribute).toHaveBeenCalledWith("aria-expanded", "false");
            expect(mockWrapper.style.display).toBe("none");
        });

        it("should detect hidden controls (no offsetParent) and update state", () => {
            // Setup - wrapper is hidden (not in DOM tree)
            mockQuerySelector.mockImplementation((selector: string) => {
                if (selector === "#chart-controls-toggle") return mockToggleButton;
                if (selector === "#chartjs-settings-wrapper") return mockWrapper;
                return null;
            });

            mockWrapper.style.display = "block";
            mockWrapper.offsetParent = null; // Element not in DOM
            mockComputedStyle.display = "block";
            mockGetComputedStyle.mockReturnValue(mockComputedStyle);

            // Execute
            updateControlsState();

            // Verify hidden state detection
            expect(mockSetState).toHaveBeenCalledWith("charts.controlsVisible", false, {
                silent: true,
                source: "updateControlsState",
            });
            expect(mockToggleButton.textContent).toBe("▶ Show Controls");
            expect(mockToggleButton.setAttribute).toHaveBeenCalledWith("aria-expanded", "false");
            expect(mockWrapper.style.display).toBe("none");
        });

        it("should call getComputedStyle correctly", () => {
            // Setup
            mockQuerySelector.mockImplementation((selector: string) => {
                if (selector === "#chart-controls-toggle") return mockToggleButton;
                if (selector === "#chartjs-settings-wrapper") return mockWrapper;
                return null;
            });

            mockWrapper.style.display = "block";
            mockWrapper.offsetParent = {} as HTMLElement;

            // Execute
            updateControlsState();

            // Verify getComputedStyle was called with wrapper
            expect(mockGetComputedStyle).toHaveBeenCalledWith(mockWrapper);
        });
    });
});
