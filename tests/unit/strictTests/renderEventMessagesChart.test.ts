/**
 * Comprehensive test suite for renderEventMessagesChart.js.
 *
 * This test suite validates event message chart rendering, timestamp
 * normalization, Chart.js integration, theming, tooltip formatting, plugin
 * configuration, error handling, and timestamp edge cases.
 */

import type { Mock } from "vitest";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
    clearChartInstanceRegistryForTests,
    getRegisteredChartInstances,
} from "../../../electron-app/utils/charts/core/chartInstanceRegistry.js";
import {
    clearChartRuntimeForTests,
    registerChartRuntime,
} from "../../../electron-app/utils/charts/core/chartRuntime.js";
import { renderEventMessagesChart } from "../../../electron-app/utils/charts/rendering/renderEventMessagesChart.js";
import {
    __resetStateManagerForTests,
    setState,
} from "../../../electron-app/utils/state/core/stateManager.js";
import { getChartSetting } from "../../../electron-app/utils/state/domain/settingsStateManager.js";
import { getThemeConfig } from "../../../electron-app/utils/theming/core/theme.js";

const chartJsMocks = vi.hoisted(() => ({
    Chart: vi.fn<ChartConstructor>(),
}));

const formatterMocks = vi.hoisted(() => ({
    formatTime: vi.fn<(value: number, showSeconds?: boolean) => string>(
        (value, showSeconds) => {
            if (showSeconds) return `${value}s`;
            return `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, "0")}`;
        }
    ),
}));

vi.mock(import("chart.js/auto"), () => ({
    default: chartJsMocks.Chart,
}));

type ChartConfig = {
    data: {
        datasets: Array<{
            backgroundColor?: string;
            data: EventChartPoint[];
            [key: string]: unknown;
        }>;
    };
    options: {
        plugins?: {
            tooltip?: {
                callbacks?: {
                    label?: (context: {
                        raw?: EventChartPoint | null;
                    }) => string;
                };
            };
            [key: string]: unknown;
        };
        scales?: Record<string, unknown>;
        [key: string]: unknown;
    };
    plugins?: unknown[];
    type?: string;
    [key: string]: unknown;
};

type ChartInstanceMock = {
    destroy: Mock<() => void>;
    id: string;
    resize: Mock<() => void>;
    update: Mock<() => void>;
};

type ChartConstructor = (
    canvas: HTMLCanvasElement,
    config: ChartConfig
) => ChartInstanceMock;

type EventChartPoint = {
    event: string;
    x: number;
    y: number;
};

type EventMessage = {
    event?: string;
    eventType?: string;
    message?: string;
    time?: Date | number | string;
    timestamp?: Date | number | string;
};

type EventMessagesRawData = {
    eventMesgs?: EventMessage[] | unknown;
};

type ThemeConfig = ReturnType<typeof getThemeConfig>;
type GetChartSettingMock = Mock<(key: string) => string | undefined>;
type ThemeConfigMock = Mock<() => ThemeConfig>;

function setEventMessagesRawData(data: EventMessagesRawData | null): void {
    setState("fitFile.rawData", data, { source: "test" });
}

function getLatestChartConfig(): ChartConfig {
    const config = chartJsMocks.Chart.mock.calls[0]?.[1];
    if (!config) {
        throw new Error("Expected Chart to be called with a config");
    }
    return config;
}

function getLatestChartCall(): [HTMLCanvasElement, ChartConfig] {
    const call = chartJsMocks.Chart.mock.calls[0];
    if (!call) {
        throw new Error("Expected Chart to be called");
    }

    return call;
}

function getRenderedCanvas(container: HTMLElement): HTMLCanvasElement {
    const canvas = container.querySelector("canvas");

    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new TypeError("Expected event messages chart canvas to exist");
    }

    return canvas;
}

function getFirstChartInstance(): ChartInstanceMock {
    const chartInstance = getRegisteredChartInstances()[0] as
        | ChartInstanceMock
        | undefined;

    if (!chartInstance) {
        throw new TypeError("Expected first Chart.js instance to exist");
    }

    return chartInstance;
}

function getRenderState(container: HTMLElement): {
    chartCalls: number;
    childCount: number;
} {
    return {
        chartCalls: chartJsMocks.Chart.mock.calls.length,
        childCount: container.children.length,
    };
}

// Mock all external dependencies
vi.mock(import("../../../electron-app/utils/theming/core/theme.js"), () => ({
    getThemeConfig: vi.fn<() => ThemeConfig>(() => ({
        colors: {
            bgPrimary: "#ffffff",
            bgSecondary: "#f8f9fa",
            textPrimary: "#000000",
            textSecondary: "#666666",
            border: "#dee2e6",
            gridLines: "#e9ecef",
            shadow: "0 2px 4px #00000020",
        },
    })),
}));

vi.mock(
    import("../../../electron-app/utils/charts/components/createChartCanvas.js"),
    () => ({
        createChartCanvas: vi.fn<
            (field: string, index: number) => HTMLCanvasElement
        >(() => {
            const canvas = document.createElement("canvas");
            canvas.id = "chart-events-0";
            return canvas;
        }),
    })
);

vi.mock(
    import("../../../electron-app/utils/formatting/formatters/formatTime.js"),
    () => ({
        formatTime: formatterMocks.formatTime,
    })
);

vi.mock(
    import("../../../electron-app/utils/charts/core/updateChartAnimations.js"),
    () => ({
        updateChartAnimations:
            vi.fn<(chart: ChartInstanceMock, chartName: string) => void>(),
    })
);

vi.mock(
    import("../../../electron-app/utils/data/lookups/getUnitSymbol.js"),
    () => ({
        getUnitSymbol: vi.fn<(field: string, type: string) => string>(
            () => "s"
        ),
    })
);

vi.mock(
    import("../../../electron-app/utils/charts/plugins/chartZoomResetPlugin.js"),
    () => ({
        chartZoomResetPlugin: { id: "chartZoomResetPlugin" },
    })
);

// Global test setup
let mockChart: ChartInstanceMock;
let mockConsoleError: ReturnType<typeof vi.spyOn>;

// Mock chart settings to provide custom event color
vi.mock(
    import("../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        getChartSetting: vi.fn<(key: string) => string | undefined>((key) => {
            if (key === "color_event_messages") return "#ff5722";
            return undefined;
        }),
    })
);

beforeEach(() => {
    __resetStateManagerForTests();
    // Reset DOM
    document.body.replaceChildren();

    // Mock Chart.js
    mockChart = {
        id: "test-chart",
        update: vi.fn<() => void>(),
        destroy: vi.fn<() => void>(),
        resize: vi.fn<() => void>(),
    };
    chartJsMocks.Chart.mockReset();
    chartJsMocks.Chart.mockImplementation(function ChartMock() {
        return mockChart;
    });
    registerChartRuntime(chartJsMocks.Chart);
    clearChartInstanceRegistryForTests();

    setEventMessagesRawData({
        eventMesgs: [
            {
                timestamp: new Date("2023-01-01T10:00:00Z"),
                event: "Start Event",
                message: "Activity started",
            },
            {
                timestamp: new Date("2023-01-01T10:05:00Z"),
                event: "Lap Event",
                eventType: "lap",
            },
            {
                timestamp: 1672570800, // Unix timestamp in seconds
                event: "Timer Event",
            },
        ],
    });

    // Mock console.error
    mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    // We no longer rely on window.localStorage directly for event color;
    // color is provided by getChartSetting mock above.
});
afterEach(() => {
    __resetStateManagerForTests();
    vi.clearAllMocks();
    clearChartRuntimeForTests();
    clearChartInstanceRegistryForTests();
    mockConsoleError.mockRestore();
});

describe("renderEventMessagesChart.js - Event Messages Chart Utility", () => {
    describe("data validation and processing", () => {
        it("should return early when eventMesgs is not available", () => {
            expect.assertions(2);

            setEventMessagesRawData(null);
            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            expect(getRenderState(container)).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
            expect(chartJsMocks.Chart).not.toHaveBeenCalled();
        });

        it("should return early when eventMesgs is not an array", () => {
            expect.assertions(2);

            setEventMessagesRawData({ eventMesgs: "invalid" });
            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            expect(getRenderState(container)).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
            expect(chartJsMocks.Chart).not.toHaveBeenCalled();
        });

        it("should return early when eventMesgs array is empty", () => {
            expect.assertions(2);

            setEventMessagesRawData({ eventMesgs: [] });
            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            expect(getRenderState(container)).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
            expect(chartJsMocks.Chart).not.toHaveBeenCalled();
        });

        it("should process event messages correctly with valid data", () => {
            expect.assertions(2);

            const container = document.createElement("div");
            const startTime = new Date("2023-01-01T10:00:00Z");

            renderEventMessagesChart(container, {}, startTime);

            const [canvas, chartConfig] = getLatestChartCall();

            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(chartConfig.data.datasets[0].data).toHaveLength(3);
        });

        it("should handle missing raw FIT data gracefully", () => {
            expect.assertions(2);

            setEventMessagesRawData(null);
            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            expect(getRenderState(container)).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
            expect(chartJsMocks.Chart).not.toHaveBeenCalled();
        });

        it("should extract event names from different fields", () => {
            expect.assertions(4);

            setEventMessagesRawData({
                eventMesgs: [
                    {
                        timestamp: new Date("2023-01-01T10:00:00Z"),
                        event: "Event Field",
                    },
                    {
                        timestamp: new Date("2023-01-01T10:01:00Z"),
                        message: "Message Field",
                    },
                    {
                        timestamp: new Date("2023-01-01T10:02:00Z"),
                        eventType: "EventType Field",
                    },
                    { timestamp: new Date("2023-01-01T10:03:00Z") }, // Default
                ],
            });
            const container = document.createElement("div");
            const startTime = new Date("2023-01-01T10:00:00Z");

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = getLatestChartConfig();
            const data = chartConfig.data.datasets[0].data;

            expect(data[0].event).toBe("Event Field");
            expect(data[1].event).toBe("Message Field");
            expect(data[2].event).toBe("EventType Field");
            expect(data[3].event).toBe("Event");
        });
    });

    describe("timestamp conversion and processing", () => {
        it("should handle Date object timestamps correctly", () => {
            expect.assertions(1);

            const container = document.createElement("div");
            const startTime = new Date("2023-01-01T10:00:00Z");

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = getLatestChartConfig();
            const data = chartConfig.data.datasets[0].data;

            expect(
                data.slice(0, 2).map(({ event, x, y }) => ({ event, x, y }))
            ).toStrictEqual([
                { event: "Start Event", x: 0, y: 1 },
                { event: "Lap Event", x: 300, y: 1 },
            ]);
        });

        it("should handle number timestamps in seconds", () => {
            expect.assertions(1);

            setEventMessagesRawData({
                eventMesgs: [
                    { timestamp: 1672570800, event: "Event 1" }, // Unix timestamp in seconds
                    { timestamp: 1672571100, event: "Event 2" }, // 5 minutes later
                ],
            });
            const container = document.createElement("div");
            const startTime = 1672570800; // Start time in seconds

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = getLatestChartConfig();
            const data = chartConfig.data.datasets[0].data;

            expect(
                data.map(({ event, x, y }) => ({ event, x, y }))
            ).toStrictEqual([
                { event: "Event 1", x: 0, y: 1 },
                { event: "Event 2", x: 300, y: 1 },
            ]);
        });

        it("should handle number timestamps in milliseconds", () => {
            expect.assertions(1);

            setEventMessagesRawData({
                eventMesgs: [
                    { timestamp: 1672570800000, event: "Event 1" }, // Unix timestamp in milliseconds
                    { timestamp: 1672571100000, event: "Event 2" }, // 5 minutes later
                ],
            });
            const container = document.createElement("div");
            const startTime = 1672570800000; // Start time in milliseconds

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = getLatestChartConfig();
            const data = chartConfig.data.datasets[0].data;

            expect(
                data.map(({ event, x, y }) => ({ event, x, y }))
            ).toStrictEqual([
                { event: "Event 1", x: 0, y: 1 },
                { event: "Event 2", x: 300, y: 1 },
            ]);
        });

        it("should handle mixed timestamp formats", () => {
            expect.assertions(1);

            setEventMessagesRawData({
                eventMesgs: [
                    {
                        timestamp: new Date("2023-01-01T10:00:00Z"),
                        event: "Event 1",
                    },
                    { timestamp: 1672570800, event: "Event 2" },
                    { timestamp: 1672570800000, event: "Event 3" },
                ],
            });
            const container = document.createElement("div");
            const startTime = new Date("2023-01-01T10:00:00Z");

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = getLatestChartConfig();
            const data = chartConfig.data.datasets[0].data;

            expect(
                data.map(({ event, x, y }) => ({ event, x, y }))
            ).toStrictEqual([
                { event: "Event 1", x: 0, y: 1 },
                { event: "Event 2", x: 3600, y: 1 },
                { event: "Event 3", x: 3600, y: 1 },
            ]);
        });

        it("should fallback to x:0 for invalid timestamp formats", () => {
            expect.assertions(1);

            setEventMessagesRawData({
                eventMesgs: [
                    { timestamp: "invalid", event: "Event 1" },
                    { timestamp: null, event: "Event 2" },
                    { event: "Event 3" }, // No timestamp
                ],
            });
            const container = document.createElement("div");
            const startTime = new Date("2023-01-01T10:00:00Z");

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = getLatestChartConfig();
            const data = chartConfig.data.datasets[0].data;

            expect(
                data.map(({ event, x, y }) => ({ event, x, y }))
            ).toStrictEqual([
                { event: "Event 1", x: 0, y: 1 },
                { event: "Event 2", x: 0, y: 1 },
                { event: "Event 3", x: 0, y: 1 },
            ]);
        });

        it("should handle invalid startTime gracefully", () => {
            expect.assertions(1);

            const container = document.createElement("div");
            const startTime = "invalid" as unknown as Date;

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = getLatestChartConfig();
            const data = chartConfig.data.datasets[0].data;

            expect(
                data.map(({ event, x, y }) => ({ event, x, y }))
            ).toStrictEqual([
                { event: "Start Event", x: 0, y: 1 },
                { event: "Lap Event", x: 0, y: 1 },
                { event: "Timer Event", x: 0, y: 1 },
            ]);
        });
    });

    describe("chart configuration", () => {
        it("should create scatter chart with correct type and configuration", () => {
            expect.assertions(5);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const [canvas, chartConfig] = getLatestChartCall();

            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(chartConfig.type).toBe("scatter");
            expect(chartConfig.type).not.toBe("line");
            expect(chartConfig.data.datasets).toHaveLength(1);
            expect(chartConfig.data.datasets[0].label).toBe("Events");
        });

        it("should configure dataset with correct styling and colors", () => {
            expect.assertions(1);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = getLatestChartConfig();
            const dataset = chartConfig.data.datasets[0];

            expect({
                backgroundColor: dataset.backgroundColor,
                borderColor: dataset.borderColor,
                pointHoverRadius: dataset.pointHoverRadius,
                pointRadius: dataset.pointRadius,
            }).toStrictEqual({
                backgroundColor: "#ff5722CC",
                borderColor: "#ff5722",
                pointHoverRadius: 8,
                pointRadius: 6,
            });
        });

        it("should use default color when no custom color setting is available", () => {
            expect.assertions(2);

            // Override mocked getChartSetting so that no custom color is provided
            (getChartSetting as GetChartSettingMock).mockReturnValueOnce(
                undefined
            );

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = getLatestChartConfig();
            const dataset = chartConfig.data.datasets[0];

            expect(dataset.backgroundColor).toBe("#9c27b0CC"); // Default purple
            expect(dataset.borderColor).toBe("#9c27b0");
        });

        it("should configure chart options based on provided options - all enabled", () => {
            expect.assertions(2);

            const container = document.createElement("div");
            const options = {
                showLegend: true,
                showTitle: true,
                showGrid: true,
                zoomPluginConfig: { zoom: { enabled: true } },
            };

            renderEventMessagesChart(container, options, new Date());

            const chartConfig = getLatestChartConfig();

            expect({
                legend: chartConfig.options.plugins.legend.display,
                title: chartConfig.options.plugins.title.display,
                xGrid: chartConfig.options.scales.x.grid.display,
            }).toStrictEqual({
                legend: true,
                title: true,
                xGrid: true,
            });
            expect(chartConfig.options.plugins.zoom).toEqual({
                zoom: { enabled: true },
            });
        });

        it("should configure chart options based on provided options - all disabled", () => {
            expect.assertions(1);

            const container = document.createElement("div");
            const options = {
                showLegend: false,
                showTitle: false,
                showGrid: false,
            };

            renderEventMessagesChart(container, options, new Date());

            const chartConfig = getLatestChartConfig();

            expect({
                legend: chartConfig.options.plugins.legend.display,
                title: chartConfig.options.plugins.title.display,
                xGrid: chartConfig.options.scales.x.grid.display,
            }).toStrictEqual({
                legend: false,
                title: false,
                xGrid: false,
            });
        });

        it("should set correct axis titles and configuration", () => {
            expect.assertions(1);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = getLatestChartConfig();

            expect({
                xDisplay: chartConfig.options.scales.x.display,
                xTitle: chartConfig.options.scales.x.title.text,
                xType: chartConfig.options.scales.x.type,
                yDisplay: chartConfig.options.scales.y.display,
            }).toStrictEqual({
                xDisplay: true,
                xTitle: "Time (s)",
                xType: "linear",
                yDisplay: false,
            });
        });

        it("should configure responsive and aspect ratio options", () => {
            expect.assertions(1);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = getLatestChartConfig();

            expect({
                maintainAspectRatio: chartConfig.options.maintainAspectRatio,
                responsive: chartConfig.options.responsive,
            }).toStrictEqual({
                maintainAspectRatio: false,
                responsive: true,
            });
        });
    });

    describe("canvas creation and styling", () => {
        it("should create canvas with correct ID and styling", () => {
            expect.assertions(4);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const view = getRenderedCanvas(container);
            expect(view).toBeInstanceOf(HTMLCanvasElement);
            expect(view.id).toBe("chart-events-0");
            expect(view.style.borderRadius).toBe("12px");
            expect(view.style.boxShadow).toBe("0 2px 4px #00000020");
        });

        it("should append canvas to container", () => {
            expect.assertions(2);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            expect({
                childCount: container.children.length,
                tagName: container.children[0]?.tagName,
            }).toStrictEqual({
                childCount: 1,
                tagName: "CANVAS",
            });
            expect(container.children[0]).not.toBeInstanceOf(HTMLDivElement);
        });

        it("should apply theme-based canvas styling", () => {
            expect.assertions(1);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const view = getRenderedCanvas(container);
            // BoxShadow should match the theme shadow value
            expect(view.style.boxShadow).toBe("0 2px 4px #00000020");
        });
    });

    describe("chart instance management", () => {
        it("should add chart instance to global instances array", () => {
            expect.assertions(2);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            expect(getRegisteredChartInstances()).toHaveLength(1);
            expect(getFirstChartInstance()).toBe(mockChart);
        });

        it("should register chart instance when the registry starts empty", () => {
            expect.assertions(2);

            clearChartInstanceRegistryForTests();
            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            expect(getRegisteredChartInstances()).toStrictEqual([mockChart]);
            expect(getRegisteredChartInstances()).not.toContain(undefined);
        });

        it("should call updateChartAnimations with correct parameters", async () => {
            expect.assertions(2);

            const { updateChartAnimations } =
                await import("../../../electron-app/utils/charts/core/updateChartAnimations.js");
            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            expect(updateChartAnimations).toHaveBeenCalledWith(
                mockChart,
                "Event Messages"
            );
            expect(getFirstChartInstance()).toBe(mockChart);
        });
    });

    describe("tooltip configuration", () => {
        it("should configure tooltip with theme colors", () => {
            expect.assertions(1);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = getLatestChartConfig();
            const tooltip = chartConfig.options.plugins.tooltip;

            expect({
                backgroundColor: tooltip.backgroundColor,
                bodyColor: tooltip.bodyColor,
                borderColor: tooltip.borderColor,
                borderWidth: tooltip.borderWidth,
                titleColor: tooltip.titleColor,
            }).toStrictEqual({
                backgroundColor: "#f8f9fa",
                bodyColor: "#000000",
                borderColor: "#dee2e6",
                borderWidth: 1,
                titleColor: "#000000",
            });
        });

        it("should format tooltip label correctly", () => {
            expect.assertions(2);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = getLatestChartConfig();
            const tooltipCallback =
                chartConfig.options.plugins.tooltip.callbacks.label;

            const mockContext = {
                raw: { event: "Test Event" },
            };

            const result = tooltipCallback(mockContext);
            expect(result).toBe("Test Event");
            expect(result).not.toBe("Event");
        });

        it("should handle missing event in tooltip", () => {
            expect.assertions(2);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = getLatestChartConfig();
            const tooltipCallback =
                chartConfig.options.plugins.tooltip.callbacks.label;

            const mockContext = {
                raw: {},
            };

            const result = tooltipCallback(mockContext);
            expect(result).toBe("Event");
            expect(result).not.toBe("Test Event");
        });

        it("should handle invalid-input tooltip context", () => {
            expect.assertions(2);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = getLatestChartConfig();
            const tooltipCallback =
                chartConfig.options.plugins.tooltip.callbacks.label;

            expect(tooltipCallback({ raw: null })).toBe("Event");
            expect(tooltipCallback({ raw: null })).not.toBe("Test Event");
        });
    });

    describe("plugin configuration", () => {
        it("should include chartZoomResetPlugin and chartBackgroundColorPlugin", () => {
            expect.assertions(2);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = getLatestChartConfig();

            expect(chartConfig.plugins).toStrictEqual([
                { id: "chartZoomResetPlugin" },
                "chartBackgroundColorPlugin",
            ]);
            expect(chartConfig.plugins).not.toContain("zoomReset");
        });

        it("should configure chartBackgroundColorPlugin with theme colors", () => {
            expect.assertions(1);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = getLatestChartConfig();
            const bgPlugin =
                chartConfig.options.plugins.chartBackgroundColorPlugin;

            expect(bgPlugin.backgroundColor).toBe("#ffffff");
        });
    });

    describe("scale configuration", () => {
        it("should configure x-axis with time formatting callback", () => {
            expect.assertions(3);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = getLatestChartConfig();
            const xAxisCallback = chartConfig.options.scales.x.ticks.callback;

            const result = xAxisCallback(300);
            expect(formatterMocks.formatTime).toHaveBeenCalledWith(300, true);
            expect(result).toBe("300s");
            expect(result).not.toBe("");
        });

        it("should configure x-axis ticks with theme colors", () => {
            expect.assertions(3);

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = getLatestChartConfig();

            expect(chartConfig.options.scales.x.ticks.color).toBe("#000000");
            expect(chartConfig.options.scales.x.title.color).toBe("#000000");
            expect(chartConfig.options.scales.x.grid.color).toBe("#e9ecef");
        });
    });

    describe("error handling", () => {
        it("should handle Chart.js constructor throwing error", () => {
            expect.assertions(3);

            const chartCreationError = new Error("Chart creation failed");
            chartJsMocks.Chart.mockImplementationOnce(
                function ChartErrorMock() {
                    throw chartCreationError;
                }
            );

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            expect(chartJsMocks.Chart).toHaveBeenCalledOnce();
            expect(getRegisteredChartInstances()).toStrictEqual([]);
            expect(mockConsoleError).toHaveBeenCalledWith(
                "[ChartJS] Error rendering event messages chart:",
                chartCreationError
            );
        });

        it("should handle errors gracefully without throwing", async () => {
            expect.assertions(3);

            const { getThemeConfig } =
                await import("../../../electron-app/utils/theming/core/theme.js");
            const themeConfigError = new Error("Theme config failed");
            (getThemeConfig as ThemeConfigMock).mockImplementation(() => {
                throw themeConfigError;
            });

            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            expect(getRenderState(container)).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
            expect(chartJsMocks.Chart).not.toHaveBeenCalled();
            expect(mockConsoleError).toHaveBeenCalledWith(
                "[ChartJS] Error rendering event messages chart:",
                themeConfigError
            );
        });
    });

    describe("edge cases", () => {
        it("should handle empty event messages array", () => {
            expect.assertions(2);

            setEventMessagesRawData({ eventMesgs: [] });
            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            expect(getRenderState(container)).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
            expect(chartJsMocks.Chart).not.toHaveBeenCalled();
        });

        it("should handle null Chart.js instance", () => {
            expect.assertions(3);

            // Mock Chart constructor to throw an error or simulate failure
            const chartConstructionError = new Error(
                "Chart construction failed"
            );
            chartJsMocks.Chart.mockImplementationOnce(
                function ChartErrorMock() {
                    throw chartConstructionError;
                }
            );
            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const [canvas] = chartJsMocks.Chart.mock.calls[0];

            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(getRegisteredChartInstances()).toStrictEqual([]);
            expect(mockConsoleError).toHaveBeenCalledWith(
                "[ChartJS] Error rendering event messages chart:",
                chartConstructionError
            );
        });

        it("should handle events with all timestamp variations", () => {
            expect.assertions(1);

            setEventMessagesRawData({
                eventMesgs: [
                    {
                        time: new Date("2023-01-01T10:00:00Z"),
                        event: "Event 1",
                    },
                    { timestamp: 1672570800, event: "Event 2" },
                    { event: "Event 3" }, // No timestamp
                ],
            });
            const container = document.createElement("div");
            const startTime = new Date("2023-01-01T10:00:00Z");

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toHaveLength(3);
        });

        it("should handle missing container gracefully", () => {
            expect.assertions(4);

            renderEventMessagesChart(
                null as unknown as HTMLElement,
                {},
                new Date()
            );

            expect(chartJsMocks.Chart).not.toHaveBeenCalled();
            expect(document.body.childElementCount).toBe(0);
            expect(getRegisteredChartInstances()).toStrictEqual([]);
            const [message, error] = mockConsoleError.mock.calls[0] ?? [];

            expect([message, error instanceof TypeError]).toStrictEqual([
                "[ChartJS] Error rendering event messages chart:",
                true,
            ]);
        });

        it("should handle undefined options object", () => {
            expect.assertions(3);

            const container = document.createElement("div");

            renderEventMessagesChart(
                container,
                undefined as unknown as Record<string, unknown>,
                new Date()
            );

            expect(getRenderState(container)).toStrictEqual({
                chartCalls: 1,
                childCount: 1,
            });
            expect(chartJsMocks.Chart).toHaveBeenCalledOnce();
            expect(getRegisteredChartInstances()).toStrictEqual([mockChart]);
        });

        it("should handle very large timestamp values", () => {
            expect.assertions(1);

            setEventMessagesRawData({
                eventMesgs: [
                    {
                        timestamp: Number.MAX_SAFE_INTEGER,
                        event: "Large Event",
                    },
                    {
                        timestamp: -Number.MAX_SAFE_INTEGER,
                        event: "Negative Event",
                    },
                ],
            });
            const container = document.createElement("div");

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toHaveLength(2);
        });
    });
});
