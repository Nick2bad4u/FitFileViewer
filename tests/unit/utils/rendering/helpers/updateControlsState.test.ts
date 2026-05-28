/**
 * Test suite for chart controls state synchronization.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    initializeControlsState,
    toggleChartControls,
    updateControlsState,
} from "../../../../../electron-app/utils/rendering/helpers/updateControlsState.js";
import {
    getState,
    setState,
    subscribe,
} from "../../../../../electron-app/utils/state/core/stateManager.js";

vi.mock("../../../../../electron-app/utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(() => () => {}),
}));

const mockGetState = vi.mocked(getState);
const mockSetState = vi.mocked(setState);
const mockSubscribe = vi.mocked(subscribe);

const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
const mockGetComputedStyle = vi.fn();

let mockToggleButton: HTMLButtonElement;
let mockWrapper: HTMLDivElement;
let currentControlsVisible: unknown;

function installControlsDom() {
    const toggleButton = document.createElement("button");
    toggleButton.id = "chart-controls-toggle";
    toggleButton.type = "button";

    const wrapper = document.createElement("div");
    wrapper.id = "chartjs-settings-wrapper";

    mockToggleButton = toggleButton;
    mockWrapper = wrapper;

    document.body.replaceChildren(toggleButton, wrapper);
    setWrapperOffsetParent(null);
}

function setWrapperOffsetParent(value: Element | null) {
    Object.defineProperty(mockWrapper, "offsetParent", {
        configurable: true,
        get: () => value,
    });
}

describe("updateControlsState", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.replaceChildren();
        currentControlsVisible = undefined;

        Object.defineProperty(globalThis, "getComputedStyle", {
            configurable: true,
            value: mockGetComputedStyle,
            writable: true,
        });

        mockGetComputedStyle.mockReturnValue({
            display: "block",
        } as CSSStyleDeclaration);
        mockSetState.mockImplementation((key, value) => {
            if (key === "charts.controlsVisible") {
                currentControlsVisible = value;
            }
        });
        installControlsDom();
    });

    describe("initializeControlsState", () => {
        it("should set up state subscription and initialize state", () => {
            initializeControlsState();

            expect(mockSubscribe).toHaveBeenCalledWith(
                "charts.controlsVisible",
                expect.any(Function)
            );
            expect(mockWrapper.style.display).toBe("none");
        });

        it("should update DOM when state changes to visible", () => {
            initializeControlsState();

            const subscriptionCallback = mockSubscribe.mock.calls[0]?.[1];
            expect(typeof subscriptionCallback).toBe("function");

            if (typeof subscriptionCallback === "function") {
                subscriptionCallback(true);
            }

            expect(mockWrapper.style.display).toBe("block");
            expect(mockToggleButton.textContent).toBe("▼ Hide Controls");
            expect(mockToggleButton.getAttribute("aria-expanded")).toBe("true");
        });

        it("should update DOM when state changes to hidden", () => {
            initializeControlsState();

            const subscriptionCallback = mockSubscribe.mock.calls[0]?.[1];
            expect(typeof subscriptionCallback).toBe("function");

            if (typeof subscriptionCallback === "function") {
                subscriptionCallback(false);
            }

            expect(mockWrapper.style.display).toBe("none");
            expect(mockToggleButton.textContent).toBe("▶ Show Controls");
            expect(mockToggleButton.getAttribute("aria-expanded")).toBe(
                "false"
            );
        });

        it("should handle missing DOM elements gracefully", () => {
            document.body.replaceChildren();

            expect(() => initializeControlsState()).not.toThrow();
            expect(mockSubscribe).toHaveBeenCalled();
        });
    });

    describe("toggleChartControls", () => {
        it("should toggle state from false to true", () => {
            mockGetState.mockReturnValue(false);

            toggleChartControls();

            expect(mockGetState).toHaveBeenCalledWith("charts.controlsVisible");
            expect(mockSetState).toHaveBeenCalledWith(
                "charts.controlsVisible",
                true,
                {
                    source: "toggleChartControls",
                }
            );
            expect(currentControlsVisible).toBe(true);
        });

        it("should toggle state from true to false", () => {
            mockGetState.mockReturnValue(true);

            toggleChartControls();

            expect(mockGetState).toHaveBeenCalledWith("charts.controlsVisible");
            expect(mockSetState).toHaveBeenCalledWith(
                "charts.controlsVisible",
                false,
                {
                    source: "toggleChartControls",
                }
            );
            expect(currentControlsVisible).toBe(false);
        });

        it("should handle undefined state", () => {
            mockGetState.mockReturnValue(undefined);

            toggleChartControls();

            expect(mockSetState).toHaveBeenCalledWith(
                "charts.controlsVisible",
                true,
                {
                    source: "toggleChartControls",
                }
            );
            expect(currentControlsVisible).not.toBe(false);
        });
    });

    describe("updateControlsState", () => {
        it("should return early if toggle button is missing", () => {
            mockToggleButton.remove();

            updateControlsState();

            expect(mockSetState).not.toHaveBeenCalled();
            expect(document.body.contains(mockWrapper)).toBe(true);
        });

        it("should return early if wrapper is missing", () => {
            mockWrapper.remove();

            updateControlsState();

            expect(mockSetState).not.toHaveBeenCalled();
            expect(document.body.contains(mockToggleButton)).toBe(true);
        });

        it("should detect visible controls and update state accordingly", () => {
            mockWrapper.style.display = "block";
            setWrapperOffsetParent(document.body);

            updateControlsState();

            expect(mockSetState).toHaveBeenCalledWith(
                "charts.controlsVisible",
                true,
                {
                    silent: true,
                    source: "updateControlsState",
                }
            );
            expect(currentControlsVisible).toBe(true);
            expect(mockToggleButton.textContent).toBe("▼ Hide Controls");
            expect(mockToggleButton.getAttribute("aria-expanded")).toBe("true");
            expect(mockWrapper.style.display).toBe("block");
        });

        it("should detect hidden controls (style.display = none) and update state", () => {
            mockWrapper.style.display = "none";
            setWrapperOffsetParent(document.body);

            updateControlsState();

            expect(mockSetState).toHaveBeenCalledWith(
                "charts.controlsVisible",
                false,
                {
                    silent: true,
                    source: "updateControlsState",
                }
            );
            expect(currentControlsVisible).toBe(false);
            expect(mockToggleButton.textContent).toBe("▶ Show Controls");
            expect(mockToggleButton.getAttribute("aria-expanded")).toBe(
                "false"
            );
            expect(mockWrapper.style.display).toBe("none");
        });

        it("should detect hidden controls (computed style = none) and update state", () => {
            mockWrapper.style.display = "block";
            setWrapperOffsetParent(document.body);
            mockGetComputedStyle.mockReturnValue({
                display: "none",
            } as CSSStyleDeclaration);

            updateControlsState();

            expect(mockSetState).toHaveBeenCalledWith(
                "charts.controlsVisible",
                false,
                {
                    silent: true,
                    source: "updateControlsState",
                }
            );
            expect(currentControlsVisible).toBe(false);
            expect(mockToggleButton.textContent).toBe("▶ Show Controls");
            expect(mockToggleButton.getAttribute("aria-expanded")).toBe(
                "false"
            );
            expect(mockWrapper.style.display).toBe("none");
        });

        it("should detect hidden controls (no offsetParent) and update state", () => {
            mockWrapper.style.display = "block";
            setWrapperOffsetParent(null);

            updateControlsState();

            expect(mockSetState).toHaveBeenCalledWith(
                "charts.controlsVisible",
                false,
                {
                    silent: true,
                    source: "updateControlsState",
                }
            );
            expect(currentControlsVisible).toBe(false);
            expect(mockToggleButton.textContent).toBe("▶ Show Controls");
            expect(mockToggleButton.getAttribute("aria-expanded")).toBe(
                "false"
            );
            expect(mockWrapper.style.display).toBe("none");
        });

        it("should call getComputedStyle correctly", () => {
            mockWrapper.style.display = "block";
            setWrapperOffsetParent(document.body);

            updateControlsState();

            expect(mockGetComputedStyle).toHaveBeenCalledWith(mockWrapper);
            expect(mockToggleButton.getAttribute("aria-expanded")).toBe("true");
        });
    });
});

void mockConsoleLog;
