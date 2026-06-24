import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getRendererElectronApi,
    registerRendererElectronApiCandidate,
    resetRendererElectronApiCandidate,
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
        resetRendererElectronApiCandidate();
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

    it("does not read ambient globals from the default scope", () => {
        expect.assertions(1);

        const api = {
            openExternal: vi.fn<(url: string) => Promise<boolean>>(),
        };
        vi.stubGlobal("electronAPI", api);

        expect(getRendererElectronApi(isExternalOpenApi)).toBeNull();
    });

    it("uses a registered API candidate instead of ambient globals", () => {
        expect.assertions(2);

        const ambientApi = {
            openExternal: vi.fn<(url: string) => Promise<boolean>>(),
        };
        const registeredApi = {
            openExternal: vi.fn<(url: string) => Promise<boolean>>(),
        };
        vi.stubGlobal("electronAPI", ambientApi);

        registerRendererElectronApiCandidate(registeredApi);
        expect(getRendererElectronApi(isExternalOpenApi)).toBe(registeredApi);

        resetRendererElectronApiCandidate();
        expect(getRendererElectronApi(isExternalOpenApi)).toBeNull();
    });

    it("prefers an explicit provider scope over the registered fallback", () => {
        expect.assertions(1);

        const registeredApi = {
            openExternal: vi.fn<(url: string) => Promise<boolean>>(),
        };
        const scopedApi = {
            openExternal: vi.fn<(url: string) => Promise<boolean>>(),
        };

        registerRendererElectronApiCandidate(registeredApi);

        expect(
            getRendererElectronApi(isExternalOpenApi, {
                getElectronAPI: () => scopedApi,
            })
        ).toBe(scopedApi);
    });
});
