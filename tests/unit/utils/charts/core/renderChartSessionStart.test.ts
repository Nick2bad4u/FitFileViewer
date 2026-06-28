import { describe, expect, it, vi } from "vitest";

import { beginChartRenderSession } from "../../../../../electron-app/utils/charts/core/renderChartSessionStart.js";
import type { RendererStateUpdateOptions } from "../../../../../electron-app/utils/state/domain/rendererStateUpdateOptions.js";

describe("renderChartSessionStart", () => {
    it("starts rendering and clears chart state through typed fallback patches", async () => {
        expect.assertions(5);

        const clearChartRenderState =
            vi.fn<(options?: RendererStateUpdateOptions) => void>();
        const setChartRendering =
            vi.fn<
                (
                    rendering: boolean,
                    options?: RendererStateUpdateOptions
                ) => void
            >();
        const setLoadingState =
            vi.fn<
                (loading: boolean, options?: RendererStateUpdateOptions) => void
            >();
        const waitIfRapidRender = vi.fn(async () => undefined);

        const { performanceStart, ready } = await beginChartRenderSession(
            {
                clearChartRenderState,
                doc: document,
                getChartLifecycleActions: () => null,
                isLoadingStateSuppressed: () => false,
                now: () => 1234,
                setChartRendering,
                setLoadingState,
                waitIfRapidRender,
            },
            { targetContainer: document.createElement("div") }
        );

        expect(waitIfRapidRender).toHaveBeenCalledOnce();
        expect(setChartRendering).toHaveBeenCalledWith(true, {
            silent: false,
            source: "renderChartJS.start",
        });
        expect(setLoadingState).toHaveBeenCalledWith(true, {
            silent: false,
            source: "renderChartJS.start",
        });
        expect(clearChartRenderState).toHaveBeenCalledWith({
            silent: false,
            source: "renderChartJS.clear",
        });
        expect({ performanceStart, ready }).toStrictEqual({
            performanceStart: 1234,
            ready: true,
        });
    });
});
