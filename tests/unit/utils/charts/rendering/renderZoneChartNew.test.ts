import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

type ChartConfig = Record<string, any>;
type ChartInstance = { data: unknown; destroy: () => void };
type ThemeName = "dark" | "light";

const createChartCanvasMock =
    vi.fn<(chartId: string, index: number) => HTMLCanvasElement>();
const detectCurrentThemeMock = vi.fn<() => ThemeName>();
const getThemeConfigMock = vi.fn<() => Record<string, unknown>>();
const getZoneTypeFromFieldMock = vi.fn<(field: string) => string>();
const getChartZoneColorsMock =
    vi.fn<(zoneType: string, zoneCount: number) => string[]>();
const formatTimeMock =
    vi.fn<(value: unknown, includeSeconds?: boolean) => string>();

const chartBackgroundColorPluginStub = { id: "background-plugin" };

vi.mock(
    import("../../../../../electron-app/utils/charts/components/createChartCanvas.js"),
    () => ({
        createChartCanvas: createChartCanvasMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/plugins/chartBackgroundColorPlugin.js"),
    () => ({
        chartBackgroundColorPlugin: chartBackgroundColorPluginStub,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/theming/chartThemeUtils.js"),
    () => ({
        detectCurrentTheme: detectCurrentThemeMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/data/zones/chartZoneColorUtils.js"),
    () => ({
        getChartZoneColors: getChartZoneColorsMock,
        getZoneTypeFromField: getZoneTypeFromFieldMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/theming/core/theme.js"),
    () => ({
        getThemeConfig: getThemeConfigMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/formatting/formatters/formatTime.js"),
    () => ({
        formatTime: formatTimeMock,
    })
);

async function loadModule() {
    // Don't reset modules - let beforeEach handle cleanup
    // await vi.resetModules();
    return import("../../../../../electron-app/utils/charts/rendering/renderZoneChartNew.js");
}

function lightenColor(hex: string, delta: number) {
    const sanitized = /^#?[\dA-Fa-f]{6}$/.test(hex)
        ? hex.replace("#", "")
        : "999999";
    const r = Math.min(255, Number.parseInt(sanitized.slice(0, 2), 16) + delta);
    const g = Math.min(255, Number.parseInt(sanitized.slice(2, 4), 16) + delta);
    const b = Math.min(255, Number.parseInt(sanitized.slice(4, 6), 16) + delta);
    return `rgba(${r}, ${g}, ${b}, 0.9)`;
}

let chartConstructorMock: ReturnType<
    typeof vi.fn<
        (canvas: HTMLCanvasElement, config: ChartConfig) => ChartInstance
    >
>;
let chartCalls: Array<{ canvas: HTMLCanvasElement; config: any }>;

beforeEach(() => {
    vi.clearAllMocks();

    chartCalls = [];
    createChartCanvasMock.mockImplementation((id: string) => {
        const canvas = document.createElement("canvas");
        canvas.dataset.chartId = id;
        vi.spyOn(canvas, "getContext").mockReturnValue(null);
        return canvas as HTMLCanvasElement;
    });

    detectCurrentThemeMock.mockReturnValue("light");
    getThemeConfigMock.mockReturnValue({
        colors: {
            shadowLight: "rgba(0, 0, 0, 0.15)",
            zoneColors: [
                "#102030",
                "#405060",
                "#708090",
            ],
        },
    });
    getZoneTypeFromFieldMock.mockReturnValue("heartRate");
    getChartZoneColorsMock.mockReturnValue([
        "#123456",
        "#789abc",
        "#def012",
    ]);
    formatTimeMock.mockImplementation((value: unknown) => `formatted-${value}`);

    chartConstructorMock = vi.fn<
        (canvas: HTMLCanvasElement, config: ChartConfig) => ChartInstance
    >(function Chart(canvas: HTMLCanvasElement, config: ChartConfig) {
        chartCalls.push({ canvas, config });
        return { data: config["data"], destroy: vi.fn<() => void>() };
    });
    (globalThis as any).Chart = chartConstructorMock;
    delete (globalThis as any)._chartjsInstances;

    document.body.replaceChildren();
});

afterEach(() => {
    document.body.replaceChildren();
    delete (globalThis as any)._chartjsInstances;
    vi.clearAllMocks();
});

describe("renderZoneChartNew", () => {
    it("returns early when container is invalid or zone data is empty", async () => {
        expect.assertions(3);

        const { renderZoneChart } = await loadModule();

        renderZoneChart(
            null as unknown as HTMLElement,
            "No Render",
            [{ zone: 1 }],
            "chart-empty"
        );
        renderZoneChart(
            document.createElement("div"),
            "No Data",
            [],
            "chart-empty"
        );

        expect(createChartCanvasMock).not.toHaveBeenCalled();
        expect(chartConstructorMock).not.toHaveBeenCalled();
        expect(document.body.childElementCount).toBe(0);
    });

    it("creates a doughnut chart using provided zone colors and updates legend + tooltips", async () => {
        expect.assertions(17);

        const { renderZoneChart } = await loadModule();

        const container = document.createElement("div");
        const zoneData = [
            { zone: 1, label: "Z1", time: 120, color: "#123456" },
            { zone: 2, label: "Z2", time: 60, color: "#654321" },
        ];

        renderZoneChart(container, "Heart Rate", zoneData, "hr-zone-chart");

        expect(createChartCanvasMock).toHaveBeenCalledWith("hr-zone-chart", 0);
        const renderedCanvas = container.querySelector("canvas");
        expect(renderedCanvas?.dataset.chartId).toBe("hr-zone-chart");
        expect(renderedCanvas?.style.borderRadius).toBe("12px");

        expect(chartConstructorMock).toHaveBeenCalledOnce();

        expect(chartCalls.length).toBeGreaterThan(0);
        const { canvas, config } = chartCalls[0]!;
        expect(config.type).toBe("doughnut");
        expect(canvas.style.borderRadius).toBe("12px");
        expect(canvas.style.boxShadow).toBe("0 2px 16px 0 rgba(0, 0, 0, 0.15)");

        const dataset = config.data.datasets[0];
        expect(dataset.data).toEqual([120, 60]);
        expect(dataset.backgroundColor).toEqual(["#123456", "#654321"]);
        expect(dataset.hoverBackgroundColor).toEqual([
            lightenColor("#123456", 30),
            lightenColor("#654321", 30),
        ]);

        expect((globalThis as any)._chartjsInstances).toHaveLength(1);

        const legendLabels =
            config.options.plugins.legend.labels.generateLabels({
                data: config.data,
                getDatasetMeta: () => ({
                    data: [{ hidden: false }, { hidden: true }],
                }),
            });
        expect(legendLabels).toHaveLength(2);
        expect(legendLabels[0].text).toBe("Z1: formatted-120 (66.7%)");
        expect(legendLabels[1]).toMatchObject({
            hidden: true,
            text: "Z2: formatted-60 (33.3%)",
        });

        const tooltipLines = config.options.plugins.tooltip.callbacks.label({
            dataset: { data: dataset.data },
            parsed: dataset.data[0],
        });
        expect(tooltipLines).toEqual([
            "Time: formatted-120",
            "Percentage: 66.7%",
        ]);
        expect(formatTimeMock).toHaveBeenCalledWith(120, true);
    });

    it("creates a bar chart using zone type colors and applies theme-aware settings", async () => {
        expect.assertions(12);

        detectCurrentThemeMock.mockReturnValue("dark");
        getThemeConfigMock.mockReturnValue({
            colors: {
                shadowLight: "rgba(255, 255, 255, 0.1)",
                zoneColors: ["#aaaaaa", "#bbbbbb"],
            },
        });
        getZoneTypeFromFieldMock.mockReturnValue("power");
        getChartZoneColorsMock.mockReturnValue(["#010203", "INVALID"]);

        const { renderZoneChart } = await loadModule();

        const container = document.createElement("div");
        const zoneData = [
            { zone: 1, label: "P1", time: 200 },
            { zone: 2, label: "P2", time: 100 },
        ];

        renderZoneChart(
            container,
            "Power Zones",
            zoneData,
            "power-zone-chart",
            { chartType: "bar" }
        );

        expect(createChartCanvasMock).toHaveBeenCalledWith(
            "power-zone-chart",
            0
        );
        expect(chartConstructorMock).toHaveBeenCalledOnce();

        expect(chartCalls.length).toBeGreaterThan(0);
        const { config } = chartCalls[0]!;
        expect(config.type).toBe("bar");
        expect(config.plugins).toEqual([chartBackgroundColorPluginStub]);

        const dataset = config.data.datasets[0];
        expect(dataset.backgroundColor).toEqual(["#010203", "INVALID"]);
        expect(dataset.hoverBackgroundColor).toEqual([
            lightenColor("#010203", 20),
            lightenColor("INVALID", 20),
        ]);
        expect(dataset.hoverBorderColor).toEqual(["#010203", "INVALID"]);

        const yTickResult = config.options.scales.y.ticks.callback(300);
        expect(yTickResult).toBe("formatted-300");

        const tooltipLabel = config.options.plugins.tooltip.callbacks.label({
            dataset: { data: dataset.data },
            parsed: { y: dataset.data[1] },
        });
        expect(tooltipLabel).toBe("Time: formatted-100");

        expect(getZoneTypeFromFieldMock).toHaveBeenCalledWith(
            "power-zone-chart"
        );
        expect(getChartZoneColorsMock).toHaveBeenCalledWith(
            "power",
            zoneData.length
        );
    });

    it("logs an error when chart creation fails", async () => {
        expect.assertions(2);

        chartConstructorMock.mockImplementation(() => {
            throw new Error("chart boom");
        });
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        const { renderZoneChart } = await loadModule();

        const container = document.createElement("div");
        const zoneData = [{ zone: 1, label: "Z1", time: 30 }];

        renderZoneChart(container, "Errored Chart", zoneData, "error-chart");

        expect(errorSpy).toHaveBeenCalledWith(
            "[ChartJS] Failed to create zone chart",
            expect.any(Error)
        );
        expect((globalThis as any)._chartjsInstances).toBeUndefined();

        errorSpy.mockRestore();
    });
});
