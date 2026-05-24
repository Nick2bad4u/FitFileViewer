import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../utils/files/export/exportUtils.js", () => ({
    exportUtils: {
        downloadChartAsPNG: vi.fn(),
    },
}));
vi.mock("../../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: vi.fn(),
}));

describe("exportAllCharts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (window as any)._chartjsInstances = [];
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("warns when no charts", async () => {
        const { exportUtils } =
            await import("../../../../utils/files/export/exportUtils.js");
        const notif =
            await import("../../../../utils/ui/notifications/showNotification.js");
        const { exportAllCharts } =
            await import("../../../../utils/files/export/exportAllCharts.js");
        const result = exportAllCharts();
        expect(result).toBeUndefined();
        expect((window as any)._chartjsInstances).toEqual([]);
        expect(exportUtils.downloadChartAsPNG).not.toHaveBeenCalled();
        expect(notif.showNotification).toHaveBeenCalledWith(
            "No charts available to export",
            "warning"
        );
    });

    it("warns when the chart registry is invalid", async () => {
        const { exportUtils } =
            await import("../../../../utils/files/export/exportUtils.js");
        const notif =
            await import("../../../../utils/ui/notifications/showNotification.js");
        (window as any)._chartjsInstances = { stale: true };

        const { exportAllCharts } =
            await import("../../../../utils/files/export/exportAllCharts.js");
        const result = exportAllCharts();

        expect(result).toBeUndefined();
        expect((window as any)._chartjsInstances).toEqual({ stale: true });
        expect(exportUtils.downloadChartAsPNG).not.toHaveBeenCalled();
        expect(notif.showNotification).toHaveBeenCalledWith(
            "No charts available to export",
            "warning"
        );
    });

    it("exports each chart and shows success", async () => {
        const { exportUtils } =
            await import("../../../../utils/files/export/exportUtils.js");
        const notif =
            await import("../../../../utils/ui/notifications/showNotification.js");
        const mkChart = (label: string) =>
            ({
                data: { datasets: [{ label }] },
                toBase64Image: () => "",
            }) as any;
        const charts = [
            mkChart("Speed"),
            mkChart("Power Output"),
        ];
        (window as any)._chartjsInstances = charts;

        const { exportAllCharts } =
            await import("../../../../utils/files/export/exportAllCharts.js");
        const result = exportAllCharts();
        expect(result).toBeUndefined();
        expect((window as any)._chartjsInstances).toBe(charts);
        expect(exportUtils.downloadChartAsPNG).toHaveBeenCalledTimes(2);
        expect(exportUtils.downloadChartAsPNG).toHaveBeenNthCalledWith(
            1,
            charts[0],
            "speed-chart.png"
        );
        expect(exportUtils.downloadChartAsPNG).toHaveBeenNthCalledWith(
            2,
            charts[1],
            "power-output-chart.png"
        );
        expect(notif.showNotification).toHaveBeenCalledWith(
            "Exported 2 charts",
            "success"
        );
    });

    it("handles errors gracefully and notifies", async () => {
        const { exportUtils } =
            await import("../../../../utils/files/export/exportUtils.js");
        const notif =
            await import("../../../../utils/ui/notifications/showNotification.js");
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => undefined);
        const exportError = new Error("boom");
        (exportUtils.downloadChartAsPNG as any).mockImplementation(() => {
            throw exportError;
        });
        (window as any)._chartjsInstances = [
            { data: { datasets: [{ label: "X" }] } } as any,
        ];
        const { exportAllCharts } =
            await import("../../../../utils/files/export/exportAllCharts.js");
        const result = exportAllCharts();
        expect(result).toBeUndefined();
        expect((window as any)._chartjsInstances).toHaveLength(1);
        expect(exportUtils.downloadChartAsPNG).toHaveBeenCalledWith(
            (window as any)._chartjsInstances[0],
            "x-chart.png"
        );
        expect(errorSpy).toHaveBeenCalledWith(
            "Error exporting all charts:",
            exportError
        );
        expect(notif.showNotification).toHaveBeenCalledWith(
            "Failed to export charts",
            "error"
        );
    });
});
