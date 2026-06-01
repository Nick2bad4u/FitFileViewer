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
import type {
    StateListener,
    StateUpdateOptions,
} from "../../../../../electron-app/utils/state/core/stateManager.js";

type GetState = <T = unknown>(path?: string) => T | undefined;
type SetState = (
    path: string,
    value: unknown,
    options?: StateUpdateOptions
) => void;
type Subscribe = (path: string, callback: StateListener) => () => void;

vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: vi.fn<GetState>(),
        setState: vi.fn<SetState>(),
        subscribe: vi.fn<Subscribe>(() => () => {}),
    })
);

const mockGetState = vi.mocked(getState);
const mockSetState = vi.mocked(setState);
const mockSubscribe = vi.mocked(subscribe);

const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
const mockGetComputedStyle = vi.fn<(element: Element) => CSSStyleDeclaration>();

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

describe(updateControlsState, () => {
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

    describe(initializeControlsState, () => {
        it("should set up state subscription and initialize state", () => {
            expect.hasAssertions();

            initializeControlsState();

            expect(mockSubscribe).toHaveBeenCalledWith(
                "charts.controlsVisible",
                expect.any(Function)
            );
            expect(mockWrapper.style.display).toBe("none");
        });

        it("should update DOM when state changes to visible", () => {
            expect.hasAssertions();

            initializeControlsState();

            const subscriptionCallback = mockSubscribe.mock
                .calls[0]?.[1] as StateListener;
            expect(subscriptionCallback).toBeTypeOf("function");

            subscriptionCallback(true, false, "charts.controlsVisible");

            expect(mockWrapper.style.display).toBe("block");
            expect(mockToggleButton.textContent).toBe("▼ Hide Controls");
            expect(mockToggleButton.getAttribute("aria-expanded")).toBe("true");
        });

        it("should update DOM when state changes to hidden", () => {
            expect.hasAssertions();

            initializeControlsState();

            const subscriptionCallback = mockSubscribe.mock
                .calls[0]?.[1] as StateListener;
            expect(subscriptionCallback).toBeTypeOf("function");

            subscriptionCallback(false, true, "charts.controlsVisible");

            expect(mockWrapper.style.display).toBe("none");
            expect(mockToggleButton.textContent).toBe("▶ Show Controls");
            expect(mockToggleButton.getAttribute("aria-expanded")).toBe(
                "false"
            );
        });

        it("should handle missing DOM elements gracefully", () => {
            expect.hasAssertions();

            document.body.replaceChildren();

            expect(initializeControlsState()).toBeUndefined();
            expect(mockSubscribe).toHaveBeenCalledWith(
                "charts.controlsVisible",
                expect.any(Function)
            );
        });
    });

    describe(toggleChartControls, () => {
        it("should toggle state from false to true", () => {
            expect.hasAssertions();

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
            expect.hasAssertions();

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
            expect.hasAssertions();

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

    describe(updateControlsState, () => {
        it("should return early if toggle button is missing", () => {
            expect.hasAssertions();

            mockToggleButton.remove();

            updateControlsState();

            expect(mockSetState).not.toHaveBeenCalled();
            expect(document.body.contains(mockWrapper)).toBe(true);
        });

        it("should return early if wrapper is missing", () => {
            expect.hasAssertions();

            mockWrapper.remove();

            updateControlsState();

            expect(mockSetState).not.toHaveBeenCalled();
            expect(document.body.contains(mockToggleButton)).toBe(true);
        });

        it("should detect visible controls and update state accordingly", () => {
            expect.hasAssertions();

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
            expect.hasAssertions();

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
            expect.hasAssertions();

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
            expect.hasAssertions();

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
            expect.hasAssertions();

            mockWrapper.style.display = "block";
            setWrapperOffsetParent(document.body);

            updateControlsState();

            expect(mockGetComputedStyle).toHaveBeenCalledWith(mockWrapper);
            expect(mockToggleButton.getAttribute("aria-expanded")).toBe("true");
        });
    });
});

void mockConsoleLog;
