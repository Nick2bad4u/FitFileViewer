import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import type { ZoneData } from "../../../electron-app/utils/types/sharedChartTypes.js";

interface RenderZoneChartOptions {
    readonly chartType?: string;
    readonly showLegend?: boolean;
}

interface ZoneChartDataset {
    readonly backgroundColor: string[];
    readonly data?: number[];
}

interface ZoneChartConfig {
    readonly data: {
        readonly datasets: readonly ZoneChartDataset[];
        readonly labels: string[];
    };
    readonly options: {
        readonly plugins: {
            readonly chartBackgroundColorPlugin?: {
                readonly backgroundColor?: string;
            };
            readonly legend?: {
                readonly display: boolean;
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

type ConsoleMethod = (...args: unknown[]) => void;
type ZoneChartRenderRegistrySnapshot = {
    chartInstanceTypes: string[];
};
type ContainerChildSnapshot = {
    childTags: string[];
};
type ChartInstanceRegistryModule =
    typeof import("../../../electron-app/utils/charts/core/chartInstanceRegistry.js");
type TestGlobalProperty =
    | "console"
    | "document"
    | "HTMLCanvasElement"
    | "HTMLElement"
    | "window";

const originalGlobalDescriptors = new Map<
    TestGlobalProperty,
    PropertyDescriptor
>();

function getZoneChartGlobal(): typeof globalThis {
    return globalThis;
}

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

function getLatestChartConfig(): ZoneChartConfig {
    const config = chartMock.mock.calls[0]?.[1];
    if (!config) {
        throw new Error("Expected Chart constructor to receive a config");
    }
    return config;
}

function getRenderedCanvas(container: HTMLElement): HTMLCanvasElement {
    const canvas = container.querySelector("canvas");
    const CanvasConstructor = getZoneChartGlobal().HTMLCanvasElement;

    if (!CanvasConstructor || !(canvas instanceof CanvasConstructor)) {
        throw new TypeError("Expected rendered zone chart canvas to exist");
    }

    return canvas as HTMLCanvasElement;
}

function getFirstChartCanvasArgument(): HTMLCanvasElement {
    const canvas = chartMock.mock.calls[0]?.[0];
    const CanvasConstructor = getZoneChartGlobal().HTMLCanvasElement;

    if (!CanvasConstructor || !(canvas instanceof CanvasConstructor)) {
        throw new TypeError("Expected Chart constructor to receive canvas");
    }

    return canvas as HTMLCanvasElement;
}

let renderZoneChart: RenderZoneChart;
let chartMock: ChartConstructorMock;
let chartInstanceMock: ZoneChartInstanceMock;
let detectCurrentThemeMock: ReturnType<typeof vi.fn<() => string>>;
let getThemeConfigMock: ReturnType<typeof vi.fn<() => unknown>>;
let getChartZoneColorsMock: ReturnType<typeof vi.fn<() => string[]>>;
let getZoneTypeFromFieldMock: ReturnType<typeof vi.fn<() => string>>;
let formatTimeMock: ReturnType<typeof vi.fn<(value: number) => string>>;
let createChartCanvasMock: ReturnType<typeof vi.fn<() => HTMLCanvasElement>>;
let chartInstanceRegistryModule: ChartInstanceRegistryModule | undefined;

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

describe("renderZoneChart.js - Zone Chart Rendering Utility", () => {
    beforeEach(async () => {
        vi.resetModules();

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

        setTestGlobal("console", {
            log: vi.fn<ConsoleMethod>(),
            warn: vi.fn<ConsoleMethod>(),
            error: vi.fn<ConsoleMethod>(),
        } as unknown as Console);

        chartInstanceMock = {
            update: vi.fn<() => void>(),
        };
        chartMock = vi.fn<
            (
                canvas: HTMLCanvasElement,
                config: ZoneChartConfig
            ) => ZoneChartInstanceMock
        >(function ChartConstructor(_canvas, _config) {
            return chartInstanceMock;
        });
        await loadChartInstanceRegistry();
        clearChartInstanceRegistryForTests();

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

        vi.doMock(import("chart.js/auto"), () => ({
            default: chartMock,
        }));
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

        const { setChartRuntime } =
            await import("../../../electron-app/utils/charts/core/chartRuntime.js");
        setChartRuntime(chartMock);

        const module =
            await import("../../../electron-app/utils/charts/rendering/renderZoneChart.js");
        renderZoneChart = module.renderZoneChart;
    });

    afterEach(async () => {
        const { clearChartRuntimeForTests } =
            await import("../../../electron-app/utils/charts/core/chartRuntime.js");
        clearChartRuntimeForTests();
        clearChartInstanceRegistryForTests();
        vi.resetModules();
        vi.clearAllMocks();
        restoreTestGlobals();
    });

    it("should warn and exit when container is invalid", () => {
        expect.assertions(3);

        renderZoneChart(null, "Invalid", [], "heart-rate-zones");

        expect(console.warn).toHaveBeenCalledWith(
            "renderZoneChart: invalid container",
            null
        );
        expect(chartMock).not.toHaveBeenCalled();
        expect<ZoneChartRenderRegistrySnapshot>({
            chartInstanceTypes: getRegisteredChartInstances().map(
                (chartInstance) => typeof chartInstance
            ),
        }).toStrictEqual({
            chartInstanceTypes: [],
        });
    });

    it("should warn and exit when zone data is not an array", () => {
        expect.assertions(3);

        const container = document.createElement("div");
        renderZoneChart(container, "Invalid", null, "heart-rate-zones");

        expect(console.warn).toHaveBeenCalledWith(
            "renderZoneChart: zoneData not array",
            null
        );
        expect(chartMock).not.toHaveBeenCalled();
        expect<ContainerChildSnapshot>({
            childTags: [...container.children].map((child) => child.tagName),
        }).toStrictEqual({
            childTags: [],
        });
    });

    it("should render doughnut chart with colors provided in zone data", () => {
        expect.assertions(14);

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
        const view = getRenderedCanvas(container);
        expect(view).toBeInstanceOf(HTMLCanvasElement);
        expect(getFirstChartCanvasArgument()).toBe(view);
        expect(chartMock).toHaveBeenCalledOnce();
        expect(getRegisteredChartInstances()).toStrictEqual([
            chartInstanceMock,
        ]);
        const config = getLatestChartConfig();
        expect(config.type).toBe("doughnut");
        expect(config.data.labels).toStrictEqual(["Z1", "Z2"]);
        expect(config.data.datasets[0].data).toStrictEqual([120, 240]);
        expect(config.data.datasets[0].backgroundColor).toStrictEqual([
            "#ff0000",
            "#00ff00",
        ]);
        expect(config.options.plugins.legend).toHaveProperty("display", true);

        const tooltipLabel = config.options.plugins.tooltip.callbacks.label({
            dataset: {
                data: [120, 240],
                backgroundColor: ["#ff0000", "#00ff00"],
            },
            parsed: 120,
            dataIndex: 0,
        });
        expect(formatTimeMock).toHaveBeenCalledWith(120, true);
        expect(tooltipLabel).toStrictEqual([
            "Time: formatted-120",
            "Percentage: 33.3%",
        ]);
        expect(view.style.borderRadius).toBe("12px");
    });

    it("should fallback to computed zone colors and render bar chart when requested", () => {
        expect.assertions(11);

        const container = document.createElement("div");
        const zoneData: ZoneData[] = [
            { zone: 1, label: "Z1", time: 150 },
            { zone: 2, label: "Z2", time: 300 },
        ];
        getZoneTypeFromFieldMock.mockReturnValueOnce("power");

        renderZoneChart(container, "Power Zones", zoneData, "power-zones", {
            chartType: "bar",
            showLegend: false,
        });

        expect(getZoneTypeFromFieldMock).toHaveBeenCalledWith("power-zones");
        expect(getChartZoneColorsMock).toHaveBeenCalledWith(
            "power",
            zoneData.length
        );

        const config = getLatestChartConfig();
        expect(config.type).toBe("bar");
        expect(config.data.labels).toStrictEqual(["Z1", "Z2"]);
        expect(config.data.datasets[0].data).toStrictEqual([150, 300]);
        expect(config.data.datasets[0].backgroundColor).toStrictEqual([
            "#aaaaaa",
            "#bbbbbb",
        ]);
        expect(config.options.plugins.legend).toHaveProperty("display", false);
        expect(
            config.options.plugins.chartBackgroundColorPlugin.backgroundColor
        ).toBe("#ffffff");

        const label = config.options.plugins.tooltip.callbacks.label({
            parsed: { y: 150 },
        });
        expect(formatTimeMock).toHaveBeenCalledWith(150, true);
        expect(label).toBe("Time: formatted-150");
        expect(getRegisteredChartInstances()).toStrictEqual([
            chartInstanceMock,
        ]);
    });
});
