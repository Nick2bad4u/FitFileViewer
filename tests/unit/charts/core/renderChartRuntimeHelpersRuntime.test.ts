import { describe, expect, it } from "vitest";

import {
    getRenderChartRuntimeHelpersRuntime,
    type RenderChartRuntimeEnvironment,
} from "../../../../electron-app/utils/charts/core/renderChartRuntimeHelpersRuntime.js";

describe("render chart runtime helpers runtime", () => {
    it("returns an injected mutable chart runtime environment", () => {
        expect.assertions(1);

        const chartRuntimeEnvironment: RenderChartRuntimeEnvironment = {
                process: { env: { NODE_ENV: "test" } },
            },
            utils = getRenderChartRuntimeHelpersRuntime({
                chartRuntimeEnvironment,
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

    it("prefers the scoped provider over the static runtime object", () => {
        expect.assertions(1);

        const fallbackEnvironment: RenderChartRuntimeEnvironment = {
                process: { env: { NODE_ENV: "development" } },
            },
            providedEnvironment: RenderChartRuntimeEnvironment = {
                process: { env: { NODE_ENV: "test" } },
            },
            utils = getRenderChartRuntimeHelpersRuntime({
                chartRuntimeEnvironment: fallbackEnvironment,
                getChartRuntimeEnvironment: () => providedEnvironment,
            });

        expect(utils.getMutableChartRuntimeEnvironment()).toBe(
            providedEnvironment
        );
    });
});
