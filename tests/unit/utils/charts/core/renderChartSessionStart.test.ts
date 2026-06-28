import { describe, expect, it, vi } from "vitest";

import { beginChartRenderSession } from "../../../../../electron-app/utils/charts/core/renderChartSessionStart.js";
import type { ChartClearStatePatch } from "../../../../../electron-app/utils/charts/core/renderChartLifecycle.js";
import type { ChartStateUpdateOptions } from "../../../../../electron-app/utils/charts/core/renderChartStateAccess.js";

describe("renderChartSessionStart", () => {
    it("starts rendering and clears chart state through typed fallback patches", async () => {
        expect.assertions(5);

        const setChartRendering =
            vi.fn<
                (rendering: boolean, options?: ChartStateUpdateOptions) => void
            >();
        const setState =
            vi.fn<
                (
                    path: string,
                    value: unknown,
                    options?: ChartStateUpdateOptions
                ) => void
            >();
        const updateState =
            vi.fn<
                (
                    path: string,
                    value: ChartClearStatePatch,
                    options?: ChartStateUpdateOptions
                ) => void
            >();
        const waitIfRapidRender = vi.fn(async () => undefined);

        const { performanceStart, ready } = await beginChartRenderSession(
            {
                doc: document,
                getChartLifecycleActions: () => null,
                isLoadingStateSuppressed: () => false,
                now: () => 1234,
                setChartRendering,
                setState,
                updateState,
                waitIfRapidRender,
            },
            { targetContainer: document.createElement("div") }
        );

        expect(waitIfRapidRender).toHaveBeenCalledOnce();
        expect(setChartRendering).toHaveBeenCalledWith(true, {
            silent: false,
            source: "renderChartJS.start",
        });
        expect(setState).toHaveBeenCalledWith("isLoading", true, {
            silent: false,
            source: "renderChartJS.start",
        });
        expect(updateState).toHaveBeenCalledWith(
            "charts",
            { chartData: null, isRendered: false, renderedCount: 0 },
            { silent: false, source: "renderChartJS.clear" }
        );
        expect({ performanceStart, ready }).toStrictEqual({
            performanceStart: 1234,
            ready: true,
        });
    });
});
