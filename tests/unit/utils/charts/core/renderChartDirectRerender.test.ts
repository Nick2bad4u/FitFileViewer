// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

const hasActiveFitChartDataMock = vi.hoisted(() =>
    vi.fn<() => boolean>(() => true)
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/fitChartDataState.js"),
    () => ({
        hasActiveFitChartData: hasActiveFitChartDataMock,
    })
);

import { createDebouncedDirectRerender } from "../../../../../electron-app/utils/charts/core/renderChartDirectRerender.js";

describe("createDebouncedDirectRerender", () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        hasActiveFitChartDataMock.mockReset();
        hasActiveFitChartDataMock.mockReturnValue(true);
    });

    it("renders through the injected chart container runtime", async () => {
        expect.assertions(4);

        vi.useFakeTimers();
        const container = document.createElement("section");
        const getStateManager = vi.fn(() => ({}));
        const renderChart = vi.fn<() => Promise<unknown>>(() =>
            Promise.resolve()
        );
        const rerender = createDebouncedDirectRerender({
            getStateManager,
            isDevelopmentEnvironment: () => false,
            renderChart,
            runtime: {
                queryChartContainer: () => container,
                querySelector: () => null,
            },
            waitMs: 25,
        });

        rerender("state update");
        await vi.advanceTimersByTimeAsync(25);

        expect(getStateManager).toHaveBeenCalledOnce();
        expect(hasActiveFitChartDataMock).toHaveBeenCalledOnce();
        expect(renderChart).toHaveBeenCalledOnce();
        expect(renderChart).toHaveBeenCalledWith(container);
    });

    it("skips rendering when no FIT chart data is active", async () => {
        expect.assertions(2);

        vi.useFakeTimers();
        hasActiveFitChartDataMock.mockReturnValue(false);
        const renderChart = vi.fn<() => Promise<unknown>>(() =>
            Promise.resolve()
        );
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        const rerender = createDebouncedDirectRerender({
            getStateManager: () => ({}),
            isDevelopmentEnvironment: () => true,
            renderChart,
            runtime: {
                queryChartContainer: () => document.createElement("section"),
                querySelector: () => null,
            },
            waitMs: 25,
        });

        rerender("state update");
        await vi.advanceTimersByTimeAsync(25);

        expect(renderChart).not.toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(
            "[ChartJS] Skipping direct re-render (state update) - no container or no data"
        );
    });
});
