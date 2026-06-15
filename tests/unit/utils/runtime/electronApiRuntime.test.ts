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

    it("resolves a matching API from an explicit scope", () => {
        expect.assertions(1);

        const api = {
            openExternal: vi.fn<(url: string) => Promise<boolean>>(),
        };
        const scope: RendererElectronApiScope = { electronAPI: api };

        expect(getRendererElectronApi(isExternalOpenApi, scope)).toBe(api);
    });

    it("falls back to a matching window API from an explicit scope", () => {
        expect.assertions(1);

        const api = {
            openExternal: vi.fn<(url: string) => Promise<boolean>>(),
        };
        const scope: RendererElectronApiScope = {
            window: { electronAPI: api },
        };

        expect(getRendererElectronApi(isExternalOpenApi, scope)).toBe(api);
    });

    it("resolves APIs from provider scopes", () => {
        expect.assertions(4);

        const directApi = {
            openExternal: vi.fn<(url: string) => Promise<boolean>>(),
        };
        const windowApi = {
            openExternal: vi.fn<(url: string) => Promise<boolean>>(),
        };
        const getElectronAPI = vi.fn(() => directApi);
        const getWindow = vi.fn(() => ({ electronAPI: windowApi }));

        expect(
            getRendererElectronApi(isExternalOpenApi, {
                getElectronAPI,
                getWindow,
            })
        ).toBe(directApi);
        expect(getElectronAPI).toHaveBeenCalledOnce();
        expect(getWindow).not.toHaveBeenCalled();

        expect(
            getRendererElectronApi(isExternalOpenApi, {
                getElectronAPI: () => undefined,
                getWindow,
            })
        ).toBe(windowApi);
    });

    it("ignores missing or malformed APIs", () => {
        expect.assertions(4);

        expect(getRendererElectronApi(isExternalOpenApi, {})).toBeNull();
        expect(
            getRendererElectronApi(isExternalOpenApi, { electronAPI: null })
        ).toBeNull();
        expect(
            getRendererElectronApi(isExternalOpenApi, { electronAPI: {} })
        ).toBeNull();
        expect(
            getRendererElectronApi(isExternalOpenApi, {
                window: { electronAPI: { openExternal: "nope" } },
            })
        ).toBeNull();
    });

    it("uses globalThis as the default scope", () => {
        expect.assertions(1);

        const api = {
            openExternal: vi.fn<(url: string) => Promise<boolean>>(),
        };
        vi.stubGlobal("electronAPI", api);

        expect(getRendererElectronApi(isExternalOpenApi)).toBe(api);
    });

    it("prefers a registered API candidate over ambient globals", () => {
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
        expect(getRendererElectronApi(isExternalOpenApi)).toBe(ambientApi);
    });
});
