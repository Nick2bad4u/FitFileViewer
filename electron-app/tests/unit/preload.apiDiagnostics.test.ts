import { createRequire } from "node:module";

import { describe, expect, it, vi } from "vitest";

interface ApiDiagnosticsModule {
    createApiDiagnostics: (options: {
        channels: Record<string, string>;
        contextBridge:
            | {
                  exposeInMainWorld?: (key: string, api: unknown) => void;
              }
            | null
            | undefined;
        events: Record<string, string>;
        ipcRenderer:
            | {
                  invoke?: (...args: unknown[]) => Promise<unknown>;
                  on?: (...args: unknown[]) => void;
                  send?: (...args: unknown[]) => void;
              }
            | null
            | undefined;
        isDevelopmentMode: () => boolean;
        preloadLog: (
            level: "error" | "info" | "warn",
            message: string,
            ...details: unknown[]
        ) => void;
    }) => {
        getChannelInfo: () => {
            channels: Record<string, string>;
            events: Record<string, string>;
            totalChannels: number;
            totalEvents: number;
        };
        validateAPI: () => boolean;
    };
}

const requireFromTest = createRequire(import.meta.url);
const { createApiDiagnostics } = requireFromTest(
    "../../preload/apiDiagnostics.js"
) as ApiDiagnosticsModule;

function createDiagnostics({
    contextBridge = {
        exposeInMainWorld: vi.fn<(key: string, api: unknown) => void>(),
    },
    isDevelopment = false,
    ipcRenderer = {
        invoke: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
        on: vi.fn<(...args: unknown[]) => void>(),
        send: vi.fn<(...args: unknown[]) => void>(),
    },
}: {
    contextBridge?: { exposeInMainWorld?: (key: string, api: unknown) => void };
    isDevelopment?: boolean;
    ipcRenderer?: {
        invoke?: (...args: unknown[]) => Promise<unknown>;
        on?: (...args: unknown[]) => void;
        send?: (...args: unknown[]) => void;
    };
} = {}) {
    const preloadLog =
        vi.fn<
            (
                level: "error" | "info" | "warn",
                message: string,
                ...details: unknown[]
            ) => void
        >();

    return {
        diagnostics: createApiDiagnostics({
            channels: {
                APP_VERSION: "getAppVersion",
                THEME_GET: "theme:get",
            },
            contextBridge,
            events: {
                MENU_OPEN_FILE: "menu-open-file",
            },
            ipcRenderer,
            isDevelopmentMode: () => isDevelopment,
            preloadLog,
        }),
        preloadLog,
    };
}

describe("preload API diagnostics", () => {
    it("reports channel and event metadata", () => {
        expect.assertions(2);

        const { diagnostics } = createDiagnostics();
        const channelInfo = diagnostics.getChannelInfo();

        expect(channelInfo).toStrictEqual({
            channels: {
                APP_VERSION: "getAppVersion",
                THEME_GET: "theme:get",
            },
            events: {
                MENU_OPEN_FILE: "menu-open-file",
            },
            totalChannels: 2,
            totalEvents: 1,
        });
        expect(channelInfo.totalChannels).not.toBe(0);
    });

    it("validates required Electron preload surfaces", () => {
        expect.assertions(3);

        const { diagnostics: validDiagnostics } = createDiagnostics();
        const { diagnostics: invalidDiagnostics } = createDiagnostics({
            ipcRenderer: {
                invoke: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
                send: vi.fn<(...args: unknown[]) => void>(),
            },
        });

        expect(validDiagnostics.validateAPI() ? "valid" : "invalid").toBe(
            "valid"
        );
        expect(invalidDiagnostics.validateAPI() ? "valid" : "invalid").toBe(
            "invalid"
        );
        expect(invalidDiagnostics.getChannelInfo().totalChannels).toBe(2);
    });

    it("logs validation details in development mode", () => {
        expect.assertions(2);

        const { diagnostics, preloadLog } = createDiagnostics({
            isDevelopment: true,
        });

        expect(diagnostics.validateAPI() ? "valid" : "invalid").toBe("valid");
        expect(preloadLog).toHaveBeenCalledWith(
            "info",
            "[preload.js] API Validation:",
            {
                channelCount: 2,
                eventCount: 1,
                hasContextBridge: true,
                hasIpcRenderer: true,
            }
        );
    });

    it("logs validation failures and returns false", () => {
        expect.assertions(2);

        const preloadLog =
            vi.fn<
                (
                    level: "error" | "info" | "warn",
                    message: string,
                    ...details: unknown[]
                ) => void
            >();
        const diagnostics = createApiDiagnostics({
            channels: {},
            contextBridge: {
                get exposeInMainWorld(): () => void {
                    throw new Error("context failed");
                },
            },
            events: {},
            ipcRenderer: undefined,
            isDevelopmentMode: () => false,
            preloadLog,
        });

        expect(diagnostics.validateAPI() ? "valid" : "invalid").toBe(
            "invalid"
        );
        expect(preloadLog).toHaveBeenCalledWith(
            "error",
            "[preload.js] API validation failed:",
            expect.any(Error)
        );
    });
});
