import { describe, expect, it, vi } from "vitest";

import { resolveChartRuntimeDependencies } from "../../../../../electron-app/utils/charts/core/renderChartRuntimeDependencies.js";

describe("resolveChartRuntimeDependencies", () => {
    it("does not expose the retired generic chart set-state alias", async () => {
        expect.assertions(2);

        const setState = vi.fn();
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
            getStateManager: () => ({
                getState: vi.fn(),
                setState,
                updateState: vi.fn(),
            }),
            getThemeConfig: () => ({ mode: "test" }),
        });

        expect(dependencies).not.toHaveProperty("ss_rcwd");
        expect(setState).not.toHaveBeenCalled();
    });
});
