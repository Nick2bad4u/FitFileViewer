import type { Mock } from "vitest";
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
    type?: string;
    [key: string]: unknown;
};

type ChartConstructor = (
    canvas: HTMLCanvasElement,
    config: ChartConfig
) => ChartInstanceMock;

type ChartConstructorMock = Mock<ChartConstructor> & {
    mock: {
        calls: [HTMLCanvasElement, ChartConfig][];
    };
};

type ChartInstanceMock = {
    clear: Mock<() => void>;
    config: Record<string, unknown>;
    data: { datasets: Array<Record<string, unknown>> };
    destroy: Mock<() => void>;
    options: Record<string, unknown>;
    render: Mock<() => void>;
    reset: Mock<() => void>;
    resize: Mock<() => void>;
    stop: Mock<() => void>;
    toBase64Image: Mock<() => string>;
    update: Mock<() => void>;
};

type ChartSettingsManagerMock = {
    getFieldVisibility: Mock<() => "hidden" | "visible">;
};

type ChartInstanceRegistryModule =
    typeof import("../../../electron-app/utils/charts/core/chartInstanceRegistry.js");

type GlobalFixtureName =
    | "document"
    | "HTMLCanvasElement"
    | "HTMLElement"
    | "localStorage"
    | "window";

type ChartTestGlobal = typeof globalThis & {
    HTMLCanvasElement?: typeof HTMLCanvasElement;
    HTMLElement?: typeof HTMLElement;
    localStorage?: StorageMock;
    window?: Window & typeof globalThis;
};

type RenderAltitudeProfileChart = (
    container: HTMLElement,
    data: readonly AltitudeDatum[],
    labels: readonly (number | string)[],
    options: AltitudeOptions
) => void;

type StorageMock = {
    clear: Mock<() => void>;
    getItem: Mock<(key: string) => null | string>;
    removeItem: Mock<(key: string) => void>;
    setItem: Mock<(key: string, value: string) => void>;
};

function getChartTestGlobal(): ChartTestGlobal {
    return globalThis as ChartTestGlobal;
}

function getLatestChartConfig(): ChartConfig {
    const config = chartMock.mock.calls[0]?.[1];
    if (!config) {
        throw new Error("Expected Chart to be called with a config");
    }
    return config;
}

function getLatestChartCall(): [HTMLCanvasElement, ChartConfig] {
    const call = chartMock.mock.calls[0];
    if (!call) {
        throw new Error("Expected Chart to be called");
    }

    return call;
}

function getRenderedCanvas(container: HTMLElement): HTMLCanvasElement {
    const canvas = container.querySelector("canvas");
    const CanvasConstructor = getChartTestGlobal().HTMLCanvasElement;

    if (!CanvasConstructor || !(canvas instanceof CanvasConstructor)) {
        throw new TypeError(
            "Expected rendered altitude profile canvas to exist"
        );
    }

    return canvas as HTMLCanvasElement;
}

// Mock Chart.js
let chartMock: ChartConstructorMock;
let chartInstanceMock: ChartInstanceMock;
let renderAltitudeProfileChart: RenderAltitudeProfileChart;
let mockLocalStorage: StorageMock;
let mockChartSettingsManager: ChartSettingsManagerMock;
let chartInstanceRegistryModule: ChartInstanceRegistryModule | undefined;
let dom: JSDOM | undefined;
const originalGlobalDescriptors = new Map<
    GlobalFixtureName,
    PropertyDescriptor
>();

async function loadChartInstanceRegistry(): Promise<ChartInstanceRegistryModule> {
    chartInstanceRegistryModule =
        await import("../../../electron-app/utils/charts/core/chartInstanceRegistry.js");
    return chartInstanceRegistryModule;
}

function clearChartInstanceRegistryForTests(): void {
    chartInstanceRegistryModule?.clearChartInstanceRegistryForTests();
}

function getRegisteredChartInstances(): unknown[] {
    return chartInstanceRegistryModule?.getRegisteredChartInstances() ?? [];
}

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

async function clearChartRuntime(): Promise<void> {
    const { clearChartRuntimeForTests } =
        await import("../../../electron-app/utils/charts/core/chartRuntime.js");

    clearChartRuntimeForTests();
}

async function registerChartRuntime(runtime: unknown): Promise<void> {
    const { setChartRuntime } =
        await import("../../../electron-app/utils/charts/core/chartRuntime.js");

    setChartRuntime(runtime);
}

describe("renderAltitudeProfileChart.js - Altitude Profile Chart Utility", () => {
    beforeEach(async () => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});

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
        };

        chartMock = vi
            .fn<ChartConstructor>()
            .mockImplementation(function ChartConstructor() {
                return chartInstanceMock;
            }) as ChartConstructorMock;
        vi.doMock(import("chart.js/auto"), () => ({
            default: chartMock,
        }));
        await registerChartRuntime(chartMock);
        await loadChartInstanceRegistry();
        clearChartInstanceRegistryForTests();

        // Mock all dependencies
        mockChartSettingsManager = {
            getFieldVisibility: vi.fn<() => "hidden" | "visible">(
                () => "visible"
            ),
        };
        vi.doMock(
            import("../../../electron-app/utils/charts/core/renderChartJS.js"),
            () => ({
                chartSettingsManager: mockChartSettingsManager,
            })
        );

        vi.doMock(
            import("../../../electron-app/utils/theming/core/theme.js"),
            () => ({
                getThemeConfig: vi.fn<() => Record<string, unknown>>(() => ({
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
            })
        );

        vi.doMock(
            import("../../../electron-app/utils/charts/components/createChartCanvas.js"),
            () => ({
                createChartCanvas: vi.fn<
                    (field: string, index: number) => HTMLCanvasElement
                >((field, index) => {
                    const canvas = document.createElement("canvas");
                    canvas.id = `chart-${field}-${index}`;
                    return canvas;
                }),
            })
        );

        vi.doMock(
            import("../../../electron-app/utils/formatting/formatters/formatTime.js"),
            () => ({
                formatTime: vi.fn<(value: number, short?: boolean) => string>(
                    (value, short) => {
                        const minutes = Math.floor(value / 60);
                        const seconds = Math.floor(value % 60);
                        return short
                            ? `${minutes}:${seconds.toString().padStart(2, "0")}`
                            : `${minutes}:${seconds.toString().padStart(2, "0")}`;
                    }
                ),
            })
        );

        vi.doMock(
            import("../../../electron-app/utils/data/lookups/getUnitSymbol.js"),
            () => ({
                getUnitSymbol: vi.fn<(field: string, type: string) => string>(
                    (field, type) => {
                        if (field === "time" && type === "time") return "s";
                        return "m";
                    }
                ),
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

        // Import the module after mocking
        const module =
            await import("../../../electron-app/utils/charts/rendering/renderAltitudeProfileChart.js");
        renderAltitudeProfileChart = module.renderAltitudeProfileChart;
    });

    afterEach(async () => {
        clearChartInstanceRegistryForTests();
        await clearChartRuntime();

        vi.clearAllMocks();
        vi.resetAllMocks();
        vi.resetModules();
        dom?.window.close();
        dom = undefined;
        restoreGlobalValues();
        vi.restoreAllMocks();
    });

    describe("data validation and processing", () => {
        it("should return early when data has no altitude values", () => {
            expect.assertions(2);

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

            expect(chartMock).not.toHaveBeenCalled();
            expect({
                chartCalls: chartMock.mock.calls.length,
                childCount: container.children.length,
            }).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should return early when field visibility is hidden (handled by chart state manager)", () => {
            expect.assertions(2);

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

            expect(chartMock).not.toHaveBeenCalled();
            expect({
                chartCalls: chartMock.mock.calls.length,
                childCount: container.children.length,
            }).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should process data correctly with valid altitude values", () => {
            expect.assertions(2);

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

            const [canvas] = getLatestChartCall();
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            const chartData = getLatestChartConfig().data.datasets[0].data;
            expect(chartData).toEqual([
                { x: 0, y: 100 },
                { x: 10, y: 150 },
                { x: 20, y: 200 },
            ]);
        });

        it("should handle enhancedAltitude preference over altitude", () => {
            expect.assertions(1);

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
            expect.assertions(2);

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

            expect(chartMock).not.toHaveBeenCalled();
            expect({
                chartCalls: chartMock.mock.calls.length,
                childCount: container.children.length,
            }).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should handle mixed valid and invalid altitude values", () => {
            expect.assertions(1);

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

    describe("data point limiting", () => {
        it("should apply data point limiting when maxPoints is exceeded", () => {
            expect.assertions(3);

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
            expect(chartData).not.toHaveLength(data.length);
            // With step = Math.ceil(10/3) = 4, we get indices 0, 4, 8
            expect(chartData).toEqual([
                { x: 0, y: 100 },
                { x: 40, y: 140 },
                { x: 80, y: 180 },
            ]);
        });

        it("should not limit data when maxPoints is 'all'", () => {
            expect.assertions(1);

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
            expect.assertions(1);

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

    describe("chart configuration", () => {
        it("should create line chart with correct type and configuration", () => {
            expect.assertions(4);

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

            const [canvas] = getLatestChartCall();
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
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
            expect.assertions(1);

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
            expect.assertions(1);

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
            expect.assertions(1);

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
            expect.assertions(4);

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
            expect.assertions(1);

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

    describe("canvas creation and styling", () => {
        it("should create canvas with correct ID and styling", () => {
            expect.assertions(5);

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

            const view = getRenderedCanvas(container);
            expect(view.tagName.toLowerCase()).toBe("canvas");
            expect(view.id).toBe("chart-altitude-profile-0");
            expect(view.id).not.toBe("chart-altitude-0");
            expect({
                borderRadius: view.style.borderRadius,
                childCount: container.children.length,
            }).toStrictEqual({
                borderRadius: "12px",
                childCount: 1,
            });
            expect(view.style.background).toMatch(
                /(#ffffff|rgb\(255,\s*255,\s*255\))/
            );
        });

        it("should append canvas to container", () => {
            expect.assertions(2);

            const container = document.createElement("div");
            const data = [{ altitude: 100 }];
            const labels = [0];
            const options = {
                maxPoints: 1000,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            expect(container.children).toHaveLength(0);

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
            expect.assertions(2);

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

            const view = getRenderedCanvas(container);
            expect(view.style.background).toMatch(
                /(#ffffff|rgb\(255,\s*255,\s*255\))/
            );
            expect(view.style.boxShadow).toBe("0 2px 16px 0 #00000020");
        });
    });

    describe("chart instance management", () => {
        it("should register chart instance", () => {
            expect.assertions(3);

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

            expect(getRegisteredChartInstances()).not.toContain(undefined);
            expect(getRegisteredChartInstances()).toContain(chartInstanceMock);
            expect(getRegisteredChartInstances()).toStrictEqual([
                chartInstanceMock,
            ]);
        });

        it("should register chart instance when the registry starts empty", () => {
            expect.assertions(2);

            clearChartInstanceRegistryForTests();

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

            expect(getRegisteredChartInstances()).toEqual([chartInstanceMock]);
            expect(getRegisteredChartInstances()).toContain(chartInstanceMock);
        });

        it("should log success message when chart is created", () => {
            expect.assertions(2);

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

            expect(getRenderedCanvas(container).tagName.toLowerCase()).toBe(
                "canvas"
            );
            expect(console.log).toHaveBeenCalledWith(
                "[ChartJS] Altitude Profile chart created successfully"
            );
        });
    });

    describe("tooltip configuration", () => {
        it("should configure tooltip with altitude and time formatting", () => {
            expect.assertions(2);

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
            expect.assertions(1);

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
            expect.assertions(1);

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

    describe("plugin configuration", () => {
        it("should include chartZoomResetPlugin and chartBackgroundColorPlugin", () => {
            expect.assertions(2);

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
            expect(config.plugins.map((plugin) => plugin.id)).not.toStrictEqual(
                ["zoomReset", "unknownPlugin"]
            );
        });

        it("should configure chartBackgroundColorPlugin with theme colors", () => {
            expect.assertions(1);

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
            expect.assertions(1);

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

    describe("scale configuration", () => {
        it("should configure x-axis with time formatting callback", () => {
            expect.assertions(2);

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
            expect.assertions(4);

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

    describe("error handling", () => {
        it("should handle Chart.js constructor throwing error", () => {
            expect.assertions(3);

            const chartCreationError = new Error("Chart creation failed");
            chartMock.mockImplementationOnce(function ChartConstructor() {
                throw chartCreationError;
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

            renderAltitudeProfileChart(container, data, labels, options);

            expect(console.error).toHaveBeenCalledWith(
                "[ChartJS] Error rendering altitude profile chart:",
                chartCreationError
            );
            expect(getRegisteredChartInstances()).toStrictEqual([]);
            expect(
                [...container.children].map((child) => child.tagName)
            ).toEqual(["CANVAS"]);
        });
    });

    describe("edge cases", () => {
        it("should handle empty data array", () => {
            expect.assertions(2);

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

            expect(chartMock).not.toHaveBeenCalled();
            expect({
                chartCalls: chartMock.mock.calls.length,
                childCount: container.children.length,
            }).toStrictEqual({
                chartCalls: 0,
                childCount: 0,
            });
        });

        it("should handle data with zero altitude values", () => {
            expect.assertions(2);

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

            const [canvas] = getLatestChartCall();
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            const chartData = getLatestChartConfig().data.datasets[0].data;
            expect(chartData).toEqual([
                { x: 0, y: 0 },
                { x: 10, y: 0 },
            ]);
        });

        it("should handle fractional maxPoints calculation", () => {
            expect.assertions(1);

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
            expect.assertions(1);

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
            expect.assertions(1);

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
