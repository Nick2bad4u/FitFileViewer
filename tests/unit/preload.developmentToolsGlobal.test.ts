import { describe, expect, it, vi } from "vitest";

import {
    DEVELOPMENT_TOOLS_GLOBAL_NAME,
    exposeDevelopmentToolsGlobal,
} from "../../electron-app/preload/developmentToolsGlobal.js";

interface DevelopmentToolsElectronApi {
    getAppVersion: () => Promise<string>;
    validateAPI: () => boolean;
}

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

function createApi(
    getAppVersion = vi.fn<() => Promise<string>>()
): DevelopmentToolsElectronApi {
    return {
        getAppVersion,
        validateAPI: () => true,
    };
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
        expect.assertions(8);

        vi.useFakeTimers();

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

        try {
            vi.setSystemTime(new Date("2026-01-02T03:04:05.006Z"));

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
            const preloadInfo = exposedApi?.getPreloadInfo();

            expect(exposeInMainWorld).toHaveBeenCalledWith(
                DEVELOPMENT_TOOLS_GLOBAL_NAME,
                exposedApi
            );
            expect(preloadInfo).toMatchObject({
                apiMethods: Object.keys(api),
                constants,
                version: "1.0.0",
            });
            expect(preloadInfo?.timestamp).toBe("2026-01-02T03:04:05.006Z");
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
                    timestamp: "2026-01-02T03:04:05.006Z",
                })
            );
        } finally {
            vi.useRealTimers();
        }
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
