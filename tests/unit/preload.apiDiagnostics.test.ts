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
    "../../electron-app/preload/apiDiagnostics.js"
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
    contextBridge?:
        | { exposeInMainWorld?: (key: string, api: unknown) => void }
        | null
        | undefined;
    isDevelopment?: boolean;
    ipcRenderer?:
        | {
              invoke?: (...args: unknown[]) => Promise<unknown>;
              on?: (...args: unknown[]) => void;
              send?: (...args: unknown[]) => void;
          }
        | null
        | undefined;
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
    });

    it("validates required Electron preload surfaces", () => {
        expect.assertions(6);

        const { diagnostics: validDiagnostics, preloadLog } =
            createDiagnostics();
        const invalidCases = [
            {
                expectedMetadata: {
                    totalChannels: 2,
                    totalEvents: 1,
                },
                name: "missing contextBridge",
                options: {
                    contextBridge: null,
                },
            },
            {
                expectedMetadata: {
                    totalChannels: 2,
                    totalEvents: 1,
                },
                name: "missing ipcRenderer.invoke",
                options: {
                    ipcRenderer: {
                        on: vi.fn<(...args: unknown[]) => void>(),
                        send: vi.fn<(...args: unknown[]) => void>(),
                    },
                },
            },
            {
                expectedMetadata: {
                    totalChannels: 2,
                    totalEvents: 1,
                },
                name: "missing ipcRenderer.on",
                options: {
                    ipcRenderer: {
                        invoke: vi.fn<
                            (...args: unknown[]) => Promise<unknown>
                        >(),
                        send: vi.fn<(...args: unknown[]) => void>(),
                    },
                },
            },
            {
                expectedMetadata: {
                    totalChannels: 2,
                    totalEvents: 1,
                },
                name: "missing ipcRenderer.send",
                options: {
                    ipcRenderer: {
                        invoke: vi.fn<
                            (...args: unknown[]) => Promise<unknown>
                        >(),
                        on: vi.fn<(...args: unknown[]) => void>(),
                    },
                },
            },
        ] as const;

        expect(validDiagnostics.validateAPI()).toBe(true);
        expect(preloadLog).not.toHaveBeenCalled();

        for (const invalidCase of invalidCases) {
            const { diagnostics } = createDiagnostics(invalidCase.options);

            expect({
                isValid: diagnostics.validateAPI(),
                name: invalidCase.name,
                totals: {
                    totalChannels: diagnostics.getChannelInfo().totalChannels,
                    totalEvents: diagnostics.getChannelInfo().totalEvents,
                },
            }).toStrictEqual({
                isValid: false,
                name: invalidCase.name,
                totals: invalidCase.expectedMetadata,
            });
        }
    });

    it("logs validation details in development mode", () => {
        expect.assertions(2);

        const { diagnostics, preloadLog } = createDiagnostics({
            isDevelopment: true,
        });

        expect(diagnostics.validateAPI()).toBe(true);
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

        expect(diagnostics.validateAPI()).toBe(false);
        expect(preloadLog).toHaveBeenCalledWith(
            "error",
            "[preload.js] API validation failed:",
            expect.any(Error)
        );
    });
});
