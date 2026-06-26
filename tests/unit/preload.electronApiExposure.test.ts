import { describe, expect, it, vi } from "vitest";

import type { ElectronAPI } from "../../electron-app/shared/preloadApi";
import {
    exposeElectronApi,
    getApiStructure,
} from "../../electron-app/preload/electronApiExposure.js";

function createApi(validateAPI: () => boolean = () => true): ElectronAPI {
    return {
        getChannelInfo: () => ({
            channels: {},
            events: {},
            totalChannels: 0,
            totalEvents: 0,
        }),
        validateAPI,
    } as ElectronAPI;
}

describe("preload electron API exposure", () => {
    it("classifies API methods and properties without mutating the API", () => {
        expect.assertions(2);

        const api = Object.assign(createApi(), {
            apiVersion: "test",
        });

        expect(getApiStructure(api)).toStrictEqual({
            methods: ["getChannelInfo", "validateAPI"],
            properties: ["apiVersion"],
            total: 3,
        });
        expect(api.apiVersion).toBe("test");
    });

    it("exposes a validated electronAPI object to the main world", () => {
        expect.assertions(3);

        const api = createApi();
        const exposeInMainWorld =
            vi.fn<(key: string, exposedApi: unknown) => void>();
        const preloadLog =
            vi.fn<
                (
                    level: "error" | "info" | "warn",
                    message: string,
                    ...details: unknown[]
                ) => void
            >();

        expect(
            exposeElectronApi({
                api,
                contextBridge: { exposeInMainWorld },
                isDevelopmentMode: () => false,
                preloadLog,
            })
        ).toBe(true);
        expect(exposeInMainWorld).toHaveBeenCalledWith("electronAPI", api);
        expect(preloadLog).not.toHaveBeenCalled();
    });

    it("does not expose the API when validation fails", () => {
        expect.assertions(3);

        const exposeInMainWorld =
            vi.fn<(key: string, exposedApi: unknown) => void>();
        const preloadLog =
            vi.fn<
                (
                    level: "error" | "info" | "warn",
                    message: string,
                    ...details: unknown[]
                ) => void
            >();

        expect(
            exposeElectronApi({
                api: createApi(() => false),
                contextBridge: { exposeInMainWorld },
                isDevelopmentMode: () => false,
                preloadLog,
            })
        ).toBe(false);
        expect(exposeInMainWorld).not.toHaveBeenCalled();
        expect(preloadLog).toHaveBeenCalledWith(
            "error",
            "[preload.js] API validation failed - not exposing to main world"
        );
    });

    it("logs failed exposure when contextBridge is unavailable", () => {
        expect.assertions(2);

        const preloadLog =
            vi.fn<
                (
                    level: "error" | "info" | "warn",
                    message: string,
                    ...details: unknown[]
                ) => void
            >();

        expect(
            exposeElectronApi({
                api: createApi(),
                contextBridge: null,
                isDevelopmentMode: () => false,
                preloadLog,
            })
        ).toBe(false);
        expect(preloadLog).toHaveBeenCalledWith(
            "error",
            "[preload.js] Failed to expose electronAPI:",
            expect.any(TypeError)
        );
    });

    it("logs API structure in development mode", () => {
        expect.assertions(2);

        const api = createApi();
        const preloadLog =
            vi.fn<
                (
                    level: "error" | "info" | "warn",
                    message: string,
                    ...details: unknown[]
                ) => void
            >();

        expect(
            exposeElectronApi({
                api,
                contextBridge: {
                    exposeInMainWorld:
                        vi.fn<(key: string, exposedApi: unknown) => void>(),
                },
                isDevelopmentMode: () => true,
                preloadLog,
            })
        ).toBe(true);
        expect(preloadLog).toHaveBeenCalledWith(
            "info",
            "[preload.js] API Structure:",
            getApiStructure(api)
        );
    });
});
