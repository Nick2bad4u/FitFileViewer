import { describe, expect, it, vi } from "vitest";

import type { GenericInvokeChannel } from "../../electron-app/shared/ipc";
import type { ElectronAPI } from "../../electron-app/shared/preloadApi";
import { createThemeApi } from "../../electron-app/preload/themeApi.js";

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
