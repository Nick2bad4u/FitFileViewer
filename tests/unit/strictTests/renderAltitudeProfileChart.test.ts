import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";
// import { chartSettingsManager } from "../../../electron-app/utils/charts/core/renderChartJS.js";

type AltitudeDatum = {
    altitude?: null | number;
    enhancedAltitude?: null | number;
    [key: string]: unknown;
};

type AltitudeOptions = {
    animationStyle?: string;
    distanceUnits?: string;
    interpolation?: string;
    maxPoints: "all" | number;
    showFill?: boolean;
    showGrid?: boolean;
    showLegend?: boolean;
    showTitle?: boolean;
    smoothing?: number;
    theme?: string;
    timeUnits?: string;
};

type ChartConfig = {
    data: {
        datasets: Array<Record<string, unknown>>;
        labels?: unknown[];
    };
    options: {
        plugins?: Record<string, unknown>;
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
    data: { datasets: Array<Record<string, unknown>> };
    destroy: ReturnType<typeof vi.fn>;
    options: Record<string, unknown>;
    render: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
    resize: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    toBase64Image: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
};

type ChartSettingsManagerMock = {
    getFieldVisibility: ReturnType<typeof vi.fn>;
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

type RenderAltitudeProfileChart = (
    container: HTMLElement,
    data: readonly AltitudeDatum[],
    labels: readonly (number | string)[],
    options: AltitudeOptions
) => void;

type StorageMock = {
    clear: ReturnType<typeof vi.fn>;
    getItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
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
let renderAltitudeProfileChart: RenderAltitudeProfileChart;
let mockLocalStorage: StorageMock;
let mockChartSettingsManager: ChartSettingsManagerMock;

describe("renderAltitudeProfileChart.js - Altitude Profile Chart Utility", () => {
    beforeEach(async () => {
        // Setup console first
        global.console = {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
        } as unknown as Console;

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
        };

        Chart = vi.fn().mockImplementation(function ChartConstructor() {
            return chartInstanceMock;
        }) as ChartConstructorMock;
        getChartTestWindow().Chart = Chart;
        getChartTestWindow()._chartjsInstances = [];

        // Ensure Chart is accessible from both window and globalThis
        getChartTestGlobal().Chart = Chart;
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

        // Mock all dependencies
        mockChartSettingsManager = {
            getFieldVisibility: vi.fn(() => "visible"),
        };
        vi.doMock(
            "../../../electron-app/utils/charts/core/renderChartJS.js",
            () => ({
                chartSettingsManager: mockChartSettingsManager,
            })
        );

        vi.doMock("../../../electron-app/utils/theming/core/theme.js", () => ({
            getThemeConfig: vi.fn(() => ({
                colors: {
                    success: "#00ff00",
                    chartBackground: "#ffffff",
                    chartSurface: "#f5f5f5",
                    textPrimary: "#000000",
                    chartBorder: "#cccccc",
                    chartGrid: "#e0e0e0",
                    primary: "#0066cc",
                    primaryAlpha: "#0066cc33",
                    shadow: "#00000020",
                },
            })),
        }));

        vi.doMock(
            "../../../electron-app/utils/charts/components/createChartCanvas.js",
            () => ({
                createChartCanvas: vi.fn((field, index) => {
                    const canvas = document.createElement("canvas");
                    canvas.id = `chart-${field}-${index}`;
                    return canvas;
                }),
            })
        );

        vi.doMock(
            "../../../electron-app/utils/formatting/formatters/formatTime.js",
            () => ({
                formatTime: vi.fn((value, short) => {
                    const minutes = Math.floor(value / 60);
                    const seconds = Math.floor(value % 60);
                    return short
                        ? `${minutes}:${seconds.toString().padStart(2, "0")}`
                        : `${minutes}:${seconds.toString().padStart(2, "0")}`;
                }),
            })
        );

        vi.doMock(
            "../../../electron-app/utils/data/lookups/getUnitSymbol.js",
            () => ({
                getUnitSymbol: vi.fn((field, type) => {
                    if (field === "time" && type === "time") return "s";
                    return "m";
                }),
            })
        );

        vi.doMock(
            "../../../electron-app/utils/charts/plugins/chartZoomResetPlugin.js",
            () => ({
                chartZoomResetPlugin: { id: "zoomReset" },
            })
        );

        vi.doMock(
            "../../../electron-app/utils/charts/plugins/chartBackgroundColorPlugin.js",
            () => ({
                chartBackgroundColorPlugin: { id: "backgroundColor" },
            })
        );

        // Import the module after mocking
        const module =
            await import("../../../electron-app/utils/charts/rendering/renderAltitudeProfileChart.js");
        renderAltitudeProfileChart = module.renderAltitudeProfileChart;
    });

    afterEach(() => {
        // Clean up global Chart instances
        if (global.window && getChartTestWindow()._chartjsInstances) {
            getChartTestWindow()._chartjsInstances.length = 0;
        }
        // Clean up property descriptor
        delete getChartTestGlobal()._chartjsInstances;
        delete getChartTestGlobal().Chart;

        vi.clearAllMocks();
        vi.resetAllMocks();
        vi.resetModules();
        delete getChartTestGlobal().window;
        delete getChartTestGlobal().document;
        delete getChartTestGlobal().HTMLCanvasElement;
        delete getChartTestGlobal().HTMLElement;
        delete getChartTestGlobal().console;
        delete getChartTestGlobal().localStorage;
    });

    describe("Data Validation and Processing", () => {
        it("should return early when data has no altitude values", () => {
            const container = document.createElement("div");
            const data = [{ speed: 10 }, { heartRate: 120 }];
            const labels = [0, 1];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            expect(Chart).not.toHaveBeenCalled();
            expect({
                chartCalls: Chart.mock.calls.length,
                childCount: container.children.length,
            }).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should return early when field visibility is hidden (handled by chart state manager)", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            // Force visibility to hidden via chartSettingsManager
            mockChartSettingsManager.getFieldVisibility.mockReturnValue(
                "hidden"
            );

            renderAltitudeProfileChart(container, data, labels, options);

            expect(Chart).not.toHaveBeenCalled();
            expect({
                chartCalls: Chart.mock.calls.length,
                childCount: container.children.length,
            }).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should process data correctly with valid altitude values", () => {
            const container = document.createElement("div");
            const data = [
                { altitude: 100 },
                { altitude: 150 },
                { altitude: 200 },
            ];
            const labels = [
                0,
                10,
                20,
            ];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            expect(Chart).toHaveBeenCalled();
            const chartData = getLatestChartConfig().data.datasets[0].data;
            expect(chartData).toEqual([
                { x: 0, y: 100 },
                { x: 10, y: 150 },
                { x: 20, y: 200 },
            ]);
        });

        it("should handle enhancedAltitude preference over altitude", () => {
            const container = document.createElement("div");
            const data = [
                { altitude: 100, enhancedAltitude: 110 },
                { altitude: 150, enhancedAltitude: 160 },
            ];
            const labels = [0, 10];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const chartData = getLatestChartConfig().data.datasets[0].data;
            expect(chartData).toEqual([
                { x: 0, y: 110 },
                { x: 10, y: 160 },
            ]);
        });

        it("should return early when no valid data points exist after filtering", () => {
            const container = document.createElement("div");
            const data = [{ altitude: null }, { altitude: undefined }];
            const labels = [0, 10];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            expect(Chart).not.toHaveBeenCalled();
            expect({
                chartCalls: Chart.mock.calls.length,
                childCount: container.children.length,
            }).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should handle mixed valid and invalid altitude values", () => {
            const container = document.createElement("div");
            const data = [
                { altitude: 100 },
                { altitude: null },
                { altitude: 200 },
                { altitude: undefined },
                { altitude: 300 },
            ];
            const labels = [
                0,
                10,
                20,
                30,
                40,
            ];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const chartData = getLatestChartConfig().data.datasets[0].data;
            expect(chartData).toEqual([
                { x: 0, y: 100 },
                { x: 20, y: 200 },
                { x: 40, y: 300 },
            ]);
        });
    });

    describe("Data Point Limiting", () => {
        it("should apply data point limiting when maxPoints is exceeded", () => {
            const container = document.createElement("div");
            const data = Array.from({ length: 10 }, (_, i) => ({
                altitude: 100 + i * 10,
            }));
            const labels = Array.from({ length: 10 }, (_, i) => i * 10);
            const options = {
                maxPoints: 3,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const chartData = getLatestChartConfig().data.datasets[0].data;
            expect(chartData.length).toBeLessThanOrEqual(3);
            expect(chartData.length).not.toBe(data.length);
            // With step = Math.ceil(10/3) = 4, we get indices 0, 4, 8
            expect(chartData).toEqual([
                { x: 0, y: 100 },
                { x: 40, y: 140 },
                { x: 80, y: 180 },
            ]);
        });

        it("should not limit data when maxPoints is 'all'", () => {
            const container = document.createElement("div");
            const data = Array.from({ length: 5 }, (_, i) => ({
                altitude: 100 + i * 10,
            }));
            const labels = Array.from({ length: 5 }, (_, i) => i * 10);
            const options = {
                maxPoints: "all",
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const chartData = getLatestChartConfig().data.datasets[0].data;
            expect(chartData).toEqual([
                { x: 0, y: 100 },
                { x: 10, y: 110 },
                { x: 20, y: 120 },
                { x: 30, y: 130 },
                { x: 40, y: 140 },
            ]);
        });

        it("should handle data point limiting with exact step calculation", () => {
            const container = document.createElement("div");
            const data = Array.from({ length: 6 }, (_, i) => ({
                altitude: 100 + i * 10,
            }));
            const labels = Array.from({ length: 6 }, (_, i) => i * 10);
            const options = {
                maxPoints: 3,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const chartData = getLatestChartConfig().data.datasets[0].data;
            // With step = Math.ceil(6/3) = 2, we get indices 0, 2, 4
            expect(chartData).toEqual([
                { x: 0, y: 100 },
                { x: 20, y: 120 },
                { x: 40, y: 140 },
            ]);
        });
    });

    describe("Chart Configuration", () => {
        it("should create line chart with correct type and configuration", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            expect(Chart).toHaveBeenCalled();
            const config = getLatestChartConfig();
            expect(config.type).toBe("line");
            expect(config.type).not.toBe("bar");
            expect({
                maintainAspectRatio: config.options.maintainAspectRatio,
                responsive: config.options.responsive,
            }).toStrictEqual({
                maintainAspectRatio: false,
                responsive: true,
            });
        });

        it("should configure dataset with gradient fill and correct styling", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const dataset = getLatestChartConfig().data.datasets[0];
            expect({
                backgroundColor: dataset.backgroundColor,
                borderColor: dataset.borderColor,
                borderWidth: dataset.borderWidth,
                fill: dataset.fill,
                label: dataset.label,
                pointHoverRadius: dataset.pointHoverRadius,
                pointRadius: dataset.pointRadius,
                tension: dataset.tension,
            }).toStrictEqual({
                backgroundColor: "#00ff004D",
                borderColor: "#00ff00",
                borderWidth: 2,
                fill: "origin",
                label: "Altitude Profile",
                pointHoverRadius: 4,
                pointRadius: 0,
                tension: 0.1,
            });
        });

        it("should configure chart options based on provided options - all enabled", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const config = getLatestChartConfig();
            expect({
                legendDisplay: config.options.plugins.legend.display,
                titleDisplay: config.options.plugins.title.display,
                xGridDisplay: config.options.scales.x.grid.display,
                yGridDisplay: config.options.scales.y.grid.display,
            }).toStrictEqual({
                legendDisplay: true,
                titleDisplay: true,
                xGridDisplay: true,
                yGridDisplay: true,
            });
        });

        it("should configure chart options based on provided options - all disabled", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: false,
                showTitle: false,
                showGrid: false,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const config = getLatestChartConfig();
            expect({
                legendDisplay: config.options.plugins.legend.display,
                titleDisplay: config.options.plugins.title.display,
                xGridDisplay: config.options.scales.x.grid.display,
                yGridDisplay: config.options.scales.y.grid.display,
            }).toStrictEqual({
                legendDisplay: false,
                titleDisplay: false,
                xGridDisplay: false,
                yGridDisplay: false,
            });
        });

        it("should set correct axis titles and configuration", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const config = getLatestChartConfig();
            expect(config.options.scales.x.title.text).toBe("Time (s)");
            expect(config.options.scales.y.title.text).toBe("Altitude (m)");
            expect(config.options.scales.x.type).toBe("linear");
            expect(config.options.scales.y.type).toBe("linear");
        });

        it("should configure zoom and pan options correctly", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const config = getLatestChartConfig();
            const zoom = config.options.plugins.zoom;
            expect({
                dragEnabled: zoom.zoom.drag.enabled,
                mode: zoom.zoom.mode,
                panEnabled: zoom.pan.enabled,
                panMode: zoom.pan.mode,
                pinchEnabled: zoom.zoom.pinch.enabled,
                wheelEnabled: zoom.zoom.wheel.enabled,
            }).toStrictEqual({
                dragEnabled: true,
                mode: "x",
                panEnabled: true,
                panMode: "x",
                pinchEnabled: true,
                wheelEnabled: true,
            });
        });
    });

    describe("Canvas Creation and Styling", () => {
        it("should create canvas with correct ID and styling", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const canvas = container.querySelector("canvas");
            expect(canvas?.tagName.toLowerCase()).toBe("canvas");
            expect(canvas?.id).toBe("chart-altitude-profile-0");
            expect(canvas?.id).not.toBe("chart-altitude-0");
            expect({
                borderRadius: canvas?.style.borderRadius,
                childCount: container.children.length,
            }).toStrictEqual({
                borderRadius: "12px",
                childCount: 1,
            });
            expect(canvas?.style.background).toMatch(
                /(#ffffff|rgb\(255,\s*255,\s*255\))/
            );
        });

        it("should append canvas to container", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            expect(container.children.length).toStrictEqual(0);

            renderAltitudeProfileChart(container, data, labels, options);

            expect({
                childCount: container.children.length,
                firstChildTag: container.children[0].tagName.toLowerCase(),
            }).toStrictEqual({
                childCount: 1,
                firstChildTag: "canvas",
            });
        });

        it("should apply theme-based canvas styling", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const canvas = container.querySelector("canvas");
            expect(canvas?.style.background).toMatch(
                /(#ffffff|rgb\(255,\s*255,\s*255\))/
            );
            expect(canvas?.style.boxShadow).toBe("0 2px 16px 0 #00000020");
        });
    });

    describe("Chart Instance Management", () => {
        it("should add chart instance to global instances array", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            expect(getChartTestWindow()._chartjsInstances).not.toContain(
                undefined
            );
            expect(getChartTestWindow()._chartjsInstances).toContain(
                chartInstanceMock
            );
            expect(getChartTestWindow()._chartjsInstances).toStrictEqual([
                chartInstanceMock,
            ]);
        });

        it("should initialize global instances array if it doesn't exist", () => {
            delete getChartTestWindow()._chartjsInstances;

            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            expect(getChartTestWindow()._chartjsInstances).toEqual([
                chartInstanceMock,
            ]);
            expect(getChartTestWindow()._chartjsInstances).toContain(
                chartInstanceMock
            );
        });

        it("should log success message when chart is created", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            expect(container.children[0]?.tagName.toLowerCase()).toBe("canvas");
            expect(console.log).toHaveBeenCalledWith(
                "[ChartJS] Altitude Profile chart created successfully"
            );
        });
    });

    describe("Tooltip Configuration", () => {
        it("should configure tooltip with altitude and time formatting", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const config = getLatestChartConfig();
            const tooltip = config.options.plugins.tooltip;
            expect({
                backgroundColor: tooltip.backgroundColor,
                bodyColor: tooltip.bodyColor,
                borderColor: tooltip.borderColor,
                borderWidth: tooltip.borderWidth,
                titleColor: tooltip.titleColor,
            }).toStrictEqual({
                backgroundColor: "#f5f5f5",
                bodyColor: "#000000",
                borderColor: "#cccccc",
                borderWidth: 1,
                titleColor: "#000000",
            });
            expect(tooltip.borderColor).not.toBe(tooltip.backgroundColor);
        });

        it("should format tooltip title correctly", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const config = getLatestChartConfig();
            const titleCallback =
                config.options.plugins.tooltip.callbacks.title;
            const mockContext = [{ parsed: { x: 125 } }];

            const result = titleCallback(mockContext);
            expect(result).toBe("Time: 2:05");
        });

        it("should format tooltip label correctly", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const config = getLatestChartConfig();
            const labelCallback =
                config.options.plugins.tooltip.callbacks.label;
            const mockContext = { parsed: { y: 123.456 } };

            const result = labelCallback(mockContext);
            expect(result).toBe("Altitude: 123.5 m");
        });
    });

    describe("Plugin Configuration", () => {
        it("should include chartZoomResetPlugin and chartBackgroundColorPlugin", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const config = getLatestChartConfig();
            expect(config.plugins).toEqual([
                { id: "zoomReset" },
                { id: "backgroundColor" },
            ]);
            expect(config.plugins).not.toContainEqual({ id: "unknownPlugin" });
        });

        it("should configure chartBackgroundColorPlugin with theme colors", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const config = getLatestChartConfig();
            expect(
                config.options.plugins.chartBackgroundColorPlugin
                    .backgroundColor
            ).toBe("#ffffff");
        });

        it("should configure zoom plugin with drag styling", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const config = getLatestChartConfig();
            const zoom = config.options.plugins.zoom;
            expect({
                backgroundColor: zoom.zoom.drag.backgroundColor,
                borderColor: zoom.zoom.drag.borderColor,
                borderWidth: zoom.zoom.drag.borderWidth,
                modifierKey: zoom.zoom.drag.modifierKey,
            }).toStrictEqual({
                backgroundColor: "#0066cc33",
                borderColor: "#0066ccCC",
                borderWidth: 2,
                modifierKey: "shift",
            });
        });
    });

    describe("Scale Configuration", () => {
        it("should configure x-axis with time formatting callback", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const config = getLatestChartConfig();
            const tickCallback = config.options.scales.x.ticks.callback;

            const result = tickCallback(125); // 125 seconds
            expect(result).toBe("2:05"); // formatTime with short=true
            expect(result).not.toBe("125");
        });

        it("should configure y-axis ticks with theme colors", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const config = getLatestChartConfig();
            expect(config.options.scales.x.ticks.color).toBe("#000000");
            expect(config.options.scales.y.ticks.color).toBe("#000000");
            expect(config.options.scales.x.title.color).toBe("#000000");
            expect(config.options.scales.y.title.color).toBe("#000000");
        });
    });

    describe("Error Handling", () => {
        it("should handle Chart.js constructor throwing error", () => {
            Chart.mockImplementationOnce(() => {
                throw new Error("Chart creation failed");
            });

            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            expect(() =>
                renderAltitudeProfileChart(container, data, labels, options)
            ).not.toThrow();

            expect(console.error).toHaveBeenCalledWith(
                "[ChartJS] Error rendering altitude profile chart:",
                expect.any(Error)
            );
            expect(getChartTestWindow()._chartjsInstances).toStrictEqual([]);
            expect(
                [...container.children].map((child) => child.tagName)
            ).toEqual(["CANVAS"]);
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty data array", () => {
            const container = document.createElement("div");
            const data: AltitudeDatum[] = [];
            const labels: number[] = [];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            expect(Chart).not.toHaveBeenCalled();
            expect({
                chartCalls: Chart.mock.calls.length,
                childCount: container.children.length,
            }).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should handle data with zero altitude values", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 0 }, { altitude: 0 }];
            const labels = [0, 10];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            expect(Chart).toHaveBeenCalled();
            const chartData = getLatestChartConfig().data.datasets[0].data;
            expect(chartData).toEqual([
                { x: 0, y: 0 },
                { x: 10, y: 0 },
            ]);
        });

        it("should handle fractional maxPoints calculation", () => {
            const container = document.createElement("div");
            const data = Array.from({ length: 7 }, (_, i) => ({
                altitude: 100 + i * 10,
            }));
            const labels = Array.from({ length: 7 }, (_, i) => i * 10);
            const options = {
                maxPoints: 3,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const chartData = getLatestChartConfig().data.datasets[0].data;
            // With step = Math.ceil(7/3) = 3, we get indices 0, 3, 6
            expect(chartData).toEqual([
                { x: 0, y: 100 },
                { x: 30, y: 130 },
                { x: 60, y: 160 },
            ]);
        });

        it("should skip points without matching numeric labels", () => {
            const container = document.createElement("div");
            const data = [{ altitude: 100 }, { altitude: 200 }];
            const labels = [0]; // Shorter than data array
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const chartData = getLatestChartConfig().data.datasets[0].data;
            expect(chartData).toEqual([{ x: 0, y: 100 }]);
        });

        it("should handle negative altitude values", () => {
            const container = document.createElement("div");
            const data = [{ altitude: -50 }, { altitude: 100 }];
            const labels = [0, 10];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderAltitudeProfileChart(container, data, labels, options);

            const chartData = getLatestChartConfig().data.datasets[0].data;
            expect(chartData).toEqual([
                { x: 0, y: -50 },
                { x: 10, y: 100 },
            ]);
        });
    });
});
