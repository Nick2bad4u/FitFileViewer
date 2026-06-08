import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    clearChartInstanceRegistryForTests,
    getRegisteredChartInstances,
    setRegisteredChartInstances,
} from "../../../../../electron-app/utils/charts/core/chartInstanceRegistry.js";

type DownloadChartFn = (chart: unknown, filename: string) => void;
type NotificationFn = (message: string, type: string) => void;

vi.mock(
    import("../../../../../electron-app/utils/files/export/exportUtils.js"),
    () => ({
        exportUtils: {
            downloadChartAsPNG: vi.fn<DownloadChartFn>(),
        },
    })
);
vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: vi.fn<NotificationFn>(),
    })
);

describe("exportAllCharts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearChartInstanceRegistryForTests();
        setRegisteredChartInstances([]);
    });

    afterEach(() => {
        clearChartInstanceRegistryForTests();
        vi.restoreAllMocks();
    });

    it("warns when no charts", async () => {
        expect.assertions(4);

        const { exportUtils } =
            await import("../../../../../electron-app/utils/files/export/exportUtils.js");
        const notif =
            await import("../../../../../electron-app/utils/ui/notifications/showNotification.js");
        const { exportAllCharts } =
            await import("../../../../../electron-app/utils/files/export/exportAllCharts.js");
        const result = exportAllCharts();
        expect(result).toBeUndefined();
        expect(getRegisteredChartInstances()).toEqual([]);
        expect(exportUtils.downloadChartAsPNG).not.toHaveBeenCalled();
        expect(notif.showNotification).toHaveBeenCalledWith(
            "No charts available to export",
            "warning"
        );
    });

    it("warns when the chart registry is invalid", async () => {
        expect.assertions(4);

        const { exportUtils } =
            await import("../../../../../electron-app/utils/files/export/exportUtils.js");
        const notif =
            await import("../../../../../electron-app/utils/ui/notifications/showNotification.js");
        setRegisteredChartInstances([null, "stale"]);

        const { exportAllCharts } =
            await import("../../../../../electron-app/utils/files/export/exportAllCharts.js");
        const result = exportAllCharts();

        expect(result).toBeUndefined();
        expect(getRegisteredChartInstances()).toEqual([]);
        expect(exportUtils.downloadChartAsPNG).not.toHaveBeenCalled();
        expect(notif.showNotification).toHaveBeenCalledWith(
            "No charts available to export",
            "warning"
        );
    });

    it("exports each chart and shows success", async () => {
        expect.assertions(6);

        const { exportUtils } =
            await import("../../../../../electron-app/utils/files/export/exportUtils.js");
        const notif =
            await import("../../../../../electron-app/utils/ui/notifications/showNotification.js");
        const mkChart = (label: string) =>
            ({
                data: { datasets: [{ label }] },
                toBase64Image: () => "",
            }) as any;
        const charts = [mkChart("Speed"), mkChart("Power Output")];
        setRegisteredChartInstances(charts);

        const { exportAllCharts } =
            await import("../../../../../electron-app/utils/files/export/exportAllCharts.js");
        const result = exportAllCharts();
        expect(result).toBeUndefined();
        expect(getRegisteredChartInstances()).toStrictEqual(charts);
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
        expect.assertions(5);

        const { exportUtils } =
            await import("../../../../../electron-app/utils/files/export/exportUtils.js");
        const notif =
            await import("../../../../../electron-app/utils/ui/notifications/showNotification.js");
        const errorSpy = vi.spyOn(console, "error").mockReturnValue(undefined);
        const exportError = new Error("boom");
        vi.mocked(exportUtils.downloadChartAsPNG).mockImplementation(() => {
            throw exportError;
        });
        const chart = {
            data: { datasets: [{ label: "X" }] },
        } as any;
        setRegisteredChartInstances([chart]);
        const { exportAllCharts } =
            await import("../../../../../electron-app/utils/files/export/exportAllCharts.js");
        const result = exportAllCharts();
        expect(result).toBeUndefined();
        expect(getRegisteredChartInstances()).toHaveLength(1);
        expect(exportUtils.downloadChartAsPNG).toHaveBeenCalledWith(
            chart,
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
