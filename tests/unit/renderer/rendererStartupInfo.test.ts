import { describe, expect, it, vi } from "vitest";

import {
    logRendererStartupInfo,
    type RendererStartupRuntimeInfo,
} from "../../../electron-app/renderer/rendererStartupInfo.js";

describe("rendererStartupInfo", () => {
    it("logs the startup banner without owning renderer initialization", () => {
        expect.assertions(1);
        const runtimeInfo: RendererStartupRuntimeInfo = { userAgent: "test" };
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
