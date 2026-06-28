import { describe, expect, it, vi } from "vitest";

import { resolveChartRenderSettings } from "../../../../../electron-app/utils/charts/core/renderChartRenderSettings.js";

describe("resolveChartRenderSettings", () => {
    it("stores resolved chart options through the typed chart-options setter", () => {
        expect.assertions(2);

        const setChartOptionsState = vi.fn();

        const view = resolveChartRenderSettings(
            {
                defaultMaxPoints: 5000,
                ensureDataSettingsSignature: () => "signature",
                getSettings: () => ({
                    chartType: "bar",
                    showGrid: "off",
                    showLegend: true,
                    showPoints: "on",
                }),
                resolvePerformanceSettings: () => ({
                    decimation: { enabled: false },
                    enableSpanGaps: false,
                    tickSampleSize: undefined,
                }),
                setChartOptionsState,
            },
            {
                processedAt: 1234,
                recordCount: 10,
            }
        );

        expect(view).toMatchObject({
            boolSettings: {
                showFill: false,
                showGrid: false,
                showLegend: true,
                showPoints: true,
                showTitle: true,
            },
            chartType: "bar",
            dataSettingsSignature: "signature",
            normalizedMaxPoints: 5000,
        });
        expect(setChartOptionsState).toHaveBeenCalledExactlyOnceWith(
            {
                boolSettings: view.boolSettings,
                chartType: "bar",
                performanceTuning: {
                    decimation: { enabled: false },
                    enableSpanGaps: false,
                    tickSampleSize: undefined,
                },
                processedAt: 1234,
                showGrid: "off",
                showLegend: true,
                showPoints: "on",
            },
            { silent: false, source: "renderChartsWithData" }
        );
    });
});
