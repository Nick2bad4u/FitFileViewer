import { describe, expect, it, vi } from "vitest";

import type { ElectronAPI } from "../../electron-app/shared/preloadApi";
import {
    DEVELOPMENT_TOOLS_GLOBAL_NAME,
    exposeDevelopmentToolsGlobal,
} from "../../electron-app/preload/developmentToolsGlobal.js";
interface ExposedDevelopmentToolsApi {
    getPreloadInfo: () => {
        apiMethods: string[];
        constants: unknown;
        timestamp: string;
        version: string;
    };
    logAPIState: () => void;
    testIPC: () => Promise<boolean>;
}

function createApi(getAppVersion = vi.fn<() => Promise<string>>()) {
    return {
        getAppVersion,
        validateAPI: () => true,
    } as ElectronAPI;
}

describe("preload development tools global", () => {
    it("does not expose development helpers outside development mode", () => {
        expect.assertions(2);

        const exposeInMainWorld =
            vi.fn<(key: string, exposedApi: unknown) => void>();

        expect(
            exposeDevelopmentToolsGlobal({
                api: createApi(),
                constants: {},
                contextBridge: { exposeInMainWorld },
                isDevelopmentMode: () => false,
                preloadLog: vi.fn(),
            })
        ).toBe(false);
        expect(exposeInMainWorld).not.toHaveBeenCalled();
    });

    it("exposes development helpers in development mode", async () => {
        expect.assertions(7);

        const getAppVersion = vi.fn<() => Promise<string>>(() =>
            Promise.resolve("29.9.0")
        );
        const api = createApi(getAppVersion);
        const constants = { channels: { APP_VERSION: "getAppVersion" } };
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
            exposeDevelopmentToolsGlobal({
                api,
                constants,
                contextBridge: { exposeInMainWorld },
                isDevelopmentMode: () => true,
                preloadLog,
            })
        ).toBe(true);

        const exposedApi = exposeInMainWorld.mock.calls[0]?.[1] as
            | ExposedDevelopmentToolsApi
            | undefined;

        expect(exposeInMainWorld).toHaveBeenCalledWith(
            DEVELOPMENT_TOOLS_GLOBAL_NAME,
            exposedApi
        );
        expect(exposedApi?.getPreloadInfo()).toMatchObject({
            apiMethods: Object.keys(api),
            constants,
            version: "1.0.0",
        });
        exposedApi?.logAPIState();
        await expect(exposedApi?.testIPC()).resolves.toBe(true);
        expect(getAppVersion).toHaveBeenCalledOnce();
        expect(preloadLog).toHaveBeenCalledWith(
            "info",
            "[preload.js] Development tools exposed"
        );
        expect(preloadLog).toHaveBeenCalledWith(
            "info",
            "[preload.js] Current API State:",
            expect.objectContaining({
                constants,
                electronAPI: "object",
                methodCount: Object.keys(api).length,
            })
        );
    });

    it("logs failed development helper exposure", () => {
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
            exposeDevelopmentToolsGlobal({
                api: createApi(),
                constants: {},
                contextBridge: null,
                isDevelopmentMode: () => true,
                preloadLog,
            })
        ).toBe(false);
        expect(preloadLog).toHaveBeenCalledWith(
            "error",
            "[preload.js] Failed to expose development tools:",
            expect.any(Error)
        );
    });
});
