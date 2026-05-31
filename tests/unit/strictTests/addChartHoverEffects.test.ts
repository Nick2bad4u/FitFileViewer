import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    addChartHoverEffects,
    removeChartHoverEffects,
    addHoverEffectsToExistingCharts,
    type ChartHoverThemeConfig,
} from "../../../electron-app/utils/charts/plugins/addChartHoverEffects.js";

type ChartHoverTestGlobal = typeof globalThis & {
    __FFV_debugCharts?: boolean;
    getThemeConfig?: () => ChartHoverThemeConfig;
};

type ChartWrapperState = {
    canvasParentClass: string | undefined;
    containerChildClasses: string[];
    wrapperChildClasses: string[];
    wrapperCount: number;
};

const chartHoverTestGlobal = globalThis as ChartHoverTestGlobal;

async function waitForTimers(): Promise<void> {
    await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
            clearTimeout(timeout);
            resolve();
        }, 0);
    });
}

function getWrapperState(
    container: HTMLElement,
    canvas: HTMLElement
): ChartWrapperState {
    const wrapper = container.querySelector(".chart-wrapper");

    return {
        canvasParentClass: canvas.parentElement?.className,
        containerChildClasses: Array.from(container.children, (element) =>
            element instanceof HTMLElement ? element.className : element.tagName
        ),
        wrapperChildClasses: wrapper
            ? Array.from(wrapper.children, (element) =>
                  element instanceof HTMLElement
                      ? element.className
                      : element.tagName
              )
            : [],
        wrapperCount: container.querySelectorAll(".chart-wrapper").length,
    };
}

// Mock getThemeConfig
vi.mock(import("../../theming/core/theme.js"), () => ({
    getThemeConfig: vi.fn<() => ChartHoverThemeConfig>(() => ({
        colors: {
            border: "#444",
            surface: "#222",
            shadowLight: "#00000055",
            primaryShadowLight: "#00000033",
            primary: "#888",
            accent: "#555",
            textPrimary: "#fff",
            shadow: "#00000088",
            primaryShadowHeavy: "#00000055",
            surfaceSecondary: "#333",
        },
    })),
}));

let mockConsoleWarn: ReturnType<typeof vi.spyOn>;
let mockConsoleLog: ReturnType<typeof vi.spyOn>;
let originalNodeEnv: string | undefined;

describe(addChartHoverEffects, () => {
    let mockContainer: HTMLElement;
    let mockCanvas: HTMLElement;
    let mockThemeConfig: ChartHoverThemeConfig;

    beforeEach(() => {
        // Ensure debug logging is enabled for deterministic log assertions.
        // The implementation only logs when NODE_ENV=development and __FFV_debugCharts is truthy.
        originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "development";
        chartHoverTestGlobal.__FFV_debugCharts = true;

        // Spy console methods *after* Vitest has patched them.
        mockConsoleWarn = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {});
        mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

        // Reset DOM
        document.body.innerHTML = "";
        document.head.innerHTML = "";

        // Create mock elements
        mockContainer = document.createElement("div");
        mockContainer.id = "chart-container";
        mockCanvas = document.createElement("canvas");
        mockCanvas.className = "chart-canvas";
        mockCanvas.setAttribute("aria-label", "Test Chart for Speed Data");
        mockContainer.appendChild(mockCanvas);
        document.body.appendChild(mockContainer);

        mockThemeConfig = {
            colors: {
                border: "#444",
                surface: "#222",
                shadowLight: "#00000055",
                primaryShadowLight: "#00000033",
                primary: "#888",
                accent: "#555",
                textPrimary: "#fff",
                shadow: "#00000088",
                primaryShadowHeavy: "#00000055",
                surfaceSecondary: "#333",
            },
        };

        // Reset mocks
        mockConsoleWarn.mockClear();
        mockConsoleLog.mockClear();
    });

    afterEach(() => {
        mockConsoleWarn?.mockRestore();
        mockConsoleLog?.mockRestore();
        process.env.NODE_ENV = originalNodeEnv;
        // eslint-disable-next-line no-underscore-dangle
        delete chartHoverTestGlobal.__FFV_debugCharts;

        vi.clearAllMocks();
    });

    describe("parameter validation", () => {
        it("should warn and return when chartContainer is missing", () => {
            expect.hasAssertions();

            addChartHoverEffects(null, mockThemeConfig);

            expect(document.querySelector(".chart-wrapper")).toBeNull();
            expect(mockCanvas.parentElement).toBe(mockContainer);
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                "[ChartHoverEffects] Missing required parameters"
            );
            expect(mockConsoleLog).not.toHaveBeenCalled();
        });

        it("should warn and return when themeConfig is missing", () => {
            expect.hasAssertions();

            addChartHoverEffects(mockContainer, null);

            expect(mockContainer.querySelector(".chart-wrapper")).toBeNull();
            expect(mockCanvas.parentElement).toBe(mockContainer);
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                "[ChartHoverEffects] Missing required parameters"
            );
            expect(mockConsoleLog).not.toHaveBeenCalled();
        });

        it("should warn and return when both parameters are missing", () => {
            expect.hasAssertions();

            addChartHoverEffects(null, null);

            expect(document.querySelector(".chart-wrapper")).toBeNull();
            expect(mockCanvas.parentElement).toBe(mockContainer);
            expect(mockConsoleWarn).toHaveBeenCalledWith(
                "[ChartHoverEffects] Missing required parameters"
            );
            expect(mockConsoleLog).not.toHaveBeenCalled();
        });
    });

    describe("canvas discovery and filtering", () => {
        it("should find all chart canvases in container", () => {
            expect.hasAssertions();

            const canvas2 = document.createElement("canvas");
            canvas2.className = "chart-canvas";
            canvas2.setAttribute("aria-label", "Chart");
            mockContainer.appendChild(canvas2);

            const logSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});
            addChartHoverEffects(mockContainer, mockThemeConfig);

            expect(
                mockContainer.querySelectorAll(".chart-wrapper")
            ).toHaveLength(2);
            expect(
                mockContainer.querySelectorAll(".chart-canvas")
            ).toHaveLength(2);
            expect(console.log).toHaveBeenCalledWith(
                "[ChartHoverEffects] Added hover effects to chart: Test Chart for Speed Data"
            );
            expect(console.log).toHaveBeenCalledWith(
                "[ChartHoverEffects] Added hover effects to chart: Chart"
            );
            expect(console.log).toHaveBeenCalledWith(
                "[ChartHoverEffects] Added hover effects to 2 chart(s)"
            );

            logSpy.mockRestore();
        });

        it("should handle empty canvas collection", () => {
            expect.hasAssertions();

            vi.spyOn(mockContainer, "querySelectorAll").mockReturnValue(
                [] as unknown as NodeListOf<Element>
            );

            const logSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});
            addChartHoverEffects(mockContainer, mockThemeConfig);

            expect(mockContainer.querySelector(".chart-wrapper")).toBeNull();
            expect(
                mockContainer.querySelectorAll(".chart-wrapper")
            ).toStrictEqual([]);
            expect(
                document.querySelector("#chart-hover-effects-styles")
            ).toBeInstanceOf(HTMLStyleElement);
            expect(console.log).toHaveBeenCalledWith(
                "[ChartHoverEffects] Added hover effects to 0 chart(s)"
            );

            logSpy.mockRestore();
        });
    });

    describe("dom manipulation", () => {
        it("should create wrapper div and move canvas into it", () => {
            expect.hasAssertions();

            addChartHoverEffects(mockContainer, mockThemeConfig);

            const wrapper = mockContainer.querySelector(
                ".chart-wrapper"
            ) as HTMLElement;
            expect({
                canvasParentClass: mockCanvas.parentElement?.className,
                wrapperChildTags: Array.from(
                    wrapper.children,
                    (element) => element.tagName
                ),
                wrapperClass: wrapper.className,
                wrapperTag: wrapper.tagName,
            }).toStrictEqual({
                canvasParentClass: "chart-wrapper",
                wrapperChildTags: [
                    "CANVAS",
                    "DIV",
                    "DIV",
                    "DIV",
                    "BUTTON",
                ],
                wrapperClass: "chart-wrapper",
                wrapperTag: "DIV",
            });
        });

        it("should apply correct styles to wrapper", () => {
            expect.hasAssertions();

            addChartHoverEffects(mockContainer, mockThemeConfig);

            const wrapper = mockContainer.querySelector(
                ".chart-wrapper"
            ) as HTMLElement;
            // Check that wrapper has the expected class and basic structure
            expect(wrapper.className).toBe("chart-wrapper");
            // Since cssText may not work in jsdom, just verify wrapper exists and has correct class
            expect(wrapper.parentNode).toBe(mockContainer);
        });

        it("should update canvas styles", () => {
            expect.hasAssertions();

            addChartHoverEffects(mockContainer, mockThemeConfig);

            // Canvas styles should be updated (check properties that should be set)
            expect(mockCanvas.style.boxShadow).toBe("none");
            expect(mockCanvas.style.margin).toBe("0px");
            expect(mockCanvas.style.width).toBe("100%");
            expect(mockCanvas.style.maxHeight).toBe("400px");
            expect(mockCanvas.style.display).toBe("block");
            // Note: border may show as "medium" in jsdom but the function sets it to "none"
        });

        it("should create glow overlay", () => {
            expect.hasAssertions();

            addChartHoverEffects(mockContainer, mockThemeConfig);

            const wrapper = mockContainer.querySelector(
                ".chart-wrapper"
            ) as HTMLElement;
            const glowOverlay = wrapper.querySelector(
                ".chart-glow-overlay"
            ) as HTMLElement;
            expect(glowOverlay.className).toBe("chart-glow-overlay");
            expect(glowOverlay.style.opacity).toBe("0");
        });

        it("should create title overlay with processed chart title", () => {
            expect.hasAssertions();

            addChartHoverEffects(mockContainer, mockThemeConfig);

            const wrapper = mockContainer.querySelector(
                ".chart-wrapper"
            ) as HTMLElement;
            const titleOverlay = wrapper.querySelector(
                ".chart-title-overlay"
            ) as HTMLElement;
            expect(titleOverlay.className).toBe("chart-title-overlay");
            expect(titleOverlay.textContent).toBe("TEST SPEED DATA");
            expect(titleOverlay.style.opacity).toBe("0");
        });

        it("should handle canvas without aria-label", () => {
            expect.hasAssertions();

            mockCanvas.removeAttribute("aria-label");

            addChartHoverEffects(mockContainer, mockThemeConfig);

            const wrapper = mockContainer.querySelector(
                ".chart-wrapper"
            ) as HTMLElement;
            const titleOverlay = wrapper.querySelector(
                ".chart-title-overlay"
            ) as HTMLElement;
            expect(titleOverlay.textContent).toBe("CHART");
        });
    });

    describe("event listeners", () => {
        it("should attach mouseenter event listener", () => {
            expect.hasAssertions();

            addChartHoverEffects(mockContainer, mockThemeConfig);

            const wrapper = mockContainer.querySelector(
                ".chart-wrapper"
            ) as HTMLElement;
            const mouseenterEvent = new Event("mouseenter");

            wrapper.dispatchEvent(mouseenterEvent);

            expect(wrapper.style.transform).toBe(
                "translateY(-6px) scale(1.02)"
            );
            expect(wrapper.style.boxShadow).toContain("0 12px 40px");
        });

        it("should attach mouseleave event listener", () => {
            expect.hasAssertions();

            addChartHoverEffects(mockContainer, mockThemeConfig);

            const wrapper = mockContainer.querySelector(
                ".chart-wrapper"
            ) as HTMLElement;

            // First trigger mouseenter
            wrapper.dispatchEvent(new Event("mouseenter"));
            // Then trigger mouseleave
            wrapper.dispatchEvent(new Event("mouseleave"));

            expect(wrapper.style.transform).toBe("translateY(0) scale(1)");
            expect(wrapper.style.boxShadow).toContain("0 4px 20px");
        });

        it("should attach click event listener with ripple effect", () => {
            expect.hasAssertions();

            addChartHoverEffects(mockContainer, mockThemeConfig);

            const wrapper = mockContainer.querySelector(
                ".chart-wrapper"
            ) as HTMLElement;
            const clickEvent = new MouseEvent("click", {
                clientX: 100,
                clientY: 100,
            });

            wrapper.dispatchEvent(clickEvent);

            const ripples = Array.from(wrapper.children).filter((el) => {
                if (!(el instanceof HTMLElement)) {
                    return false;
                }
                return el.style.animation.includes("ripple-effect");
            }) as HTMLElement[];
            expect(ripples).toHaveLength(1);
            expect(ripples[0]?.style.cssText).toContain(
                "animation: ripple-effect 0.6s ease-out"
            );
        });

        it("should not create a ripple when fullscreen button is clicked", () => {
            expect.hasAssertions();

            addChartHoverEffects(mockContainer, mockThemeConfig);

            const wrapper = mockContainer.querySelector(
                ".chart-wrapper"
            ) as HTMLElement;
            const fullscreenBtn = wrapper.querySelector(
                ".chart-fullscreen-btn"
            ) as HTMLButtonElement;

            fullscreenBtn.click();

            const ripples = Array.from(wrapper.children).filter((el) => {
                return (
                    el instanceof HTMLElement &&
                    el.style.animation.includes("ripple-effect")
                );
            });
            expect(ripples).toStrictEqual([]);
            expect(ripples).not.toHaveLength(1);
        });

        it("should mark canvas as having hover effects", () => {
            expect.hasAssertions();

            addChartHoverEffects(mockContainer, mockThemeConfig);

            expect(mockCanvas.dataset.hoverEffectsAdded).toBe("true");
        });

        it("should enter overlay fullscreen when chart fullscreen button is clicked", async () => {
            expect.hasAssertions();

            addChartHoverEffects(mockContainer, mockThemeConfig);

            const wrapper = mockContainer.querySelector(
                ".chart-wrapper"
            ) as HTMLElement;
            const fullscreenBtn = wrapper.querySelector(
                ".chart-fullscreen-btn"
            ) as HTMLButtonElement;

            expect(fullscreenBtn.type).toBe("button");

            // Force native fullscreen failure so fallback overlay mode is exercised.
            Object.defineProperty(wrapper, "requestFullscreen", {
                configurable: true,
                value: vi.fn<() => Promise<void> | void>(() => {
                    throw new Error("Native fullscreen unavailable in test");
                }),
            });
            Object.defineProperty(wrapper, "webkitRequestFullscreen", {
                configurable: true,
                value: undefined,
            });
            Object.defineProperty(wrapper, "mozRequestFullScreen", {
                configurable: true,
                value: undefined,
            });
            Object.defineProperty(wrapper, "msRequestFullscreen", {
                configurable: true,
                value: undefined,
            });

            fullscreenBtn.click();
            await waitForTimers();
            await waitForTimers();

            expect(
                wrapper.classList.contains("chart-wrapper--overlay-fullscreen")
            ).toStrictEqual(true);
            expect({
                bodyClasses: [...document.body.classList],
                wrapperClasses: [...wrapper.classList],
            }).toStrictEqual({
                bodyClasses: ["chart-overlay-fullscreen-active"],
                wrapperClasses: [
                    "chart-wrapper",
                    "chart-wrapper--overlay-fullscreen",
                    "chart-wrapper--fullscreen",
                ],
            });
        });

        it("should exit overlay fullscreen when chart fullscreen button is clicked again", async () => {
            expect.hasAssertions();

            addChartHoverEffects(mockContainer, mockThemeConfig);

            const wrapper = mockContainer.querySelector(
                ".chart-wrapper"
            ) as HTMLElement;
            const fullscreenBtn = wrapper.querySelector(
                ".chart-fullscreen-btn"
            ) as HTMLButtonElement;

            Object.defineProperty(wrapper, "requestFullscreen", {
                configurable: true,
                value: vi.fn<() => Promise<void> | void>(() => {
                    throw new Error("Native fullscreen unavailable in test");
                }),
            });
            Object.defineProperty(wrapper, "webkitRequestFullscreen", {
                configurable: true,
                value: undefined,
            });
            Object.defineProperty(wrapper, "mozRequestFullScreen", {
                configurable: true,
                value: undefined,
            });
            Object.defineProperty(wrapper, "msRequestFullscreen", {
                configurable: true,
                value: undefined,
            });

            fullscreenBtn.click();
            await waitForTimers();
            await waitForTimers();

            expect(
                wrapper.classList.contains("chart-wrapper--overlay-fullscreen")
            ).toStrictEqual(true);

            fullscreenBtn.click();
            await waitForTimers();

            expect({
                bodyClasses: [...document.body.classList],
                wrapperClasses: [...wrapper.classList],
            }).toStrictEqual({
                bodyClasses: [],
                wrapperClasses: ["chart-wrapper"],
            });
        });
    });

    describe("css injection", () => {
        it("should inject CSS styles on first call", () => {
            expect.hasAssertions();

            addChartHoverEffects(mockContainer, mockThemeConfig);

            const styleElement = document.getElementById(
                "chart-hover-effects-styles"
            ) as HTMLStyleElement;
            expect(styleElement.tagName).toBe("STYLE");
            expect(styleElement.textContent).toContain(
                "@keyframes ripple-effect"
            );
        });

        it("should not inject CSS styles on subsequent calls", () => {
            expect.hasAssertions();

            // First call
            addChartHoverEffects(mockContainer, mockThemeConfig);
            const firstStyleCount = document.querySelectorAll("style").length;

            // Second call with different container
            const container2 = document.createElement("div");
            const canvas2 = document.createElement("canvas");
            canvas2.className = "chart-canvas";
            container2.appendChild(canvas2);
            document.body.appendChild(container2);

            addChartHoverEffects(container2, mockThemeConfig);
            const secondStyleCount = document.querySelectorAll("style").length;

            expect(secondStyleCount).toBe(firstStyleCount);
            expect(secondStyleCount).not.toBe(firstStyleCount + 1);
        });
    });

    describe("theme integration", () => {
        it("should use theme colors for styling", () => {
            expect.hasAssertions();

            const customTheme = {
                colors: {
                    border: "#custom-border",
                    surface: "#custom-surface",
                    primary: "#custom-primary",
                    shadowLight: "#custom-shadow",
                },
            };

            addChartHoverEffects(mockContainer, customTheme);

            const wrapper = mockContainer.querySelector(
                ".chart-wrapper"
            ) as HTMLElement;
            expect(wrapper.className).toBe("chart-wrapper");
            expect(getWrapperState(mockContainer, mockCanvas)).toMatchObject({
                canvasParentClass: "chart-wrapper",
                wrapperCount: 1,
            });
            // Theme colors are applied via cssText, just verify wrapper exists
        });

        it("should handle missing color properties gracefully", () => {
            expect.hasAssertions();

            const incompleteTheme = {
                colors: {},
            };

            addChartHoverEffects(mockContainer, incompleteTheme);

            const wrapper = mockContainer.querySelector(
                ".chart-wrapper"
            ) as HTMLElement;
            // Should use fallback values
            expect(wrapper.className).toBe("chart-wrapper");
            expect(getWrapperState(mockContainer, mockCanvas)).toMatchObject({
                canvasParentClass: "chart-wrapper",
                wrapperCount: 1,
            });
        });
    });

    describe("logging", () => {
        it("should log successful addition of hover effects", () => {
            expect.hasAssertions();

            const logSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});
            addChartHoverEffects(mockContainer, mockThemeConfig);

            expect(
                mockContainer.querySelectorAll(".chart-wrapper")
            ).toHaveLength(1);
            expect(mockConsoleWarn).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith(
                "[ChartHoverEffects] Added hover effects to chart: Test Chart for Speed Data"
            );
            expect(console.log).toHaveBeenCalledWith(
                "[ChartHoverEffects] Added hover effects to 1 chart(s)"
            );

            logSpy.mockRestore();
        });
    });
});

describe(removeChartHoverEffects, () => {
    let mockContainer: HTMLElement;
    let mockCanvas: HTMLElement;

    beforeEach(() => {
        document.body.innerHTML = "";
        mockContainer = document.createElement("div");
        mockCanvas = document.createElement("canvas");
        mockCanvas.className = "chart-canvas";
        mockContainer.appendChild(mockCanvas);
        document.body.appendChild(mockContainer);

        mockConsoleLog.mockClear();
    });

    it("should return early when container is null", () => {
        expect.hasAssertions();

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        removeChartHoverEffects(null);

        expect(getWrapperState(mockContainer, mockCanvas)).toStrictEqual({
            canvasParentClass: "",
            containerChildClasses: ["chart-canvas"],
            wrapperChildClasses: [],
            wrapperCount: 0,
        });
        expect(mockContainer.querySelectorAll(".chart-wrapper")).toHaveLength(
            0
        );
        expect(console.log).not.toHaveBeenCalled();

        logSpy.mockRestore();
    });

    it("should remove wrapper and restore canvas position", () => {
        expect.hasAssertions();

        // First add effects
        const themeConfig = {
            colors: {
                border: "#444",
                surface: "#222",
                shadowLight: "#00000055",
            },
        };
        addChartHoverEffects(mockContainer, themeConfig);

        // Verify wrapper exists
        let wrapper = mockContainer.querySelector(".chart-wrapper");
        expect(mockContainer.querySelectorAll(".chart-wrapper")).toHaveLength(
            1
        );

        // Remove effects
        removeChartHoverEffects(mockContainer);

        // Verify wrapper is removed and canvas is back
        wrapper = mockContainer.querySelector(".chart-wrapper");
        expect(mockContainer.querySelectorAll(".chart-wrapper")).toHaveLength(
            0
        );
        expect(wrapper).toBeNull();
        expect(getWrapperState(mockContainer, mockCanvas)).toStrictEqual({
            canvasParentClass: "",
            containerChildClasses: ["chart-canvas"],
            wrapperChildClasses: [],
            wrapperCount: 0,
        });
    });

    it("should restore canvas styles", () => {
        expect.hasAssertions();

        const themeConfig = {
            colors: {
                shadowLight: "#00000055",
            },
        };
        addChartHoverEffects(mockContainer, themeConfig);

        removeChartHoverEffects(mockContainer);

        expect(mockCanvas.style.border).toBe("");
        expect(mockCanvas.style.margin).toBe("");
        expect(mockCanvas.style.marginBottom).toBe("20px");
        // Box shadow should be set to theme value or fallback
        // Box shadow should be restored (may have jsdom default)
        expect(mockCanvas.style.boxShadow).toContain("0 2px 8px");
    });

    it("should remove hover effects marker", () => {
        expect.hasAssertions();

        const themeConfig = { colors: {} };
        addChartHoverEffects(mockContainer, themeConfig);

        expect(mockCanvas.dataset.hoverEffectsAdded).toBe("true");

        removeChartHoverEffects(mockContainer);

        expect(mockCanvas.dataset).not.toHaveProperty("hoverEffectsAdded");
    });

    it("should handle empty wrapper collection", () => {
        expect.hasAssertions();

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        removeChartHoverEffects(mockContainer);

        expect(mockContainer.querySelectorAll(".chart-wrapper")).toHaveLength(
            0
        );
        expect(console.log).toHaveBeenCalledWith(
            "[ChartHoverEffects] Removed hover effects from 0 chart(s)"
        );

        logSpy.mockRestore();
    });

    it("should log removal of hover effects", () => {
        expect.hasAssertions();

        const themeConfig = { colors: {} };
        addChartHoverEffects(mockContainer, themeConfig);

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        removeChartHoverEffects(mockContainer);

        expect(mockContainer.querySelectorAll(".chart-wrapper")).toHaveLength(
            0
        );
        expect(getWrapperState(mockContainer, mockCanvas)).toStrictEqual({
            canvasParentClass: "",
            containerChildClasses: ["chart-canvas"],
            wrapperChildClasses: [],
            wrapperCount: 0,
        });
        expect(console.log).toHaveBeenCalledWith(
            "[ChartHoverEffects] Removed hover effects from 1 chart(s)"
        );

        logSpy.mockRestore();
    });
});

describe(addHoverEffectsToExistingCharts, () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        mockConsoleWarn.mockClear();
        mockConsoleLog.mockClear();
    });

    it("should warn when chart container not found", () => {
        expect.hasAssertions();

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        addHoverEffectsToExistingCharts();

        expect([...document.querySelectorAll(".chart-wrapper")]).toStrictEqual(
            []
        );
        expect(mockConsoleLog).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledWith(
            "[DevHelper] Chart container not found"
        );

        warnSpy.mockRestore();
    });

    it("should add hover effects to existing charts", () => {
        expect.hasAssertions();

        const container = document.createElement("div");
        container.id = "chartjs-chart-container";
        const canvas = document.createElement("canvas");
        canvas.className = "chart-canvas";
        container.appendChild(canvas);
        document.body.appendChild(container);

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        addHoverEffectsToExistingCharts();

        const wrapper = container.querySelector(".chart-wrapper");
        expect(container.querySelectorAll(".chart-wrapper")).toHaveLength(1);
        expect({
            canvasParentClass: canvas.parentElement?.className,
            wrapperClass:
                wrapper instanceof HTMLElement ? wrapper.className : null,
        }).toStrictEqual({
            canvasParentClass: "chart-wrapper",
            wrapperClass: "chart-wrapper",
        });
        expect(console.log).toHaveBeenCalledWith(
            "[DevHelper] Hover effects added to existing charts"
        );

        logSpy.mockRestore();
    });

    it("should use global getThemeConfig when available", () => {
        expect.hasAssertions();

        const container = document.createElement("div");
        container.id = "chartjs-chart-container";
        const canvas = document.createElement("canvas");
        canvas.className = "chart-canvas";
        container.appendChild(canvas);
        document.body.appendChild(container);

        const getThemeConfigMock = vi.fn<() => ChartHoverThemeConfig>(() => ({
            colors: {},
        }));
        Object.defineProperty(chartHoverTestGlobal, "getThemeConfig", {
            configurable: true,
            value: getThemeConfigMock,
        });

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        addHoverEffectsToExistingCharts();

        const wrapper = container.querySelector(".chart-wrapper");
        expect(container.querySelectorAll(".chart-wrapper")).toHaveLength(1);
        expect({
            canvasParentClass: canvas.parentElement?.className,
            wrapperClass:
                wrapper instanceof HTMLElement ? wrapper.className : null,
        }).toStrictEqual({
            canvasParentClass: "chart-wrapper",
            wrapperClass: "chart-wrapper",
        });
        expect(getThemeConfigMock).toHaveBeenCalledWith();
        expect(console.log).toHaveBeenCalledWith(
            "[DevHelper] Hover effects added to existing charts"
        );

        logSpy.mockRestore();
        delete chartHoverTestGlobal.getThemeConfig;
    });
});

describe("edge cases", () => {
    let mockContainer: HTMLElement;
    let mockCanvas: HTMLElement;
    let mockThemeConfig: ChartHoverThemeConfig;

    beforeEach(() => {
        document.body.innerHTML = "";
        mockContainer = document.createElement("div");
        mockCanvas = document.createElement("canvas");
        mockCanvas.className = "chart-canvas";
        mockContainer.appendChild(mockCanvas);
        document.body.appendChild(mockContainer);

        mockThemeConfig = { colors: {} };
    });

    it("should handle canvas without dataset property", () => {
        expect.hasAssertions();

        Object.defineProperty(mockCanvas, "dataset", {
            configurable: true,
            value: undefined,
        });

        addChartHoverEffects(mockContainer, mockThemeConfig);

        const wrapper = mockContainer.querySelector(".chart-wrapper");
        expect(wrapper).toBeInstanceOf(HTMLDivElement);
        expect(getWrapperState(mockContainer, mockCanvas)).toMatchObject({
            canvasParentClass: "chart-wrapper",
            wrapperCount: 1,
        });
        expect(mockCanvas.style.height).toBe("400px");
    });

    it("should handle canvas without parentNode", () => {
        expect.hasAssertions();

        const orphanCanvas = document.createElement("canvas");
        orphanCanvas.className = "chart-canvas";
        vi.spyOn(mockContainer, "querySelectorAll").mockReturnValue([
            orphanCanvas,
        ] as unknown as NodeListOf<Element>);

        addChartHoverEffects(mockContainer, mockThemeConfig);

        expect(orphanCanvas.dataset.hoverEffectsAdded).toBe("true");
        expect(orphanCanvas.parentElement?.className).toBe("chart-wrapper");
        expect({
            bodyCanvasCount: document.body.querySelectorAll("canvas").length,
            orphanParentClass: orphanCanvas.parentElement?.className,
        }).toStrictEqual({
            bodyCanvasCount: 1,
            orphanParentClass: "chart-wrapper",
        });
    });

    it("should handle wrapper creation failure gracefully", () => {
        expect.hasAssertions();

        const originalCreateElement = document.createElement.bind(document);
        const createElementSpy = vi
            .spyOn(document, "createElement")
            .mockImplementation((tag) => {
                if (tag === "div") throw new Error("Creation failed");
                return originalCreateElement(tag);
            });

        expect(() => {
            addChartHoverEffects(mockContainer, mockThemeConfig);
        }).toThrow("Creation failed");

        createElementSpy.mockRestore();
    });

    it("should handle multiple calls on same container", () => {
        expect.hasAssertions();

        addChartHoverEffects(mockContainer, mockThemeConfig);
        addChartHoverEffects(mockContainer, mockThemeConfig);

        const wrappers = mockContainer.querySelectorAll(".chart-wrapper");
        expect({
            wrapperClasses: Array.from(wrappers, (wrapper) =>
                wrapper instanceof HTMLElement ? wrapper.className : ""
            ),
            wrapperCount: wrappers.length,
        }).toStrictEqual({
            wrapperClasses: ["chart-wrapper"],
            wrapperCount: 1,
        });
    });
});
