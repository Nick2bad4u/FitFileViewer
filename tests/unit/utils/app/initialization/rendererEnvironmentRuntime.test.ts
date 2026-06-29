import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getRendererEnvironmentRuntime,
    type RendererEnvironmentRuntimeScope,
} from "../../../../../electron-app/utils/app/initialization/rendererEnvironmentRuntime.js";

describe("rendererEnvironmentRuntime", () => {
    function createRendererEnvironmentRuntimeScope(
        overrides: Partial<RendererEnvironmentRuntimeScope> = {}
    ): RendererEnvironmentRuntimeScope {
        return {
            getDevelopmentFlag: () => undefined,
            getDocument: () => undefined,
            getLocation: () => undefined,
            ...overrides,
        };
    }

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
        const utils = getRendererEnvironmentRuntime(
            createRendererEnvironmentRuntimeScope({
                getDevelopmentFlag: () => environmentInput.developmentFlag,
                getDocument: () => environmentInput.document,
                getLocation: () => environmentInput.location,
            })
        );

        expect(utils.getDefaultRendererEnvironmentInput()).toStrictEqual(
            environmentInput
        );
    });

    it("falls back to an empty input when providers return no runtime values", () => {
        expect.assertions(1);

        const utils = getRendererEnvironmentRuntime(
            createRendererEnvironmentRuntimeScope()
        );

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

    it("requires explicit provider slots", () => {
        expect.assertions(1);

        expect(() =>
            getRendererEnvironmentRuntime({} as RendererEnvironmentRuntimeScope)
        ).toThrow("rendererEnvironment requires developmentFlag provider");
    });

    it("requires explicit provider slots and ignores legacy direct global scope properties", () => {
        expect.assertions(2);

        const globalScope = {
            location: {
                hostname: "legacy.localhost",
            },
        };
        const legacyScope = {
            globalScope,
        } as unknown as RendererEnvironmentRuntimeScope;

        expect(() => getRendererEnvironmentRuntime(legacyScope)).toThrow(
            "rendererEnvironment requires developmentFlag provider"
        );

        const utils = getRendererEnvironmentRuntime({
            ...legacyScope,
            ...createRendererEnvironmentRuntimeScope(),
        });

        expect(utils.getDefaultRendererEnvironmentInput()).toStrictEqual({
            developmentFlag: undefined,
            document: undefined,
            location: undefined,
        });
    });
});
