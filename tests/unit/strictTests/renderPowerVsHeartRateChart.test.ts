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
import {
    clearChartInstanceRegistryForTests,
    getRegisteredChartInstances,
} from "../../../electron-app/utils/charts/core/chartInstanceRegistry.js";
import {
    clearChartRuntimeForTests,
    registerChartRuntime,
} from "../../../electron-app/utils/charts/core/chartRuntime.js";
import { chartSettingsManager } from "../../../electron-app/utils/charts/core/renderChartJS.js";

const chartJsMocks = vi.hoisted(() => ({
    Chart: vi.fn<ChartConstructorFunction>(),
}));

vi.mock(import("chart.js/auto"), () => ({
    default: chartJsMocks.Chart,
}));

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

type GlobalFixtureName =
    | "document"
    | "HTMLCanvasElement"
    | "HTMLElement"
    | "localStorage"
    | "window";

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

function getRequiredChartInstances(): ChartInstanceMock[] {
    const chartInstances = getRegisteredChartInstances() as ChartInstanceMock[];

    if (chartInstances.length === 0) {
        throw new Error("Expected Chart.js instances to be tracked");
    }

    return chartInstances;
}

function getLatestChartConfig(): ChartConfig {
    const config = chartMock.mock.calls[0]?.[1];
    if (!config) {
        throw new Error("Expected Chart to be called with a config");
    }
    return config;
}

function getRequiredDatasetData(dataset: ChartDataset): unknown[] {
    const { data } = dataset;

    if (!data) {
        throw new Error("Expected chart dataset data");
    }

    return data;
}

function getLatestChartCall(): [HTMLCanvasElement, ChartConfig] {
    const call = chartMock.mock.calls[0];
    if (!call) {
        throw new Error("Expected Chart to be called");
    }

    return call;
}

function getRenderState(container: HTMLElement): {
    chartCalls: number;
    childCount: number;
} {
    return {
        chartCalls: chartMock.mock.calls.length,
        childCount: container.children.length,
    };
}

// Mock Chart.js
let chartMock: ChartConstructorMock;
let chartInstanceMock: ChartInstanceMock;
let renderPowerVsHeartRateChart: RenderPowerVsHeartRateChart;
let mockLocalStorage: StorageMock;
let dom: JSDOM | undefined;
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

describe("renderPowerVsHeartRateChart.js - power vs heart rate chart utility", () => {
    beforeEach(async () => {
        // Setup JSDOM environment
        dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
            url: "http://localhost",
            pretendToBeVisual: true,
            resources: "usable",
        });

        setGlobalValue(
            "window",
            dom.window as unknown as Window & typeof globalThis
        );
        setGlobalValue("document", dom.window.document);
        setGlobalValue(
            "HTMLCanvasElement",
            dom.window.HTMLCanvasElement as unknown as typeof HTMLCanvasElement
        );
        setGlobalValue(
            "HTMLElement",
            dom.window.HTMLElement as unknown as typeof HTMLElement
        );
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});

        // Mock localStorage
        mockLocalStorage = {
            getItem: vi.fn<(key: string) => null | string>(),
            setItem: vi.fn<(key: string, value: string) => void>(),
            removeItem: vi.fn<(key: string) => void>(),
            clear: vi.fn<() => void>(),
        };
        setGlobalValue("localStorage", mockLocalStorage);

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

        chartMock = chartJsMocks.Chart as ChartConstructorMock;
        chartMock.mockReset();
        chartMock.mockImplementation(function ChartConstructor() {
            return chartInstanceMock;
        });
        registerChartRuntime(chartMock);
        clearChartInstanceRegistryForTests();

        // Load the module dynamically with fresh imports
        const module =
            await import("../../../electron-app/utils/charts/rendering/renderPowerVsHeartRateChart.js");
        renderPowerVsHeartRateChart = module.renderPowerVsHeartRateChart;
    });

    afterEach(() => {
        vi.clearAllMocks();
        clearChartInstanceRegistryForTests();
        clearChartRuntimeForTests();

        dom?.window.close();
        dom = undefined;
        restoreGlobalValues();
        vi.restoreAllMocks();
    });

    describe("data validation and processing", () => {
        it("should return early when data has no power values", () => {
            expect.assertions(2);

            const container = document.createElement("div");
            const data = [
                { heartRate: 120 },
                { heartRate: 130 },
                { heartRate: 140 },
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(chartMock).not.toHaveBeenCalled();
            expect(getRenderState(container)).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should return early when data has no heart rate values", () => {
            expect.assertions(2);

            const container = document.createElement("div");
            const data = [
                { power: 200 },
                { power: 250 },
                { power: 300 },
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(chartMock).not.toHaveBeenCalled();
            expect(getRenderState(container)).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should return early when field visibility is hidden", () => {
            expect.assertions(3);

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
            expect(chartMock).not.toHaveBeenCalled();
            expect(getRenderState(container)).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should process data correctly with valid power and heart rate values", () => {
            expect.assertions(2);

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

            const [canvas] = getLatestChartCall();
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 120, y: 200 },
                { x: 130, y: 250 },
                { x: 135, y: 275 },
            ]);
        });

        it("should return early when no valid data points exist after filtering", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: null, heartRate: 120 },
                { power: 250, heartRate: null },
                { power: undefined, heartRate: undefined },
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(chartMock).not.toHaveBeenCalled();
            expect(getRenderState(container)).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });
    });

    describe("data point limiting", () => {
        it("should apply data point limiting when maxPoints is exceeded", () => {
            expect.assertions(3);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [];
            for (let i = 0; i < 1000; i++) {
                data.push({ power: 200 + i, heartRate: 120 + (i % 50) });
            }
            const options = { maxPoints: 100, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            const [canvas] = getLatestChartCall();
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            const chartConfig = getLatestChartConfig();
            expect(
                chartConfig.data.datasets[0].data.length
            ).toBeLessThanOrEqual(100);
            expect(chartConfig.data.datasets[0].data).not.toHaveLength(
                data.length
            );
        });

        it("should not limit data when maxPoints is 'all'", () => {
            expect.assertions(3);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [];
            for (let i = 0; i < 50; i++) {
                data.push({ power: 200 + i, heartRate: 120 + i });
            }
            const options = { maxPoints: "all", showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            const [canvas] = getLatestChartCall();
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            const chartConfig = getLatestChartConfig();
            const datasetData = getRequiredDatasetData(
                chartConfig.data.datasets[0]
            );
            expect(datasetData).toHaveLength(50);
            expect(datasetData.at(-1)).toStrictEqual({
                x: 169,
                y: 249,
            });
        });

        it("should not limit data when data length is less than maxPoints", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 200, heartRate: 120 },
                { power: 250, heartRate: 130 },
                { power: 275, heartRate: 135 },
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            const [canvas] = getLatestChartCall();
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toStrictEqual([
                { x: 120, y: 200 },
                { x: 130, y: 250 },
                { x: 135, y: 275 },
            ]);
        });
    });

    describe("chart canvas creation and styling", () => {
        it("should create canvas with correct ID and styling", () => {
            expect.assertions(3);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            const canvas = container.children[0] as HTMLCanvasElement;
            expect({
                childCount: container.children.length,
                id: canvas.id,
                tagName: canvas.tagName,
            }).toStrictEqual({
                childCount: 1,
                id: "chart-power-vs-hr-0",
                tagName: "CANVAS",
            });
            expect(canvas.id).not.toBe("chart-speed-vs-distance-0");
            expect(canvas.style.borderRadius).toBe("12px");
        });

        it("should apply theme background and shadow to canvas", () => {
            expect.assertions(1);

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

    describe("chart configuration", () => {
        it("should create scatter chart with correct basic configuration", () => {
            expect.assertions(6);

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

            const [canvas] = getLatestChartCall();
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            const chartConfig = getLatestChartConfig();

            expect(chartConfig.type).toBe("scatter");
            expect(chartConfig.type).not.toBe("line");
            expect(chartConfig.data.datasets).toHaveLength(1);
            expect(chartConfig.data.datasets[0].label).toBe(
                "Power vs Heart Rate"
            );
            expect({
                maintainAspectRatio: chartConfig.options.maintainAspectRatio,
                responsive: chartConfig.options.responsive,
            }).toStrictEqual({
                maintainAspectRatio: false,
                responsive: true,
            });
        });

        it("should configure legend display based on options", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];

            // Test with legend enabled
            const optionsWithLegend = { maxPoints: 1000, showLegend: true };
            renderPowerVsHeartRateChart(container, data, optionsWithLegend);

            let chartConfig = getLatestChartConfig();
            expect({
                display: chartConfig.options.plugins.legend.display,
                labels: {
                    color: chartConfig.options.plugins.legend.labels.color,
                },
            }).toStrictEqual({
                display: true,
                labels: { color: "#fff" },
            });

            chartMock.mockClear();
            container.innerHTML = "";

            // Test with legend disabled
            const optionsWithoutLegend = { maxPoints: 1000, showLegend: false };
            renderPowerVsHeartRateChart(container, data, optionsWithoutLegend);

            chartConfig = getLatestChartConfig();
            expect({
                display: chartConfig.options.plugins.legend.display,
                labels: {
                    color: chartConfig.options.plugins.legend.labels.color,
                },
            }).toStrictEqual({
                display: false,
                labels: { color: "#fff" },
            });
        });

        it("should configure title display based on options", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];

            // Test with title enabled
            const optionsWithTitle = { maxPoints: 1000, showTitle: true };
            renderPowerVsHeartRateChart(container, data, optionsWithTitle);

            let chartConfig = getLatestChartConfig();
            expect({
                display: chartConfig.options.plugins.title.display,
                text: chartConfig.options.plugins.title.text,
            }).toStrictEqual({
                display: true,
                text: "Power vs Heart Rate",
            });

            chartMock.mockClear();
            container.innerHTML = "";

            // Test with title disabled
            const optionsWithoutTitle = { maxPoints: 1000, showTitle: false };
            renderPowerVsHeartRateChart(container, data, optionsWithoutTitle);

            chartConfig = getLatestChartConfig();
            expect({
                display: chartConfig.options.plugins.title.display,
                text: chartConfig.options.plugins.title.text,
            }).toStrictEqual({
                display: false,
                text: "Power vs Heart Rate",
            });
        });

        it("should configure grid display based on options", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];

            // Test with grid enabled
            const optionsWithGrid = { maxPoints: 1000, showGrid: true };
            renderPowerVsHeartRateChart(container, data, optionsWithGrid);

            let chartConfig = getLatestChartConfig();
            expect({
                xGrid: chartConfig.options.scales.x.grid.display,
                yGrid: chartConfig.options.scales.y.grid.display,
            }).toStrictEqual({
                xGrid: true,
                yGrid: true,
            });

            chartMock.mockClear();
            container.innerHTML = "";

            // Test with grid disabled
            const optionsWithoutGrid = { maxPoints: 1000, showGrid: false };
            renderPowerVsHeartRateChart(container, data, optionsWithoutGrid);

            chartConfig = getLatestChartConfig();
            expect({
                xGrid: chartConfig.options.scales.x.grid.display,
                yGrid: chartConfig.options.scales.y.grid.display,
            }).toStrictEqual({
                xGrid: false,
                yGrid: false,
            });
        });

        it("should configure point radius based on showPoints option", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];

            // Test with points shown
            const optionsWithPoints = { maxPoints: 1000, showPoints: true };
            renderPowerVsHeartRateChart(container, data, optionsWithPoints);

            let chartConfig = getLatestChartConfig();
            expect({
                pointHoverRadius: chartConfig.data.datasets[0].pointHoverRadius,
                pointRadius: chartConfig.data.datasets[0].pointRadius,
            }).toStrictEqual({
                pointHoverRadius: 4,
                pointRadius: 2,
            });

            chartMock.mockClear();
            container.innerHTML = "";

            // Test with points hidden
            const optionsWithoutPoints = { maxPoints: 1000, showPoints: false };
            renderPowerVsHeartRateChart(container, data, optionsWithoutPoints);

            chartConfig = getLatestChartConfig();
            expect({
                pointHoverRadius: chartConfig.data.datasets[0].pointHoverRadius,
                pointRadius: chartConfig.data.datasets[0].pointRadius,
            }).toStrictEqual({
                pointHoverRadius: 4,
                pointRadius: 1,
            });
        });
    });

    describe("scales configuration", () => {
        it("should configure x-axis for heart rate", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000, showGrid: true };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect({
                display: chartConfig.options.scales.x.display,
                title: {
                    display: chartConfig.options.scales.x.title.display,
                    text: chartConfig.options.scales.x.title.text,
                },
                type: chartConfig.options.scales.x.type,
            }).toStrictEqual({
                display: true,
                title: {
                    display: true,
                    text: "Heart Rate (bpm)",
                },
                type: "linear",
            });
            expect(chartConfig.options.scales.x.title.text).not.toBe(
                "Power (W)"
            );
        });

        it("should configure y-axis for power", () => {
            expect.assertions(1);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000, showGrid: true };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect({
                display: chartConfig.options.scales.y.display,
                title: {
                    display: chartConfig.options.scales.y.title.display,
                    text: chartConfig.options.scales.y.title.text,
                },
                type: chartConfig.options.scales.y.type,
            }).toStrictEqual({
                display: true,
                title: {
                    display: true,
                    text: "Power (W)",
                },
                type: "linear",
            });
        });
    });

    describe("zoom and pan configuration", () => {
        it("should configure zoom plugin with correct settings", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            const zoomConfig = chartConfig.options.plugins.zoom;

            expect({
                limits: zoomConfig.limits,
                pan: zoomConfig.pan,
                zoom: {
                    drag: zoomConfig.zoom.drag,
                    mode: zoomConfig.zoom.mode,
                    pinch: zoomConfig.zoom.pinch,
                    wheel: zoomConfig.zoom.wheel,
                },
            }).toStrictEqual({
                limits: {
                    x: {
                        max: "original",
                        min: "original",
                    },
                    y: {
                        max: "original",
                        min: "original",
                    },
                },
                pan: {
                    enabled: true,
                    mode: "xy",
                    modifierKey: null,
                },
                zoom: {
                    drag: {
                        backgroundColor: "#667eea80",
                        borderColor: "#667eeaCC",
                        borderWidth: 2,
                        enabled: true,
                        modifierKey: "shift",
                    },
                    mode: "xy",
                    pinch: {
                        enabled: true,
                    },
                    wheel: {
                        enabled: true,
                        modifierKey: "ctrl",
                        speed: 0.1,
                    },
                },
            });
            expect(zoomConfig.zoom.wheel.modifierKey).not.toBe("shift");
        });
    });

    describe("tooltip configuration", () => {
        it("should configure tooltip with custom label callback", () => {
            expect.assertions(3);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            const tooltipConfig = chartConfig.options.plugins.tooltip;

            expect({
                borderWidth: tooltipConfig.borderWidth,
                labelType: typeof tooltipConfig.callbacks.label,
            }).toStrictEqual({
                borderWidth: 1,
                labelType: "function",
            });

            // Test tooltip callback
            const mockContext = {
                parsed: { x: 140, y: 280 },
            };
            const result = tooltipConfig.callbacks.label(mockContext);
            expect(result).toEqual(["Heart Rate: 140 bpm", "Power: 280 W"]);
            expect(result).not.toContain("Speed: 140 mph");
        });
    });

    describe("plugin integration", () => {
        it("should include required plugins in configuration", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect(
                chartConfig.plugins?.map((plugin) =>
                    typeof plugin === "object" &&
                    plugin !== null &&
                    "id" in plugin
                        ? plugin.id
                        : plugin
                )
            ).toStrictEqual([
                "chartZoomResetPlugin",
                "chartBackgroundColorPlugin",
            ]);
            expect(chartConfig.plugins).not.toContain("zoomReset");
        });

        it("should configure background color plugin", () => {
            expect.assertions(1);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = getLatestChartConfig();
            expect(
                chartConfig.options.plugins.chartBackgroundColorPlugin
            ).toStrictEqual({
                backgroundColor: "#181c24",
            });
        });
    });

    describe("chart instance management", () => {
        it("should track chart instance in global array", () => {
            expect.assertions(3);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            const chartInstances = getRequiredChartInstances();
            expect(chartInstances).toStrictEqual([chartInstanceMock]);
            expect(chartInstances).not.toContain(undefined);
            expect(chartInstances.at(0)).toBe(chartInstanceMock);
        });

        it("should register chart instance when the registry starts empty", () => {
            expect.assertions(1);

            mockLocalStorage.getItem.mockReturnValue(null);
            clearChartInstanceRegistryForTests();

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(getRegisteredChartInstances()).toStrictEqual([
                chartInstanceMock,
            ]);
        });

        it("should log success message when chart is created", () => {
            expect.assertions(2);

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

    describe("error handling", () => {
        it("should handle errors gracefully and log error message", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue(null);
            const chartCreationError = new Error("Chart creation failed");
            chartMock.mockImplementation(function ChartConstructor() {
                throw chartCreationError;
            });

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(console.error).toHaveBeenCalledWith(
                "[ChartJS] Error rendering power vs heart rate chart:",
                chartCreationError
            );
            expect(getRegisteredChartInstances()).toStrictEqual([]);
        });
    });

    describe("edge cases and boundary conditions", () => {
        it("should handle empty data array", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data: PowerHeartRateDatum[] = [];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(chartMock).not.toHaveBeenCalled();
            expect(getRenderState(container)).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should handle data with zero power values", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 0, heartRate: 120 },
                { power: 0, heartRate: 130 },
            ];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            const [canvas] = getLatestChartCall();
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 120, y: 0 },
                { x: 130, y: 0 },
            ]);
        });

        it("should handle data with zero heart rate values", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 200, heartRate: 0 },
                { power: 250, heartRate: 0 },
            ];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            const [canvas] = getLatestChartCall();
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 0, y: 200 },
                { x: 0, y: 250 },
            ]);
        });

        it("should handle very large datasets efficiently", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data: PowerHeartRateDatum[] = [];
            for (let i = 0; i < 10000; i++) {
                data.push({ power: 200 + i, heartRate: 120 + (i % 100) });
            }
            const options = { maxPoints: 500 };

            renderPowerVsHeartRateChart(container, data, options);

            const [canvas] = getLatestChartCall();
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            const chartConfig = getLatestChartConfig();
            expect(
                chartConfig.data.datasets[0].data.length
            ).toBeLessThanOrEqual(500);
        });

        it("should handle mixed valid and invalid data points", () => {
            expect.assertions(2);

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

            const [canvas] = getLatestChartCall();
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
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

    describe("performance and optimization", () => {
        it("should handle rapid successive chart creations", () => {
            expect.assertions(2);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            for (let i = 0; i < 5; i++) {
                renderPowerVsHeartRateChart(container, data, options);
            }

            expect(chartMock).toHaveBeenCalledTimes(5);
            expect(getRegisteredChartInstances()).toHaveLength(5);
        });

        it("should not modify original data array", () => {
            expect.assertions(2);

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

    describe("integration with dependencies", () => {
        it("should use fallback colors when theme configuration is missing", () => {
            expect.assertions(4);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(chartMock).toHaveBeenCalledOnce();
            expect(container.children).toHaveLength(1);
            expect(container.children[0].tagName).toBe("CANVAS");
            const fallbackDataset = getLatestChartConfig().data.datasets[0];
            expect({
                backgroundColor: fallbackDataset.backgroundColor,
                borderColor: fallbackDataset.borderColor,
                data: fallbackDataset.data,
            }).toStrictEqual({
                backgroundColor: "#f59e0b99",
                borderColor: "#f59e0b",
                data: [{ x: 120, y: 200 }],
            });
        });

        it("should call createChartCanvas with correct parameters", () => {
            expect.assertions(1);

            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            // Verify canvas was created and added to container
            expect({
                childCount: container.children.length,
                id: container.children[0]?.id,
                tagName: container.children[0]?.tagName,
            }).toStrictEqual({
                childCount: 1,
                id: "chart-power-vs-hr-0",
                tagName: "CANVAS",
            });
        });
    });

    describe("real-world usage scenarios", () => {
        it("should handle typical cycling power and heart rate data", () => {
            expect.assertions(4);

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

            const [canvas] = getLatestChartCall();
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
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
            expect.assertions(2);

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

            const [canvas] = getLatestChartCall();
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            const chartConfig = getLatestChartConfig();
            expect(chartConfig.data.datasets[0].data).toStrictEqual([
                { x: 130, y: 200 },
                { x: 165, y: 450 },
                { x: 125, y: 180 },
                { x: 155, y: 350 },
                { x: 115, y: 160 },
            ]);
        });
    });
});
