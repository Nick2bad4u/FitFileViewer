import { describe, expect, it, vi } from "vitest";

import { createChartStateView } from "../../../../../electron-app/utils/charts/core/renderChartStateView.js";

const activeFitChartDataMock = vi.hoisted(() =>
    vi.fn(() => ({ rawData: null, ready: false }))
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/fitChartDataState.js"),
    () => ({
        getActiveFitChartData: activeFitChartDataMock,
    })
);

describe("createChartStateView", () => {
    it("reads selected chart and controls visibility through typed dependencies", () => {
        expect.assertions(8);

        const dependencies = {
            areChartControlsVisible: vi.fn(() => false),
            areChartsRendered: vi.fn(() => true),
            getChartData: vi.fn(() => ({ rows: [1] })),
            getChartOptions: vi.fn(() => ({ responsive: true })),
            getFieldVisibility: vi.fn(() => "visible"),
            getFormatChartFields: vi.fn(() => []),
            getSelectedChart: vi.fn(() => "power"),
            isChartRendering: vi.fn(() => false),
        };

        const chartState = createChartStateView(dependencies);

        expect(chartState.chartData).toStrictEqual({ rows: [1] });
        expect(chartState.chartOptions).toStrictEqual({ responsive: true });
        expect(chartState.controlsVisible).toBe(false);
        expect(chartState.selectedChart).toBe("power");
        expect(dependencies.getChartData).toHaveBeenCalledWith();
        expect(dependencies.getChartOptions).toHaveBeenCalledWith();
        expect(dependencies.areChartControlsVisible).toHaveBeenCalledWith();
        expect(dependencies.getSelectedChart).toHaveBeenCalledWith();
    });
});
