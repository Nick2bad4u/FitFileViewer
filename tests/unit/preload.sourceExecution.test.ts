/* eslint-disable case-police/string-check -- devTools is the preload API contract name. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type PreloadExecutionGlobal = typeof globalThis & {
    __electronHoistedMock?: {
        contextBridge: typeof mockContextBridge;
        ipcRenderer: typeof mockIpcRenderer;
    };
};

interface ExposedElectronAPI {
    getAppVersion: () => Promise<unknown>;
    getChannelInfo: () => {
        channels: Record<string, string>;
        events: Record<string, string>;
        totalChannels: number;
        totalEvents: number;
    };
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
}

const preloadExecutionGlobal = globalThis as PreloadExecutionGlobal;

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

vi.mock(import("electron"), () => ({
    contextBridge: mockContextBridge,
    ipcRenderer: mockIpcRenderer,
}));

describe("preload.js source execution", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        process.env.NODE_ENV = "development";

        // Provide hoisted override so modules that resolve lazily see our mock
        preloadExecutionGlobal.__electronHoistedMock = {
            contextBridge: mockContextBridge,
            ipcRenderer: mockIpcRenderer,
        };

        global.console = {
            ...console,
            log: vi.fn<(...data: unknown[]) => void>(),
            error: vi.fn<(...data: unknown[]) => void>(),
        };
    });

    afterEach(() => {
        vi.resetModules();

        delete process.env.NODE_ENV;

        delete preloadExecutionGlobal.__electronHoistedMock;
    });

    describe("development mode execution", () => {
        it("should execute preload.js and expose electronAPI in development mode", async () => {
            expect.assertions(11);

            process.env.NODE_ENV = "development";

            await import("../../electron-app/preload.js");

            // Verify contextBridge.exposeInMainWorld was called for electronAPI
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                expect.objectContaining({
                    // Verify key API methods exist
                    addRecentFile: expect.any(Function),
                    getAppVersion: expect.any(Function),
                    openFileDialog: expect.any(Function),
                    parseFitFile: expect.any(Function),
                    getTheme: expect.any(Function),
                    validateAPI: expect.any(Function),
                    getChannelInfo: expect.any(Function),
                })
            );

            // Verify devTools was also exposed in development mode
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "devTools",
                expect.objectContaining({
                    getPreloadInfo: expect.any(Function),
                    logAPIState: expect.any(Function),
                    testIPC: expect.any(Function),
                })
            );

            // Verify development logging occurred
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining(
                    "[preload.js] Successfully exposed electronAPI to main world"
                )
            );

            const electronAPICall =
                mockContextBridge.exposeInMainWorld.mock.calls.find(
                    (call) => call[0] === "electronAPI"
                );
            const devToolsCall =
                mockContextBridge.exposeInMainWorld.mock.calls.find(
                    (call) => call[0] === "devTools"
                );
            const electronAPI = electronAPICall?.[1] as
                | ExposedElectronAPI
                | undefined;
            const devTools = devToolsCall?.[1] as ExposedDevTools | undefined;

            expect(electronAPI?.validateAPI()).toStrictEqual(true);
            const preloadInfo = devTools?.getPreloadInfo();
            expect(preloadInfo?.apiMethods).toStrictEqual(
                Object.keys(electronAPI!)
            );
            expect(preloadInfo?.apiMethods).toContain("getAppVersion");
            expect(preloadInfo?.apiMethods).toContain("validateAPI");
            expect(preloadInfo?.constants.CHANNELS).toMatchObject({
                APP_VERSION: "getAppVersion",
                FIT_PARSE: "fit:parse",
                THEME_GET: "theme:get",
            });
            expect(preloadInfo?.constants.EVENTS).toMatchObject({
                OPEN_RECENT_FILE: "open-recent-file",
                SET_THEME: "set-theme",
                THEME_CHANGED: "theme-changed",
            });
            expect(preloadInfo?.constants.DEFAULT_VALUES).toStrictEqual({
                FIT_FILE_PATH: null,
                THEME: null,
            });
            expect(preloadInfo?.version).toBe("1.0.0");
        });

        it("should provide working API methods when executed", async () => {
            expect.assertions(11);

            process.env.NODE_ENV = "development";

            // Import preload.js so mocks are honored
            await import("../../electron-app/preload.js");

            // Get the exposed electronAPI from the mock call
            const exposeMainWorldCalls =
                mockContextBridge.exposeInMainWorld.mock.calls;
            const electronAPICall = exposeMainWorldCalls.find(
                (call) => call[0] === "electronAPI"
            );
            expect(electronAPICall).toEqual([
                "electronAPI",
                expect.objectContaining({
                    getChannelInfo: expect.any(Function),
                    validateAPI: expect.any(Function),
                }),
            ]);

            const electronAPI = electronAPICall![1];

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
            expect(channelInfo.channels).toMatchObject({
                APP_VERSION: "getAppVersion",
                FIT_DECODE: "fit:decode",
                FIT_PARSE: "fit:parse",
                THEME_GET: "theme:get",
            });
            expect(channelInfo.events).toMatchObject({
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

            await import("../../electron-app/preload.js");

            const exposeMainWorldCalls =
                mockContextBridge.exposeInMainWorld.mock.calls;
            const electronAPICall = exposeMainWorldCalls.find(
                (call) => call[0] === "electronAPI"
            );
            const electronAPI = electronAPICall![1];

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
            expect.assertions(2);

            // Set production mode
            process.env.NODE_ENV = "production";

            await import("../../electron-app/preload.js");

            // Verify electronAPI was exposed
            const electronAPICall =
                mockContextBridge.exposeInMainWorld.mock.calls.find(
                    (call) => call[0] === "electronAPI"
                );
            expect(electronAPICall).toEqual([
                "electronAPI",
                expect.objectContaining({
                    getChannelInfo: expect.any(Function),
                    validateAPI: expect.any(Function),
                }),
            ]);

            // Verify devTools was NOT exposed in production
            const devToolsCall =
                mockContextBridge.exposeInMainWorld.mock.calls.find(
                    (call) => call[0] === "devTools"
                );
            expect(devToolsCall).toBeUndefined();
        });
    });
});
/* eslint-enable case-police/string-check */
