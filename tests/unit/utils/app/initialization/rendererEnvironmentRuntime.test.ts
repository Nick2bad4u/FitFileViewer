import { describe, expect, it } from "vitest";

import { getRendererEnvironmentRuntime } from "../../../../../electron-app/utils/app/initialization/rendererEnvironmentRuntime.js";

describe("rendererEnvironmentRuntime", () => {
    it("returns the injected focused environment input", () => {
        expect.assertions(1);

        const environmentInput = {
            developmentFlag: true,
            document: { documentElement: { dataset: {} } },
            electronAPI: { __devMode: false },
            location: { hostname: "localhost" },
        };
        const utils = getRendererEnvironmentRuntime({
            getDevelopmentFlag: () => environmentInput.developmentFlag,
            getDocument: () => environmentInput.document,
            getElectronAPI: () => environmentInput.electronAPI,
            getLocation: () => environmentInput.location,
        });

        expect(utils.getDefaultRendererEnvironmentInput()).toStrictEqual(
            environmentInput
        );
    });

    it("falls back to an empty input when no providers are available", () => {
        expect.assertions(1);

        const utils = getRendererEnvironmentRuntime({});

        expect(utils.getDefaultRendererEnvironmentInput()).toStrictEqual({
            developmentFlag: undefined,
            document: undefined,
            electronAPI: undefined,
            location: undefined,
        });
    });

    it("ignores legacy direct global scope properties", () => {
        expect.assertions(1);

        const globalScope = {
            location: {
                hostname: "legacy.localhost",
            },
        };
        const utils = getRendererEnvironmentRuntime({
            globalScope,
        } as unknown as Parameters<typeof getRendererEnvironmentRuntime>[0]);

        expect(utils.getDefaultRendererEnvironmentInput()).toStrictEqual({
            developmentFlag: undefined,
            document: undefined,
            electronAPI: undefined,
            location: undefined,
        });
    });
});
