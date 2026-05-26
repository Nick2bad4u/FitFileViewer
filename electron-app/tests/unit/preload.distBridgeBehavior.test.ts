/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { resolvePreloadScriptRequire } from "../helpers/preloadModuleMocks";

interface ChannelInfo {
    channels: Record<string, unknown>;
    events: Record<string, unknown>;
    totalChannels: number;
    totalEvents: number;
}

interface ExposedPreloadApi {
    [methodName: string]: (...args: unknown[]) => unknown;
    getChannelInfo: () => ChannelInfo;
    validateAPI: () => boolean;
}

interface ExposedDevToolsApi {
    [methodName: string]: (...args: unknown[]) => unknown;
    getPreloadInfo: () => {
        apiMethods: string[];
        constants?: unknown;
        timestamp?: unknown;
    };
    testIPC: () => Promise<unknown>;
}

interface MockIpcRenderer {
    invoke: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;
    on: ReturnType<typeof vi.fn>;
    once: ReturnType<typeof vi.fn>;
    removeAllListeners: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
}

interface MockContextBridge {
    exposeInMainWorld: ReturnType<
        typeof vi.fn<(name: string, api: unknown) => void>
    >;
}

describe("preload.js dist bridge behavior", () => {
    let mockIpcRenderer: MockIpcRenderer;
    let mockContextBridge: MockContextBridge;
    let consoleSpy: {
        error: ReturnType<typeof vi.spyOn>;
        log: ReturnType<typeof vi.spyOn>;
    };
    let preloadCode: string;
    let exposedAPI: ExposedPreloadApi;
    let exposedDevTools: ExposedDevToolsApi;

    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks();

        // Setup comprehensive IPC renderer mock
        mockIpcRenderer = {
            invoke: vi
                .fn<(...args: unknown[]) => Promise<unknown>>()
                .mockResolvedValue("mock-result"),
            send: vi.fn(),
            on: vi.fn(),
            once: vi.fn(),
            removeListener: vi.fn(),
            removeAllListeners: vi.fn(),
        };

        // Setup context bridge mock
        mockContextBridge = {
            exposeInMainWorld: vi.fn((name, api) => {
                if (name === "electronAPI") {
                    exposedAPI = api as ExposedPreloadApi;
                } else if (name === "devTools") {
                    exposedDevTools = api as ExposedDevToolsApi;
                }
            }),
        };

        // Setup console spies
        consoleSpy = {
            log: vi.spyOn(console, "log").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
        };

        // Load preload script source
        preloadCode = readFileSync(
            join(__dirname, "../../dist/preload.js"),
            "utf-8"
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
        exposedAPI = undefined as unknown as ExposedPreloadApi;
        exposedDevTools = undefined as unknown as ExposedDevToolsApi;
    });

    /**
     * Execute preload script in controlled environment
     */
    function executePreloadScript(envOptions = {}) {
        const env = {
            NODE_ENV: "test",
            ...envOptions,
        };

        const mockRequire = vi.fn((moduleName: string) =>
            resolvePreloadScriptRequire(moduleName, {
                ipcRenderer: mockIpcRenderer,
                contextBridge: mockContextBridge,
            })
        );

        const mockProcess = {
            env,
            once: vi.fn(),
        };

        const mockConsole = {
            log: consoleSpy.log,
            error: consoleSpy.error,
        };

        try {
            runPreloadScript(mockRequire, mockProcess, mockConsole);
        } catch {
            // Some errors are expected in test environment
        }

        return {
            mockRequire,
            mockProcess,
            mockConsole,
        };
    }

    function runPreloadScript(
        mockRequire: (moduleName: string) => unknown,
        mockProcess: {
            env: Record<string, unknown>;
            once: ReturnType<typeof vi.fn>;
        },
        mockConsole: { error: unknown; log: unknown }
    ) {
        // eslint-disable-next-line no-new-func -- preload.js is a CommonJS side-effect script executed with controlled test doubles.
        const preloadScript = new Function(
            "require",
            "process",
            "console",
            preloadCode
        );

        return preloadScript(mockRequire, mockProcess, mockConsole);
    }

    describe("Module Loading and Initialization", () => {
        test("should load and execute without throwing errors", () => {
            expect(() => {
                executePreloadScript();
            }).not.toThrow();
        });

        test("should expose electronAPI to main world", () => {
            executePreloadScript();

            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                expect.any(Object)
            );
            expect(exposedAPI).toMatchObject({
                getChannelInfo: expect.any(Function),
                validateAPI: expect.any(Function),
            });
            expect(exposedAPI.validateAPI()).toBe(true);
        });

        test("should validate API before exposing", () => {
            executePreloadScript();

            expect(typeof exposedAPI.validateAPI).toBe("function");
            expect(exposedAPI.validateAPI()).toBe(true);
        });

        test("should not expose API if validation fails", () => {
            // Mock contextBridge to be undefined to trigger validation failure
            mockContextBridge = undefined;

            const mockRequire = vi.fn((moduleName: string) =>
                resolvePreloadScriptRequire(moduleName, {
                    ipcRenderer: mockIpcRenderer,
                    contextBridge: mockContextBridge,
                })
            );

            expect(() => {
                runPreloadScript(
                    mockRequire,
                    { env: { NODE_ENV: "test" }, once: vi.fn() },
                    console
                );
            }).not.toThrow();

            // Should not have been called since contextBridge is undefined
            expect(exposedAPI).toBeUndefined();
        });
    });

    describe("Development Mode Features", () => {
        test("should expose devTools in development mode", () => {
            executePreloadScript({ NODE_ENV: "development" });

            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "devTools",
                expect.any(Object)
            );
            expect(exposedDevTools).toMatchObject({
                getPreloadInfo: expect.any(Function),
                logAPIState: expect.any(Function),
                testIPC: expect.any(Function),
            });
        });

        test("should not expose devTools in production mode", () => {
            executePreloadScript({ NODE_ENV: "production" });

            // Should only have one call for electronAPI, not devTools
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledTimes(
                1
            );
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                expect.any(Object)
            );
            expect(exposedDevTools).toBeUndefined();
        });

        test("devTools should provide development utilities", () => {
            executePreloadScript({ NODE_ENV: "development" });

            expect(exposedDevTools).toMatchObject({
                getPreloadInfo: expect.any(Function),
                logAPIState: expect.any(Function),
                testIPC: expect.any(Function),
            });
        });

        test("devTools.getPreloadInfo should return preload information", () => {
            executePreloadScript({ NODE_ENV: "development" });

            const preloadInfo = exposedDevTools.getPreloadInfo();

            expect(preloadInfo).toMatchObject({
                apiMethods: expect.any(Array),
                constants: expect.any(Object),
                timestamp: expect.any(String),
                version: "1.0.0",
            });
            expect(preloadInfo.apiMethods).toBeInstanceOf(Array);
            expect(preloadInfo.apiMethods.length).toBeGreaterThan(0);
            expect(preloadInfo.version).toBe("1.0.0");
        });

        test("devTools.testIPC should test IPC communication", async () => {
            mockIpcRenderer.invoke.mockResolvedValue("1.0.0");
            executePreloadScript({ NODE_ENV: "development" });

            const result = await exposedDevTools.testIPC();

            expect(result).toBe(true);
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getAppVersion"
            );
        });

        test("devTools.testIPC should handle IPC failures", async () => {
            mockIpcRenderer.invoke.mockRejectedValue(new Error("IPC failed"));
            executePreloadScript({ NODE_ENV: "development" });

            const result = await exposedDevTools.testIPC();

            expect(result).toBe(false);
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] IPC test failed:",
                expect.any(Error)
            );
        });
    });

    describe("API Structure and Methods", () => {
        test("should have all expected API methods", () => {
            executePreloadScript();

            const expectedMethods = [
                "addRecentFile",
                "checkForUpdates",
                "decodeFitFile",
                "getAppVersion",
                "getChannelInfo",
                "getChromeVersion",
                "getElectronVersion",
                "getLicenseInfo",
                "getNodeVersion",
                "getPlatformInfo",
                "getTheme",
                "injectMenu",
                "installUpdate",
                "invoke",
                "onIpc",
                "onMenuOpenFile",
                "onOpenRecentFile",
                "onOpenSummaryColumnSelector",
                "onSetTheme",
                "onUpdateEvent",
                "openExternal",
                "openFile",
                "openFileDialog",
                "parseFitFile",
                "readFile",
                "recentFiles",
                "send",
                "sendThemeChanged",
                "setFullScreen",
                "startGyazoServer",
                "stopGyazoServer",
                "validateAPI",
            ];

            expectedMethods.forEach((method) => {
                expect(exposedAPI[method]).toEqual(expect.any(Function));
            });
        });

        test("getChannelInfo should return channel information", () => {
            executePreloadScript();

            const channelInfo = exposedAPI.getChannelInfo();

            expect(channelInfo).toMatchObject({
                channels: expect.any(Object),
                events: expect.any(Object),
                totalChannels: expect.any(Number),
                totalEvents: expect.any(Number),
            });
            expect(typeof channelInfo.totalChannels).toBe("number");
            expect(typeof channelInfo.totalEvents).toBe("number");
            expect(channelInfo.totalChannels).toBeGreaterThan(0);
            expect(channelInfo.totalEvents).toBeGreaterThan(0);
        });

        test("validateAPI should perform comprehensive validation", () => {
            executePreloadScript();

            const result = exposedAPI.validateAPI();

            expect(result).toBe(true);
        });

        test("getChannelInfo should not include unknown channels", () => {
            executePreloadScript();

            const channelInfo = exposedAPI.getChannelInfo();

            expect(channelInfo.channels).not.toHaveProperty("UNKNOWN_CHANNEL");
            expect(channelInfo.events).not.toHaveProperty("UNKNOWN_EVENT");
        });
    });

    describe("IPC Invoke Methods", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        test("addRecentFile should invoke correct channel", async () => {
            const filePath = "/path/to/file.fit";
            const result = await exposedAPI.addRecentFile(filePath);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "recentFiles:add",
                filePath
            );
            expect(result).toBe("mock-result");
        });

        test("decodeFitFile should invoke correct channel", async () => {
            const arrayBuffer = new ArrayBuffer(8);
            const result = await exposedAPI.decodeFitFile(arrayBuffer);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "fit:decode",
                arrayBuffer
            );
            expect(result).toBe("mock-result");
        });

        test("getAppVersion should invoke correct channel", async () => {
            const result = await exposedAPI.getAppVersion();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getAppVersion"
            );
            expect(result).toBe("mock-result");
        });

        test("getChromeVersion should invoke correct channel", async () => {
            const result = await exposedAPI.getChromeVersion();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getChromeVersion"
            );
            expect(result).toBe("mock-result");
        });

        test("getElectronVersion should invoke correct channel", async () => {
            const result = await exposedAPI.getElectronVersion();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getElectronVersion"
            );
            expect(result).toBe("mock-result");
        });

        test("getLicenseInfo should invoke correct channel", async () => {
            const result = await exposedAPI.getLicenseInfo();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getLicenseInfo"
            );
            expect(result).toBe("mock-result");
        });

        test("getNodeVersion should invoke correct channel", async () => {
            const result = await exposedAPI.getNodeVersion();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getNodeVersion"
            );
            expect(result).toBe("mock-result");
        });

        test("getPlatformInfo should invoke correct channel", async () => {
            const result = await exposedAPI.getPlatformInfo();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getPlatformInfo"
            );
            expect(result).toBe("mock-result");
        });

        test("getTheme should invoke correct channel", async () => {
            const result = await exposedAPI.getTheme();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("theme:get");
            expect(result).toBe("mock-result");
        });

        test("openExternal should invoke correct channel", async () => {
            const url = "https://example.com";
            const result = await exposedAPI.openExternal(url);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "shell:openExternal",
                url
            );
            expect(result).toBe("mock-result");
        });

        test("openFile should invoke correct channel", async () => {
            const result = await exposedAPI.openFile();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "dialog:openFile"
            );
            expect(result).toBe("mock-result");
        });

        test("openFileDialog should invoke correct channel", async () => {
            const result = await exposedAPI.openFileDialog();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "dialog:openFile"
            );
            expect(result).toBe("mock-result");
        });

        test("parseFitFile should invoke correct channel", async () => {
            const arrayBuffer = new ArrayBuffer(8);
            const result = await exposedAPI.parseFitFile(arrayBuffer);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "fit:parse",
                arrayBuffer
            );
            expect(result).toBe("mock-result");
        });

        test("readFile should invoke correct channel", async () => {
            const filePath = "/path/to/file.fit";
            const result = await exposedAPI.readFile(filePath);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "file:read",
                filePath
            );
            expect(result).toBe("mock-result");
        });

        test("recentFiles should invoke correct channel", async () => {
            const result = await exposedAPI.recentFiles();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "recentFiles:get"
            );
            expect(result).toBe("mock-result");
        });

        test("startGyazoServer should invoke correct channel", async () => {
            const port = 3000;
            const result = await exposedAPI.startGyazoServer(port);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "gyazo:server:start",
                port
            );
            expect(result).toBe("mock-result");
        });

        test("stopGyazoServer should invoke correct channel", async () => {
            const result = await exposedAPI.stopGyazoServer();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "gyazo:server:stop"
            );
            expect(result).toBe("mock-result");
        });

        test("getTheme should surface IPC rejection", async () => {
            const error = new Error("theme unavailable");
            mockIpcRenderer.invoke.mockRejectedValue(error);

            await expect(exposedAPI.getTheme()).rejects.toThrow(
                "theme unavailable"
            );
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error in getTheme:",
                error
            );
        });
    });

    describe("IPC Send Methods", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        test("checkForUpdates should send correct event", () => {
            const result = exposedAPI.checkForUpdates();

            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "menu-check-for-updates"
            );
            expect(result).toBeUndefined();
        });

        test("installUpdate should send correct event", () => {
            const result = exposedAPI.installUpdate();

            expect(mockIpcRenderer.send).toHaveBeenCalledWith("install-update");
            expect(result).toBeUndefined();
        });

        test("sendThemeChanged should send correct event", () => {
            const theme = "dark";
            const result = exposedAPI.sendThemeChanged(theme);

            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "theme-changed",
                theme
            );
            expect(result).toBeUndefined();
        });

        test("setFullScreen should send correct event", () => {
            const flag = true;
            const result = exposedAPI.setFullScreen(flag);

            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "set-fullscreen",
                flag
            );
            expect(result).toBeUndefined();
        });

        test("checkForUpdates should report send failures", () => {
            const error = new Error("update check unavailable");
            mockIpcRenderer.send.mockImplementation(() => {
                throw error;
            });

            const result = exposedAPI.checkForUpdates();

            expect(result).toBeUndefined();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error in checkForUpdates:",
                error
            );
        });
    });

    describe("Event Handler Registration", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        test("onMenuOpenFile should register event handler", () => {
            const callback = vi.fn();
            const unsubscribe = exposedAPI.onMenuOpenFile(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "menu-open-file",
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        test("onMenuOpenOverlay should register event handler", () => {
            const callback = vi.fn();
            const unsubscribe = exposedAPI.onMenuOpenOverlay(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "menu-open-overlay",
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        test("onOpenRecentFile should register event handler", () => {
            const callback = vi.fn();
            const unsubscribe = exposedAPI.onOpenRecentFile(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "open-recent-file",
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        test("onOpenSummaryColumnSelector should register event handler", () => {
            const callback = vi.fn();
            const unsubscribe =
                exposedAPI.onOpenSummaryColumnSelector(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "open-summary-column-selector",
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        test("onSetTheme should register event handler", () => {
            const callback = vi.fn();
            const unsubscribe = exposedAPI.onSetTheme(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "set-theme",
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        test("onUpdateEvent should register event handler", () => {
            const eventName = "update-available";
            const callback = vi.fn();
            const unsubscribe = exposedAPI.onUpdateEvent(eventName, callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                eventName,
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        test("onIpc should register generic event handler", () => {
            const channel = "custom-channel";
            const callback = vi.fn();
            const unsubscribe = exposedAPI.onIpc(channel, callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                channel,
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        test("onMenuOpenFile should reject invalid callbacks", () => {
            const unsubscribe = exposedAPI.onMenuOpenFile("not-a-function");

            expect(typeof unsubscribe).toBe("function");
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] onMenuOpenFile: callback must be a function"
            );
        });
    });

    describe("Generic IPC Methods", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        test("invoke should call ipcRenderer.invoke", async () => {
            const channel = "test-channel";
            const args = ["arg1", "arg2"];
            const result = await exposedAPI.invoke(channel, ...args);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                channel,
                ...args
            );
            expect(result).toBe("mock-result");
        });

        test("send should call ipcRenderer.send", () => {
            const channel = "test-channel";
            const args = ["arg1", "arg2"];
            const result = exposedAPI.send(channel, ...args);

            expect(mockIpcRenderer.send).toHaveBeenCalledWith(channel, ...args);
            expect(result).toBeUndefined();
        });

        test("send should reject invalid channels", () => {
            const result = exposedAPI.send(123);

            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] send: channel must be a string"
            );
        });
    });

    describe("Special Methods", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        test("injectMenu should validate parameters and invoke channel", async () => {
            const theme = "dark";
            const fitFilePath = "/path/to/file.fit";

            const result = await exposedAPI.injectMenu(theme, fitFilePath);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "devtools-inject-menu",
                theme,
                fitFilePath
            );
            expect(result).toBe("mock-result");
        });

        test("injectMenu should handle default parameters", async () => {
            const result = await exposedAPI.injectMenu();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "devtools-inject-menu",
                null,
                null
            );
            expect(result).toBe("mock-result");
        });

        test("injectMenu should validate theme parameter", async () => {
            const invalidTheme = 123; // Not a string or null

            const result = await exposedAPI.injectMenu(invalidTheme);

            expect(result).toBe(false);
            expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] injectMenu: theme must be a string or null"
            );
        });

        test("injectMenu should validate fitFilePath parameter", async () => {
            const invalidPath = 123; // Not a string or null

            const result = await exposedAPI.injectMenu("dark", invalidPath);

            expect(result).toBe(false);
            expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] injectMenu: fitFilePath must be a string or null"
            );
        });
    });

    describe("Error Handling", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        test("should handle IPC invoke errors", async () => {
            const error = new Error("IPC error");
            mockIpcRenderer.invoke.mockRejectedValue(error);

            await expect(exposedAPI.getAppVersion()).rejects.toThrow(
                "IPC error"
            );
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error in getAppVersion:",
                error
            );
        });

        test("should handle IPC send errors", () => {
            const error = new Error("Send error");
            mockIpcRenderer.send.mockImplementation(() => {
                throw error;
            });

            const result = exposedAPI.checkForUpdates();

            expect(result).toBeUndefined();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error in checkForUpdates:",
                error
            );
        });

        test("should handle event registration errors", () => {
            const error = new Error("Event error");
            mockIpcRenderer.on.mockImplementation(() => {
                throw error;
            });

            const unsubscribe = exposedAPI.onMenuOpenFile(vi.fn());

            expect(typeof unsubscribe).toBe("function");
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error setting up onMenuOpenFile event handler:",
                error
            );
        });

        test("should validate callback in event handlers", () => {
            const unsubscribe = exposedAPI.onMenuOpenFile("not-a-function");

            expect(typeof unsubscribe).toBe("function");
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] onMenuOpenFile: callback must be a function"
            );
        });

        test("should validate callback in onUpdateEvent", () => {
            const unsubscribe = exposedAPI.onUpdateEvent(
                "test-event",
                "not-a-function"
            );

            expect(unsubscribe).toBeUndefined();
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] onUpdateEvent: callback must be a function"
            );
        });

        test("should validate eventName in onUpdateEvent", () => {
            const unsubscribe = exposedAPI.onUpdateEvent(123, vi.fn());

            expect(unsubscribe).toBeUndefined();
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] onUpdateEvent: eventName must be a string"
            );
        });

        test("should validate channel in generic methods", async () => {
            await expect(exposedAPI.invoke(123)).rejects.toThrow(
                "Invalid channel for invoke"
            );
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] invoke: channel must be a string"
            );
        });

        test("should validate channel in send method", () => {
            const result = exposedAPI.send(123);

            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] send: channel must be a string"
            );
        });

        test("should validate channel in onIpc method", () => {
            const unsubscribe = exposedAPI.onIpc(123, vi.fn());

            expect(unsubscribe).toBeUndefined();
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] onIpc: channel must be a string"
            );
        });

        test("should validate callback in onIpc method", () => {
            const unsubscribe = exposedAPI.onIpc(
                "test-channel",
                "not-a-function"
            );

            expect(unsubscribe).toBeUndefined();
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] onIpc: callback must be a function"
            );
        });
    });

    describe("Event Callback Error Handling", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        test("should handle errors in event callbacks", () => {
            const errorCallback = vi.fn(() => {
                throw new Error("Callback error");
            });

            exposedAPI.onMenuOpenFile(errorCallback);

            // Simulate event being triggered
            const registeredCallback = mockIpcRenderer.on.mock.calls[0][1];
            const callbackResult = registeredCallback({}, "test-data");

            expect(callbackResult).toBeUndefined();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error in onMenuOpenFile callback:",
                expect.any(Error)
            );
            expect(errorCallback).toHaveBeenCalledWith("test-data");
        });

        test("should handle errors in transform callbacks", () => {
            const callback = vi.fn();

            exposedAPI.onOpenRecentFile(callback);

            // Simulate event being triggered
            const registeredCallback = mockIpcRenderer.on.mock.calls[0][1];
            const event = {};
            const callbackResult = registeredCallback(event, "test-file-path");

            expect(callbackResult).toBeUndefined();
            expect(callback).toHaveBeenCalledWith("test-file-path");
            expect(callback).not.toHaveBeenCalledWith(event, "test-file-path");
        });

        test("should handle errors in onUpdateEvent callbacks", () => {
            const errorCallback = vi.fn(() => {
                throw new Error("Update callback error");
            });

            exposedAPI.onUpdateEvent("test-event", errorCallback);

            // Simulate event being triggered
            const registeredCallback = mockIpcRenderer.on.mock.calls[0][1];
            const callbackResult = registeredCallback({}, "test-data");

            expect(callbackResult).toBeUndefined();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error in onUpdateEvent(test-event) callback:",
                expect.any(Error)
            );
            expect(errorCallback).toHaveBeenCalledWith("test-data");
        });
    });

    describe("Process Lifecycle", () => {
        test("should register beforeExit handler", () => {
            const mockProcess = {
                env: { NODE_ENV: "development" },
                once: vi.fn(),
            };

            const mockRequire = vi.fn((moduleName: string) =>
                resolvePreloadScriptRequire(moduleName, {
                    ipcRenderer: mockIpcRenderer,
                    contextBridge: mockContextBridge,
                })
            );

            const result = runPreloadScript(mockRequire, mockProcess, console);

            expect(mockProcess.once).toHaveBeenCalledWith(
                "beforeExit",
                expect.any(Function)
            );
            expect(mockProcess.once).not.toHaveBeenCalledWith(
                "exit",
                expect.any(Function)
            );
            expect(result).toBeUndefined();
        });
    });

    describe("Constants and Configuration", () => {
        test("should expose channel information correctly", () => {
            executePreloadScript();

            const channelInfo = exposedAPI.getChannelInfo();

            // Verify expected channels exist
            expect(channelInfo.channels.APP_VERSION).toBe("getAppVersion");
            expect(channelInfo.channels.CHROME_VERSION).toBe(
                "getChromeVersion"
            );
            expect(channelInfo.channels.DIALOG_OPEN_FILE).toBe(
                "dialog:openFile"
            );
            expect(channelInfo.channels.FIT_DECODE).toBe("fit:decode");
            expect(channelInfo.channels.FIT_PARSE).toBe("fit:parse");

            // Verify expected events exist
            expect(channelInfo.events.MENU_OPEN_FILE).toBe("menu-open-file");
            expect(channelInfo.events.MENU_OPEN_OVERLAY).toBe(
                "menu-open-overlay"
            );
            expect(channelInfo.events.SET_THEME).toBe("set-theme");
            expect(channelInfo.events.THEME_CHANGED).toBe("theme-changed");
            expect(channelInfo.channels).not.toHaveProperty("UNKNOWN_CHANNEL");
            expect(channelInfo.events).not.toHaveProperty("UNKNOWN_EVENT");
        });
    });

    describe("Development vs Production Behavior", () => {
        test("should log in development mode", () => {
            executePreloadScript({ NODE_ENV: "development" });

            expect(consoleSpy.log).toHaveBeenCalledWith(
                "[preload.js] Successfully exposed electronAPI to main world"
            );
            expect(exposedDevTools).toMatchObject({
                getPreloadInfo: expect.any(Function),
            });
        });

        test("should not log in production mode", () => {
            executePreloadScript({ NODE_ENV: "production" });

            expect(consoleSpy.log).not.toHaveBeenCalledWith(
                "[preload.js] Successfully exposed electronAPI to main world"
            );
            expect(exposedDevTools).toBeUndefined();
        });
    });

    describe("Edge Cases and Robustness", () => {
        test("should handle module loading failures gracefully", () => {
            const mockRequire = vi.fn(() => {
                throw new Error("Module loading failed");
            });

            expect(() => {
                runPreloadScript(
                    mockRequire,
                    { env: { NODE_ENV: "test" }, once: vi.fn() },
                    console
                );
            }).toThrow("Module loading failed");
        });

        test("should handle contextBridge exposure failures", () => {
            mockContextBridge.exposeInMainWorld.mockImplementation(() => {
                throw new Error("Exposure failed");
            });

            executePreloadScript();

            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Failed to expose electronAPI:",
                expect.any(Error)
            );
            expect(exposedAPI).toBeUndefined();
        });

        test("should handle devTools exposure failures in development", () => {
            mockContextBridge.exposeInMainWorld.mockImplementation(
                (name: string) => {
                    if (name === "devTools") {
                        throw new Error("DevTools exposure failed");
                    }
                }
            );

            executePreloadScript({ NODE_ENV: "development" });

            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Failed to expose development tools:",
                expect.any(Error)
            );
            expect(exposedDevTools).toBeUndefined();
        });
    });
});
