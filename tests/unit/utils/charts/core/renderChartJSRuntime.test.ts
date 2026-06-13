import { describe, expect, it, vi } from "vitest";

import { getRenderChartJSRuntime } from "../../../../../electron-app/utils/charts/core/renderChartJSRuntime.js";

describe("renderChartJSRuntime", () => {
    it("reads high-resolution timing through the scoped performance runtime", () => {
        expect.assertions(2);

        const now = vi.fn(() => 42.5),
            utils = getRenderChartJSRuntime({
                performance: { now },
            });

        expect(utils.nowPerformance()).toBe(42.5);
        expect(now).toHaveBeenCalledWith();
    });

    it("falls back to the date clock when performance timing is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderChartJSRuntime({
            dateNow: () => 1234,
        });

        expect(utils.nowPerformance()).toBe(1234);
    });

    it("reads date timestamps through the scoped date clock", () => {
        expect.assertions(1);

        const utils = getRenderChartJSRuntime({
            dateNow: () => 5678,
        });

        expect(utils.now()).toBe(5678);
    });

    it("reports window availability through the scoped runtime", () => {
        expect.assertions(2);

        expect(getRenderChartJSRuntime({ window: {} }).isWindowAvailable()).toBe(
            true
        );
        expect(getRenderChartJSRuntime({}).isWindowAvailable()).toBe(false);
    });
});
