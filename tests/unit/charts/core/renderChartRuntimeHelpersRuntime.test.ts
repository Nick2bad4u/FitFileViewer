import { describe, expect, it } from "vitest";

import {
    getRenderChartRuntimeHelpersRuntime,
    type ProcessShim,
    type RenderChartRuntimeHelpersRuntimeScope,
} from "../../../../electron-app/utils/charts/core/renderChartRuntimeHelpersRuntime.js";

describe("render chart runtime helpers runtime", () => {
    it("returns an injected process shim", () => {
        expect.assertions(2);

        const processShim: ProcessShim = { env: { NODE_ENV: "test" } },
            utils = getRenderChartRuntimeHelpersRuntime({
                getProcess: () => processShim,
            });

        expect(utils.getProcessShim()).toBe(processShim);
        expect(utils.getProcessEnvironmentValue("NODE_ENV")).toBe("test");
    });

    it("prefers the injected process environment provider", () => {
        expect.assertions(1);

        const utils = getRenderChartRuntimeHelpersRuntime({
            getProcess: () => ({ env: { NODE_ENV: "development" } }),
            getProcessEnvironmentValue: (name) =>
                name === "NODE_ENV" ? "test" : undefined,
        });

        expect(utils.getProcessEnvironmentValue("NODE_ENV")).toBe("test");
    });

    it("creates a process shim when the scoped provider has no process object", () => {
        expect.assertions(3);

        let processShim: ProcessShim | undefined;
        const utils = getRenderChartRuntimeHelpersRuntime({
            getProcess: () => undefined,
            setProcess: (nextProcessShim) => {
                processShim = nextProcessShim;
            },
        });
        const ensuredProcessShim = utils.ensureProcessShim();

        expect(ensuredProcessShim).toStrictEqual({});
        expect(processShim).toBe(ensuredProcessShim);
        expect(utils.getProcessShim()).toBeNull();
    });

    it("ignores legacy direct runtime environment properties", () => {
        expect.assertions(1);

        const legacyProcessShim: ProcessShim = {
                env: { NODE_ENV: "development" },
            },
            utils = getRenderChartRuntimeHelpersRuntime({
                chartRuntimeEnvironment: { process: legacyProcessShim },
            } as unknown as RenderChartRuntimeHelpersRuntimeScope);

        expect(utils.getProcessShim()).toBeNull();
    });
});
