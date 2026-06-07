import { createRequire } from "node:module";

import { describe, expect, it, vi } from "vitest";

import type { GenericInvokeChannel } from "../../electron-app/shared/ipc";
import type { ElectronAPI } from "../../electron-app/shared/preloadApi";

interface ExternalApiModule {
    createExternalApi: (options: {
        channels: {
            GYAZO_OAUTH_CALLBACK: string;
            GYAZO_SERVER_START: "gyazo:server:start";
            GYAZO_SERVER_STOP: "gyazo:server:stop";
            SHELL_OPEN_EXTERNAL: "shell:openExternal";
        };
        createSafeEventHandler: (
            channel: string,
            methodName: string
        ) => (callback: (...args: unknown[]) => unknown) => () => void;
        createSafeInvokeHandler: (
            channel: GenericInvokeChannel,
            methodName: string
        ) => (...args: unknown[]) => Promise<unknown>;
    }) => Pick<
        ElectronAPI,
        | "onGyazoOAuthCallback"
        | "openExternal"
        | "startGyazoServer"
        | "stopGyazoServer"
    >;
}

const requireFromTest = createRequire(import.meta.url);
const { createExternalApi } = requireFromTest(
    "../../electron-app/preload/externalApi.js"
) as ExternalApiModule;

describe("preload external API", () => {
    it("routes shell and Gyazo methods through expected IPC channels", async () => {
        expect.assertions(2);

        const eventHandlers: Array<{ channel: string; methodName: string }> =
            [];
        const invokeCalls: Array<{
            args: unknown[];
            channel: GenericInvokeChannel;
            methodName: string;
        }> = [];
        const createSafeEventHandler = vi.fn(
            (channel: string, methodName: string) =>
                (_callback: (...args: unknown[]) => unknown) => {
                    eventHandlers.push({ channel, methodName });
                    return () => undefined;
                }
        );
        const createSafeInvokeHandler = vi.fn(
            (channel: GenericInvokeChannel, methodName: string) =>
                async (...args: unknown[]) => {
                    invokeCalls.push({ args, channel, methodName });
                    return `${methodName}:result`;
                }
        );
        const api = createExternalApi({
            channels: {
                GYAZO_OAUTH_CALLBACK: "gyazo-oauth-callback",
                GYAZO_SERVER_START: "gyazo:server:start",
                GYAZO_SERVER_STOP: "gyazo:server:stop",
                SHELL_OPEN_EXTERNAL: "shell:openExternal",
            },
            createSafeEventHandler,
            createSafeInvokeHandler,
        });

        api.onGyazoOAuthCallback(vi.fn());
        await api.openExternal("https://example.com/");
        await api.startGyazoServer(3000);
        await api.stopGyazoServer();

        expect(eventHandlers).toStrictEqual([
            {
                channel: "gyazo-oauth-callback",
                methodName: "onGyazoOAuthCallback",
            },
        ]);
        expect(invokeCalls).toStrictEqual([
            {
                args: ["https://example.com/"],
                channel: "shell:openExternal",
                methodName: "openExternal",
            },
            {
                args: [3000],
                channel: "gyazo:server:start",
                methodName: "startGyazoServer",
            },
            {
                args: [],
                channel: "gyazo:server:stop",
                methodName: "stopGyazoServer",
            },
        ]);
    });
});
