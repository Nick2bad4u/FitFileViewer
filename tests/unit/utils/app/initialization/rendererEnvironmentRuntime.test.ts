import { afterEach, describe, expect, it, vi } from "vitest";

import { getRendererEnvironmentRuntime } from "../../../../../electron-app/utils/app/initialization/rendererEnvironmentRuntime.js";

describe("rendererEnvironmentRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns the injected focused environment input", () => {
        expect.assertions(1);

        const environmentInput = {
            developmentFlag: true,
            document: { documentElement: { dataset: {} } },
            location: { hostname: "localhost" },
        };
        const utils = getRendererEnvironmentRuntime({
            getDevelopmentFlag: () => environmentInput.developmentFlag,
            getDocument: () => environmentInput.document,
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
            location: undefined,
        });
    });

    it("uses shared browser providers for production defaults", () => {
        expect.assertions(3);

        vi.stubGlobal("__DEVELOPMENT__", true);

        const utils = getRendererEnvironmentRuntime();
        const {
            developmentFlag,
            document: runtimeDocument,
            location,
        } = utils.getDefaultRendererEnvironmentInput();

        expect(developmentFlag).toBe(true);
        expect(runtimeDocument).toBe(document);
        expect(location).toBe(globalThis.location);
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
            location: undefined,
        });
    });
});
