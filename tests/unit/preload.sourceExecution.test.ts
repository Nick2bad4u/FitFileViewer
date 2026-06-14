/* eslint-disable case-police/string-check -- devTools is the preload API contract name. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface ExposedElectronAPI {
    addRecentFile: (...args: unknown[]) => Promise<unknown>;
    getAppVersion: () => Promise<unknown>;
    getChannelInfo: () => {
        channels: Record<string, string>;
        events: Record<string, string>;
        totalChannels: number;
        totalEvents: number;
    };
    getTheme: () => Promise<unknown>;
    openFileDialog: () => Promise<unknown>;
    parseFitFile: (...args: unknown[]) => Promise<unknown>;
    validateAPI: () => boolean;
}

interface ExposedDevTools {
    getPreloadInfo: () => {
        apiMethods: string[];
        constants: {
            CHANNELS: Record<string, string>;
            DEFAULT_VALUES: {
                FIT_FILE_PATH: null | string;
                THEME: null | string;
            };
            EVENTS: Record<string, string>;
        };
        version: string;
    };
    logAPIState: () => void;
    testIPC: () => Promise<boolean>;
}

type TestGlobalProperty = "console";

const mockContextBridge = {
    exposeInMainWorld: vi.fn<(apiName: string, api: unknown) => void>(),
};

const mockIpcRenderer = {
    invoke: vi.fn<(channel: string, ...args: unknown[]) => Promise<unknown>>(),
    send: vi.fn<(channel: string, ...args: unknown[]) => void>(),
    on: vi.fn<
        (channel: string, listener: (...args: unknown[]) => void) => void
    >(),
    removeAllListeners: vi.fn<(channel: string) => void>(),
};

let preloadElectronBridgeMock: {
    contextBridge: typeof mockContextBridge;
    ipcRenderer: typeof mockIpcRenderer;
};
const originalGlobalDescriptors = new Map<
    TestGlobalProperty,
    PropertyDescriptor
>();

function setTestGlobal(name: TestGlobalProperty, value: unknown): void {
    if (!originalGlobalDescriptors.has(name)) {
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
        if (!descriptor) {
            throw new Error(`Expected globalThis.${name} to exist`);
        }
        originalGlobalDescriptors.set(name, descriptor);
    }

    Object.defineProperty(globalThis, name, {
        configurable: true,
        value,
        writable: true,
    });
}

function restoreTestGlobals(): void {
    for (const [name, descriptor] of originalGlobalDescriptors) {
        Object.defineProperty(globalThis, name, descriptor);
    }
    originalGlobalDescriptors.clear();
}

async function startPreloadWithElectronBridge(): Promise<void> {
    const { startPreloadEntrypoint } =
        await import("../../electron-app/preload/preloadEntrypoint.js");

    startPreloadEntrypoint({
        consoleRef: console,
        electronBridgeOverride: preloadElectronBridgeMock,
        globalScope: globalThis,
        processRef: process,
    });
}

function getRequiredExposeCall(apiName: string): [string, unknown] {
    const call = mockContextBridge.exposeInMainWorld.mock.calls.find(
        ([name]) => name === apiName
    );

    if (!call) {
        throw new TypeError(`Expected ${apiName} exposure`);
    }

    return call;
}

function getRequiredElectronAPI(): ExposedElectronAPI {
    return getRequiredExposeCall("electronAPI")[1] as ExposedElectronAPI;
}

function getRequiredDevTools(): ExposedDevTools {
    return getRequiredExposeCall("devTools")[1] as ExposedDevTools;
}

function getRequiredPreloadInfo(
    devTools: ExposedDevTools
): ReturnType<ExposedDevTools["getPreloadInfo"]> {
    const preloadInfo = devTools.getPreloadInfo();

    if (!preloadInfo) {
        throw new TypeError("Expected preload info");
    }

    return preloadInfo;
}

vi.mock(import("electron"), () => ({
    contextBridge: mockContextBridge,
    ipcRenderer: mockIpcRenderer,
}));

describe("preload.js source execution", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        process.env.NODE_ENV = "development";

        preloadElectronBridgeMock = {
            contextBridge: mockContextBridge,
            ipcRenderer: mockIpcRenderer,
        };

        setTestGlobal("console", {
            ...globalThis.console,
            log: vi.fn<(...data: unknown[]) => void>(),
            error: vi.fn<(...data: unknown[]) => void>(),
        });
    });

    afterEach(() => {
        vi.resetModules();
        restoreTestGlobals();

        delete process.env.NODE_ENV;

        preloadElectronBridgeMock = undefined as never;
    });

    describe("development mode execution", () => {
        it("should execute preload.js and expose electronAPI in development mode", async () => {
            expect.assertions(13);

            process.env.NODE_ENV = "development";

            await startPreloadWithElectronBridge();

            const electronAPI = getRequiredElectronAPI();
            const devTools = getRequiredDevTools();

            // Verify contextBridge.exposeInMainWorld was called for electronAPI
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                electronAPI
            );
            expect(
                Object.fromEntries(
                    [
                        "addRecentFile",
                        "getAppVersion",
                        "getChannelInfo",
                        "getTheme",
                        "openFileDialog",
                        "parseFitFile",
                        "validateAPI",
                    ].map((methodName) => [
                        methodName,
                        Object.hasOwn(electronAPI, methodName),
                    ])
                )
            ).toStrictEqual({
                addRecentFile: true,
                getAppVersion: true,
                getChannelInfo: true,
                getTheme: true,
                openFileDialog: true,
                parseFitFile: true,
                validateAPI: true,
            });

            // Verify devTools was also exposed in development mode
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "devTools",
                devTools
            );
            expect(
                Object.fromEntries(
                    [
                        "getPreloadInfo",
                        "logAPIState",
                        "testIPC",
                    ].map((methodName) => [
                        methodName,
                        Object.hasOwn(devTools, methodName),
                    ])
                )
            ).toStrictEqual({
                getPreloadInfo: true,
                logAPIState: true,
                testIPC: true,
            });

            // Verify development logging occurred
            expect(console.log).toHaveBeenCalledWith(
                "[preload.js] Successfully exposed electronAPI to main world"
            );

            expect(electronAPI.validateAPI()).toStrictEqual(true);
            const preloadInfo = getRequiredPreloadInfo(devTools);
            expect(preloadInfo.apiMethods).toStrictEqual(
                Object.keys(electronAPI)
            );
            expect(preloadInfo.apiMethods).toContain("getAppVersion");
            expect(preloadInfo.apiMethods).toContain("validateAPI");
            expect({
                APP_VERSION: preloadInfo.constants.CHANNELS.APP_VERSION,
                FIT_PARSE: preloadInfo.constants.CHANNELS.FIT_PARSE,
                THEME_GET: preloadInfo.constants.CHANNELS.THEME_GET,
            }).toStrictEqual({
                APP_VERSION: "getAppVersion",
                FIT_PARSE: "fit:parse",
                THEME_GET: "theme:get",
            });
            expect({
                OPEN_RECENT_FILE: preloadInfo.constants.EVENTS.OPEN_RECENT_FILE,
                SET_THEME: preloadInfo.constants.EVENTS.SET_THEME,
                THEME_CHANGED: preloadInfo.constants.EVENTS.THEME_CHANGED,
            }).toStrictEqual({
                OPEN_RECENT_FILE: "open-recent-file",
                SET_THEME: "set-theme",
                THEME_CHANGED: "theme-changed",
            });
            expect(preloadInfo.constants.DEFAULT_VALUES).toStrictEqual({
                FIT_FILE_PATH: null,
                THEME: null,
            });
            expect(preloadInfo.version).toBe("1.0.0");
        });

        it("should provide working API methods when executed", async () => {
            expect.assertions(12);

            process.env.NODE_ENV = "development";

            // Import preload.js so mocks are honored
            await startPreloadWithElectronBridge();

            // Get the exposed electronAPI from the mock call
            const electronAPICall = getRequiredExposeCall("electronAPI");
            expect(electronAPICall).toStrictEqual([
                "electronAPI",
                electronAPICall[1],
            ]);

            const electronAPI = electronAPICall[1] as ExposedElectronAPI;
            expect(
                Object.fromEntries(
                    ["getChannelInfo", "validateAPI"].map((methodName) => [
                        methodName,
                        Object.hasOwn(electronAPI, methodName),
                    ])
                )
            ).toStrictEqual({
                getChannelInfo: true,
                validateAPI: true,
            });

            // Test validateAPI method
            expect(electronAPI.validateAPI()).toStrictEqual(true);

            // Test getChannelInfo method
            const channelInfo = electronAPI.getChannelInfo();
            expect(channelInfo).toHaveProperty("channels");
            expect(channelInfo).toHaveProperty("events");
            expect(channelInfo).toHaveProperty("totalChannels");
            expect(channelInfo).toHaveProperty("totalEvents");
            expect(channelInfo.totalChannels).toBeTypeOf("number");
            expect(channelInfo.totalChannels).toBe(
                Object.keys(channelInfo.channels).length
            );
            expect(channelInfo.totalEvents).toBe(
                Object.keys(channelInfo.events).length
            );
            expect({
                APP_VERSION: channelInfo.channels.APP_VERSION,
                FIT_DECODE: channelInfo.channels.FIT_DECODE,
                FIT_PARSE: channelInfo.channels.FIT_PARSE,
                THEME_GET: channelInfo.channels.THEME_GET,
            }).toStrictEqual({
                APP_VERSION: "getAppVersion",
                FIT_DECODE: "fit:decode",
                FIT_PARSE: "fit:parse",
                THEME_GET: "theme:get",
            });
            expect({
                MENU_OPEN_FILE: channelInfo.events.MENU_OPEN_FILE,
                OPEN_RECENT_FILE: channelInfo.events.OPEN_RECENT_FILE,
                SET_THEME: channelInfo.events.SET_THEME,
                THEME_CHANGED: channelInfo.events.THEME_CHANGED,
            }).toStrictEqual({
                MENU_OPEN_FILE: "menu-open-file",
                OPEN_RECENT_FILE: "open-recent-file",
                SET_THEME: "set-theme",
                THEME_CHANGED: "theme-changed",
            });
        });

        it("should handle IPC invoke methods correctly", async () => {
            expect.assertions(2);

            process.env.NODE_ENV = "development";

            // Mock successful IPC response
            mockIpcRenderer.invoke.mockResolvedValue("test-result");

            await startPreloadWithElectronBridge();

            const electronAPI = getRequiredElectronAPI();

            // Test an invoke-based method
            const result = await electronAPI.getAppVersion();
            expect(result).toBe("test-result");
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getAppVersion"
            );
        });
    });

    describe("production mode execution", () => {
        it("should execute preload.js in production mode without devTools", async () => {
            expect.assertions(3);

            // Set production mode
            process.env.NODE_ENV = "production";

            await startPreloadWithElectronBridge();

            // Verify electronAPI was exposed
            const electronAPICall = getRequiredExposeCall("electronAPI");
            expect(electronAPICall).toStrictEqual([
                "electronAPI",
                electronAPICall[1],
            ]);
            const electronAPI = electronAPICall[1] as ExposedElectronAPI;
            expect(
                Object.fromEntries(
                    ["getChannelInfo", "validateAPI"].map((methodName) => [
                        methodName,
                        Object.hasOwn(electronAPI, methodName),
                    ])
                )
            ).toStrictEqual({
                getChannelInfo: true,
                validateAPI: true,
            });

            // Verify devTools was NOT exposed in production
            expect(
                mockContextBridge.exposeInMainWorld.mock.calls.map(
                    ([name]) => name
                )
            ).not.toContain("devTools");
        });
    });
});
/* eslint-enable case-police/string-check */
