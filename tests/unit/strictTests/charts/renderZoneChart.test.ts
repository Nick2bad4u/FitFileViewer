import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ChartInstanceMock = {
    destroy: ReturnType<typeof vi.fn<() => void>>;
    getDatasetMeta: ReturnType<
        typeof vi.fn<(datasetIndex: number) => { data: object[] }>
    >;
    update: ReturnType<typeof vi.fn<() => void>>;
};

type RenderedChartConfig = {
    data: {
        datasets: Array<{
            backgroundColor: string[];
            data: number[];
        }>;
        labels: string[];
    };
    options: {
        plugins: {
            legend: {
                display: boolean;
            };
        };
    };
    type: "bar" | "doughnut";
};

type ZoneChartTestWindow = Window &
    typeof globalThis & {
        _chartjsInstances: unknown[];
        Chart?: ReturnType<
            typeof vi.fn<
                (
                    canvas: HTMLCanvasElement,
                    config: RenderedChartConfig
                ) => ChartInstanceMock
            >
        >;
    };

async function loadModule() {
    return await import("../../../../electron-app/utils/charts/rendering/renderZoneChart.js");
}

function getChartInstances(): unknown[] {
    return (window as ZoneChartTestWindow)._chartjsInstances;
}

function getChartConstructor() {
    const chartConstructor = (window as ZoneChartTestWindow).Chart;
    if (!chartConstructor) {
        throw new Error("Expected mocked Chart constructor to be installed");
    }
    return chartConstructor;
}

function getCreatedChartConfig(): RenderedChartConfig {
    const chartConstructor = getChartConstructor(),
        config = chartConstructor.mock.calls[0]?.[1];

    if (!config) {
        throw new Error("Expected Chart constructor to receive config");
    }

    return config;
}

function getRenderedCanvas(container: HTMLElement): HTMLCanvasElement {
    const canvas = container.querySelector("canvas");

    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new TypeError("Expected rendered zone chart canvas to exist");
    }

    return canvas;
}

function getFirstChartCanvasArgument(): HTMLCanvasElement {
    const canvas = getChartConstructor().mock.calls[0]?.[0];

    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new TypeError("Expected Chart constructor to receive canvas");
    }

    return canvas;
}

describe("renderZoneChart", () => {
    let originalChart: ZoneChartTestWindow["Chart"];
    beforeEach(() => {
        document.body.replaceChildren();
        const root = document.createElement("div");
        root.id = "root";
        document.body.append(root);
        (window as ZoneChartTestWindow)._chartjsInstances = [];
        originalChart = (window as ZoneChartTestWindow).Chart;
        const chartConstructor = vi
            .fn<
                (
                    canvas: HTMLCanvasElement,
                    config: RenderedChartConfig
                ) => ChartInstanceMock
            >()
            .mockImplementation(function ChartMock(_canvas, _config) {
                return {
                    destroy: vi.fn<() => void>(),
                    getDatasetMeta: vi
                        .fn<(datasetIndex: number) => { data: object[] }>()
                        .mockReturnValue({
                            data: [
                                {},
                                {},
                                {},
                            ],
                        }),
                    update: vi.fn<() => void>(),
                };
            });
        Object.defineProperty(window, "Chart", {
            configurable: true,
            value: chartConstructor,
        });
        // theme
        document.body.classList.add("theme-light");
        Object.defineProperty(window, "matchMedia", {
            configurable: true,
            value: vi.fn<(query: string) => MediaQueryList>().mockReturnValue({
                addEventListener: vi.fn<MediaQueryList["addEventListener"]>(),
                matches: false,
                removeEventListener:
                    vi.fn<MediaQueryList["removeEventListener"]>(),
            } as unknown as MediaQueryList),
        });
        window.localStorage.clear?.();
    });
    afterEach(() => {
        Object.defineProperty(window, "Chart", {
            configurable: true,
            value: originalChart,
        });
        document.body.replaceChildren();
        vi.doUnmock(
            "../../../../electron-app/utils/data/zones/chartZoneColorUtils.js"
        );
        vi.restoreAllMocks();
        vi.resetModules();
    });

    it("renders doughnut with data colors and pushes instance", async () => {
        expect.assertions(11);

        const { renderZoneChart } = await loadModule();
        const container = document.getElementById("root")!;
        const zoneData = [
            { zone: 1, label: "Z1", time: 10, color: "#111111" },
            { zone: 2, label: "Z2", time: 20, color: "#222222" },
        ];
        renderZoneChart(
            container as any,
            "HR Zones",
            zoneData as any,
            "hr_zone",
            { showLegend: true }
        );
        const view = getRenderedCanvas(container);
        expect(view).toBeInstanceOf(HTMLCanvasElement);
        expect(view.id).toBe("chart-hr_zone-0");
        expect(getChartConstructor()).toHaveBeenCalledOnce();
        expect(getFirstChartCanvasArgument()).toBe(view);
        expect(getChartInstances()).toBeInstanceOf(Array);
        expect(getChartInstances()).toHaveLength(1);

        const chartConfig = getCreatedChartConfig();
        expect(chartConfig.type).toBe("doughnut");
        expect(chartConfig.data.labels).toEqual(["Z1", "Z2"]);
        expect(chartConfig.data.datasets[0].data).toEqual([10, 20]);
        expect(chartConfig.data.datasets[0].backgroundColor).toEqual([
            "#111111",
            "#222222",
        ]);
        expect(chartConfig.options.plugins.legend).toHaveProperty(
            "display",
            true
        );
    });

    it("renders bar config when chartType=bar and uses zoneType colors fallback", async () => {
        expect.assertions(9);

        vi.doMock(
            import("../../../../electron-app/utils/data/zones/chartZoneColorUtils.js"),
            () => ({
                getZoneTypeFromField: (id: string) =>
                    id.includes("power") ? "power" : "hr",
                getChartZoneColors: (_type: string, n: number) =>
                    Array.from({ length: n }, (_, i) => `#00${i}${i}${i}${i}`),
            })
        );
        const { renderZoneChart } = await loadModule();
        const container = document.getElementById("root")!;
        const zoneData = [
            { zone: 1, label: "Z1", time: 5 },
            { zone: 2, label: "Z2", time: 15 },
            { zone: 3, label: "Z3", time: 25 },
        ];
        renderZoneChart(
            container as any,
            "Power Zones",
            zoneData as any,
            "power_zone",
            {
                chartType: "bar",
                showLegend: false,
            }
        );
        const view = getRenderedCanvas(container);
        expect(view).toBeInstanceOf(HTMLCanvasElement);
        expect(view.id).toBe("chart-power_zone-0");
        expect(getChartConstructor()).toHaveBeenCalledOnce();
        expect(getFirstChartCanvasArgument()).toBe(view);

        const chartConfig = getCreatedChartConfig();
        expect(chartConfig.type).toBe("bar");
        expect(chartConfig.data.labels).toEqual([
            "Z1",
            "Z2",
            "Z3",
        ]);
        expect(chartConfig.data.datasets[0].data).toEqual([
            5,
            15,
            25,
        ]);
        expect(chartConfig.data.datasets[0].backgroundColor).toEqual([
            "#000000",
            "#001111",
            "#002222",
        ]);
        expect(chartConfig.options.plugins.legend).toHaveProperty(
            "display",
            false
        );
    });

    it("gracefully returns on invalid inputs", async () => {
        expect.assertions(6);

        const warnSpy = vi.spyOn(console, "warn").mockReturnValue(undefined);
        const { renderZoneChart } = await loadModule();
        renderZoneChart(null as any, "X", [] as any, "id");
        renderZoneChart(document.body, "X", null as any, "id");
        expect(warnSpy).toHaveBeenCalledTimes(2);
        expect(warnSpy).toHaveBeenNthCalledWith(
            1,
            "renderZoneChart: invalid container",
            null
        );
        expect(warnSpy).toHaveBeenNthCalledWith(
            2,
            "renderZoneChart: zoneData not array",
            null
        );
        expect(Array.from(document.querySelectorAll("canvas"))).toStrictEqual(
            []
        );
        expect(getChartConstructor()).not.toHaveBeenCalled();
        expect(getChartInstances()).toStrictEqual([]);
    });
});
