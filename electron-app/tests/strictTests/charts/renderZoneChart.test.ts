import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

async function loadModule() {
    return await import("../../../utils/charts/rendering/renderZoneChart.js");
}

describe("renderZoneChart", () => {
    let originalChart: any;
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
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
        expect(container.querySelector("canvas")).toBeTruthy();
        expect((window as any).Chart).toHaveBeenCalled();
        expect(Array.isArray((window as any)._chartjsInstances)).toBe(true);
        expect((window as any)._chartjsInstances.length).toBe(1);
    });

    it("renders bar config when chartType=bar and uses zoneType colors fallback", async () => {
        vi.mock("../../../utils/data/zones/chartZoneColorUtils.js", () => ({
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
        expect(container.querySelector("canvas")).toBeTruthy();
        expect((window as any).Chart).toHaveBeenCalled();
    });

    it("gracefully returns on invalid inputs", async () => {
        const { renderZoneChart } = await loadModule();
        renderZoneChart(null as any, "X", [] as any, "id");
        renderZoneChart(document.body, "X", null as any, "id");
        expect(true).toBe(true);
    });
});
