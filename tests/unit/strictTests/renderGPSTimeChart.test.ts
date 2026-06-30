import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import { clearChartInstanceRegistryForTests } from "../../../electron-app/utils/charts/core/chartInstanceRegistry.js";

type ChartConfig = {
    data: {
        datasets: Array<{
            data: GPSTimePoint[];
            pointRadius?: number;
            [key: string]: unknown;
        }>;
    };
    options: {
        plugins: {
            legend: {
                display: boolean;
            };
            tooltip: {
                callbacks: {
                    label: (context: GPSTimeTooltipContext) => string[];
                    title: (
                        context: readonly { raw: GPSTimePoint }[]
                    ) => string;
                };
            };
        };
        scales: {
            x: {
                grid: {
                    display: boolean;
                };
            };
        };
    };
    plugins: unknown[];
};

type ChartConstructorMock = ReturnType<typeof vi.fn> & {
    mock: {
        calls: [HTMLCanvasElement, ChartConfig][];
    };
};

type ChartInstanceMock = {
    destroy: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
};

type GPSTimeDatum = {
    positionLat: null | number;
    positionLong: null | number;
    timestamp: null | string;
};

type GPSTimeOptions = {
    maxPoints: "all" | number;
    showGrid?: boolean;
    showLegend?: boolean;
    showPoints?: boolean;
    showTitle?: boolean;
};

type GPSTimePoint = {
    elapsedSeconds: number;
    pointIndex: number;
    timestamp: Date | number | string;
    x: number;
    y: number;
};

type GPSTimeTestGlobal = typeof globalThis & {
    HTMLCanvasElement?: typeof HTMLCanvasElement;
    HTMLElement?: typeof HTMLElement;
    localStorage?: StorageMock;
    window?: Window & typeof globalThis;
};

type GPSTimeTooltipContext = {
    datasetIndex: number;
    raw: GPSTimePoint;
};

type RenderGPSTimeChart = (
    container: HTMLElement,
    data: readonly GPSTimeDatum[],
    options: GPSTimeOptions
) => void;

type StorageMock = {
    clear: ReturnType<typeof vi.fn>;
    getItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
};

function getGPSTimeGlobal(): GPSTimeTestGlobal {
    return globalThis as GPSTimeTestGlobal;
}

function getLatestChartConfig(): ChartConfig {
    const config = chartMock.mock.calls[0]?.[1];
    if (!config) {
        throw new Error("Expected Chart to be called with a config");
    }
    return config;
}

function getRenderedCanvas(container: HTMLElement): HTMLCanvasElement {
    const canvas = container.querySelector("canvas");
    const CanvasConstructor = getGPSTimeGlobal().HTMLCanvasElement;

    if (!CanvasConstructor || !(canvas instanceof CanvasConstructor)) {
        throw new TypeError("Expected rendered GPS time canvas to exist");
    }

    return canvas as HTMLCanvasElement;
}

let renderGPSTimeChart: RenderGPSTimeChart;
let chartMock: ChartConstructorMock;
let chartInstanceMock: ChartInstanceMock;
let mockLocalStorage: StorageMock;
let mockChartSettingsManager: { getFieldVisibility: ReturnType<typeof vi.fn> };
let getThemeConfigMock: ReturnType<typeof vi.fn>;
let createChartCanvasMock: ReturnType<typeof vi.fn>;

const MOCK_COLORS = {
    bgPrimary: "#101010",
    chartBackground: "#111111",
    chartSurface: "#1c1c1c",
    chartBorder: "#333333",
    gridLines: "#222222",
    primary: "#1677ff",
    primaryAlpha: "rgba(22, 119, 255, 0.25)",
    success: "#13c2c2",
    successAlpha: "rgba(19, 194, 194, 0.2)",
    shadow: "0 2px 16px rgba(0,0,0,0.2)",
    text: "#f5f5f5",
    textPrimary: "#e8e8e8",
};

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

describe("renderGPSTimeChart.js - GPS Position vs Time Chart Utility", () => {
    beforeEach(async () => {
        vi.resetModules();

        const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
            url: "http://localhost",
            pretendToBeVisual: true,
            resources: "usable",
        });

        getGPSTimeGlobal().window = dom.window as unknown as Window &
            typeof globalThis;
        getGPSTimeGlobal().document = dom.window.document;
        getGPSTimeGlobal().HTMLCanvasElement = dom.window
            .HTMLCanvasElement as unknown as typeof HTMLCanvasElement;
        getGPSTimeGlobal().HTMLElement = dom.window
            .HTMLElement as unknown as typeof HTMLElement;

        getGPSTimeGlobal().console = {
            log: vi.fn<(...data: unknown[]) => void>(),
            error: vi.fn<(...data: unknown[]) => void>(),
            warn: vi.fn<(...data: unknown[]) => void>(),
        } as unknown as Console;

        mockLocalStorage = {
            getItem: vi.fn<() => null>(() => null),
            setItem: vi.fn<(key: string, value: string) => void>(),
            removeItem: vi.fn<(key: string) => void>(),
            clear: vi.fn<() => void>(),
        };
        getGPSTimeGlobal().localStorage = mockLocalStorage;

        chartInstanceMock = {
            destroy: vi.fn<() => void>(),
            update: vi.fn<() => void>(),
        };

        chartMock = vi.fn<() => ChartInstanceMock>(function ChartConstructor() {
            return chartInstanceMock;
        }) as ChartConstructorMock;
        vi.doMock(import("chart.js/auto"), () => ({
            default: chartMock,
        }));
        await registerChartRuntime(chartMock);
        clearChartInstanceRegistryForTests();

        createChartCanvasMock = vi.fn<() => HTMLCanvasElement>(() =>
            document.createElement("canvas")
        );
        getThemeConfigMock = vi.fn<() => { colors: typeof MOCK_COLORS }>(
            () => ({
                colors: MOCK_COLORS,
            })
        );
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
                getThemeConfig: getThemeConfigMock,
            })
        );
        vi.doMock(
            import("../../../electron-app/utils/charts/components/createChartCanvas.js"),
            () => ({
                createChartCanvas: createChartCanvasMock,
            })
        );
        vi.doMock(
            import("../../../electron-app/utils/charts/plugins/chartZoomResetPlugin.js"),
            () => ({
                chartZoomResetPlugin: { id: "zoom-reset" },
            })
        );

        const module =
            await import("../../../electron-app/utils/charts/rendering/renderGPSTimeChart.js");
        renderGPSTimeChart = module.renderGPSTimeChart;
    });

    afterEach(async () => {
        vi.clearAllMocks();
        await clearChartRuntime();
        clearChartInstanceRegistryForTests();
        vi.resetModules();
        delete getGPSTimeGlobal().window;
        delete getGPSTimeGlobal().document;
        delete getGPSTimeGlobal().HTMLCanvasElement;
        delete getGPSTimeGlobal().HTMLElement;
        delete getGPSTimeGlobal().localStorage;
    });

    it("should exit early when GPS or timestamp data is missing", () => {
        expect.assertions(2);

        const container = document.createElement("div");
        const data = [
            { positionLat: null, positionLong: null, timestamp: null },
        ];

        renderGPSTimeChart(container, data, { maxPoints: "all" });

        expect(chartMock).not.toHaveBeenCalled();
        expect(Array.from(container.children)).toStrictEqual([]);
    });

    it("should respect field visibility from settings manager", () => {
        expect.assertions(2);

        const container = document.createElement("div");
        const data = [
            {
                positionLat: 0,
                positionLong: 0,
                timestamp: "2024-01-01T00:00:00.000Z",
            },
        ];

        mockChartSettingsManager.getFieldVisibility.mockReturnValue("hidden");

        renderGPSTimeChart(container, data, { maxPoints: "all" });

        expect(chartMock).not.toHaveBeenCalled();
        expect(Array.from(container.children)).toStrictEqual([]);
    });

    it("should convert GPS semicircles to degrees, limit points, and configure chart options", () => {
        expect.assertions(16);

        const container = document.createElement("div");
        const data = [
            {
                positionLat: 0,
                positionLong: 0,
                timestamp: "2024-01-01T00:00:00.000Z",
            },
            {
                positionLat: 1_073_741_824, // 90 degrees
                positionLong: 1_073_741_824,
                timestamp: "2024-01-01T00:00:01.500Z",
            },
            {
                positionLat: -1_073_741_824, // -90 degrees
                positionLong: -1_073_741_824,
                timestamp: "2024-01-01T00:00:02.500Z",
            },
        ];

        const options = {
            maxPoints: 2,
            showGrid: false,
            showLegend: false,
            showPoints: true,
            showTitle: true,
        };

        renderGPSTimeChart(container, data, options);

        expect(createChartCanvasMock).toHaveBeenCalledWith("gps-time", 0);
        expect(chartMock).toHaveBeenCalledOnce();

        const config = getLatestChartConfig();
        const latitudeDataset = config.data.datasets[0];
        const longitudeDataset = config.data.datasets[1];

        expect(latitudeDataset.data).toHaveLength(2);
        expect(longitudeDataset.data).toHaveLength(2);
        expect(latitudeDataset.pointRadius).toBe(2);
        expect(config.options.plugins.legend.display).toBe(false);
        expect(config.options.scales.x.grid.display).toBe(false);

        const firstLatPoint = latitudeDataset.data[0];
        const secondLatPoint = latitudeDataset.data[1];
        expect(firstLatPoint.y).toBeCloseTo(0, 6);
        expect(secondLatPoint.y).toBeCloseTo(-90, 6);
        expect(secondLatPoint.pointIndex).toBe(2);
        expect(secondLatPoint.elapsedSeconds).toBeCloseTo(2.5, 5);

        const tooltipLabel = config.options.plugins.tooltip.callbacks.label({
            datasetIndex: 0,
            raw: secondLatPoint,
        });
        expect(tooltipLabel).toStrictEqual([
            "Latitude: -90.000000°",
            "Elapsed: 2s",
            "Point: 2",
        ]);

        const tooltipTitle = config.options.plugins.tooltip.callbacks.title([
            { raw: secondLatPoint },
        ]);
        expect(tooltipTitle).toBe(
            new Date(secondLatPoint.timestamp).toLocaleString()
        );

        expect(config.plugins[0]).toStrictEqual({ id: "zoom-reset" });
        const view = getRenderedCanvas(container);
        expect(view.style.borderRadius).toBe("12px");
        expect(view.style.background).toBe("rgb(16, 16, 16)");
    });
});
