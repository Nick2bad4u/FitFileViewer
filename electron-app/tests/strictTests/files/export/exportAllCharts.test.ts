import { describe, it, expect, vi, beforeEach } from "vitest";

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
        (window as any)._chartjsInstances = [];
    });

    it("warns when no charts", async () => {
        const notif =
            await import("../../../../utils/ui/notifications/showNotification.js");
        const { exportAllCharts } =
            await import("../../../../utils/files/export/exportAllCharts.js");
        exportAllCharts();
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
        (window as any)._chartjsInstances = [
            mkChart("Speed"),
            mkChart("Power Output"),
        ];

        const { exportAllCharts } =
            await import("../../../../utils/files/export/exportAllCharts.js");
        exportAllCharts();
        expect(exportUtils.downloadChartAsPNG).toHaveBeenCalledTimes(2);
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
        (exportUtils.downloadChartAsPNG as any).mockImplementation(() => {
            throw new Error("boom");
        });
        (window as any)._chartjsInstances = [
            { data: { datasets: [{ label: "X" }] } } as any,
        ];
        const { exportAllCharts } =
            await import("../../../../utils/files/export/exportAllCharts.js");
        exportAllCharts();
        expect(notif.showNotification).toHaveBeenCalledWith(
            "Failed to export charts",
            "error"
        );
    });
});
