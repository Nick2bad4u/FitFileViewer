import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const createChartCanvasMock = vi.fn();
const detectCurrentThemeMock = vi.fn();
const getThemeConfigMock = vi.fn();
const getZoneTypeFromFieldMock = vi.fn();
const getChartZoneColorsMock = vi.fn();
const formatTimeMock = vi.fn();

const chartBackgroundColorPluginStub = { id: "background-plugin" };

vi.mock("../../../../../utils/charts/components/createChartCanvas.js", () => ({
    createChartCanvas: (...args: any[]) => createChartCanvasMock(...args),
}));

vi.mock("../../../../../utils/charts/plugins/chartBackgroundColorPlugin.js", () => ({
    chartBackgroundColorPlugin: chartBackgroundColorPluginStub,
}));

vi.mock("../../../../../utils/charts/theming/chartThemeUtils.js", () => ({
    detectCurrentTheme: (...args: any[]) => detectCurrentThemeMock(...args),
}));

vi.mock("../../../../../utils/data/zones/chartZoneColorUtils.js", () => ({
    getChartZoneColors: (...args: any[]) => getChartZoneColorsMock(...args),
    getZoneTypeFromField: (...args: any[]) => getZoneTypeFromFieldMock(...args),
}));

vi.mock("../../../../../utils/theming/core/theme.js", () => ({
    getThemeConfig: (...args: any[]) => getThemeConfigMock(...args),
}));

vi.mock("../../../../../utils/formatting/formatters/formatTime.js", () => ({
    formatTime: (...args: any[]) => formatTimeMock(...args),
}));

async function loadModule() {
    await vi.resetModules();
    return import("../../../../../utils/charts/rendering/renderZoneChartNew.js");
}

function lightenColor(hex: string, delta: number) {
    const sanitized = /^#?[\dA-Fa-f]{6}$/.test(hex) ? hex.replace("#", "") : "999999";
    const r = Math.min(255, Number.parseInt(sanitized.slice(0, 2), 16) + delta);
    const g = Math.min(255, Number.parseInt(sanitized.slice(2, 4), 16) + delta);
    const b = Math.min(255, Number.parseInt(sanitized.slice(4, 6), 16) + delta);
    return `rgba(${r}, ${g}, ${b}, 0.9)`;
}

let chartConstructorMock: ReturnType<typeof vi.fn>;
let chartCalls: Array<{ canvas: HTMLCanvasElement; config: any }>;

beforeEach(() => {
    vi.clearAllMocks();

    chartCalls = [];
    createChartCanvasMock.mockImplementation((id: string) => {
        const canvas = document.createElement("canvas");
        canvas.dataset.chartId = id;
        canvas.getContext = vi.fn();
        return canvas as HTMLCanvasElement;
    });

    detectCurrentThemeMock.mockReturnValue("light");
    getThemeConfigMock.mockReturnValue({
        colors: {
            shadowLight: "rgba(0, 0, 0, 0.15)",
            zoneColors: ["#102030", "#405060", "#708090"],
        },
    });
    getZoneTypeFromFieldMock.mockReturnValue("heartRate");
    getChartZoneColorsMock.mockReturnValue(["#123456", "#789abc", "#def012"]);
    formatTimeMock.mockImplementation((value: unknown) => `formatted-${value}`);

    chartConstructorMock = vi.fn((canvas: HTMLCanvasElement, config: any) => {
        chartCalls.push({ canvas, config });
        return { destroy: vi.fn(), data: config.data };
    });
    (globalThis as any).Chart = chartConstructorMock;
    delete (globalThis as any)._chartjsInstances;

    document.body.innerHTML = "";
});

afterEach(() => {
    document.body.innerHTML = "";
    delete (globalThis as any)._chartjsInstances;
});

describe("renderZoneChartNew", () => {
    it("returns early when container is invalid or zone data is empty", async () => {
        const { renderZoneChart } = await loadModule();

        renderZoneChart(null as unknown as HTMLElement, "No Render", [{ zone: 1 }], "chart-empty");
        renderZoneChart(document.createElement("div"), "No Data", [], "chart-empty");

        expect(createChartCanvasMock).not.toHaveBeenCalled();
        expect(chartConstructorMock).not.toHaveBeenCalled();
    });

    it("creates a doughnut chart using provided zone colors and updates legend + tooltips", async () => {
        const { renderZoneChart } = await loadModule();

        const container = document.createElement("div");
        const zoneData = [
            { zone: 1, label: "Z1", time: 120, color: "#123456" },
            { zone: 2, label: "Z2", time: 60, color: "#654321" },
        ];

        renderZoneChart(container, "Heart Rate", zoneData, "hr-zone-chart");

        expect(createChartCanvasMock).toHaveBeenCalledWith("hr-zone-chart", 0);
        expect(container.querySelector("canvas")).toBeTruthy();
        expect(chartConstructorMock).toHaveBeenCalledTimes(1);

        const { canvas, config } = chartCalls[0];
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

        const legendLabels = config.options.plugins.legend.labels.generateLabels({
            data: config.data,
            getDatasetMeta: () => ({ data: [{ hidden: false }, { hidden: true }] }),
        });
        expect(legendLabels).toHaveLength(2);
        expect(legendLabels[0].text).toContain("formatted-120");
        expect(legendLabels[1].hidden).toBe(true);

        const tooltipLines = config.options.plugins.tooltip.callbacks.label({
            dataset: { data: dataset.data },
            parsed: dataset.data[0],
        });
        expect(tooltipLines).toEqual(["Time: formatted-120", "Percentage: 66.7%"]);
        expect(formatTimeMock).toHaveBeenCalledWith(120, true);
    });

    it("creates a bar chart using zone type colors and applies theme-aware settings", async () => {
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

        renderZoneChart(container, "Power Zones", zoneData, "power-zone-chart", { chartType: "bar" });

        expect(createChartCanvasMock).toHaveBeenCalledWith("power-zone-chart", 0);
        expect(chartConstructorMock).toHaveBeenCalledTimes(1);

        const { config } = chartCalls[0];
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

        expect(getZoneTypeFromFieldMock).toHaveBeenCalledWith("power-zone-chart");
        expect(getChartZoneColorsMock).toHaveBeenCalledWith("power", zoneData.length);
    });

    it("logs an error when chart creation fails", async () => {
        chartConstructorMock.mockImplementation(() => {
            throw new Error("chart boom");
        });
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

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
