import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";
import type { detectCurrentTheme as detectCurrentThemeSignature } from "../../../../../electron-app/utils/charts/theming/chartThemeUtils.js";
import type { formatTime as formatTimeSignature } from "../../../../../electron-app/utils/formatting/formatters/formatTime.js";
import type { getUnitSymbol as getUnitSymbolSignature } from "../../../../../electron-app/utils/data/lookups/getUnitSymbol.js";
import type { getChartZoneColors as getChartZoneColorsSignature } from "../../../../../electron-app/utils/data/zones/chartZoneColorUtils.js";

type ChartConfig = {
    data: {
        datasets: Array<{
            backgroundColor?: string;
            label?: string;
        }>;
        labels: string[];
    };
    options: {
        plugins: {
            chartBackgroundColorPlugin: unknown;
            title?: {
                display?: boolean;
                text?: string;
            };
            tooltip: {
                callbacks: {
                    label: (context: TooltipContext) => string;
                };
            };
        };
        scales: {
            y: {
                ticks: {
                    callback: (value: number | string) => string;
                };
            };
        };
    };
    type: "bar";
};

type ChartInstance = {
    config?: ChartConfig;
    data: {
        datasets: unknown[];
    };
    destroy: ReturnType<typeof vi.fn<() => void>>;
    options: {
        plugins: {
            chartBackgroundColorPlugin: { backgroundColor: null | string };
            tooltip: { callbacks: { label: ReturnType<typeof vi.fn> } };
        };
        scales: {
            x: { ticks: { color: null | string } };
            y: {
                ticks: {
                    callback: ReturnType<typeof vi.fn>;
                    color: null | string;
                };
            };
        };
    };
    update: ReturnType<typeof vi.fn<() => void>>;
};

type ChartMock = ReturnType<
    typeof vi.fn<
        (canvasElement: HTMLCanvasElement, config: ChartConfig) => ChartInstance
    >
>;

type ShowNotification = (
    message: string,
    type?: string,
    duration?: number,
    options?: unknown
) => Promise<void> | void;

type TestGlobal = typeof globalThis & {
    __lastChartConfig?: ChartConfig;
};

type TooltipContext = {
    dataset: { label: string };
    parsed: { y: number };
};

const testGlobal = globalThis as TestGlobal;
type GlobalFixtureName =
    | "document"
    | "HTMLCanvasElement"
    | "HTMLElement"
    | "window";
const originalGlobalDescriptors = new Map<
    GlobalFixtureName,
    PropertyDescriptor
>();

function rememberGlobalDescriptor(name: GlobalFixtureName): void {
    if (!originalGlobalDescriptors.has(name)) {
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);

        if (!descriptor) {
            throw new Error(`Expected globalThis.${name} to exist`);
        }

        originalGlobalDescriptors.set(name, descriptor);
    }
}

function setGlobalValue(name: GlobalFixtureName, value: unknown): void {
    rememberGlobalDescriptor(name);
    Object.defineProperty(globalThis, name, {
        configurable: true,
        value,
        writable: true,
    });
}

function restoreGlobalValues(): void {
    for (const [name, descriptor] of originalGlobalDescriptors) {
        Object.defineProperty(globalThis, name, descriptor);
    }
    originalGlobalDescriptors.clear();
}

const chartModuleMock = vi.hoisted(() => {
    const state = {
        instance: undefined as ChartInstance | undefined,
        lastConfig: undefined as ChartConfig | undefined,
    };
    const Chart = vi.fn<
        (canvasElement: HTMLCanvasElement, config: ChartConfig) => ChartInstance
    >(function ChartConstructorMock(_canvasElement, config) {
        state.lastConfig = config;
        if (state.instance) {
            state.instance.config = config;
            return state.instance;
        }

        return {
            config,
            data: { datasets: [] },
            destroy: vi.fn<() => void>(),
            options: {
                plugins: {
                    chartBackgroundColorPlugin: { backgroundColor: null },
                    tooltip: { callbacks: { label: vi.fn() } },
                },
                scales: {
                    x: { ticks: { color: null } },
                    y: {
                        ticks: {
                            callback: vi.fn(),
                            color: null,
                        },
                    },
                },
            },
            update: vi.fn<() => void>(),
        };
    });

    return { Chart, state };
});
const notificationMocks = vi.hoisted(() => ({
    showNotification: vi.fn<ShowNotification>(),
}));

vi.mock("chart.js/auto", () => ({ default: chartModuleMock.Chart }));
vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: notificationMocks.showNotification,
    })
);

// Mock dependencies before importing the module
vi.mock(
    import("../../../../../electron-app/utils/charts/theming/chartThemeUtils.js"),
    () => ({
        detectCurrentTheme: vi
            .fn<typeof detectCurrentThemeSignature>()
            .mockReturnValue("light"),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/data/zones/chartZoneColorUtils.js"),
    () => ({
        getChartZoneColors: vi
            .fn<typeof getChartZoneColorsSignature>()
            .mockReturnValue([
                "#ff0000",
                "#00ff00",
                "#0000ff",
                "#ffff00",
                "#00ffff",
            ]),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/data/lookups/getUnitSymbol.js"),
    () => ({
        getUnitSymbol: vi
            .fn<typeof getUnitSymbolSignature>()
            .mockReturnValue("h:m:s"),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/formatting/formatters/formatTime.js"),
    () => ({
        formatTime: vi
            .fn<typeof formatTimeSignature>()
            .mockImplementation((value) => `${value}s`),
    })
);

// Mock Chart.js plugins
vi.mock(
    import("../../../../../electron-app/utils/charts/plugins/chartZoomResetPlugin.js"),
    () => ({
        chartZoomResetPlugin: {},
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/plugins/chartBackgroundColorPlugin.js"),
    () => ({
        chartBackgroundColorPlugin: {},
    })
);

// Import the module after mocks
import { renderSingleHRZoneBar } from "../../../../../electron-app/utils/data/zones/renderSingleHRZoneBar.js";
import {
    clearChartRuntimeForTests,
    registerChartRuntime,
} from "../../../../../electron-app/utils/charts/core/chartRuntime.js";
import * as formatTime from "../../../../../electron-app/utils/formatting/formatters/formatTime.js";
import * as chartZoneColorUtils from "../../../../../electron-app/utils/data/zones/chartZoneColorUtils.js";

describe(renderSingleHRZoneBar, () => {
    let canvas: HTMLCanvasElement;
    let mockChartInstance: ChartInstance;
    let lastChartConfig: ChartConfig | undefined;
    let dom: JSDOM;

    beforeEach(() => {
        // Setup JSDOM environment
        dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
            url: "http://localhost",
            pretendToBeVisual: true,
            resources: "usable",
        });

        setGlobalValue("window", dom.window);
        setGlobalValue("document", dom.window.document);
        setGlobalValue("HTMLCanvasElement", dom.window.HTMLCanvasElement);
        setGlobalValue("HTMLElement", dom.window.HTMLElement);

        // Create a canvas element for testing
        canvas = document.createElement("canvas");
        document.body.appendChild(canvas);

        // Create a complete mock Chart instance with all required structures
        mockChartInstance = {
            destroy: vi.fn<() => void>(),
            update: vi.fn<() => void>(),
            data: {
                datasets: [],
            },
            options: {
                scales: {
                    y: {
                        ticks: {
                            callback:
                                vi.fn<(value: number | string) => string>(),
                            color: null,
                        },
                    },
                    x: { ticks: { color: null } },
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: vi.fn<(context: TooltipContext) => string>(),
                        },
                    },
                    chartBackgroundColorPlugin: { backgroundColor: null },
                },
            },
        };

        // Reset last captured config
        lastChartConfig = undefined;
        chartModuleMock.state.instance = mockChartInstance;
        chartModuleMock.state.lastConfig = undefined;
        chartModuleMock.Chart.mockClear();
        registerChartRuntime(chartModuleMock.Chart);

        notificationMocks.showNotification.mockReset();

        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "info").mockImplementation(() => {});
        vi.spyOn(console, "debug").mockImplementation(() => {});

        vi.mocked(chartZoneColorUtils.getChartZoneColors).mockReturnValue([
            "#ff0000",
            "#00ff00",
            "#0000ff",
            "#ffff00",
            "#00ffff",
        ]);
    });

    afterEach(() => {
        // Clean up DOM
        if (global.document && global.document.body) {
            document.body.replaceChildren();
        }

        restoreGlobalValues();
        dom.window.close();

        // Reset all mocks
        clearChartRuntimeForTests();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    function getCapturedChartConfig(view?: unknown): ChartConfig {
        const chartConfig =
            mockChartInstance.config ??
            (view as { config?: ChartConfig } | undefined)?.config ??
            chartModuleMock.Chart.mock.calls[0]?.[1] ??
            lastChartConfig ??
            chartModuleMock.state.lastConfig ??
            testGlobal.__lastChartConfig;

        expect(chartConfig).toMatchObject({
            data: { labels: ["Time in Zone"] },
            options: expect.any(Object),
            type: "bar",
        });
        return chartConfig as ChartConfig;
    }

    it("should create a Chart.js chart with correct configuration", () => {
        expect.assertions(2);
        // Prepare test data
        const zoneData = [
            { label: "Zone 1", value: 300, color: "#ff0000" },
            { label: "Zone 2", value: 600, color: "#00ff00" },
            { label: "Zone 3", value: 450, color: "#0000ff" },
        ];

        // Call the function
        const view = renderSingleHRZoneBar(canvas, zoneData);

        // Verify Chart.js was called with correct parameters
        expect(chartModuleMock.Chart).toHaveBeenCalledExactlyOnceWith(
            canvas,
            expect.objectContaining({
                type: "bar",
                data: expect.objectContaining({
                    labels: ["Time in Zone"],
                }),
            })
        );

        // Verify the result
        expect(view).toBe(mockChartInstance);
    });

    it("should handle custom options like title", () => {
        expect.assertions(3);
        // Prepare test data
        const zoneData = [{ label: "Zone 1", value: 300, color: "#ff0000" }];

        // Call with custom options
        const view = renderSingleHRZoneBar(canvas, zoneData, {
            title: "Custom HR Zones Title",
        });
        expect(chartModuleMock.Chart).toHaveBeenCalledOnce();

        const chartConfig = getCapturedChartConfig(view);

        // Verify title was set correctly
        expect(chartConfig?.options?.plugins?.title).toMatchObject({
            display: true,
            text: "Custom HR Zones Title",
        });
    });

    it("should use zone colors from chartZoneColorUtils when colors not provided", () => {
        expect.assertions(10);
        // Mock the getChartZoneColors function
        vi.spyOn(chartZoneColorUtils, "getChartZoneColors").mockReturnValue([
            "#ff0000",
            "#00ff00",
            "#0000ff",
        ]);

        // Prepare test data without colors
        const zoneData = [
            { label: "Zone 1", value: 300 },
            { label: "Zone 2", value: 600 },
        ];

        // Call the function
        const view = renderSingleHRZoneBar(canvas, zoneData);

        // Verify the function returned a chart
        expect(view).toBe(mockChartInstance);

        // Verify that Chart constructor was called
        expect(chartModuleMock.Chart).toHaveBeenCalledOnce();

        // Verify the chart was created with correct data structure
        const chartCall = chartModuleMock.Chart.mock.calls[0];
        expect(chartCall).toEqual([canvas, expect.any(Object)]);
        expect(chartCall?.[0]).toBe(canvas);

        const chartConfig = getCapturedChartConfig(view);
        expect(chartConfig.data.datasets).toHaveLength(2);
        expect(chartConfig.data.datasets[0].label).toBe("Zone 1");
        expect(chartConfig.data.datasets[1].label).toBe("Zone 2");

        // Verify colors were set (mocked getChartZoneColors would provide these)
        expect(chartConfig.data.datasets[0].backgroundColor).toBe("#ff0000");
        expect(chartConfig.data.datasets[1].backgroundColor).toBe("#00ff00");
    });

    it("should wire tooltip and y-axis callbacks that format time", () => {
        expect.assertions(7);
        const zoneData = [{ label: "Zone 1", value: 120 }];
        const view = renderSingleHRZoneBar(canvas, zoneData);
        const cfg = getCapturedChartConfig(view);
        const yTickCb = cfg.options.scales.y.ticks.callback;
        const tooltipCb = cfg.options.plugins.tooltip.callbacks.label;
        expect(yTickCb).toBeTypeOf("function");
        expect(tooltipCb).toBeTypeOf("function");
        // Control the return values of formatTime at call-time to avoid environment brittleness
        const ftSpy = vi.spyOn(formatTime, "formatTime");
        ftSpy.mockReturnValueOnce("90s");
        expect(yTickCb(90)).toBe("90s");
        expect(ftSpy).toHaveBeenCalledWith(90, true);
        ftSpy.mockReturnValueOnce("120s");
        expect(
            tooltipCb({ dataset: { label: "Zone 1" }, parsed: { y: 120 } })
        ).toBe("Zone 1: 120s");
        expect(ftSpy).toHaveBeenCalledWith(120, true);
    });

    it("should expose styling callbacks in configuration (smoke)", () => {
        expect.assertions(3);
        const zoneData = [{ label: "Zone 1", value: 120 }];
        const view = renderSingleHRZoneBar(canvas, zoneData);
        const chartConfig = getCapturedChartConfig(view);
        // Verify callback presence without asserting exact styles
        expect(chartConfig.options.scales.y.ticks.callback).toBeTypeOf(
            "function"
        );
        expect(chartConfig.options.plugins.chartBackgroundColorPlugin).toEqual(
            expect.objectContaining({
                backgroundColor: "#ffffff",
                display: true,
                text: "chart background plugin",
            })
        );
    });

    it("should handle invalid inputs gracefully", () => {
        expect.assertions(9);
        // Test with null canvas
        expect(
            renderSingleHRZoneBar(null as unknown as HTMLCanvasElement, [])
        ).toBeNull();
        expect(
            notificationMocks.showNotification
        ).toHaveBeenCalledExactlyOnceWith(
            "Failed to render HR zone bar",
            "error"
        );
        expect(chartModuleMock.Chart).not.toHaveBeenCalled();

        // Reset mocks
        vi.clearAllMocks();

        // Test with null zoneData
        expect(
            renderSingleHRZoneBar(canvas, null as unknown as readonly unknown[])
        ).toBeNull();
        expect(canvas.classList.contains("chart-canvas")).toBe(false);
        expect(notificationMocks.showNotification.mock.calls).toStrictEqual([
            ["Failed to render HR zone bar", "error"],
        ]);

        // Reset mocks
        vi.clearAllMocks();
        vi.mocked(chartZoneColorUtils.getChartZoneColors).mockReturnValue([
            "#ff0000",
            "#00ff00",
            "#0000ff",
        ]);

        // A legacy Chart global is not needed when the runtime is registered.
        expect(Reflect.get(globalThis, "Chart")).toBeUndefined();
        expect(
            renderSingleHRZoneBar(canvas, [{ label: "Zone 1", value: 300 }])
        ).toBe(mockChartInstance);
        expect(Reflect.get(globalThis, "Chart")).toBeUndefined();
    });

    it("should include tooltip and y-axis format callbacks (smoke)", () => {
        expect.assertions(3);
        const zoneData = [{ label: "Zone 1", value: 120 }];
        const view = renderSingleHRZoneBar(canvas, zoneData);
        const chartConfig = getCapturedChartConfig(view);
        expect(chartConfig.options.plugins.tooltip.callbacks.label).toBeTypeOf(
            "function"
        );
        expect(chartConfig.options.scales.y.ticks.callback).toBeTypeOf(
            "function"
        );
    });
});
