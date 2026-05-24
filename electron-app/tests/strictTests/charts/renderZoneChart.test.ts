import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

async function loadModule() {
    return await import("../../../utils/charts/rendering/renderZoneChart.js");
}

describe("renderZoneChart", () => {
    let originalChart: any;
    beforeEach(() => {
        document.body.replaceChildren();
        const root = document.createElement("div");
        root.id = "root";
        document.body.append(root);
        (window as any)._chartjsInstances = [];
        originalChart = (window as any).Chart;
        (window as any).Chart = vi
            .fn()
            .mockImplementation(function ChartMock(_canvas, _config) {
                return {
                    update: vi.fn(),
                    destroy: vi.fn(),
                    getDatasetMeta: vi.fn().mockReturnValue({
                        data: [
                            {},
                            {},
                            {},
                        ],
                    }),
                };
            });
        // theme
        document.body.classList.add("theme-light");
        (window as any).matchMedia = vi.fn().mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
        (window as any).localStorage.clear?.();
    });
    afterEach(() => {
        (window as any).Chart = originalChart;
        document.body.replaceChildren();
        vi.doUnmock("../../../utils/data/zones/chartZoneColorUtils.js");
        vi.restoreAllMocks();
        vi.resetModules();
    });

    it("renders doughnut with data colors and pushes instance", async () => {
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
        const canvas = container.querySelector("canvas");
        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        expect(canvas?.id).toBe("chart-hr_zone-0");
        expect((window as any).Chart).toHaveBeenCalled();
        expect(Array.isArray((window as any)._chartjsInstances)).toBe(true);
        expect((window as any)._chartjsInstances.length).toBe(1);

        const config = (window as any).Chart.mock.calls[0][1];
        expect(config.type).toBe("doughnut");
        expect(config.data.labels).toEqual([
            "Z1",
            "Z2",
        ]);
        expect(config.data.datasets[0].data).toEqual([
            10,
            20,
        ]);
        expect(config.data.datasets[0].backgroundColor).toEqual([
            "#111111",
            "#222222",
        ]);
        expect(config.options.plugins.legend.display).toBe(true);
    });

    it("renders bar config when chartType=bar and uses zoneType colors fallback", async () => {
        vi.doMock("../../../utils/data/zones/chartZoneColorUtils.js", () => ({
            getZoneTypeFromField: (id: string) =>
                id.includes("power") ? "power" : "hr",
            getChartZoneColors: (_type: string, n: number) =>
                Array.from({ length: n }, (_, i) => `#00${i}${i}${i}${i}`),
        }));
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
        const canvas = container.querySelector("canvas");
        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        expect(canvas?.id).toBe("chart-power_zone-0");
        expect((window as any).Chart).toHaveBeenCalled();

        const config = (window as any).Chart.mock.calls[0][1];
        expect(config.type).toBe("bar");
        expect(config.data.labels).toEqual([
            "Z1",
            "Z2",
            "Z3",
        ]);
        expect(config.data.datasets[0].data).toEqual([
            5,
            15,
            25,
        ]);
        expect(config.data.datasets[0].backgroundColor).toEqual([
            "#000000",
            "#001111",
            "#002222",
        ]);
        expect(config.options.plugins.legend.display).toBe(false);
    });

    it("gracefully returns on invalid inputs", async () => {
        const warnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => undefined);
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
        expect(document.querySelectorAll("canvas")).toHaveLength(0);
        expect((window as any).Chart).not.toHaveBeenCalled();
        expect((window as any)._chartjsInstances).toHaveLength(0);
    });
});
