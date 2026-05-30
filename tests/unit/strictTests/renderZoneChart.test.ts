import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import type { ZoneData } from "../../../electron-app/utils/types/sharedChartTypes.js";

interface RenderZoneChartOptions {
    readonly chartType?: string;
}

interface ZoneChartDataset {
    readonly backgroundColor: string[];
    readonly data?: number[];
}

interface ZoneChartConfig {
    readonly data: {
        readonly datasets: readonly ZoneChartDataset[];
    };
    readonly options: {
        readonly plugins: {
            readonly chartBackgroundColorPlugin?: {
                readonly backgroundColor?: string;
            };
            readonly tooltip: {
                readonly callbacks: {
                    readonly label: (
                        context: ZoneTooltipContext
                    ) => string | string[];
                };
            };
        };
    };
    readonly type: string;
}

interface ZoneTooltipContext {
    readonly dataIndex?: number;
    readonly dataset?: {
        readonly backgroundColor?: string[];
        readonly data?: number[];
    };
    readonly parsed?: number | { readonly y: number };
}

interface ZoneChartInstanceMock {
    update: ReturnType<typeof vi.fn<() => void>>;
}

type RenderZoneChart = (
    container: unknown,
    title: string,
    zoneData: unknown,
    chartId: string,
    options?: RenderZoneChartOptions
) => void;

type ChartConstructorMock = ReturnType<
    typeof vi.fn<
        (
            canvas: HTMLCanvasElement,
            config: ZoneChartConfig
        ) => ZoneChartInstanceMock
    >
>;

type ZoneChartTestGlobal = typeof globalThis & {
    Chart?: unknown;
    _chartjsInstances?: unknown[];
};

type ConsoleMethod = (...args: unknown[]) => void;
type ZoneChartRenderRegistrySnapshot = {
    chartInstanceTypes: string[];
};
type ContainerChildSnapshot = {
    childTags: string[];
};

function getZoneChartGlobal(): ZoneChartTestGlobal {
    return globalThis as ZoneChartTestGlobal;
}

function getLatestChartConfig(): ZoneChartConfig {
    const config = Chart.mock.calls[0]?.[1];
    if (!config) {
        throw new Error("Expected Chart constructor to receive a config");
    }
    return config;
}

let renderZoneChart: RenderZoneChart;
let Chart: ChartConstructorMock;
let chartInstanceMock: ZoneChartInstanceMock;
let detectCurrentThemeMock: ReturnType<typeof vi.fn<() => string>>;
let getThemeConfigMock: ReturnType<typeof vi.fn<() => unknown>>;
let getChartZoneColorsMock: ReturnType<typeof vi.fn<() => string[]>>;
let getZoneTypeFromFieldMock: ReturnType<typeof vi.fn<() => string>>;
let formatTimeMock: ReturnType<typeof vi.fn<(value: number) => string>>;
let createChartCanvasMock: ReturnType<typeof vi.fn<() => HTMLCanvasElement>>;

describe("renderZoneChart.js - Zone Chart Rendering Utility", () => {
    beforeEach(async () => {
        vi.resetModules();

        const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
            url: "http://localhost",
            pretendToBeVisual: true,
            resources: "usable",
        });

        globalThis.window = dom.window as unknown as Window & typeof globalThis;
        globalThis.document = dom.window.document;
        globalThis.HTMLCanvasElement = dom.window.HTMLCanvasElement;
        globalThis.HTMLElement = dom.window.HTMLElement;

        globalThis.console = {
            log: vi.fn<ConsoleMethod>(),
            warn: vi.fn<ConsoleMethod>(),
            error: vi.fn<ConsoleMethod>(),
        } as unknown as Console;

        chartInstanceMock = {
            update: vi.fn<() => void>(),
        };
        Chart = vi.fn<
            (
                canvas: HTMLCanvasElement,
                config: ZoneChartConfig
            ) => ZoneChartInstanceMock
        >(function ChartConstructor(_canvas, _config) {
            return chartInstanceMock;
        });
        const zoneGlobal = getZoneChartGlobal();
        zoneGlobal.Chart = Chart;
        zoneGlobal._chartjsInstances = [];

        detectCurrentThemeMock = vi.fn<() => string>(() => "light");
        getThemeConfigMock = vi.fn<() => unknown>(() => ({
            colors: {
                zoneColors: [
                    "#111111",
                    "#222222",
                    "#333333",
                ],
                shadowLight: "rgba(0, 0, 0, 0.15)",
            },
        }));
        getChartZoneColorsMock = vi.fn<() => string[]>(() => [
            "#aaaaaa",
            "#bbbbbb",
            "#cccccc",
        ]);
        getZoneTypeFromFieldMock = vi.fn<() => string>(() => "heartRate");
        formatTimeMock = vi.fn<(value: number) => string>(
            (value: number) => `formatted-${value}`
        );
        createChartCanvasMock = vi.fn<() => HTMLCanvasElement>(() =>
            document.createElement("canvas")
        );

        vi.doMock(
            import("../../../electron-app/utils/charts/theming/chartThemeUtils.js"),
            () => ({
                detectCurrentTheme: detectCurrentThemeMock,
            })
        );
        vi.doMock(
            import("../../../electron-app/utils/theming/core/theme.js"),
            () => ({
                getThemeConfig: getThemeConfigMock,
            })
        );
        vi.doMock(
            import("../../../electron-app/utils/data/zones/chartZoneColorUtils.js"),
            () => ({
                getChartZoneColors: getChartZoneColorsMock,
                getZoneTypeFromField: getZoneTypeFromFieldMock,
            })
        );
        vi.doMock(
            import("../../../electron-app/utils/formatting/formatters/formatTime.js"),
            () => ({
                formatTime: formatTimeMock,
            })
        );
        vi.doMock(
            import("../../../electron-app/utils/charts/components/createChartCanvas.js"),
            () => ({
                createChartCanvas: createChartCanvasMock,
            })
        );
        vi.doMock(
            import("../../../electron-app/utils/charts/plugins/chartBackgroundColorPlugin.js"),
            () => ({
                chartBackgroundColorPlugin: { id: "background-color" },
            })
        );

        const module =
            await import("../../../electron-app/utils/charts/rendering/renderZoneChart.js");
        renderZoneChart = module.renderZoneChart;
    });

    afterEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        const zoneGlobal = getZoneChartGlobal();
        if (zoneGlobal._chartjsInstances) {
            zoneGlobal._chartjsInstances = [];
        }
        delete zoneGlobal.Chart;
        delete zoneGlobal.window;
        delete zoneGlobal.document;
        delete zoneGlobal.HTMLCanvasElement;
        delete zoneGlobal.HTMLElement;
    });

    it("should warn and exit when container is invalid", () => {
        expect.hasAssertions();

        renderZoneChart(null, "Invalid", [], "heart-rate-zones");

        expect(console.warn).toHaveBeenCalledWith(
            "renderZoneChart: invalid container",
            null
        );
        expect(Chart).not.toHaveBeenCalled();
        expect<ZoneChartRenderRegistrySnapshot>({
            chartInstanceTypes:
                getZoneChartGlobal()._chartjsInstances?.map(
                    (chartInstance) => typeof chartInstance
                ) ?? [],
        }).toStrictEqual({
            chartInstanceTypes: [],
        });
    });

    it("should warn and exit when zone data is not an array", () => {
        expect.hasAssertions();

        const container = document.createElement("div");
        renderZoneChart(container, "Invalid", null, "heart-rate-zones");

        expect(console.warn).toHaveBeenCalledWith(
            "renderZoneChart: zoneData not array",
            null
        );
        expect(Chart).not.toHaveBeenCalled();
        expect<ContainerChildSnapshot>({
            childTags: [...container.children].map((child) => child.tagName),
        }).toStrictEqual({
            childTags: [],
        });
    });

    it("should render doughnut chart with colors provided in zone data", () => {
        expect.hasAssertions();

        const container = document.createElement("div");
        const zoneData: ZoneData[] = [
            { zone: 1, label: "Z1", time: 120, color: "#ff0000" },
            { zone: 2, label: "Z2", time: 240, color: "#00ff00" },
        ];

        renderZoneChart(container, "HR Zones", zoneData, "heart-rate-zones", {
            chartType: "doughnut",
        });

        expect(getChartZoneColorsMock).not.toHaveBeenCalled();
        expect(createChartCanvasMock).toHaveBeenCalledWith(
            "heart-rate-zones",
            0
        );
        const config = getLatestChartConfig();
        expect(config.type).toBe("doughnut");
        expect(config.data.datasets[0].backgroundColor).toEqual([
            "#ff0000",
            "#00ff00",
        ]);

        const tooltipLabel = config.options.plugins.tooltip.callbacks.label({
            dataset: {
                data: [120, 240],
                backgroundColor: ["#ff0000", "#00ff00"],
            },
            parsed: 120,
            dataIndex: 0,
        });
        expect(formatTimeMock).toHaveBeenCalledWith(120, true);
        expect(tooltipLabel).toEqual([
            "Time: formatted-120",
            "Percentage: 33.3%",
        ]);
        const renderedCanvas = container.querySelector("canvas");
        expect(renderedCanvas?.style.borderRadius).toBe("12px");
    });

    it("should fallback to computed zone colors and render bar chart when requested", () => {
        expect.hasAssertions();

        const container = document.createElement("div");
        const zoneData: ZoneData[] = [
            { zone: 1, label: "Z1", time: 150 },
            { zone: 2, label: "Z2", time: 300 },
        ];
        getZoneTypeFromFieldMock.mockReturnValueOnce("power");

        renderZoneChart(container, "Power Zones", zoneData, "power-zones", {
            chartType: "bar",
        });

        expect(getZoneTypeFromFieldMock).toHaveBeenCalledWith("power-zones");
        expect(getChartZoneColorsMock).toHaveBeenCalledWith(
            "power",
            zoneData.length
        );

        const config = getLatestChartConfig();
        expect(config.type).toBe("bar");
        expect(config.data.datasets[0].backgroundColor).toEqual([
            "#aaaaaa",
            "#bbbbbb",
        ]);
        expect(
            config.options.plugins.chartBackgroundColorPlugin.backgroundColor
        ).toBe("#ffffff");

        const label = config.options.plugins.tooltip.callbacks.label({
            parsed: { y: 150 },
        });
        expect(formatTimeMock).toHaveBeenCalledWith(150, true);
        expect(label).toBe("Time: formatted-150");
    });
});
