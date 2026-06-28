import { describe, expect, it, vi } from "vitest";

import { resolveChartRuntimeDependencies } from "../../../../../electron-app/utils/charts/core/renderChartRuntimeDependencies.js";

describe("resolveChartRuntimeDependencies", () => {
    it("does not expose retired generic chart state aliases", async () => {
        expect.assertions(2);

        const dependencies = await resolveChartRuntimeDependencies({
            getConverters: () => vi.fn(),
            getHoverPlugins: () => ({
                addChartHoverEffects: vi.fn(),
                addHoverEffectsToExistingCharts: vi.fn(),
                removeChartHoverEffects: vi.fn(),
            }),
            getRendererModules: () => ({
                createChartCanvas: vi.fn(),
                createEnhancedChart: vi.fn(),
                renderEventMessagesChart: vi.fn(),
                renderGPSTimeChart: vi.fn(),
                renderGPSTrackChart: vi.fn(),
                renderLapZoneCharts: vi.fn(),
                renderPerformanceAnalysisCharts: vi.fn(),
                renderTimeInZoneCharts: vi.fn(),
            }),
            getShowRenderNotification: () => vi.fn(),
            getThemeConfig: () => ({ mode: "test" }),
        });

        expect(dependencies).toEqual(
            expect.not.objectContaining({
                gs_rcwd: expect.anything(),
                ss_rcwd: expect.anything(),
                us_rcwd: expect.anything(),
            })
        );
        expect(Object.keys(dependencies)).not.toEqual(
            expect.arrayContaining([
                "gs_rcwd",
                "ss_rcwd",
                "us_rcwd",
            ])
        );
    });
});
