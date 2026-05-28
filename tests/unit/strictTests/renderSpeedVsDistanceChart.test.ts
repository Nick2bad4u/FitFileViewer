import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import { chartSettingsManager } from "../../../electron-app/utils/charts/core/renderChartJS.js";

type ChartDataset = {
    data?: unknown[];
    [key: string]: unknown;
};

type ChartConfig = {
    data: {
        datasets: ChartDataset[];
    };
    options: {
        maintainAspectRatio?: boolean;
        plugins?: {
            chartBackgroundColorPlugin?: unknown;
            tooltip?: {
                callbacks?: {
                    label?: (context: TooltipContext) => string[];
                };
            };
            [key: string]: unknown;
        };
        responsive?: boolean;
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

type RenderSpeedVsDistanceChart = (
    container: HTMLElement,
    data: readonly SpeedDistanceDatum[],
    options: SpeedDistanceOptions
) => void;

type SpeedDistanceDatum = {
    distance?: null | number;
    enhancedSpeed?: number;
    speed?: null | number;
};

type SpeedDistanceOptions = {
    animationStyle?: string;
    distanceUnits?: string;
    interpolation?: string;
    maxPoints: "all" | number;
    showGrid?: boolean;
    showLegend?: boolean;
    showPoints?: boolean;
    showTitle?: boolean;
    smoothing?: number;
    theme?: string;
};

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
let renderSpeedVsDistanceChart: RenderSpeedVsDistanceChart;
let mockLocalStorage: StorageMock;

describe("renderSpeedVsDistanceChart.js - Speed vs Distance Chart Utility", () => {
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

        // Sync Chart constructor between window and globalThis using property descriptor
        Object.defineProperty(getChartTestGlobal(), "Chart", {
            get() {
                return getChartTestWindow().Chart;
            },
            set(value) {
                getChartTestWindow().Chart = value as ChartConstructorMock;
            },
            configurable: true,
        });

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
            await import("../../../electron-app/utils/charts/rendering/renderSpeedVsDistanceChart.js");
        renderSpeedVsDistanceChart = module.renderSpeedVsDistanceChart;
    });

    afterEach(() => {
        vi.clearAllMocks();
        if (global.window && getChartTestWindow()._chartjsInstances) {
            getChartTestWindow()._chartjsInstances = [];
        }
        // Clean up property descriptors
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
        it("should return early when data has no speed values", () => {
            const container = document.createElement("div");
            const data = [
                { distance: 1000 },
                { distance: 2000 },
                { distance: 3000 },
            ];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should return early when data has no distance values", () => {
            const container = document.createElement("div");
            const data = [
                { speed: 5.5 },
                { speed: 6.0 },
                { speed: 4.8 },
            ];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should return early when field visibility is hidden", () => {
            const container = document.createElement("div");
            const data = [
                { speed: 5.5, distance: 1000 },
                { speed: 6.0, distance: 2000 },
            ];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            const visibilitySpy = vi
                .spyOn(chartSettingsManager, "getFieldVisibility")
                .mockReturnValue("hidden");

            renderSpeedVsDistanceChart(container, data, options);

            expect(visibilitySpy).toHaveBeenCalledWith("speed_vs_distance");
            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should process data correctly with valid speed and distance values", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { speed: 5.5, distance: 1000 },
                { speed: 6.0, distance: 2000 },
                { speed: null, distance: 3000 }, // Should be filtered out
                { speed: 4.8, distance: undefined }, // Should be filtered out
                { speed: 5.2, distance: 2500 },
            ];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 1, y: 19.8 }, // Distance converted from meters to km, speed converted to km/h
                { x: 2, y: 21.6 },
                { x: 2.5, y: 18.72 },
            ]);
        });

        it("should handle enhancedSpeed preference over speed", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { speed: 5.5, enhancedSpeed: 5.8, distance: 1000 },
                { speed: 6.0, enhancedSpeed: 6.2, distance: 2000 },
            ];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 1, y: 20.88 }, // enhancedSpeed used instead of speed, converted to km/h
                { x: 2, y: 22.32 },
            ]);
        });

        it("should return early when no valid data points exist after filtering", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { speed: null, distance: 1000 },
                { speed: 5.5, distance: null },
                { speed: undefined, distance: undefined },
            ];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

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
                data.push({ speed: 5.0 + i * 0.01, distance: 100 * i });
            }
            const options = {
                maxPoints: 100,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(
                chartConfig.data.datasets[0].data.length
            ).toBeLessThanOrEqual(100);
            expect(chartConfig.data.datasets[0].data).not.toHaveLength(0);
        });

        it("should not limit data when maxPoints is 'all'", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [];
            for (let i = 0; i < 50; i++) {
                data.push({ speed: 5.0 + i, distance: 1000 * i });
            }
            const options = {
                maxPoints: "all",
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data.length).toBe(50);
        });

        it("should handle data point limiting with exact step calculation", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [];
            for (let i = 0; i < 200; i++) {
                data.push({ speed: 5.0 + i, distance: 100 * i });
            }
            const options = {
                maxPoints: 50,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(
                chartConfig.data.datasets[0].data.length
            ).toBeLessThanOrEqual(50);
        });
    });

    describe("Chart Configuration", () => {
        it("should create scatter chart with correct type and configuration", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { speed: 5.5, distance: 1000 },
                { speed: 6.0, distance: 2000 },
            ];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.type).toBe("scatter");
            expect(chartConfig.data.datasets[0].label).toBe(
                "Speed vs Distance"
            );
            expect(chartConfig.data.datasets[0].showLine).toBe(true);
            expect(chartConfig.data.datasets[0].fill).toBe(false);
            expect(chartConfig.data.datasets[0].tension).toBe(0.1);
            expect(chartConfig.data.datasets[0].borderWidth).toBe(2);
        });

        it("should configure chart options based on provided options - all enabled", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].pointRadius).toBe(2);
            expect(chartConfig.options.plugins.legend.display).toBe(true);
            expect(chartConfig.options.plugins.legend.display).not.toBe(false);
            expect(chartConfig.options.plugins.title.display).toBe(true);
            expect(chartConfig.options.plugins.title.text).toBe(
                "Speed vs Distance"
            );
            expect(chartConfig.options.scales.x.grid.display).toBe(true);
            expect(chartConfig.options.scales.y.grid.display).toBe(true);
        });

        it("should configure chart options based on provided options - all disabled", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: false,
                showLegend: false,
                showTitle: false,
                showGrid: false,
            };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].pointRadius).toBe(1);
            expect(chartConfig.options.plugins.legend.display).toBe(false);
            expect(chartConfig.options.plugins.title.display).toBe(false);
            expect(chartConfig.options.scales.x.grid.display).toBe(false);
            expect(chartConfig.options.scales.y.grid.display).toBe(false);
        });

        it("should set correct axis titles and configuration", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect(chartConfig.options.scales.x.type).toBe("linear");
            expect(chartConfig.options.scales.x.display).toBe(true);
            expect(chartConfig.options.scales.x.title.display).toBe(true);
            expect(chartConfig.options.scales.x.title.text).toContain(
                "Distance"
            );

            expect(chartConfig.options.scales.y.type).toBe("linear");
            expect(chartConfig.options.scales.y.display).toBe(true);
            expect(chartConfig.options.scales.y.title.display).toBe(true);
            expect(chartConfig.options.scales.y.title.text).toContain("Speed");
        });

        it("should configure zoom and pan options correctly", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect(chartConfig.options.plugins.zoom.pan.enabled).toBe(true);
            expect(chartConfig.options.plugins.zoom.pan.mode).toBe("x");
            expect(chartConfig.options.plugins.zoom.zoom.wheel.enabled).toBe(
                true
            );
            expect(chartConfig.options.plugins.zoom.zoom.pinch.enabled).toBe(
                true
            );
            expect(chartConfig.options.plugins.zoom.zoom.drag.enabled).toBe(
                true
            );
            expect(chartConfig.options.plugins.zoom.zoom.mode).toBe("x");
            expect(chartConfig.options.plugins.zoom.limits.x.min).toBe(
                "original"
            );
            expect(chartConfig.options.plugins.zoom.limits.x.max).toBe(
                "original"
            );
            expect(chartConfig.options.plugins.zoom.limits.y.min).toBe(
                "original"
            );
            expect(chartConfig.options.plugins.zoom.limits.y.max).toBe(
                "original"
            );
        });
    });

    describe("Canvas Creation and Styling", () => {
        it("should create canvas with correct ID and styling", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(container.children.length).toBe(1);
            const canvas = container.children[0] as HTMLCanvasElement;
            expect(canvas.tagName).toBe("CANVAS");
            expect(canvas.id).toBe("chart-speed-vs-distance-0"); // Actual format from createChartCanvas
            expect(canvas.style.borderRadius).toBe("12px");
        });

        it("should append canvas to container", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(container.children.length).toBe(1);
            expect(container.children).not.toHaveLength(0);
            expect(container.children[0]).toBeInstanceOf(HTMLCanvasElement);
        });
    });

    describe("Chart Instance Management", () => {
        it("should add chart instance to global instances array", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(getChartTestWindow()._chartjsInstances).toHaveLength(1);
            expect(getChartTestWindow()._chartjsInstances).not.toHaveLength(0);
            expect(getChartTestWindow()._chartjsInstances?.[0]).toBe(
                chartInstanceMock
            );
        });

        it("should initialize global instances array if it doesn't exist", () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            getChartTestWindow()._chartjsInstances = undefined;

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(getChartTestWindow()._chartjsInstances).toStrictEqual([
                chartInstanceMock,
            ]);
        });

        it("should log success message when chart is created", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(console.log).toHaveBeenCalledWith(
                "[ChartJS] Speed vs Distance chart created successfully"
            );
            expect(container.children).toHaveLength(1);
        });
    });

    describe("Tooltip Configuration", () => {
        it("should configure tooltip with distance and speed formatting", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect(chartConfig.options.plugins.tooltip).toMatchObject({
                callbacks: {
                    label: expect.any(Function),
                },
            });
            expect(
                typeof chartConfig.options.plugins.tooltip.callbacks.label
            ).toBe("function");
        });

        it("should format tooltip correctly with kilometers distance units", () => {
            mockLocalStorage.getItem.mockImplementation((key: string) => {
                if (key === "chartjs_field_speed_vs_distance") return null;
                if (key === "chartjs_distanceUnits") return "kilometers";
                return null;
            });

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                distanceUnits: "kilometers",
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            const tooltipCallback =
                chartConfig.options.plugins.tooltip.callbacks.label;
            const mockContext = {
                parsed: { x: 1, y: 19.8 }, // 1 km, 19.8 km/h
            };

            const result = tooltipCallback(mockContext);
            expect(result).toStrictEqual([
                "Distance: 1.00 km (0.62 mi)",
                "Speed: 19.80 km/h",
            ]);
        });

        it("should format tooltip correctly with feet distance units", () => {
            mockLocalStorage.getItem.mockImplementation((key: string) => {
                if (key === "chartjs_field_speed_vs_distance") return null;
                if (key === "chartjs_distanceUnits") return "feet";
                return null;
            });

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                distanceUnits: "feet",
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            const tooltipCallback =
                chartConfig.options.plugins.tooltip.callbacks.label;
            const mockContext = {
                parsed: { x: 3280.84, y: 19.8 }, // feet, km/h
            };

            const result = tooltipCallback(mockContext);
            expect(result).toStrictEqual([
                "Distance: 0.62 mi (1.00 km)",
                "Speed: 19.80 mph",
            ]);
        });

        it("should format tooltip correctly with miles distance units", () => {
            mockLocalStorage.getItem.mockImplementation((key: string) => {
                if (key === "chartjs_field_speed_vs_distance") return null;
                if (key === "chartjs_distanceUnits") return "miles";
                return null;
            });

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                distanceUnits: "miles",
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            const tooltipCallback =
                chartConfig.options.plugins.tooltip.callbacks.label;
            const mockContext = {
                parsed: { x: 0.621371, y: 19.8 }, // miles, km/h
            };

            const result = tooltipCallback(mockContext);
            expect(result).toStrictEqual([
                "Distance: 0.62 mi (1.00 km)",
                "Speed: 19.80 mph",
            ]);
        });

        it("should handle tooltip formatting with default units when no localStorage value", () => {
            mockLocalStorage.getItem.mockImplementation((key: string) => {
                if (key === "chartjs_field_speed_vs_distance") return null;
                if (key === "chartjs_distanceUnits") return null;
                return null;
            });

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            const tooltipCallback =
                chartConfig.options.plugins.tooltip.callbacks.label;
            const mockContext = {
                parsed: { x: 1, y: 19.8 },
            };

            const result = tooltipCallback(mockContext);
            expect(result).toStrictEqual([
                "Distance: 1.00 km (0.62 mi)",
                "Speed: 19.80 km/h",
            ]);
        });
    });

    describe("Plugin Configuration", () => {
        it("should include chartZoomResetPlugin and chartBackgroundColorPlugin", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect(chartConfig.plugins).toHaveLength(2);
            expect(chartConfig.plugins).not.toHaveLength(0);
        });

        it("should configure chartBackgroundColorPlugin with theme colors", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect(chartConfig.options.plugins).toHaveProperty(
                "chartBackgroundColorPlugin"
            );
        });
    });

    describe("Error Handling", () => {
        it("should handle Chart.js constructor throwing error", () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            Chart.mockImplementation(() => {
                throw new Error("Chart creation failed");
            });

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            expect(
                renderSpeedVsDistanceChart(container, data, options)
            ).toBeUndefined();

            expect(console.error).toHaveBeenCalledWith(
                "[ChartJS] Error rendering speed vs distance chart:",
                expect.any(Error)
            );
            expect(Chart).toHaveBeenCalledOnce();
            expect(getChartTestWindow()._chartjsInstances).toHaveLength(0);
            expect(container.children).toHaveLength(1);
        });

        it("should handle errors during canvas creation", () => {
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            // Mock window.Chart to throw an error when instantiated
            const mockChart = vi.fn().mockImplementation(function ChartMock() {
                throw new Error("Chart creation failed");
            });

            // Setup the Chart mock on window
            Object.defineProperty(window, "Chart", {
                value: mockChart,
                writable: true,
                configurable: true,
            });

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];

            expect(
                renderSpeedVsDistanceChart(container, data, { maxPoints: 100 })
            ).toBeUndefined();

            expect(consoleSpy).toHaveBeenCalledWith(
                "[ChartJS] Error rendering speed vs distance chart:",
                expect.any(Error)
            );
            expect(mockChart).toHaveBeenCalledOnce();
            expect(getChartTestWindow()._chartjsInstances).toHaveLength(0);
            expect(container.children).toHaveLength(1);

            consoleSpy.mockRestore();
        });

        it("should handle null container gracefully", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            expect(
                renderSpeedVsDistanceChart(
                    null as unknown as HTMLElement,
                    data,
                    options
                )
            ).toBeUndefined();

            expect(console.error).toHaveBeenCalledWith(
                "[ChartJS] Error rendering speed vs distance chart:",
                expect.any(Error)
            );
            expect(Chart).not.toHaveBeenCalled();
            expect(getChartTestWindow()._chartjsInstances).toHaveLength(0);
        });
    });

    describe("Responsive Configuration", () => {
        it("should set responsive and maintainAspectRatio options", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect(chartConfig.options.responsive).toBe(true);
            expect(chartConfig.options.responsive).not.toBe(false);
            expect(chartConfig.options.maintainAspectRatio).toBe(false);
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty data array", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data: SpeedDistanceDatum[] = [];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should handle data with zero values", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { speed: 0, distance: 0 },
                { speed: 5.5, distance: 1000 },
            ];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toHaveLength(2);
        });

        it("should handle fractional maxPoints calculation", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [];
            for (let i = 0; i < 100; i++) {
                data.push({ speed: 5.0 + i, distance: 100 * i });
            }
            const options = {
                maxPoints: 33,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = getLatestChartConfig();
            expect(
                chartConfig.data.datasets[0].data.length
            ).toBeLessThanOrEqual(33);
        });
    });
});
