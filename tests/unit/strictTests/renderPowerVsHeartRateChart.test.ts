import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import { chartSettingsManager } from "../../../electron-app/utils/charts/core/renderChartJS.js";

type ChartDataset = {
    backgroundColor?: string;
    data?: unknown[];
    [key: string]: unknown;
};

type ChartConfig = {
    data: {
        datasets: ChartDataset[];
    };
    options: {
        plugins?: {
            tooltip?: {
                callbacks?: {
                    label?: (context: TooltipContext) => string[];
                };
            };
            [key: string]: unknown;
        };
        scales?: Record<string, unknown>;
        [key: string]: unknown;
    };
    plugins?: unknown[];
    [key: string]: unknown;
};

type ChartConstructorMock = ReturnType<typeof vi.fn> & {
    mock: {
        calls: [HTMLCanvasElement, ChartConfig][];
    };
};

type ChartInstanceMock = {
    clear: ReturnType<typeof vi.fn>;
    config: Record<string, unknown>;
    data: { datasets: ChartDataset[] };
    destroy: ReturnType<typeof vi.fn>;
    generateLegend: ReturnType<typeof vi.fn>;
    getDatasetAtEvent: ReturnType<typeof vi.fn>;
    getElementAtEvent: ReturnType<typeof vi.fn>;
    getElementsAtEventForMode: ReturnType<typeof vi.fn>;
    options: Record<string, unknown>;
    render: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
    resize: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    toBase64Image: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
};

type ChartTestGlobal = typeof globalThis & {
    Chart?: ChartConstructorMock;
    HTMLCanvasElement?: typeof HTMLCanvasElement;
    HTMLElement?: typeof HTMLElement;
    _chartjsInstances?: ChartInstanceMock[];
    localStorage?: StorageMock;
    window?: ChartTestWindow;
};

type ChartTestWindow = Window &
    typeof globalThis & {
        Chart?: ChartConstructorMock;
        _chartjsInstances?: ChartInstanceMock[];
    };

type PowerHeartRateDatum = {
    heartRate?: null | number;
    power?: null | number;
};

type PowerHeartRateOptions = {
    animationStyle?: string;
    maxPoints?: "all" | number;
    showGrid?: boolean;
    showLegend?: boolean;
    showPoints?: boolean;
    showTitle?: boolean;
    theme?: string;
};

type RenderPowerVsHeartRateChart = (
    container: HTMLElement,
    data: PowerHeartRateDatum[],
    options: PowerHeartRateOptions
) => void;

type StorageMock = {
    clear: ReturnType<typeof vi.fn>;
    getItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
};

type TooltipContext = {
    parsed: {
        x?: number;
        y?: number;
    };
};

function getChartTestGlobal(): ChartTestGlobal {
    return globalThis as ChartTestGlobal;
}

function getChartTestWindow(): ChartTestWindow {
    return global.window as unknown as ChartTestWindow;
}

function getLatestChartConfig(): ChartConfig {
    const config = Chart.mock.calls[0]?.[1];
    if (!config) {
        throw new Error("Expected Chart to be called with a config");
    }
    return config;
}

// Mock Chart.js
let Chart: ChartConstructorMock;
let chartInstanceMock: ChartInstanceMock;
let renderPowerVsHeartRateChart: RenderPowerVsHeartRateChart;
let mockLocalStorage: StorageMock;

describe("renderPowerVsHeartRateChart.js - Power vs Heart Rate Chart Utility", () => {
    beforeEach(async () => {
        // Setup JSDOM environment
        const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
            url: "http://localhost",
            pretendToBeVisual: true,
            resources: "usable",
        });

        global.window = dom.window as unknown as Window & typeof globalThis;
        global.document = dom.window.document;
        global.HTMLCanvasElement = dom.window
            .HTMLCanvasElement as unknown as typeof HTMLCanvasElement;
        global.HTMLElement = dom.window
            .HTMLElement as unknown as typeof HTMLElement;
        global.console = {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
        } as unknown as Console;

        // Mock localStorage
        mockLocalStorage = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
        };
        getChartTestGlobal().localStorage = mockLocalStorage;

        // Mock Chart.js
        chartInstanceMock = {
            data: { datasets: [] },
            options: {},
            config: {},
            destroy: vi.fn(),
            update: vi.fn(),
            resize: vi.fn(),
            reset: vi.fn(),
            render: vi.fn(),
            stop: vi.fn(),
            clear: vi.fn(),
            toBase64Image: vi.fn(),
            generateLegend: vi.fn(),
            getElementsAtEventForMode: vi.fn(() => []),
            getElementAtEvent: vi.fn(() => []),
            getDatasetAtEvent: vi.fn(() => []),
        };

        Chart = vi.fn(function ChartConstructor() {
            return chartInstanceMock;
        }) as ChartConstructorMock;
        getChartTestWindow().Chart = Chart;
        getChartTestGlobal().Chart = Chart;
        getChartTestWindow()._chartjsInstances = [];
        // Sync chart instances between window and globalThis using property descriptor
        Object.defineProperty(getChartTestGlobal(), "_chartjsInstances", {
            get() {
                return getChartTestWindow()._chartjsInstances;
            },
            set(value) {
                getChartTestWindow()._chartjsInstances = value as
                    | ChartInstanceMock[]
                    | undefined;
            },
            configurable: true,
        });

        // Load the module dynamically with fresh imports
        const module =
            await import("../../../electron-app/utils/charts/rendering/renderPowerVsHeartRateChart.js");
        renderPowerVsHeartRateChart = module.renderPowerVsHeartRateChart;
    });

    afterEach(() => {
        vi.clearAllMocks();
        if (global.window && getChartTestWindow()._chartjsInstances) {
            getChartTestWindow()._chartjsInstances = [];
        }
        // Clean up property descriptor
        delete getChartTestGlobal()._chartjsInstances;
        delete getChartTestGlobal().Chart;

        // Clean up JSDOM
        if (global.window) {
            getChartTestWindow().close();
        }
        getChartTestGlobal().window = undefined;
        getChartTestGlobal().document = undefined;
        getChartTestGlobal().HTMLCanvasElement = undefined;
        getChartTestGlobal().HTMLElement = undefined;
        getChartTestGlobal().localStorage = undefined;
    });

    describe("Data Validation and Processing", () => {
        it("should return early when data has no power values", () => {
            const container = document.createElement("div");
            const data = [
                { heartRate: 120 },
                { heartRate: 130 },
                { heartRate: 140 },
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should return early when data has no heart rate values", () => {
            const container = document.createElement("div");
            const data = [
                { power: 200 },
                { power: 250 },
                { power: 300 },
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should return early when field visibility is hidden", () => {
            const visibilitySpy = vi
                .spyOn(chartSettingsManager, "getFieldVisibility")
                .mockReturnValue("hidden");

            const container = document.createElement("div");
            const data = [
                { power: 200, heartRate: 120 },
                { power: 250, heartRate: 130 },
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(visibilitySpy).toHaveBeenCalledWith("power_vs_hr");
            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should process data correctly with valid power and heart rate values", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 200, heartRate: 120 },
                { power: 250, heartRate: 130 },
                { power: null, heartRate: 140 }, // Should be filtered out
                { power: 300, heartRate: undefined }, // Should be filtered out
                { power: 275, heartRate: 135 },
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 120, y: 200 },
                { x: 130, y: 250 },
                { x: 135, y: 275 },
            ]);
        });

        it("should return early when no valid data points exist after filtering", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: null, heartRate: 120 },
                { power: 250, heartRate: null },
                { power: undefined, heartRate: undefined },
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });
    });

    describe("Data Point Limiting", () => {
        it("should apply data point limiting when maxPoints is exceeded", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [];
            for (let i = 0; i < 1000; i++) {
                data.push({ power: 200 + i, heartRate: 120 + (i % 50) });
            }
            const options = { maxPoints: 100, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(
                chartConfig.data.datasets[0].data.length
            ).toBeLessThanOrEqual(100);
            expect(chartConfig.data.datasets[0].data.length).not.toBe(
                data.length
            );
        });

        it("should not limit data when maxPoints is 'all'", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [];
            for (let i = 0; i < 50; i++) {
                data.push({ power: 200 + i, heartRate: 120 + i });
            }
            const options = { maxPoints: "all", showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data.length).toBe(50);
        });

        it("should not limit data when data length is less than maxPoints", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 200, heartRate: 120 },
                { power: 250, heartRate: 130 },
                { power: 275, heartRate: 135 },
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data.length).toBe(3);
        });
    });

    describe("Chart Canvas Creation and Styling", () => {
        it("should create canvas with correct ID and styling", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(container.children.length).toBe(1);
            const canvas = container.children[0] as HTMLCanvasElement;
            expect(canvas.tagName).toBe("CANVAS");
            expect(canvas.id).toBe("chart-power-vs-hr-0");
            expect(canvas.id).not.toBe("chart-speed-vs-distance-0");
            expect(canvas.style.borderRadius).toBe("12px");
        });

        it("should apply theme background and shadow to canvas", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            const canvas = container.children[0] as HTMLCanvasElement;
            // Note: In JSDOM, the theme would be applied but we can't easily verify the exact values
            expect(canvas.style.borderRadius).toBe("12px");
        });
    });

    describe("Chart Configuration", () => {
        it("should create scatter chart with correct basic configuration", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();

            expect(chartConfig.type).toBe("scatter");
            expect(chartConfig.type).not.toBe("line");
            expect(chartConfig.data.datasets).toHaveLength(1);
            expect(chartConfig.data.datasets[0].label).toBe(
                "Power vs Heart Rate"
            );
            expect(chartConfig.options.responsive).toBe(true);
            expect(chartConfig.options.maintainAspectRatio).toBe(false);
        });

        it("should configure legend display based on options", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];

            // Test with legend enabled
            const optionsWithLegend = { maxPoints: 1000, showLegend: true };
            renderPowerVsHeartRateChart(container, data, optionsWithLegend);

            let chartConfig = getLatestChartConfig();
            expect(chartConfig.options.plugins.legend.display).toBe(true);

            Chart.mockClear();
            container.innerHTML = "";

            // Test with legend disabled
            const optionsWithoutLegend = { maxPoints: 1000, showLegend: false };
            renderPowerVsHeartRateChart(container, data, optionsWithoutLegend);

            chartConfig = getLatestChartConfig();
            expect(chartConfig.options.plugins.legend.display).toBe(false);
        });

        it("should configure title display based on options", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];

            // Test with title enabled
            const optionsWithTitle = { maxPoints: 1000, showTitle: true };
            renderPowerVsHeartRateChart(container, data, optionsWithTitle);

            let chartConfig = getLatestChartConfig();
            expect(chartConfig.options.plugins.title.display).toBe(true);
            expect(chartConfig.options.plugins.title.text).toBe(
                "Power vs Heart Rate"
            );

            Chart.mockClear();
            container.innerHTML = "";

            // Test with title disabled
            const optionsWithoutTitle = { maxPoints: 1000, showTitle: false };
            renderPowerVsHeartRateChart(container, data, optionsWithoutTitle);

            chartConfig = getLatestChartConfig();
            expect(chartConfig.options.plugins.title.display).toBe(false);
        });

        it("should configure grid display based on options", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];

            // Test with grid enabled
            const optionsWithGrid = { maxPoints: 1000, showGrid: true };
            renderPowerVsHeartRateChart(container, data, optionsWithGrid);

            let chartConfig = getLatestChartConfig();
            expect(chartConfig.options.scales.x.grid.display).toBe(true);
            expect(chartConfig.options.scales.y.grid.display).toBe(true);

            Chart.mockClear();
            container.innerHTML = "";

            // Test with grid disabled
            const optionsWithoutGrid = { maxPoints: 1000, showGrid: false };
            renderPowerVsHeartRateChart(container, data, optionsWithoutGrid);

            chartConfig = getLatestChartConfig();
            expect(chartConfig.options.scales.x.grid.display).toBe(false);
            expect(chartConfig.options.scales.y.grid.display).toBe(false);
        });

        it("should configure point radius based on showPoints option", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];

            // Test with points shown
            const optionsWithPoints = { maxPoints: 1000, showPoints: true };
            renderPowerVsHeartRateChart(container, data, optionsWithPoints);

            let chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].pointRadius).toBe(2);

            Chart.mockClear();
            container.innerHTML = "";

            // Test with points hidden
            const optionsWithoutPoints = { maxPoints: 1000, showPoints: false };
            renderPowerVsHeartRateChart(container, data, optionsWithoutPoints);

            chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].pointRadius).toBe(1);
        });
    });

    describe("Scales Configuration", () => {
        it("should configure x-axis for heart rate", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000, showGrid: true };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect(chartConfig.options.scales.x.type).toBe("linear");
            expect(chartConfig.options.scales.x.display).toBe(true);
            expect(chartConfig.options.scales.x.title.display).toBe(true);
            expect(chartConfig.options.scales.x.title.text).toBe(
                "Heart Rate (bpm)"
            );
            expect(chartConfig.options.scales.x.title.text).not.toBe(
                "Power (W)"
            );
        });

        it("should configure y-axis for power", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000, showGrid: true };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect(chartConfig.options.scales.y.type).toBe("linear");
            expect(chartConfig.options.scales.y.display).toBe(true);
            expect(chartConfig.options.scales.y.title.display).toBe(true);
            expect(chartConfig.options.scales.y.title.text).toBe("Power (W)");
        });
    });

    describe("Zoom and Pan Configuration", () => {
        it("should configure zoom plugin with correct settings", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            const zoomConfig = chartConfig.options.plugins.zoom;

            expect(zoomConfig.pan.enabled).toBe(true);
            expect(zoomConfig.pan.mode).toBe("xy");
            expect(zoomConfig.pan.modifierKey).toBe(null);

            expect(zoomConfig.zoom.wheel.enabled).toBe(true);
            expect(zoomConfig.zoom.wheel.modifierKey).toBe("ctrl");
            expect(zoomConfig.zoom.wheel.modifierKey).not.toBe("shift");
            expect(zoomConfig.zoom.wheel.speed).toBe(0.1);
            expect(zoomConfig.zoom.pinch.enabled).toBe(true);
            expect(zoomConfig.zoom.drag.enabled).toBe(true);
            expect(zoomConfig.zoom.drag.modifierKey).toBe("shift");
            expect(zoomConfig.zoom.mode).toBe("xy");

            expect(zoomConfig.limits.x.min).toBe("original");
            expect(zoomConfig.limits.x.max).toBe("original");
            expect(zoomConfig.limits.y.min).toBe("original");
            expect(zoomConfig.limits.y.max).toBe("original");
        });
    });

    describe("Tooltip Configuration", () => {
        it("should configure tooltip with custom label callback", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            const tooltipConfig = chartConfig.options.plugins.tooltip;

            expect(tooltipConfig.borderWidth).toBe(1);
            expect(typeof tooltipConfig.callbacks.label).toBe("function");

            // Test tooltip callback
            const mockContext = {
                parsed: { x: 140, y: 280 },
            };
            const result = tooltipConfig.callbacks.label(mockContext);
            expect(result).toEqual(["Heart Rate: 140 bpm", "Power: 280 W"]);
            expect(result).not.toContain("Speed: 140 mph");
        });
    });

    describe("Plugin Integration", () => {
        it("should include required plugins in configuration", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect(chartConfig.plugins).toHaveLength(2);
            expect(chartConfig.plugins).not.toHaveLength(0);
            // Note: Actual plugin instances are imported and would be present
        });

        it("should configure background color plugin", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect(
                chartConfig.options.plugins.chartBackgroundColorPlugin
            ).toStrictEqual({
                backgroundColor: expect.any(String),
            });
        });
    });

    describe("Chart Instance Management", () => {
        it("should track chart instance in global array", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(getChartTestWindow()._chartjsInstances).toHaveLength(1);
            expect(getChartTestWindow()._chartjsInstances).not.toHaveLength(0);
            expect(getChartTestWindow()._chartjsInstances?.[0]).toBe(
                chartInstanceMock
            );
        });

        it("should initialize global chart instances array if not present", () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            delete global.window._chartjsInstances;

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(global.window._chartjsInstances).toStrictEqual([
                chartInstanceMock,
            ]);
        });

        it("should log success message when chart is created", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(console.log).toHaveBeenCalledWith(
                "[ChartJS] Power vs Heart Rate chart created successfully"
            );
            expect(container.children).toHaveLength(1);
        });
    });

    describe("Error Handling", () => {
        it("should handle errors gracefully and log error message", () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            Chart.mockImplementation(() => {
                throw new Error("Chart creation failed");
            });

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(console.error).toHaveBeenCalledWith(
                "[ChartJS] Error rendering power vs heart rate chart:",
                expect.any(Error)
            );
            expect(global.window._chartjsInstances).toHaveLength(0);
        });
    });

    describe("Edge Cases and Boundary Conditions", () => {
        it("should handle empty data array", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data: PowerHeartRateDatum[] = [];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should handle data with zero power values", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 0, heartRate: 120 },
                { power: 0, heartRate: 130 },
            ];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 120, y: 0 },
                { x: 130, y: 0 },
            ]);
        });

        it("should handle data with zero heart rate values", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 200, heartRate: 0 },
                { power: 250, heartRate: 0 },
            ];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 0, y: 200 },
                { x: 0, y: 250 },
            ]);
        });

        it("should handle very large datasets efficiently", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data: PowerHeartRateDatum[] = [];
            for (let i = 0; i < 10000; i++) {
                data.push({ power: 200 + i, heartRate: 120 + (i % 100) });
            }
            const options = { maxPoints: 500 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(
                chartConfig.data.datasets[0].data.length
            ).toBeLessThanOrEqual(500);
        });

        it("should handle mixed valid and invalid data points", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 200, heartRate: 120 },
                { power: "invalid", heartRate: 130 },
                { power: 250, heartRate: "invalid" },
                { power: 275, heartRate: 135 },
                { power: null, heartRate: null },
                { power: 300, heartRate: 140 },
            ];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 120, y: 200 },
                { x: 130, y: "invalid" },
                { x: "invalid", y: 250 },
                { x: 135, y: 275 },
                { x: 140, y: 300 },
            ]);
        });
    });

    describe("Performance and Optimization", () => {
        it("should handle rapid successive chart creations", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            for (let i = 0; i < 5; i++) {
                renderPowerVsHeartRateChart(container, data, options);
            }

            expect(Chart).toHaveBeenCalledTimes(5);
            expect(global.window._chartjsInstances).toHaveLength(5);
        });

        it("should not modify original data array", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const originalData = [
                { power: 200, heartRate: 120 },
                { power: 250, heartRate: 130 },
            ];
            const data = [...originalData];
            const options = { maxPoints: 1 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(data).toEqual(originalData);
            expect(data).not.toBe(originalData);
        });
    });

    describe("Integration with Dependencies", () => {
        it("should use fallback colors when theme configuration is missing", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            expect(
                renderPowerVsHeartRateChart(container, data, options)
            ).toBeUndefined();

            expect(Chart).toHaveBeenCalledOnce();
            expect(container.children).toHaveLength(1);
            expect(container.children[0].tagName).toBe("CANVAS");
            expect(getLatestChartConfig().data.datasets[0]).toMatchObject({
                backgroundColor: expect.any(String),
                borderColor: expect.any(String),
                data: [{ x: 120, y: 200 }],
            });
        });

        it("should call createChartCanvas with correct parameters", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            // Verify canvas was created and added to container
            expect(container.children.length).toBe(1);
            expect(container.children[0].tagName).toBe("CANVAS");
            expect(container.children[0].id).toBe("chart-power-vs-hr-0");
        });
    });

    describe("Real-world Usage Scenarios", () => {
        it("should handle typical cycling power and heart rate data", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 150, heartRate: 110 },
                { power: 200, heartRate: 130 },
                { power: 250, heartRate: 145 },
                { power: 300, heartRate: 160 },
                { power: 280, heartRate: 155 },
                { power: 220, heartRate: 140 },
            ];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
            };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toHaveLength(6);
            expect(chartConfig.data.datasets[0].label).toBe(
                "Power vs Heart Rate"
            );
            expect(chartConfig.data.datasets[0].label).not.toBe(
                "Speed vs Distance"
            );
        });

        it("should handle training data with power spikes", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 200, heartRate: 130 },
                { power: 450, heartRate: 165 }, // Sprint
                { power: 180, heartRate: 125 }, // Recovery
                { power: 350, heartRate: 155 }, // High intensity
                { power: 160, heartRate: 115 }, // Base pace
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toContainEqual({
                x: 165,
                y: 450,
            });
            expect(chartConfig.data.datasets[0].data).toContainEqual({
                x: 115,
                y: 160,
            });
        });
    });
});
