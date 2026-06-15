import { describe, expect, it, vi } from "vitest";

import type { GenericInvokeChannel } from "../../electron-app/shared/ipc";
import { createPreloadExternalApiDomain } from "../../electron-app/preload/externalApiDomain.js";
import { createGyazoExternalApi } from "../../electron-app/preload/gyazoExternalApi.js";
import { createShellExternalApi } from "../../electron-app/preload/shellExternalApi.js";

function createExternalHandlerSpies(): {
    createSafeEventHandler: ReturnType<typeof vi.fn>;
    createSafeInvokeHandler: ReturnType<typeof vi.fn>;
    eventHandlers: Array<{ channel: string; methodName: string }>;
    invokeCalls: Array<{
        args: unknown[];
        channel: GenericInvokeChannel;
        methodName: string;
    }>;
} {
    const eventHandlers: Array<{ channel: string; methodName: string }> = [];
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

    return {
        createSafeEventHandler,
        createSafeInvokeHandler,
        eventHandlers,
        invokeCalls,
    };
}

describe("preload external API", () => {
    it("assembles shell and Gyazo APIs through split external domains", async () => {
        expect.assertions(2);

        const {
            createSafeEventHandler,
            createSafeInvokeHandler,
            eventHandlers,
            invokeCalls,
        } = createExternalHandlerSpies();
        const { gyazoExternalApi, shellExternalApi } =
            createPreloadExternalApiDomain({
                constants: {
                    CHANNELS: {
                        GYAZO_SERVER_START: "gyazo:server:start",
                        GYAZO_SERVER_STOP: "gyazo:server:stop",
                        SHELL_OPEN_EXTERNAL: "shell:openExternal",
                    },
                    EVENTS: {
                        GYAZO_OAUTH_CALLBACK: "gyazo-oauth-callback",
                    },
                },
                createSafeEventHandler,
                createSafeInvokeHandler,
                modules: {
                    createGyazoExternalApi,
                    createShellExternalApi,
                },
            });

        gyazoExternalApi.onGyazoOAuthCallback(vi.fn());
        await shellExternalApi.openExternal("https://example.com/");
        await gyazoExternalApi.startGyazoServer(3000);
        await gyazoExternalApi.stopGyazoServer();

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

    it("keeps Gyazo server and OAuth methods in the Gyazo domain", async () => {
        expect.assertions(2);

        const {
            createSafeEventHandler,
            createSafeInvokeHandler,
            eventHandlers,
            invokeCalls,
        } = createExternalHandlerSpies();
        const api = createGyazoExternalApi({
            channels: {
                GYAZO_OAUTH_CALLBACK: "gyazo-oauth-callback",
                GYAZO_SERVER_START: "gyazo:server:start",
                GYAZO_SERVER_STOP: "gyazo:server:stop",
            },
            createSafeEventHandler,
            createSafeInvokeHandler,
        });

        api.onGyazoOAuthCallback(vi.fn());
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

    it("keeps shell navigation in the shell external domain", async () => {
        expect.assertions(1);

        const { createSafeInvokeHandler, invokeCalls } =
            createExternalHandlerSpies();
        const api = createShellExternalApi({
            channels: {
                SHELL_OPEN_EXTERNAL: "shell:openExternal",
            },
            createSafeInvokeHandler,
        });

        await api.openExternal("https://example.com/");

        expect(invokeCalls).toStrictEqual([
            {
                args: ["https://example.com/"],
                channel: "shell:openExternal",
                methodName: "openExternal",
            },
        ]);
    });
});
