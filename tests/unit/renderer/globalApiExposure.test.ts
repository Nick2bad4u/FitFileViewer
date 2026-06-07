import { describe, expect, it, vi } from "vitest";

import {
    installRendererGlobalApiExposure,
    logRendererStartupInfo,
} from "../../../electron-app/renderer/globalApiExposure.js";

describe("globalApiExposure", () => {
    it("installs the remaining legacy renderer globals on the provided scope", () => {
        expect.assertions(3);
        const scope = {} as typeof globalThis;
        const appInfo = {
            getRuntimeInfo: () => ({ platform: "test" }),
            name: "Test App",
            version: "1.2.3",
        };
        const createExportGPXButton = vi.fn<() => HTMLButtonElement>();
        const resetStateInitializationForTests = vi.fn<() => void>();

        installRendererGlobalApiExposure({
            appInfo,
            createExportGPXButton,
            resetStateInitializationForTests,
            scope,
        });

        expect(Reflect.get(scope, "APP_INFO")).toBe(appInfo);
        expect(Reflect.get(scope, "createExportGPXButton")).toBe(
            createExportGPXButton
        );
        expect(
            Reflect.get(scope, "__resetRendererStateInitializationForTests")
        ).toBe(resetStateInitializationForTests);
    });

    it("logs the startup banner without owning renderer initialization", () => {
        expect.assertions(1);
        const runtimeInfo = { userAgent: "test" };
        const appInfo = {
            getRuntimeInfo: () => runtimeInfo,
            name: "Test App",
            version: "1.2.3",
        };
        const logRenderer =
            vi.fn<
                (
                    level: "group" | "groupEnd" | "log",
                    ...args: unknown[]
                ) => void
            >();

        logRendererStartupInfo({
            appInfo,
            environment: "test",
            logRenderer,
        });

        expect(logRenderer.mock.calls).toStrictEqual([
            ["group", "[Renderer] Application Startup"],
            [
                "log",
                "App:",
                "Test App",
                "v1.2.3",
            ],
            [
                "log",
                "Environment:",
                "test",
            ],
            [
                "log",
                "Runtime Info:",
                runtimeInfo,
            ],
            ["groupEnd"],
        ]);
    });
});
