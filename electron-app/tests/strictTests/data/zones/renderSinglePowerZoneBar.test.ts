import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../../utils/charts/theming/chartThemeUtils.js", () => ({
    detectCurrentTheme: () => "light",
}));
vi.mock("../../../../utils/data/lookups/getUnitSymbol.js", () => ({
    getUnitSymbol: () => "s",
}));
vi.mock("../../../../utils/formatting/formatters/formatTime.js", () => ({
    formatTime: (v: any) => `${v}s`,
}));
vi.mock("../../../../utils/charts/plugins/chartZoomResetPlugin.js", () => ({
    chartZoomResetPlugin: {},
}));
vi.mock(
    "../../../../utils/charts/plugins/chartBackgroundColorPlugin.js",
    () => ({ chartBackgroundColorPlugin: {} })
);
vi.mock("../../../../utils/data/zones/chartZoneColorUtils.js", () => ({
    getChartZoneColors: () => [
        "#f00",
        "#0f0",
        "#00f",
    ],
}));

describe("renderSinglePowerZoneBar", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    it("renders chart when Chart is available", async () => {
        const canvas = document.createElement("canvas");
        document.body.appendChild(canvas);
        (window as any).Chart = vi.fn(function ChartMock(_, cfg) {
            return { config: cfg, destroy: vi.fn() };
        });

        // Ensure globalThis can access the Chart mock
        if (!(global as any).globalThis) {
            (global as any).globalThis = global;
        }
        (global as any).globalThis.Chart = (window as any).Chart;

        const { renderSinglePowerZoneBar } =
            await import("../../../../utils/data/zones/renderSinglePowerZoneBar.js");
        const chart = renderSinglePowerZoneBar(
            canvas as HTMLCanvasElement,
            [
                { label: "Z1", value: 10 },
                { label: "Z2", value: 20 },
                { label: "Z3", value: 30 },
            ],
            { title: "Power Zones" }
        );
        expect(chart).toBeTruthy();
        expect((window as any).Chart).toHaveBeenCalled();

        // Exercise callbacks for coverage
        const call = (window as any).Chart.mock.calls[0];
        const cfg = call[1];
        const yTickCb = cfg.options.scales.y.ticks.callback;
        const tooltipCb = cfg.options.plugins.tooltip.callbacks.label;
        expect(yTickCb(30)).toBe("30s");
        expect(tooltipCb({ dataset: { label: "Z1" }, parsed: { y: 30 } })).toBe(
            "Z1: 30s"
        );
    });

    it("handles errors gracefully when Chart.js missing", async () => {
        delete (window as any).Chart;
        const { renderSinglePowerZoneBar } =
            await import("../../../../utils/data/zones/renderSinglePowerZoneBar.js");
        (window as any).showNotification = vi.fn(async () => {});
        const res = renderSinglePowerZoneBar(null as any, null as any);
        expect(res).toBeNull();
        expect((window as any).showNotification).toHaveBeenCalled();
    });
});
