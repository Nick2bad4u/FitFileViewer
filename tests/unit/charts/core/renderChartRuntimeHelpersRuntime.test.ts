import { describe, expect, it } from "vitest";

import {
    getRenderChartRuntimeHelpersRuntime,
    type RenderChartRuntimeEnvironment,
    type RenderChartRuntimeHelpersRuntimeScope,
} from "../../../../electron-app/utils/charts/core/renderChartRuntimeHelpersRuntime.js";

describe("render chart runtime helpers runtime", () => {
    it("returns an injected mutable chart runtime environment", () => {
        expect.assertions(1);

        const chartRuntimeEnvironment: RenderChartRuntimeEnvironment = {
                process: { env: { NODE_ENV: "test" } },
            },
            utils = getRenderChartRuntimeHelpersRuntime({
                getChartRuntimeEnvironment: () => chartRuntimeEnvironment,
            });

        expect(utils.getMutableChartRuntimeEnvironment()).toBe(
            chartRuntimeEnvironment
        );
    });

    it("returns an empty environment when the scoped provider has no runtime object", () => {
        expect.assertions(1);

        const utils = getRenderChartRuntimeHelpersRuntime({
            getChartRuntimeEnvironment: () => undefined,
        });

        expect(utils.getMutableChartRuntimeEnvironment()).toStrictEqual({});
    });

    it("ignores legacy direct runtime environment properties", () => {
        expect.assertions(1);

        const legacyEnvironment: RenderChartRuntimeEnvironment = {
                process: { env: { NODE_ENV: "development" } },
            },
            utils = getRenderChartRuntimeHelpersRuntime({
                chartRuntimeEnvironment: legacyEnvironment,
            } as unknown as RenderChartRuntimeHelpersRuntimeScope);

        expect(utils.getMutableChartRuntimeEnvironment()).toStrictEqual({});
    });
});
