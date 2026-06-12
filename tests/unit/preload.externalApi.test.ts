import { createRequire } from "node:module";

import { describe, expect, it, vi } from "vitest";

import type { GenericInvokeChannel } from "../../electron-app/shared/ipc";
import type { ElectronAPI } from "../../electron-app/shared/preloadApi";

interface GyazoExternalApiModule {
    createGyazoExternalApi: (options: {
        channels: {
            GYAZO_OAUTH_CALLBACK: string;
            GYAZO_SERVER_START: "gyazo:server:start";
            GYAZO_SERVER_STOP: "gyazo:server:stop";
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
        "onGyazoOAuthCallback" | "startGyazoServer" | "stopGyazoServer"
    >;
}

interface ShellExternalApiModule {
    createShellExternalApi: (options: {
        channels: {
            SHELL_OPEN_EXTERNAL: "shell:openExternal";
        };
        createSafeInvokeHandler: (
            channel: GenericInvokeChannel,
            methodName: string
        ) => (...args: unknown[]) => Promise<unknown>;
    }) => Pick<ElectronAPI, "openExternal">;
}

interface ExternalApiDomainModule {
    createPreloadExternalApiDomain: (options: {
        constants: {
            CHANNELS: {
                GYAZO_SERVER_START: "gyazo:server:start";
                GYAZO_SERVER_STOP: "gyazo:server:stop";
                SHELL_OPEN_EXTERNAL: "shell:openExternal";
            };
            EVENTS: {
                GYAZO_OAUTH_CALLBACK: string;
            };
        };
        createSafeEventHandler: (
            channel: string,
            methodName: string
        ) => (callback: (...args: unknown[]) => unknown) => () => void;
        createSafeInvokeHandler: (
            channel: GenericInvokeChannel,
            methodName: string
        ) => (...args: unknown[]) => Promise<unknown>;
        modules: {
            createGyazoExternalApi: GyazoExternalApiModule["createGyazoExternalApi"];
            createShellExternalApi: ShellExternalApiModule["createShellExternalApi"];
        };
    }) => {
        gyazoExternalApi: Pick<
            ElectronAPI,
            "onGyazoOAuthCallback" | "startGyazoServer" | "stopGyazoServer"
        >;
        shellExternalApi: Pick<ElectronAPI, "openExternal">;
    };
}

const requireFromTest = createRequire(import.meta.url);
const { createPreloadExternalApiDomain } = requireFromTest(
    "../../electron-app/preload/externalApiDomain.js"
) as ExternalApiDomainModule;
const { createGyazoExternalApi } = requireFromTest(
    "../../electron-app/preload/gyazoExternalApi.js"
) as GyazoExternalApiModule;
const { createShellExternalApi } = requireFromTest(
    "../../electron-app/preload/shellExternalApi.js"
) as ShellExternalApiModule;

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
