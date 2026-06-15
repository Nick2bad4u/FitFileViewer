import { describe, expect, it, vi } from "vitest";

import type { GenericInvokeChannel } from "../../electron-app/shared/ipc";
import type { ElectronAPI } from "../../electron-app/shared/preloadApi";
import { createAppInfoApi } from "../../electron-app/preload/appInfoApi.js";

describe("preload app info API", () => {
    it("routes version, license, and platform methods through expected IPC channels", async () => {
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
                    return `${methodName}:result`;
                }
        );
        const api = createAppInfoApi({
            channels: {
                APP_VERSION: "getAppVersion",
                CHROME_VERSION: "getChromeVersion",
                ELECTRON_VERSION: "getElectronVersion",
                LICENSE_INFO: "getLicenseInfo",
                NODE_VERSION: "getNodeVersion",
                PLATFORM_INFO: "getPlatformInfo",
            },
            createSafeInvokeHandler,
        });

        await api.getAppVersion();
        await api.getChromeVersion();
        await api.getElectronVersion();
        await api.getLicenseInfo();
        await api.getNodeVersion();
        await api.getPlatformInfo();

        expect(invokeCalls).toStrictEqual([
            {
                args: [],
                channel: "getAppVersion",
                methodName: "getAppVersion",
            },
            {
                args: [],
                channel: "getChromeVersion",
                methodName: "getChromeVersion",
            },
            {
                args: [],
                channel: "getElectronVersion",
                methodName: "getElectronVersion",
            },
            {
                args: [],
                channel: "getLicenseInfo",
                methodName: "getLicenseInfo",
            },
            {
                args: [],
                channel: "getNodeVersion",
                methodName: "getNodeVersion",
            },
            {
                args: [],
                channel: "getPlatformInfo",
                methodName: "getPlatformInfo",
            },
        ]);
    });
});
