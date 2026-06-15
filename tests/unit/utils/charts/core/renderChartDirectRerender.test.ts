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

import { createDebouncedDirectRerender as createDebouncedDirectChartUpdate } from "../../../../../electron-app/utils/charts/core/renderChartDirectRerender.js";

describe("createDebouncedDirectRerender", () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        hasActiveFitChartDataMock.mockReset();
        hasActiveFitChartDataMock.mockReturnValue(true);
    });

    it("renders through the injected chart container runtime", async () => {
        expect.assertions(5);

        vi.useFakeTimers();
        const container = document.createElement("section");
        const getStateManager = vi.fn(() => ({}));
        const renderChart = vi.fn<() => Promise<unknown>>(() => {
            container.dataset.rendered = "true";
            return Promise.resolve();
        });
        const directChartUpdate = createDebouncedDirectChartUpdate({
            getStateManager,
            isDevelopmentEnvironment: () => false,
            renderChart,
            runtime: {
                queryChartContainer: () => container,
                querySelector: () => null,
            },
            waitMs: 25,
        });

        directChartUpdate("state update");
        await vi.advanceTimersByTimeAsync(25);

        expect(container.dataset.rendered).toBe("true");
        expect(getStateManager).toHaveBeenCalledOnce();
        expect(hasActiveFitChartDataMock).toHaveBeenCalledOnce();
        expect(renderChart).toHaveBeenCalledOnce();
        expect(renderChart).toHaveBeenCalledWith(container);
    });

    it("skips rendering when no FIT chart data is active", async () => {
        expect.assertions(3);

        vi.useFakeTimers();
        hasActiveFitChartDataMock.mockReturnValue(false);
        const container = document.createElement("section");
        const renderChart = vi.fn<() => Promise<unknown>>(() =>
            Promise.resolve()
        );
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        const directChartUpdate = createDebouncedDirectChartUpdate({
            getStateManager: () => ({}),
            isDevelopmentEnvironment: () => true,
            renderChart,
            runtime: {
                queryChartContainer: () => container,
                querySelector: () => null,
            },
            waitMs: 25,
        });

        directChartUpdate("state update");
        await vi.advanceTimersByTimeAsync(25);

        expect(container.dataset.rendered).toBeUndefined();
        expect(renderChart).not.toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(
            "[ChartJS] Skipping direct re-render (state update) - no container or no data"
        );
    });
});
