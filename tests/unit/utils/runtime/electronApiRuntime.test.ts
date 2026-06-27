import { afterEach, describe, expect, it, vi } from "vitest";

import {
    createRendererElectronApiScope,
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../../../electron-app/utils/runtime/electronApiRuntime.js";

type ExternalOpenApi = {
    openExternal: (url: string) => Promise<boolean>;
};

function isExternalOpenApi(value: unknown): value is ExternalOpenApi {
    return (
        typeof value === "object" &&
        value !== null &&
        "openExternal" in value &&
        typeof value.openExternal === "function"
    );
}

describe("electronApiRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("resolves a matching API from an explicit provider scope", () => {
        expect.assertions(1);

        const api = {
            openExternal: vi.fn<(url: string) => Promise<boolean>>(),
        };
        const scope: RendererElectronApiScope = {
            getElectronAPI: () => api,
        };

        expect(getRendererElectronApi(isExternalOpenApi, scope)).toBe(api);
    });

    it("resolves APIs from provider scopes", () => {
        expect.assertions(3);

        const directApi = {
            openExternal: vi.fn<(url: string) => Promise<boolean>>(),
        };
        const getElectronAPI = vi.fn(() => directApi);

        expect(
            getRendererElectronApi(isExternalOpenApi, {
                getElectronAPI,
            })
        ).toBe(directApi);
        expect(getElectronAPI).toHaveBeenCalledOnce();

        expect(
            getRendererElectronApi(isExternalOpenApi, {
                getElectronAPI: () => undefined,
            })
        ).toBeNull();
    });

    it("creates explicit provider scopes without reading the API eagerly", () => {
        expect.assertions(3);

        const api = {
            openExternal: vi.fn<(url: string) => Promise<boolean>>(),
        };
        const getElectronAPI = vi.fn(() => api);

        const utils = createRendererElectronApiScope(getElectronAPI);

        expect(getElectronAPI).not.toHaveBeenCalled();
        expect(getRendererElectronApi(isExternalOpenApi, utils)).toBe(api);
        expect(getElectronAPI).toHaveBeenCalledOnce();
    });

    it("ignores missing or malformed APIs", () => {
        expect.assertions(3);

        expect(getRendererElectronApi(isExternalOpenApi, {})).toBeNull();
        expect(
            getRendererElectronApi(isExternalOpenApi, {
                getElectronAPI: () => null,
            })
        ).toBeNull();
        expect(
            getRendererElectronApi(isExternalOpenApi, {
                getElectronAPI: () => ({}),
            })
        ).toBeNull();
    });

    it("ignores legacy direct Electron API scope properties", () => {
        expect.assertions(1);

        const api = {
            openExternal: vi.fn<(url: string) => Promise<boolean>>(),
        };

        expect(
            getRendererElectronApi(isExternalOpenApi, {
                electronAPI: api,
            } as unknown as RendererElectronApiScope)
        ).toBeNull();
    });

    it("reads the preload-exposed API through the centralized default provider", () => {
        expect.assertions(1);

        const api = {
            openExternal: vi.fn<(url: string) => Promise<boolean>>(),
        };
        vi.stubGlobal("electronAPI", api);

        expect(getRendererElectronApi(isExternalOpenApi)).toBe(api);
    });
});
