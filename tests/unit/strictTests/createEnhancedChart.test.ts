import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { JSDOM } from "jsdom";

// Mock Chart.js
interface ChartDatasetConfig {
    [key: string]: unknown;
    backgroundColor?: unknown;
    borderColor?: unknown;
    borderWidth?: unknown;
    data?: unknown;
    fill?: unknown;
    label?: unknown;
    pointBackgroundColor?: unknown;
    pointBorderColor?: unknown;
    pointHoverRadius?: unknown;
    pointRadius?: unknown;
    showLine?: unknown;
    tension?: unknown;
}

interface ChartConfig {
    data: {
        datasets: ChartDatasetConfig[];
    };
    options: {
        animation: Record<string, unknown>;
        plugins: {
            legend: {
                display?: unknown;
                labels: Record<string, unknown>;
            };
            title: Record<string, unknown>;
            tooltip: Record<string, unknown>;
            zoom?: Record<string, unknown>;
        };
        scales: {
            x: {
                grid: Record<string, unknown>;
                ticks: {
                    callback?: (value: number) => string;
                    [key: string]: unknown;
                };
            };
            y: {
                grid: Record<string, unknown>;
                ticks: Record<string, unknown>;
            };
        };
    };
    plugins: unknown[];
    type: string;
}

interface ChartInstanceMock {
    clear: Mock<() => void>;
    config: Record<string, unknown>;
    data: { datasets: unknown[] };
    destroy: Mock<() => void>;
    options: Record<string, unknown>;
    render: Mock<() => void>;
    reset: Mock<() => void>;
    resize: Mock<() => void>;
    stop: Mock<() => void>;
    toBase64Image: Mock<() => unknown>;
    update: Mock<() => void>;
}

interface LocalStorageMock {
    clear: Mock<() => void>;
    getItem: Mock<(key: string) => string | null>;
    removeItem: Mock<(key: string) => void>;
    setItem: Mock<(key: string, value: string) => void>;
}

type ChartConstructorMock = Mock<
    (canvas: HTMLCanvasElement, config: ChartConfig) => ChartInstanceMock
>;

type ConsoleMethod = (...data: unknown[]) => void;
type CreateEnhancedChart =
    typeof import("../../../electron-app/utils/charts/components/createEnhancedChart.js").createEnhancedChart;
type DetectCurrentTheme = () => "dark" | "light";
type ConvertTimeUnits = (value: number, units: string) => number;
type FormatTime = (value: number) => string;
type FormatTooltipWithUnits = (value: number, field: string) => string;
type GetUnitSymbol = (field: string) => string;
type HexToRgba = (hex: string, alpha: number) => string;
type GetFieldColor = (field: string) => string;
type UpdateChartAnimations = (...args: unknown[]) => void;
type TestGlobalProperty =
    | "console"
    | "document"
    | "HTMLCanvasElement"
    | "HTMLElement"
    | "localStorage"
    | "window";

let chartMock: ChartConstructorMock;
let chartInstanceMock: ChartInstanceMock;
let createEnhancedChart: CreateEnhancedChart;
let mockLocalStorage: LocalStorageMock;
const originalGlobalDescriptors = new Map<
    TestGlobalProperty,
    PropertyDescriptor
>();

function setTestGlobal(name: TestGlobalProperty, value: unknown): void {
    if (!originalGlobalDescriptors.has(name)) {
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);

        if (!descriptor) {
            throw new Error(`Expected globalThis.${name} to exist`);
        }

        originalGlobalDescriptors.set(name, descriptor);
    }

    Object.defineProperty(globalThis, name, {
        configurable: true,
        value,
        writable: true,
    });
}

function restoreTestGlobals(): void {
    for (const [name, descriptor] of [
        ...originalGlobalDescriptors.entries(),
    ].reverse()) {
        Object.defineProperty(globalThis, name, descriptor);
    }
    originalGlobalDescriptors.clear();
}

async function clearChartRuntime(): Promise<void> {
    const { clearChartRuntimeForTests } =
        await import("../../../electron-app/utils/charts/core/chartRuntime.js");

    clearChartRuntimeForTests();
}

async function registerChartRuntime(runtime: unknown): Promise<void> {
    const chartRuntimeModule =
        await import("../../../electron-app/utils/charts/core/chartRuntime.js");

    chartRuntimeModule.registerChartRuntime(
        runtime as Parameters<typeof chartRuntimeModule.registerChartRuntime>[0]
    );
}

describe("createEnhancedChart.js - Enhanced Chart Creation Utility", () => {
    beforeEach(async () => {
        // Setup console first
        setTestGlobal("console", {
            error: vi.fn<ConsoleMethod>(),
            log: vi.fn<ConsoleMethod>(),
            warn: vi.fn<ConsoleMethod>(),
        } as unknown as Console);

        // Setup JSDOM environment
        const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
            url: "http://localhost",
            pretendToBeVisual: true,
            resources: "usable",
        });

        setTestGlobal(
            "window",
            dom.window as unknown as Window & typeof globalThis
        );
        setTestGlobal("document", dom.window.document);
        setTestGlobal("HTMLCanvasElement", dom.window.HTMLCanvasElement);
        setTestGlobal("HTMLElement", dom.window.HTMLElement);

        // Mock localStorage
        mockLocalStorage = {
            clear: vi.fn<() => void>(),
            getItem: vi.fn<(key: string) => string | null>(),
            removeItem: vi.fn<(key: string) => void>(),
            setItem: vi.fn<(key: string, value: string) => void>(),
        };
        setTestGlobal("localStorage", mockLocalStorage as unknown as Storage);

        // Mock Chart.js
        chartInstanceMock = {
            data: { datasets: [] },
            options: {},
            config: {},
            clear: vi.fn<() => void>(),
            destroy: vi.fn<() => void>(),
            render: vi.fn<() => void>(),
            reset: vi.fn<() => void>(),
            resize: vi.fn<() => void>(),
            stop: vi.fn<() => void>(),
            toBase64Image: vi.fn<() => unknown>(),
            update: vi.fn<() => void>(),
        };

        chartMock = vi.fn<
            (
                canvas: HTMLCanvasElement,
                config: ChartConfig
            ) => ChartInstanceMock
        >(function ChartConstructor() {
            return chartInstanceMock;
        });
        await registerChartRuntime(chartMock);

        // Mock all dependencies
        vi.doMock(
            import("../../../electron-app/utils/charts/theming/chartThemeUtils.js"),
            () => ({
                detectCurrentTheme: vi.fn<DetectCurrentTheme>(() => "light"),
            })
        );

        vi.doMock(
            import("../../../electron-app/utils/formatting/converters/convertTimeUnits.js"),
            () => ({
                convertTimeUnits: vi.fn<ConvertTimeUnits>((value, units) => {
                    if (units === "hours") return value / 3600;
                    if (units === "minutes") return value / 60;
                    return value;
                }),
            })
        );

        vi.doMock(
            import("../../../electron-app/utils/formatting/formatters/formatTime.js"),
            () => ({
                formatTime: vi.fn<FormatTime>(
                    (value) =>
                        `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, "0")}`
                ),
            })
        );

        vi.doMock(
            import("../../../electron-app/utils/formatting/display/formatTooltipWithUnits.js"),
            () => ({
                formatTooltipWithUnits: vi.fn<FormatTooltipWithUnits>(
                    (value, field) => `${value.toFixed(2)} ${field}`
                ),
            })
        );

        vi.doMock(
            import("../../../electron-app/utils/data/lookups/getUnitSymbol.js"),
            () => ({
                getUnitSymbol: vi.fn<GetUnitSymbol>((field) => {
                    const symbols: { [key: string]: string } = {
                        distance: "km",
                        speed: "km/h",
                        altitude: "m",
                        temperature: "°C",
                        power: "W",
                        heartRate: "bpm",
                        time: "s",
                    };
                    return symbols[field] || field;
                }),
            })
        );

        vi.doMock(
            import("../../../electron-app/utils/charts/core/renderChartJS.js"),
            () => ({
                hexToRgba: vi.fn<HexToRgba>(
                    (_hex, alpha) => `rgba(255, 0, 0, ${alpha})`
                ),
            })
        );

        vi.doMock(
            import("../../../electron-app/utils/charts/theming/getFieldColor.js"),
            () => ({
                getFieldColor: vi.fn<GetFieldColor>(() => "#ff0000"),
            })
        );

        vi.doMock(
            import("../../../electron-app/utils/charts/plugins/chartZoomResetPlugin.js"),
            () => ({
                chartZoomResetPlugin: { id: "zoomReset" },
            })
        );

        vi.doMock(
            import("../../../electron-app/utils/charts/plugins/chartBackgroundColorPlugin.js"),
            () => ({
                chartBackgroundColorPlugin: { id: "backgroundColor" },
            })
        );

        vi.doMock(
            import("../../../electron-app/utils/ui/notifications/showNotification.js"),
            () => ({
                showNotification: vi.fn<ConsoleMethod>(),
            })
        );

        vi.doMock(
            import("../../../electron-app/utils/charts/core/updateChartAnimations.js"),
            () => ({
                updateChartAnimations: vi.fn<UpdateChartAnimations>(),
            })
        );

        // Import the module after mocking
        const module =
            await import("../../../electron-app/utils/charts/components/createEnhancedChart.js");
        createEnhancedChart = module.createEnhancedChart;
    });

    afterEach(async () => {
        vi.clearAllMocks();
        vi.resetAllMocks();
        await clearChartRuntime();
        vi.resetModules(); // Clear module cache
        restoreTestGlobals();
    });

    describe("basic chart creation", () => {
        it("should create a basic line chart with default options", () => {
            expect.assertions(5);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [
                    { x: 0, y: 10 },
                    { x: 1, y: 15 },
                ],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            const result = createEnhancedChart(canvas, options);

            expect(result).toBe(chartInstanceMock);
            expect(chartMock).toHaveBeenCalledOnce();
            expect(chartMock.mock.calls[0][0]).toBe(canvas);
            expect(chartMock.mock.calls[0][1].type).toBe("line");
            expect(chartMock.mock.calls[0][1].type).not.toBe("bar");
        });

        it("should create a bar chart when chartType is bar", () => {
            expect.assertions(4);

            const canvas = document.createElement("canvas");
            const options = {
                field: "power",
                chartData: [{ x: 0, y: 100 }],
                chartType: "bar",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            const result = createEnhancedChart(canvas, options);

            expect(result).toBe(chartInstanceMock);
            expect(chartMock.mock.calls[0][1].type).toBe("bar");
            const dataset = chartMock.mock.calls[0][1].data.datasets[0];
            expect(dataset.backgroundColor).toBe("#ff0000");
            expect(dataset.borderWidth).toStrictEqual(1);
        });

        it("should create a scatter chart when chartType is scatter", () => {
            expect.assertions(4);

            const canvas = document.createElement("canvas");
            const options = {
                field: "heartRate",
                chartData: [{ x: 0, y: 120 }],
                chartType: "scatter",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            const result = createEnhancedChart(canvas, options);

            expect(result).toBe(chartInstanceMock);
            expect(chartMock.mock.calls[0][1].type).toBe("scatter");
            const dataset = chartMock.mock.calls[0][1].data.datasets[0];
            expect(dataset.showLine).toStrictEqual(false);
            expect(dataset.pointRadius).toStrictEqual(4);
        });

        it("should create an area chart (line type with area styling)", () => {
            expect.assertions(4);

            const canvas = document.createElement("canvas");
            const options = {
                field: "altitude",
                chartData: [{ x: 0, y: 100 }],
                chartType: "area",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: true,
                smoothing: 50,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            const result = createEnhancedChart(canvas, options);

            expect(result).toBe(chartInstanceMock);
            expect(chartMock.mock.calls[0][1].type).toBe("line");
            const dataset = chartMock.mock.calls[0][1].data.datasets[0];
            expect(dataset.fill).toStrictEqual(true);
            expect(dataset.tension).toBe(0.5); // smoothing 50 / 100
        });
    });

    describe("dataset configuration", () => {
        it("should configure dataset with custom colors", () => {
            expect.assertions(4);

            const canvas = document.createElement("canvas");
            const customColors = { speed: "#00ff00" };
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors,
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const dataset = chartMock.mock.calls[0][1].data.datasets[0];
            expect(dataset.borderColor).toBe("#00ff00");
            expect(dataset.pointBackgroundColor).toBe("#00ff00");
            expect(dataset.pointBorderColor).toBe("#00ff00");
            expect(dataset.borderColor).not.toBe("#ff0000");
        });

        it("should configure dataset with field labels", () => {
            expect.assertions(1);

            const canvas = document.createElement("canvas");
            const fieldLabels = { speed: "Speed (Enhanced)" };
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels,
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const dataset = chartMock.mock.calls[0][1].data.datasets[0];
            expect(dataset.label).toBe("Speed (Enhanced)");
        });

        it("should configure point display based on showPoints option", () => {
            expect.assertions(2);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: false,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const dataset = chartMock.mock.calls[0][1].data.datasets[0];
            expect(dataset.pointRadius).toStrictEqual(0);
            expect(dataset.pointHoverRadius).toStrictEqual(5);
        });

        it("should configure fill based on showFill option", () => {
            expect.assertions(2);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: true,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const dataset = chartMock.mock.calls[0][1].data.datasets[0];
            expect(dataset.fill).toStrictEqual(true);
            expect(dataset.backgroundColor).toBe("rgba(255, 0, 0, 0.2)");
        });
    });

    describe("theme configuration", () => {
        it("should configure chart for light theme", async () => {
            expect.assertions(6);

            const { detectCurrentTheme } =
                await import("../../../electron-app/utils/charts/theming/chartThemeUtils.js");
            vi.mocked(detectCurrentTheme).mockReturnValue("light");

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            expect(config.options.plugins.legend.labels.color).toBe("#000");
            expect(config.options.plugins.title.color).toBe("#000");
            expect(config.options.plugins.tooltip.backgroundColor).toBe("#fff");
            expect(config.options.plugins.tooltip.titleColor).toBe("#000");
            expect(config.options.plugins.tooltip.bodyColor).toBe("#000");
            expect(config.options.plugins.tooltip.borderColor).toBe("#ddd");
        });

        it("should configure chart for dark theme", () => {
            expect.assertions(7);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "dark",
            };

            createEnhancedChart(canvas, options);

            const config =
                chartMock.mock.calls[chartMock.mock.calls.length - 1][1];
            expect(config.options.plugins.legend.labels.color).toBe("#fff");
            expect(config.options.plugins.title.color).toBe("#fff");
            expect(config.options.plugins.tooltip.backgroundColor).toBe("#222");
            expect(config.options.plugins.tooltip.titleColor).toBe("#fff");
            expect(config.options.plugins.tooltip.bodyColor).toBe("#fff");
            expect(config.options.plugins.tooltip.borderColor).toBe("#555");
            expect(config.options.plugins.tooltip.borderColor).not.toBe("#ddd");
        });

        it("should configure grid colors based on theme", () => {
            expect.assertions(6);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "dark",
            };

            createEnhancedChart(canvas, options);

            const config =
                chartMock.mock.calls[chartMock.mock.calls.length - 1][1];
            expect(config.options.scales.x.grid.color).toBe(
                "rgba(255,255,255,0.1)"
            );
            expect(config.options.scales.y.grid.color).toBe(
                "rgba(255,255,255,0.1)"
            );
            expect(config.options.scales.x.ticks.color).toBe("#fff");
            expect(config.options.scales.y.ticks.color).toBe("#fff");
            expect(config.options.scales.x.grid.display).toStrictEqual(true);
            expect(config.options.scales.y.grid.display).toStrictEqual(true);
        });
    });

    describe("plugin configuration", () => {
        it("should include required plugins", () => {
            expect.assertions(1);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            expect(config.plugins).toEqual([
                { id: "zoomReset" },
                { id: "backgroundColor" },
            ]);
        });

        it("should configure zoom plugin", () => {
            expect.assertions(1);

            const canvas = document.createElement("canvas");
            const zoomPluginConfig = {
                pan: { enabled: true },
                zoom: { wheel: { enabled: true } },
            };
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig,
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            expect(config.options.plugins.zoom).toEqual(zoomPluginConfig);
        });

        it("should configure background color plugin based on theme", () => {
            expect.assertions(4);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "dark",
            };

            createEnhancedChart(canvas, options);

            const config =
                chartMock.mock.calls[chartMock.mock.calls.length - 1][1];
            expect(
                config.options.plugins.chartBackgroundColorPlugin
            ).toHaveProperty("backgroundColor");
            expect(
                config.options.plugins.chartBackgroundColorPlugin
                    .backgroundColor
            ).toBeTypeOf("string");
            expect(
                config.options.plugins.chartBackgroundColorPlugin
                    .backgroundColor
            ).toBe("#181c24");
            expect(
                config.options.plugins.chartBackgroundColorPlugin
                    .backgroundColor
            ).not.toBe("#ffffff");
        });
    });

    describe("tooltip configuration", () => {
        it("should configure tooltip title callback", () => {
            expect.assertions(1);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            const titleCallback =
                config.options.plugins.tooltip.callbacks.title;
            const mockContext = [{ label: "Test Label" }];

            expect(titleCallback(mockContext)).toBe("Test Label");
        });

        it("should format tooltip for distance fields with unit conversion", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue("kilometers");

            const canvas = document.createElement("canvas");
            const options = {
                field: "distance",
                chartData: [{ x: 0, y: 5 }], // 5 km in chart
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: { distance: "Distance" },
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            const labelCallback =
                config.options.plugins.tooltip.callbacks.label;
            const mockContext = {
                parsed: { y: 5 }, // 5 km
                dataset: { label: "Distance" },
            };

            const result = labelCallback(mockContext);
            expect(result).toBe("Distance: 5000.00 distance"); // Converted back to meters
            expect(result).not.toBe("Distance: 5.00 distance");
        });

        it("should format tooltip for temperature fields with fahrenheit conversion", () => {
            expect.assertions(1);

            mockLocalStorage.getItem.mockReturnValue("fahrenheit");

            const canvas = document.createElement("canvas");
            const options = {
                field: "temperature",
                chartData: [{ x: 0, y: 86 }], // 86°F in chart
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: { temperature: "Temperature" },
                theme: "light",
                temperatureUnits: "fahrenheit",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            const labelCallback =
                config.options.plugins.tooltip.callbacks.label;
            const mockContext = {
                parsed: { y: 86 }, // 86°F
                dataset: { label: "Temperature" },
            };

            const result = labelCallback(mockContext);
            expect(result).toBe("Temperature: 30.00 temperature"); // Converted back to Celsius
        });

        it("should format tooltip for non-converted fields", () => {
            expect.assertions(1);

            const canvas = document.createElement("canvas");
            const options = {
                field: "power",
                chartData: [{ x: 0, y: 250 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: { power: "Power" },
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            const labelCallback =
                config.options.plugins.tooltip.callbacks.label;
            const mockContext = {
                parsed: { y: 250 },
                dataset: { label: "Power" },
            };

            const result = labelCallback(mockContext);
            expect(result).toBe("Power: 250.00 power");
        });
    });

    describe("scale configuration", () => {
        it("should configure x-axis with time formatting", () => {
            expect.assertions(3);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            expect(config.options.scales.x.type).toBe("linear");
            expect(config.options.scales.x.title.text).toBe("Time (s)");
            expect(config.options.scales.x.title.display).toStrictEqual(true);
        });

        it("should configure y-axis with field-specific formatting", () => {
            expect.assertions(2);

            const canvas = document.createElement("canvas");
            const fieldLabels = { speed: "Speed" };
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels,
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            expect(config.options.scales.y.title.text).toBe("Speed (km/h)");
            expect(config.options.scales.y.title.display).toStrictEqual(true);
        });

        it("should format x-axis ticks for different time units", () => {
            expect.assertions(1);

            mockLocalStorage.getItem.mockReturnValue("minutes");

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
                timeUnits: "minutes",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            const tickCallback = config.options.scales.x.ticks.callback;

            const result = tickCallback(120); // 120 seconds
            expect(result).toBe("2.0m"); // 2 minutes
        });

        it("should format x-axis ticks for hours", () => {
            expect.assertions(1);

            mockLocalStorage.getItem.mockReturnValue("hours");

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
                timeUnits: "hours",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            const tickCallback = config.options.scales.x.ticks.callback;

            const result = tickCallback(7200); // 7200 seconds = 2 hours
            expect(result).toBe("2.00h");
        });

        it("should format x-axis ticks for seconds using formatTime", () => {
            expect.assertions(1);

            mockLocalStorage.getItem.mockReturnValue("seconds");

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
                timeUnits: "seconds",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            const tickCallback = config.options.scales.x.ticks.callback;

            const result = tickCallback(125); // 125 seconds
            expect(result).toBe("2:05"); // 2 minutes 5 seconds
        });

        it("should hide grid when showGrid is false", () => {
            expect.assertions(3);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: false,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            expect(config.options.scales.x.grid.display).toStrictEqual(false);
            expect(config.options.scales.y.grid.display).toStrictEqual(false);
            expect(config.options.scales.x.grid.display).not.toStrictEqual(
                true
            );
        });
    });

    describe("animation configuration", () => {
        it("should configure no animation when animationStyle is none", () => {
            expect.assertions(2);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "none",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            expect(config.options.animation.duration).toStrictEqual(0);
            expect(config.options.animation.easing).toBe("linear");
        });

        it("should configure fast animation", () => {
            expect.assertions(2);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "easeInOut",
                animationStyle: "fast",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            expect(config.options.animation.duration).toStrictEqual(500);
            expect(config.options.animation.easing).toBe("easeInOut");
        });

        it("should configure slow animation", () => {
            expect.assertions(1);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "slow",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            expect(config.options.animation.duration).toStrictEqual(2000);
        });

        it("should configure normal animation", () => {
            expect.assertions(1);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            expect(config.options.animation.duration).toStrictEqual(1000);
        });

        it("should call updateChartAnimations when animation is enabled", async () => {
            expect.assertions(4);

            const { updateChartAnimations } =
                await import("../../../electron-app/utils/charts/core/updateChartAnimations.js");

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            const result = createEnhancedChart(canvas, options);

            expect(result).toBe(chartInstanceMock);
            const config =
                chartMock.mock.calls[chartMock.mock.calls.length - 1][1];
            expect(config.options.animation.duration).toStrictEqual(1000);
            expect(config.options.animation.easing).toBe("linear");
            expect(updateChartAnimations).toHaveBeenCalledWith(
                chartInstanceMock,
                "speed"
            );
        });

        it("should not call updateChartAnimations when animation is disabled", async () => {
            expect.assertions(3);

            const { updateChartAnimations } =
                await import("../../../electron-app/utils/charts/core/updateChartAnimations.js");

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "none",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            const result = createEnhancedChart(canvas, options);

            expect(result).toBe(chartInstanceMock);
            const config = chartMock.mock.calls[0][1];
            expect(config.options.animation.duration).toStrictEqual(0);
            expect(updateChartAnimations).not.toHaveBeenCalled();
        });
    });

    describe("display options", () => {
        it("should hide legend when showLegend is false", () => {
            expect.assertions(2);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: false,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            expect(config.options.plugins.legend.display).toStrictEqual(false);
            expect(config.options.plugins.title.display).not.toStrictEqual(
                false
            );
        });

        it("should hide title when showTitle is false", () => {
            expect.assertions(1);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: false,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            expect(config.options.plugins.title.display).toStrictEqual(false);
        });

        it("should set title text with field label and unit symbol", () => {
            expect.assertions(1);

            const canvas = document.createElement("canvas");
            const fieldLabels = { speed: "Velocity" };
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels,
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const config = chartMock.mock.calls[0][1];
            expect(config.options.plugins.title.text).toBe("Velocity (km/h)");
        });
    });

    describe("canvas styling", () => {
        it("should apply canvas styling", () => {
            expect.assertions(3);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            expect(canvas.style.borderRadius).toBe("12px");
            expect(canvas.style.borderRadius).not.toBe("");
            expect(canvas.style.boxShadow).toBe(
                "0 2px 16px 0 rgba(0,0,0,0.18)"
            );
        });
    });

    describe("error handling", () => {
        it("should handle Chart constructor throwing error", () => {
            expect.assertions(2);

            const chartCreationError = new Error("Chart creation failed");
            chartMock.mockImplementationOnce(function ChartConstructor() {
                throw chartCreationError;
            });

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            const result = createEnhancedChart(canvas, options);

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith(
                "[ChartJS] Error creating chart for speed:",
                chartCreationError
            );
        });

        it("should return null and log when chart creation fails", () => {
            expect.assertions(2);

            const chartCreationError = new Error("Chart creation failed");
            chartMock.mockImplementationOnce(function ChartConstructor() {
                throw chartCreationError;
            });

            const canvas = document.createElement("canvas");
            const options = {
                field: "power",
                chartData: [{ x: 0, y: 100 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            const createdChart = createEnhancedChart(canvas, options);

            expect(createdChart).toBeNull();
            expect(console.error).toHaveBeenCalledWith(
                "[ChartJS] Error creating chart for power:",
                chartCreationError
            );
        });
    });

    describe("edge cases", () => {
        it("should handle empty chartData", () => {
            expect.assertions(3);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            const result = createEnhancedChart(canvas, options);

            expect(result).toBe(chartInstanceMock);
            const dataset = chartMock.mock.calls[0][1].data.datasets[0];
            expect(dataset.data).toStrictEqual([]);
            expect(dataset.data).not.toHaveLength(1);
        });

        it("should handle maximum smoothing value", () => {
            expect.assertions(1);

            const canvas = document.createElement("canvas");
            const options = {
                field: "speed",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 100,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const dataset = chartMock.mock.calls[0][1].data.datasets[0];
            expect(dataset.tension).toBe(1.0);
        });

        it("should handle field with no label or custom color", () => {
            expect.assertions(2);

            const canvas = document.createElement("canvas");
            const options = {
                field: "unknownField",
                chartData: [{ x: 0, y: 10 }],
                chartType: "line",
                interpolation: "linear",
                animationStyle: "normal",
                showGrid: true,
                showLegend: true,
                showTitle: true,
                showPoints: true,
                showFill: false,
                smoothing: 0,
                customColors: {},
                zoomPluginConfig: {},
                fieldLabels: {},
                theme: "light",
            };

            createEnhancedChart(canvas, options);

            const dataset = chartMock.mock.calls[0][1].data.datasets[0];
            expect(dataset.label).toBe("unknownField");
            expect(dataset.borderColor).toBe("#ff0000"); // from getFieldColor mock
        });
    });
});
