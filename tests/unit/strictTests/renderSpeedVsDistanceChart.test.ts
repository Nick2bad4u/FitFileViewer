import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type Mock,
} from "vitest";
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

type ChartConstructorFunction = (
    canvas: HTMLCanvasElement,
    config: ChartConfig
) => ChartInstanceMock;

type ChartConstructorMock = Mock<ChartConstructorFunction>;

type ChartInstanceMock = {
    clear: Mock<() => void>;
    config: Record<string, unknown>;
    data: { datasets: ChartDataset[] };
    destroy: Mock<() => void>;
    generateLegend: Mock<() => void>;
    getDatasetAtEvent: Mock<() => unknown[]>;
    getElementAtEvent: Mock<() => unknown[]>;
    getElementsAtEventForMode: Mock<() => unknown[]>;
    options: Record<string, unknown>;
    render: Mock<() => void>;
    reset: Mock<() => void>;
    resize: Mock<() => void>;
    stop: Mock<() => void>;
    toBase64Image: Mock<() => string>;
    update: Mock<() => void>;
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
    clear: Mock<() => void>;
    getItem: Mock<(key: string) => null | string>;
    removeItem: Mock<(key: string) => void>;
    setItem: Mock<(key: string, value: string) => void>;
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

describe("renderSpeedVsDistanceChart.js - speed vs distance chart utility", () => {
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
            log: vi.fn<Console["log"]>(),
            error: vi.fn<Console["error"]>(),
            warn: vi.fn<Console["warn"]>(),
        } as unknown as Console;

        // Mock localStorage
        mockLocalStorage = {
            getItem: vi.fn<(key: string) => null | string>(),
            setItem: vi.fn<(key: string, value: string) => void>(),
            removeItem: vi.fn<(key: string) => void>(),
            clear: vi.fn<() => void>(),
        };
        getChartTestGlobal().localStorage = mockLocalStorage;

        // Mock Chart.js
        chartInstanceMock = {
            data: { datasets: [] },
            options: {},
            config: {},
            destroy: vi.fn<() => void>(),
            update: vi.fn<() => void>(),
            resize: vi.fn<() => void>(),
            reset: vi.fn<() => void>(),
            render: vi.fn<() => void>(),
            stop: vi.fn<() => void>(),
            clear: vi.fn<() => void>(),
            toBase64Image: vi.fn<() => string>(),
            generateLegend: vi.fn<() => void>(),
            getElementsAtEventForMode: vi.fn<() => unknown[]>(() => []),
            getElementAtEvent: vi.fn<() => unknown[]>(() => []),
            getDatasetAtEvent: vi.fn<() => unknown[]>(() => []),
        };

        Chart = vi.fn<ChartConstructorFunction>(function ChartConstructor() {
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

    describe("data validation and processing", () => {
        it("should return early when data has no speed values", () => {
            expect.assertions(2);

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
            expect({
                chartCalls: Chart.mock.calls.length,
                childCount: container.children.length,
            }).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should return early when data has no distance values", () => {
            expect.assertions(2);

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
            expect({
                chartCalls: Chart.mock.calls.length,
                childCount: container.children.length,
            }).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should return early when field visibility is hidden", () => {
            expect.assertions(3);

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
            expect({
                chartCalls: Chart.mock.calls.length,
                childCount: container.children.length,
            }).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should process data correctly with valid speed and distance values", () => {
            expect.assertions(2);

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

            expect(Chart).toHaveBeenCalledWith(
                expect.any(HTMLCanvasElement),
                expect.any(Object)
            );
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 1, y: 19.8 }, // Distance converted from meters to km, speed converted to km/h
                { x: 2, y: 21.6 },
                { x: 2.5, y: 18.72 },
            ]);
        });

        it("should handle enhancedSpeed preference over speed", () => {
            expect.assertions(2);

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

            expect(Chart).toHaveBeenCalledWith(
                expect.any(HTMLCanvasElement),
                expect.any(Object)
            );
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 1, y: 20.88 }, // enhancedSpeed used instead of speed, converted to km/h
                { x: 2, y: 22.32 },
            ]);
        });

        it("should return early when no valid data points exist after filtering", () => {
            expect.assertions(2);

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
            expect({
                chartCalls: Chart.mock.calls.length,
                childCount: container.children.length,
            }).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });
    });

    describe("data point limiting", () => {
        it("should apply data point limiting when maxPoints is exceeded", () => {
            expect.assertions(4);

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

            expect(Chart).toHaveBeenCalledWith(
                expect.any(HTMLCanvasElement),
                expect.any(Object)
            );
            const chartConfig = getLatestChartConfig();
            expect(
                chartConfig.data.datasets[0].data.length
            ).toBeLessThanOrEqual(100);
            expect(chartConfig.data.datasets[0].data).not.toHaveLength(
                data.length
            );
            expect(chartConfig.data.datasets[0].data).toContainEqual({
                x: 0,
                y: 18,
            });
        });

        it("should not limit data when maxPoints is 'all'", () => {
            expect.assertions(2);

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

            expect(Chart).toHaveBeenCalledWith(
                expect.any(HTMLCanvasElement),
                expect.any(Object)
            );
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toHaveLength(50);
        });

        it("should handle data point limiting with exact step calculation", () => {
            expect.assertions(2);

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

            expect(Chart).toHaveBeenCalledWith(
                expect.any(HTMLCanvasElement),
                expect.any(Object)
            );
            const chartConfig = getLatestChartConfig();
            expect(
                chartConfig.data.datasets[0].data.length
            ).toBeLessThanOrEqual(50);
        });
    });

    describe("chart configuration", () => {
        it("should create scatter chart with correct type and configuration", () => {
            expect.assertions(4);

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

            expect(Chart).toHaveBeenCalledWith(
                expect.any(HTMLCanvasElement),
                expect.any(Object)
            );
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.type).toBe("scatter");
            expect(chartConfig.type).not.toBe("line");
            expect({
                borderWidth: chartConfig.data.datasets[0].borderWidth,
                fill: chartConfig.data.datasets[0].fill,
                label: chartConfig.data.datasets[0].label,
                showLine: chartConfig.data.datasets[0].showLine,
                tension: chartConfig.data.datasets[0].tension,
            }).toStrictEqual({
                borderWidth: 2,
                fill: false,
                label: "Speed vs Distance",
                showLine: true,
                tension: 0.1,
            });
        });

        it("should configure chart options based on provided options - all enabled", () => {
            expect.assertions(2);

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
            expect({
                legendDisplay: chartConfig.options.plugins.legend.display,
                pointRadius: chartConfig.data.datasets[0].pointRadius,
                titleDisplay: chartConfig.options.plugins.title.display,
                xGridDisplay: chartConfig.options.scales.x.grid.display,
                yGridDisplay: chartConfig.options.scales.y.grid.display,
            }).toStrictEqual({
                legendDisplay: true,
                pointRadius: 2,
                titleDisplay: true,
                xGridDisplay: true,
                yGridDisplay: true,
            });
            expect(chartConfig.options.plugins.title.text).toBe(
                "Speed vs Distance"
            );
        });

        it("should configure chart options based on provided options - all disabled", () => {
            expect.assertions(1);

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
            expect({
                legendDisplay: chartConfig.options.plugins.legend.display,
                pointRadius: chartConfig.data.datasets[0].pointRadius,
                titleDisplay: chartConfig.options.plugins.title.display,
                xGridDisplay: chartConfig.options.scales.x.grid.display,
                yGridDisplay: chartConfig.options.scales.y.grid.display,
            }).toStrictEqual({
                legendDisplay: false,
                pointRadius: 1,
                titleDisplay: false,
                xGridDisplay: false,
                yGridDisplay: false,
            });
        });

        it("should set correct axis titles and configuration", () => {
            expect.assertions(3);

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
            expect({
                xDisplay: chartConfig.options.scales.x.display,
                xTitleDisplay: chartConfig.options.scales.x.title.display,
                xType: chartConfig.options.scales.x.type,
                yDisplay: chartConfig.options.scales.y.display,
                yTitleDisplay: chartConfig.options.scales.y.title.display,
                yType: chartConfig.options.scales.y.type,
            }).toStrictEqual({
                xDisplay: true,
                xTitleDisplay: true,
                xType: "linear",
                yDisplay: true,
                yTitleDisplay: true,
                yType: "linear",
            });
            expect(chartConfig.options.scales.x.title.text).toContain(
                "Distance"
            );

            expect(chartConfig.options.scales.y.title.text).toContain("Speed");
        });

        it("should configure zoom and pan options correctly", () => {
            expect.assertions(5);

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
            expect({
                dragEnabled: chartConfig.options.plugins.zoom.zoom.drag.enabled,
                mode: chartConfig.options.plugins.zoom.zoom.mode,
                panEnabled: chartConfig.options.plugins.zoom.pan.enabled,
                panMode: chartConfig.options.plugins.zoom.pan.mode,
                pinchEnabled:
                    chartConfig.options.plugins.zoom.zoom.pinch.enabled,
                wheelEnabled:
                    chartConfig.options.plugins.zoom.zoom.wheel.enabled,
            }).toStrictEqual({
                dragEnabled: true,
                mode: "x",
                panEnabled: true,
                panMode: "x",
                pinchEnabled: true,
                wheelEnabled: true,
            });
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

    describe("canvas creation and styling", () => {
        it("should create canvas with correct ID and styling", () => {
            expect.assertions(2);

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

            const canvas = container.children[0] as HTMLCanvasElement;
            expect({
                borderRadius: canvas.style.borderRadius,
                childCount: container.children.length,
                id: canvas.id,
                tagName: canvas.tagName,
            }).toStrictEqual({
                borderRadius: "12px",
                childCount: 1,
                id: "chart-speed-vs-distance-0",
                tagName: "CANVAS",
            });
            expect(canvas.id).not.toBe("chart-speed-distance-0");
        });

        it("should append canvas to container", () => {
            expect.assertions(2);

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

            expect(
                [...container.children].map((child) => child.tagName)
            ).toEqual(["CANVAS"]);
            expect(container.children[0]).toBeInstanceOf(HTMLCanvasElement);
        });
    });

    describe("chart instance management", () => {
        it("should add chart instance to global instances array", () => {
            expect.assertions(2);

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

            expect(getChartTestWindow()._chartjsInstances).not.toContain(
                undefined
            );
            expect(getChartTestWindow()._chartjsInstances).toStrictEqual([
                chartInstanceMock,
            ]);
        });

        it("should initialize global instances array if it doesn't exist", () => {
            expect.assertions(1);

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
            expect.assertions(2);

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
            expect(
                [...container.children].map((child) => child.tagName)
            ).toEqual(["CANVAS"]);
        });
    });

    describe("tooltip configuration", () => {
        it("should configure tooltip with distance and speed formatting", () => {
            expect.assertions(2);

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
            const { callbacks } = chartConfig.options.plugins.tooltip;
            expect(callbacks.label).toBeTypeOf("function");
            expect(callbacks).not.toHaveProperty("title");
        });

        it("should format tooltip correctly with kilometers distance units", () => {
            expect.assertions(1);

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
            expect.assertions(1);

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
            expect.assertions(1);

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
            expect.assertions(1);

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

    describe("plugin configuration", () => {
        it("should include chartZoomResetPlugin and chartBackgroundColorPlugin", () => {
            expect.assertions(1);

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
            expect(chartConfig.plugins).toEqual([
                expect.objectContaining({ id: "chartZoomResetPlugin" }),
                expect.objectContaining({ id: "chartBackgroundColorPlugin" }),
            ]);
        });

        it("should configure chartBackgroundColorPlugin with theme colors", () => {
            expect.assertions(1);

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

    describe("error handling", () => {
        it("should handle Chart.js constructor throwing error", () => {
            expect.assertions(4);

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

            renderSpeedVsDistanceChart(container, data, options);

            expect(console.error).toHaveBeenCalledWith(
                "[ChartJS] Error rendering speed vs distance chart:",
                expect.any(Error)
            );
            expect(Chart).toHaveBeenCalledOnce();
            expect(getChartTestWindow()._chartjsInstances).toStrictEqual([]);
            expect(
                [...container.children].map((child) => child.tagName)
            ).toEqual(["CANVAS"]);
        });

        it("should handle errors during canvas creation", () => {
            expect.assertions(4);

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            // Mock window.Chart to throw an error when instantiated
            const mockChart = vi.fn<ChartConstructorFunction>(
                function ChartMock() {
                    throw new Error("Chart creation failed");
                }
            ) as ChartConstructorMock;

            // Setup the Chart mock on window
            Object.defineProperty(window, "Chart", {
                value: mockChart,
                writable: true,
                configurable: true,
            });

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];

            renderSpeedVsDistanceChart(container, data, { maxPoints: 100 });

            expect(consoleSpy).toHaveBeenCalledWith(
                "[ChartJS] Error rendering speed vs distance chart:",
                expect.any(Error)
            );
            expect(mockChart).toHaveBeenCalledOnce();
            expect(getChartTestWindow()._chartjsInstances).toStrictEqual([]);
            expect(
                [...container.children].map((child) => child.tagName)
            ).toEqual(["CANVAS"]);

            consoleSpy.mockRestore();
        });

        it("should handle null container gracefully", () => {
            expect.assertions(3);

            mockLocalStorage.getItem.mockReturnValue(null);

            const data = [{ speed: 5.5, distance: 1000 }];
            const options = {
                maxPoints: 1000,
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderSpeedVsDistanceChart(
                null as unknown as HTMLElement,
                data,
                options
            );

            expect(console.error).toHaveBeenCalledWith(
                "[ChartJS] Error rendering speed vs distance chart:",
                expect.any(Error)
            );
            expect(Chart).not.toHaveBeenCalled();
            expect(getChartTestWindow()._chartjsInstances).toStrictEqual([]);
        });
    });

    describe("responsive configuration", () => {
        it("should set responsive and maintainAspectRatio options", () => {
            expect.assertions(2);

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
            expect({
                maintainAspectRatio: chartConfig.options.maintainAspectRatio,
                responsive: chartConfig.options.responsive,
            }).toStrictEqual({
                maintainAspectRatio: false,
                responsive: true,
            });
            expect(chartConfig.options.responsive).not.toStrictEqual(false);
        });
    });

    describe("edge cases", () => {
        it("should handle empty data array", () => {
            expect.assertions(2);

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
            expect({
                chartCalls: Chart.mock.calls.length,
                childCount: container.children.length,
            }).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should handle data with zero values", () => {
            expect.assertions(2);

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

            expect(Chart).toHaveBeenCalledWith(
                expect.any(HTMLCanvasElement),
                expect.any(Object)
            );
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toHaveLength(2);
        });

        it("should handle fractional maxPoints calculation", () => {
            expect.assertions(2);

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

            expect(Chart).toHaveBeenCalledWith(
                expect.any(HTMLCanvasElement),
                expect.any(Object)
            );
            const chartConfig = getLatestChartConfig();
            expect(
                chartConfig.data.datasets[0].data.length
            ).toBeLessThanOrEqual(33);
        });
    });
});
