import { describe, expect, it, vi } from "vitest";

import type { GenericInvokeChannel } from "../../electron-app/shared/ipc";
import type { ElectronAPI } from "../../electron-app/shared/preloadApi";
import { createPreloadSourceRequire } from "../vitest/helpers/preloadSourceRequire";

interface ThemeApiModule {
    createThemeApi: (options: {
        channels: {
            THEME_GET: "theme:get";
        };
        createSafeInvokeHandler: (
            channel: GenericInvokeChannel,
            methodName: string
        ) => (...args: unknown[]) => Promise<unknown>;
    }) => Pick<ElectronAPI, "getTheme">;
}

const requireFromTest = createPreloadSourceRequire(import.meta.url);
const { createThemeApi } = requireFromTest(
    "../../electron-app/preload/themeApi.js"
) as ThemeApiModule;

describe("preload theme API", () => {
    it("routes getTheme through the expected IPC channel", async () => {
        expect.assertions(1);

        const invokeCalls: Array<{
            args: unknown[];
            channel: GenericInvokeChannel;
            methodName: string;
        }> = [];
        const createSafeInvokeHandler = vi.fn(
            (channel: GenericInvokeChannel, methodName: string) =>
                async (...args: unknown[]) => {
                    invokeCalls.push({ args, channel, methodName });
                    return "dark";
                }
        );
        const api = createThemeApi({
            channels: {
                THEME_GET: "theme:get",
            },
            createSafeInvokeHandler,
        });

        await api.getTheme();

        expect(invokeCalls).toStrictEqual([
            { args: [], channel: "theme:get", methodName: "getTheme" },
        ]);
    });
});
