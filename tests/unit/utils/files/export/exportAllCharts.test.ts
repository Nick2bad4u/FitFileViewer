import { describe, expect, it, vi } from "vitest";

const notificationMock = vi.hoisted(() =>
    vi.fn<(message: string, type: string) => void>()
);
const downloadChartAsPNGMock = vi.hoisted(() =>
    vi.fn<(chart: unknown, filename: string) => void>()
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: notificationMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/files/export/exportUtils.js"),
    () => ({
        exportUtils: {
            downloadChartAsPNG: downloadChartAsPNGMock,
        },
    })
);

import { exportAllCharts } from "../../../../../electron-app/utils/files/export/exportAllCharts.js";
import {
    clearChartInstanceRegistryForTests,
    getRegisteredChartInstances,
    setRegisteredChartInstances,
} from "../../../../../electron-app/utils/charts/core/chartInstanceRegistry.js";

type TestChart = {
    readonly data?: {
        readonly datasets?: Array<{ readonly label?: unknown }>;
    };
};

function createChart(label?: unknown): TestChart {
    return {
        data: {
            datasets: [{ label }],
        },
    };
}

function resetTestState(): void {
    vi.restoreAllMocks();
    notificationMock.mockReset();
    downloadChartAsPNGMock.mockReset();
    clearChartInstanceRegistryForTests();
}

describe(exportAllCharts, () => {
    it("shows a warning when no chart instances are available", () => {
        expect.assertions(3);

        resetTestState();

        exportAllCharts();

        expect(getRegisteredChartInstances()).toStrictEqual([]);
        expect(notificationMock).toHaveBeenCalledWith(
            "No charts available to export",
            "warning"
        );
        expect(downloadChartAsPNGMock).not.toHaveBeenCalled();

        resetTestState();
    });

    it("exports every chart with a sanitized filename", () => {
        expect.assertions(5);

        resetTestState();
        const powerChart = createChart("Power Output"),
            fallbackChart = createChart(123);
        setRegisteredChartInstances([powerChart, fallbackChart]);

        exportAllCharts();

        expect(getRegisteredChartInstances()).toStrictEqual([
            powerChart,
            fallbackChart,
        ]);
        expect(downloadChartAsPNGMock).toHaveBeenCalledTimes(2);
        expect(downloadChartAsPNGMock).toHaveBeenNthCalledWith(
            1,
            powerChart,
            "power-output-chart.png"
        );
        expect(downloadChartAsPNGMock).toHaveBeenNthCalledWith(
            2,
            fallbackChart,
            "chart-1-chart.png"
        );
        expect(notificationMock).toHaveBeenCalledWith(
            "Exported 2 charts",
            "success"
        );

        resetTestState();
    });

    it("logs and notifies when exporting a chart throws", () => {
        expect.assertions(4);

        resetTestState();
        const error = new Error("download failed"),
            errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        setRegisteredChartInstances([createChart("Speed")]);
        downloadChartAsPNGMock.mockImplementation(() => {
            throw error;
        });

        exportAllCharts();

        expect(getRegisteredChartInstances()).toHaveLength(1);
        expect(errorSpy).toHaveBeenCalledWith(
            "Error exporting all charts:",
            error
        );
        expect(notificationMock).toHaveBeenCalledWith(
            "Failed to export charts",
            "error"
        );
        expect(downloadChartAsPNGMock).toHaveBeenCalledOnce();

        resetTestState();
    });
});
