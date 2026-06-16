import { describe, expect, it } from "vitest";

import { getRendererEnvironmentRuntime } from "../../../../../electron-app/utils/app/initialization/rendererEnvironmentRuntime.js";

describe("rendererEnvironmentRuntime", () => {
    it("returns the injected global scope", () => {
        expect.assertions(1);

        const globalScope = {
            location: {
                hostname: "localhost",
            },
        };
        const utils = getRendererEnvironmentRuntime({ globalScope });

        expect(utils.getDefaultRendererEnvironmentScope()).toBe(globalScope);
    });

    it("falls back to an empty scope when no global scope is available", () => {
        expect.assertions(1);

        const utils = getRendererEnvironmentRuntime({});

        expect(utils.getDefaultRendererEnvironmentScope()).toStrictEqual({});
    });
});
