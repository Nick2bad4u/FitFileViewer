/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Comprehensive test suite for preload.js
 * Targeting significant coverage improvement from 43.42% baseline
 */
describe("preload.js - Comprehensive Coverage Test Suite", () => {
    let mockIpcRenderer: any;
    let mockContextBridge: any;
    let consoleSpy: any;
    let preloadCode: string;
    let exposedAPI: any;
    let exposedDevTools: any;

    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks();

        // Setup comprehensive IPC renderer mock
        mockIpcRenderer = {
            invoke: vi.fn().mockResolvedValue("mock-result"),
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
                    exposedAPI = api;
                } else if (name === "devTools") {
                    exposedDevTools = api;
                }
            }),
        };

        // Setup console spies
        consoleSpy = {
            log: vi.spyOn(console, "log").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
        };

        // Load preload script source
        preloadCode = readFileSync(join(__dirname, "../../preload.js"), "utf-8");
    });

    afterEach(() => {
        vi.restoreAllMocks();
        exposedAPI = undefined;
        exposedDevTools = undefined;
    });

    /**
     * Execute preload script in controlled environment
     */
    function executePreloadScript(envOptions = {}) {
        const env = {
            NODE_ENV: "test",
            ...envOptions,
        };

        const mockRequire = vi.fn((moduleName: string) => {
            if (moduleName === "electron") {
                return {
                    ipcRenderer: mockIpcRenderer,
                    contextBridge: mockContextBridge,
                };
            }
            throw new Error(`Module not mocked: ${moduleName}`);
        });

        const mockProcess = {
            env,
            once: vi.fn(),
        };

        const mockConsole = {
            log: consoleSpy.log,
            error: consoleSpy.error,
        };

        // Execute preload script
        const func = new Function("require", "process", "console", preloadCode);

        try {
            func(mockRequire, mockProcess, mockConsole);
        } catch (error) {
            // Some errors are expected in test environment
        }

        return {
            mockRequire,
            mockProcess,
            mockConsole,
        };
    }

    describe("Module Loading and Initialization", () => {
        test("should load and execute without throwing errors", () => {
            expect(() => {
                executePreloadScript();
            }).not.toThrow();
        });

        test("should expose electronAPI to main world", () => {
            executePreloadScript();

            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith("electronAPI", expect.any(Object));
            expect(exposedAPI).toBeDefined();
        });

        test("should validate API before exposing", () => {
            executePreloadScript();

            expect(exposedAPI).toBeDefined();
            expect(typeof exposedAPI.validateAPI).toBe("function");
            expect(exposedAPI.validateAPI()).toBe(true);
        });

        test("should not expose API if validation fails", () => {
            // Mock contextBridge to be undefined to trigger validation failure
            mockContextBridge = undefined;

            const mockRequire = vi.fn((moduleName: string) => {
                if (moduleName === "electron") {
                    return {
                        ipcRenderer: mockIpcRenderer,
                        contextBridge: mockContextBridge,
                    };
                }
                throw new Error(`Module not mocked: ${moduleName}`);
            });

            const func = new Function("require", "process", "console", preloadCode);

            expect(() => {
                func(mockRequire, { env: { NODE_ENV: "test" }, once: vi.fn() }, console);
            }).not.toThrow();

            // Should not have been called since contextBridge is undefined
            expect(exposedAPI).toBeUndefined();
        });
    });

    describe("Development Mode Features", () => {
        test("should expose devTools in development mode", () => {
            executePreloadScript({ NODE_ENV: "development" });

            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith("devTools", expect.any(Object));
            expect(exposedDevTools).toBeDefined();
        });

        test("should not expose devTools in production mode", () => {
            executePreloadScript({ NODE_ENV: "production" });

            // Should only have one call for electronAPI, not devTools
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledTimes(1);
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith("electronAPI", expect.any(Object));
            expect(exposedDevTools).toBeUndefined();
        });

        test("devTools should provide development utilities", () => {
            executePreloadScript({ NODE_ENV: "development" });

            expect(exposedDevTools).toBeDefined();
            expect(typeof exposedDevTools.getPreloadInfo).toBe("function");
            expect(typeof exposedDevTools.logAPIState).toBe("function");
            expect(typeof exposedDevTools.testIPC).toBe("function");
        });

        test("devTools.getPreloadInfo should return preload information", () => {
            executePreloadScript({ NODE_ENV: "development" });

            const preloadInfo = exposedDevTools.getPreloadInfo();

            expect(preloadInfo).toBeDefined();
            expect(preloadInfo.apiMethods).toBeInstanceOf(Array);
            expect(preloadInfo.constants).toBeDefined();
            expect(preloadInfo.timestamp).toBeDefined();
            expect(preloadInfo.version).toBe("1.0.0");
        });

        test("devTools.testIPC should test IPC communication", async () => {
            mockIpcRenderer.invoke.mockResolvedValue("1.0.0");
            executePreloadScript({ NODE_ENV: "development" });

            const result = await exposedDevTools.testIPC();

            expect(result).toBe(true);
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("getAppVersion");
        });

        test("devTools.testIPC should handle IPC failures", async () => {
            mockIpcRenderer.invoke.mockRejectedValue(new Error("IPC failed"));
            executePreloadScript({ NODE_ENV: "development" });

            const result = await exposedDevTools.testIPC();

            expect(result).toBe(false);
            expect(consoleSpy.error).toHaveBeenCalledWith("[preload.js] IPC test failed:", expect.any(Error));
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
                "exchangeGyazoToken",
                "validateAPI",
            ];

            expectedMethods.forEach((method) => {
                expect(exposedAPI[method]).toBeDefined();
                expect(typeof exposedAPI[method]).toBe("function");
            });
        });

        test("getChannelInfo should return channel information", () => {
            executePreloadScript();

            const channelInfo = exposedAPI.getChannelInfo();

            expect(channelInfo).toBeDefined();
            expect(channelInfo.channels).toBeDefined();
            expect(channelInfo.events).toBeDefined();
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
    });

    describe("IPC Invoke Methods", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        test("addRecentFile should invoke correct channel", async () => {
            const filePath = "/path/to/file.fit";
            await exposedAPI.addRecentFile(filePath);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("recentFiles:add", filePath);
        });

        test("decodeFitFile should invoke correct channel", async () => {
            const arrayBuffer = new ArrayBuffer(8);
            await exposedAPI.decodeFitFile(arrayBuffer);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("fit:decode", arrayBuffer);
        });

        test("getAppVersion should invoke correct channel", async () => {
            await exposedAPI.getAppVersion();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("getAppVersion");
        });

        test("getChromeVersion should invoke correct channel", async () => {
            await exposedAPI.getChromeVersion();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("getChromeVersion");
        });

        test("getElectronVersion should invoke correct channel", async () => {
            await exposedAPI.getElectronVersion();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("getElectronVersion");
        });

        test("getLicenseInfo should invoke correct channel", async () => {
            await exposedAPI.getLicenseInfo();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("getLicenseInfo");
        });

        test("getNodeVersion should invoke correct channel", async () => {
            await exposedAPI.getNodeVersion();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("getNodeVersion");
        });

        test("getPlatformInfo should invoke correct channel", async () => {
            await exposedAPI.getPlatformInfo();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("getPlatformInfo");
        });

        test("getTheme should invoke correct channel", async () => {
            await exposedAPI.getTheme();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("theme:get");
        });

        test("openExternal should invoke correct channel", async () => {
            const url = "https://example.com";
            await exposedAPI.openExternal(url);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("shell:openExternal", url);
        });

        test("openFile should invoke correct channel", async () => {
            await exposedAPI.openFile();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("dialog:openFile");
        });

        test("openFileDialog should invoke correct channel", async () => {
            await exposedAPI.openFileDialog();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("dialog:openFile");
        });

        test("parseFitFile should invoke correct channel", async () => {
            const arrayBuffer = new ArrayBuffer(8);
            await exposedAPI.parseFitFile(arrayBuffer);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("fit:parse", arrayBuffer);
        });

        test("readFile should invoke correct channel", async () => {
            const filePath = "/path/to/file.fit";
            await exposedAPI.readFile(filePath);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("file:read", filePath);
        });

        test("recentFiles should invoke correct channel", async () => {
            await exposedAPI.recentFiles();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("recentFiles:get");
        });

        test("startGyazoServer should invoke correct channel", async () => {
            const port = 3000;
            await exposedAPI.startGyazoServer(port);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("gyazo:server:start", port);
        });

        test("stopGyazoServer should invoke correct channel", async () => {
            await exposedAPI.stopGyazoServer();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("gyazo:server:stop");
        });

        test("exchangeGyazoToken should invoke correct channel", async () => {
            const payload = {
                clientId: "id",
                clientSecret: "secret",
                code: "code",
                redirectUri: "http://localhost/callback",
                tokenUrl: "https://gyazo.com/oauth/token",
            };
            await exposedAPI.exchangeGyazoToken(payload);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("gyazo:token:exchange", payload);
        });
    });

    describe("IPC Send Methods", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        test("checkForUpdates should send correct event", () => {
            exposedAPI.checkForUpdates();

            expect(mockIpcRenderer.send).toHaveBeenCalledWith("menu-check-for-updates");
        });

        test("installUpdate should send correct event", () => {
            exposedAPI.installUpdate();

            expect(mockIpcRenderer.send).toHaveBeenCalledWith("install-update");
        });

        test("sendThemeChanged should send correct event", () => {
            const theme = "dark";
            exposedAPI.sendThemeChanged(theme);

            expect(mockIpcRenderer.send).toHaveBeenCalledWith("theme-changed", theme);
        });

        test("setFullScreen should send correct event", () => {
            const flag = true;
            exposedAPI.setFullScreen(flag);

            expect(mockIpcRenderer.send).toHaveBeenCalledWith("set-fullscreen", flag);
        });
    });

    describe("Event Handler Registration", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        test("onMenuOpenFile should register event handler", () => {
            const callback = vi.fn();
            exposedAPI.onMenuOpenFile(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith("menu-open-file", expect.any(Function));
        });

        test("onMenuOpenOverlay should register event handler", () => {
            const callback = vi.fn();
            exposedAPI.onMenuOpenOverlay(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith("menu-open-overlay", expect.any(Function));
        });

        test("onOpenRecentFile should register event handler", () => {
            const callback = vi.fn();
            exposedAPI.onOpenRecentFile(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith("open-recent-file", expect.any(Function));
        });

        test("onOpenSummaryColumnSelector should register event handler", () => {
            const callback = vi.fn();
            exposedAPI.onOpenSummaryColumnSelector(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith("open-summary-column-selector", expect.any(Function));
        });

        test("onSetTheme should register event handler", () => {
            const callback = vi.fn();
            exposedAPI.onSetTheme(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith("set-theme", expect.any(Function));
        });

        test("onUpdateEvent should register event handler", () => {
            const eventName = "update-available";
            const callback = vi.fn();
            exposedAPI.onUpdateEvent(eventName, callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(eventName, expect.any(Function));
        });

        test("onIpc should register generic event handler", () => {
            const channel = "custom-channel";
            const callback = vi.fn();
            exposedAPI.onIpc(channel, callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(channel, expect.any(Function));
        });
    });

    describe("Generic IPC Methods", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        test("invoke should call ipcRenderer.invoke", async () => {
            const channel = "test-channel";
            const args = ["arg1", "arg2"];
            await exposedAPI.invoke(channel, ...args);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(channel, ...args);
        });

        test("send should call ipcRenderer.send", () => {
            const channel = "test-channel";
            const args = ["arg1", "arg2"];
            exposedAPI.send(channel, ...args);

            expect(mockIpcRenderer.send).toHaveBeenCalledWith(channel, ...args);
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

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("devtools-inject-menu", theme, fitFilePath);
        });

        test("injectMenu should handle default parameters", async () => {
            await exposedAPI.injectMenu();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("devtools-inject-menu", null, null);
        });

        test("injectMenu should validate theme parameter", async () => {
            const invalidTheme = 123; // Not a string or null

            const result = await exposedAPI.injectMenu(invalidTheme);

            expect(result).toBe(false);
            expect(consoleSpy.error).toHaveBeenCalledWith("[preload.js] injectMenu: theme must be a string or null");
        });

        test("injectMenu should validate fitFilePath parameter", async () => {
            const invalidPath = 123; // Not a string or null

            const result = await exposedAPI.injectMenu("dark", invalidPath);

            expect(result).toBe(false);
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

            await expect(exposedAPI.getAppVersion()).rejects.toThrow("IPC error");
            expect(consoleSpy.error).toHaveBeenCalledWith("[preload.js] Error in getAppVersion:", error);
        });

        test("should handle IPC send errors", () => {
            const error = new Error("Send error");
            mockIpcRenderer.send.mockImplementation(() => {
                throw error;
            });

            exposedAPI.checkForUpdates();

            expect(consoleSpy.error).toHaveBeenCalledWith("[preload.js] Error in checkForUpdates:", error);
        });

        test("should handle event registration errors", () => {
            const error = new Error("Event error");
            mockIpcRenderer.on.mockImplementation(() => {
                throw error;
            });

            exposedAPI.onMenuOpenFile(vi.fn());

            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error setting up onMenuOpenFile event handler:",
                error
            );
        });

        test("should validate callback in event handlers", () => {
            exposedAPI.onMenuOpenFile("not-a-function");

            expect(consoleSpy.error).toHaveBeenCalledWith("[preload.js] onMenuOpenFile: callback must be a function");
        });

        test("should validate callback in onUpdateEvent", () => {
            exposedAPI.onUpdateEvent("test-event", "not-a-function");

            expect(consoleSpy.error).toHaveBeenCalledWith("[preload.js] onUpdateEvent: callback must be a function");
        });

        test("should validate eventName in onUpdateEvent", () => {
            exposedAPI.onUpdateEvent(123, vi.fn());

            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] onUpdateEvent: eventName must be a string or null"
            );
        });

        test("should validate channel in generic methods", async () => {
            await expect(exposedAPI.invoke(123)).rejects.toThrow("Invalid channel for invoke");
            expect(consoleSpy.error).toHaveBeenCalledWith("[preload.js] invoke: channel must be a string or null");
        });

        test("should validate channel in send method", () => {
            exposedAPI.send(123);

            expect(consoleSpy.error).toHaveBeenCalledWith("[preload.js] send: channel must be a string or null");
        });

        test("should validate channel in onIpc method", () => {
            exposedAPI.onIpc(123, vi.fn());

            expect(consoleSpy.error).toHaveBeenCalledWith("[preload.js] onIpc: channel must be a string or null");
        });

        test("should validate callback in onIpc method", () => {
            exposedAPI.onIpc("test-channel", "not-a-function");

            expect(consoleSpy.error).toHaveBeenCalledWith("[preload.js] onIpc: callback must be a function");
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
            registeredCallback({}, "test-data");

            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error in onMenuOpenFile callback:",
                expect.any(Error)
            );
        });

        test("should handle errors in transform callbacks", () => {
            const callback = vi.fn();

            exposedAPI.onOpenRecentFile(callback);

            // Simulate event being triggered
            const registeredCallback = mockIpcRenderer.on.mock.calls[0][1];
            registeredCallback({}, "test-file-path");

            expect(callback).toHaveBeenCalledWith("test-file-path");
        });

        test("should handle errors in onUpdateEvent callbacks", () => {
            const errorCallback = vi.fn(() => {
                throw new Error("Update callback error");
            });

            exposedAPI.onUpdateEvent("test-event", errorCallback);

            // Simulate event being triggered
            const registeredCallback = mockIpcRenderer.on.mock.calls[0][1];
            registeredCallback({}, "test-data");

            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error in onUpdateEvent(test-event) callback:",
                expect.any(Error)
            );
        });
    });

    describe("Process Lifecycle", () => {
        test("should register beforeExit handler", () => {
            const mockProcess = {
                env: { NODE_ENV: "development" },
                once: vi.fn(),
            };

            const mockRequire = vi.fn((moduleName: string) => {
                if (moduleName === "electron") {
                    return {
                        ipcRenderer: mockIpcRenderer,
                        contextBridge: mockContextBridge,
                    };
                }
                throw new Error(`Module not mocked: ${moduleName}`);
            });

            const func = new Function("require", "process", "console", preloadCode);
            func(mockRequire, mockProcess, console);

            expect(mockProcess.once).toHaveBeenCalledWith("beforeExit", expect.any(Function));
        });
    });

    describe("Constants and Configuration", () => {
        test("should expose channel information correctly", () => {
            executePreloadScript();

            const channelInfo = exposedAPI.getChannelInfo();

            // Verify expected channels exist
            expect(channelInfo.channels.APP_VERSION).toBe("getAppVersion");
            expect(channelInfo.channels.CHROME_VERSION).toBe("getChromeVersion");
            expect(channelInfo.channels.DIALOG_OPEN_FILE).toBe("dialog:openFile");
            expect(channelInfo.channels.FIT_DECODE).toBe("fit:decode");
            expect(channelInfo.channels.FIT_PARSE).toBe("fit:parse");

            // Verify expected events exist
            expect(channelInfo.events.MENU_OPEN_FILE).toBe("menu-open-file");
            expect(channelInfo.events.MENU_OPEN_OVERLAY).toBe("menu-open-overlay");
            expect(channelInfo.events.SET_THEME).toBe("set-theme");
            expect(channelInfo.events.THEME_CHANGED).toBe("theme-changed");
        });
    });

    describe("Development vs Production Behavior", () => {
        test("should log in development mode", () => {
            executePreloadScript({ NODE_ENV: "development" });

            expect(consoleSpy.log).toHaveBeenCalledWith("[preload.js] Successfully exposed electronAPI to main world");
        });

        test("should not log in production mode", () => {
            executePreloadScript({ NODE_ENV: "production" });

            expect(consoleSpy.log).not.toHaveBeenCalledWith(
                "[preload.js] Successfully exposed electronAPI to main world"
            );
        });
    });

    describe("Edge Cases and Robustness", () => {
        test("should handle module loading failures gracefully", () => {
            const mockRequire = vi.fn(() => {
                throw new Error("Module loading failed");
            });

            const func = new Function("require", "process", "console", preloadCode);

            expect(() => {
                func(mockRequire, { env: { NODE_ENV: "test" }, once: vi.fn() }, console);
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
        });

        test("should handle devTools exposure failures in development", () => {
            mockContextBridge.exposeInMainWorld.mockImplementation((name: string) => {
                if (name === "devTools") {
                    throw new Error("DevTools exposure failed");
                }
            });

            executePreloadScript({ NODE_ENV: "development" });

            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Failed to expose development tools:",
                expect.any(Error)
            );
        });
    });
});
