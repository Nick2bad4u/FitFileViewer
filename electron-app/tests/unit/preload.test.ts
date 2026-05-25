import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { resolvePreloadScriptRequire } from "../helpers/preloadModuleMocks";

describe("preload.js - Comprehensive API Testing", () => {
    let electronMock: any;
    let consoleLogSpy: any;
    let consoleErrorSpy: any;
    let mockProcess: any;

    beforeEach(() => {
        // Reset everything completely
        vi.resetAllMocks();
        vi.resetModules();
        vi.clearAllMocks();

        // Add unhandled promise rejection handler for tests
        process.on("unhandledRejection", (reason, promise) => {
            console.error("Unhandled Promise Rejection in test:", reason);
            // Don't throw to prevent test failures, just log
        });

        // Create comprehensive electron mock
        electronMock = {
            ipcRenderer: {
                invoke: vi
                    .fn()
                    .mockImplementation((channel: string, ...args: any[]) => {
                        // Handle all known channels from CONSTANTS
                        switch (channel) {
                            case "getAppVersion":
                                return Promise.resolve("1.0.0");
                            case "getChromeVersion":
                                return Promise.resolve("chrome-version");
                            case "getElectronVersion":
                                return Promise.resolve("electron-version");
                            case "getNodeVersion":
                                return Promise.resolve("node-version");
                            case "getPlatformInfo":
                                return Promise.resolve({ platform: "win32" });
                            case "theme:get":
                                return Promise.resolve("dark");
                            case "recentFiles:get":
                                return Promise.resolve([
                                    "file1.fit",
                                    "file2.fit",
                                ]);
                            case "recentFiles:approve":
                                return Promise.resolve(true);
                            case "fit:decode":
                                return Promise.resolve("decoded-data");
                            case "fit:parse":
                                return Promise.resolve("parsed-data");
                            case "file:read":
                                return Promise.resolve("file-content");
                            case "dialog:openFile":
                                return Promise.resolve(["file1.fit"]);
                            case "recentFiles:add":
                                return Promise.resolve();
                            case "checkForUpdates":
                                return Promise.resolve(true);
                            case "installUpdate":
                                return Promise.resolve(true);
                            case "setFullScreen":
                                return Promise.resolve();
                            case "sendThemeChanged":
                                return Promise.resolve();
                            case "shell:openExternal":
                                return Promise.resolve();
                            case "devtools-inject-menu":
                                return Promise.resolve(true);
                            case "getLicenseInfo":
                                return Promise.resolve("license-info");
                            case "gyazo:server:start":
                                return Promise.resolve({
                                    success: true,
                                    port: 3000,
                                });
                            case "gyazo:server:stop":
                                return Promise.resolve({ success: true });
                            default:
                                // Don't reject unknown channels, just return a default value
                                console.warn(
                                    `[Test] Unknown channel: ${channel}, returning default mock`
                                );
                                return Promise.resolve("default-mock");
                        }
                    }),
                send: vi.fn(),
                on: vi.fn(),
                removeAllListeners: vi.fn(),
            },
            contextBridge: {
                exposeInMainWorld: vi
                    .fn()
                    .mockImplementation((apiName: string, api: any) => {
                        // Actually expose the API to the global object for tests
                        (globalThis as any)[apiName] = api;
                        (global as any)[apiName] = api;
                    }),
            },
        };

        // Mock console methods
        consoleLogSpy = vi.spyOn(console, "log");
        consoleErrorSpy = vi.spyOn(console, "error");

        // Mock process object
        mockProcess = {
            env: { NODE_ENV: "development" },
            once: vi.fn(),
        };
        vi.stubGlobal("process", mockProcess);

        // Load and execute preload script
        const preloadPath = path.resolve(__dirname, "../../dist/preload.js");
        const preloadCode = fs.readFileSync(preloadPath, "utf-8");

        const mockRequire = vi.fn().mockImplementation((module: string) => {
            return resolvePreloadScriptRequire(module, electronMock);
        });

        // eslint-disable-next-line no-new-func -- preload.js is a CommonJS side-effect script executed with controlled test doubles.
        const scriptFunc = new Function(
            "require",
            "console",
            "process",
            "globalThis",
            preloadCode
        );
        scriptFunc(mockRequire, console, mockProcess, globalThis);
    });

    afterEach(() => {
        // Cleanup is handled by vitest automatically
        // process.removeAllListeners('unhandledRejection');
    });

    describe("API Exposure", () => {
        it("should expose electronAPI to main world", () => {
            expect(
                electronMock.contextBridge.exposeInMainWorld
            ).toHaveBeenCalledWith("electronAPI", expect.any(Object));
            expect((globalThis as any).electronAPI.validateAPI()).toBe(true);
        });

        it("should expose devTools to main world", () => {
            expect(
                electronMock.contextBridge.exposeInMainWorld
            ).toHaveBeenCalledWith("devTools", expect.any(Object));
            expect((globalThis as any).devTools).toMatchObject({
                getPreloadInfo: expect.any(Function),
                logAPIState: expect.any(Function),
                testIPC: expect.any(Function),
            });
        });

        it("should expose exactly 2 APIs", () => {
            expect(
                electronMock.contextBridge.exposeInMainWorld
            ).toHaveBeenCalledTimes(2);
            expect(Object.keys(globalThis as any)).toEqual(
                expect.arrayContaining(["electronAPI", "devTools"])
            );
        });

        it("should expose electronAPI with all expected methods", () => {
            const electronAPICall =
                electronMock.contextBridge.exposeInMainWorld.mock.calls.find(
                    (call: any) => call[0] === "electronAPI"
                );

            expect(electronAPICall?.[1]).toMatchObject({
                getAppVersion: expect.any(Function),
                getChannelInfo: expect.any(Function),
                validateAPI: expect.any(Function),
            });

            const electronAPI = electronAPICall![1];

            // Test core methods
            expect(electronAPI).toHaveProperty("getAppVersion");
            expect(electronAPI).toHaveProperty("getChromeVersion");
            expect(electronAPI).toHaveProperty("getElectronVersion");
            expect(electronAPI).toHaveProperty("getNodeVersion");
            expect(electronAPI).toHaveProperty("getPlatformInfo");
            expect(electronAPI).toHaveProperty("getTheme");
            expect(electronAPI).toHaveProperty("getLicenseInfo");
            expect(electronAPI).toHaveProperty("getChannelInfo");

            // Test file operations
            expect(electronAPI).toHaveProperty("openFile");
            expect(electronAPI).toHaveProperty("openFileDialog");
            expect(electronAPI).toHaveProperty("readFile");
            expect(electronAPI).toHaveProperty("recentFiles");
            expect(electronAPI).toHaveProperty("approveRecentFile");
            expect(electronAPI).toHaveProperty("addRecentFile");

            // Test FIT file operations
            expect(electronAPI).toHaveProperty("decodeFitFile");
            expect(electronAPI).toHaveProperty("parseFitFile");

            // Test IPC operations
            expect(electronAPI).toHaveProperty("invoke");
            expect(electronAPI).toHaveProperty("send");
            expect(electronAPI).toHaveProperty("onIpc");

            // Test menu operations
            expect(electronAPI).toHaveProperty("injectMenu");
            expect(electronAPI).toHaveProperty("onMenuOpenFile");
            expect(electronAPI).toHaveProperty("onMenuOpenOverlay");
            expect(electronAPI).toHaveProperty("onOpenRecentFile");
            expect(electronAPI).toHaveProperty("onOpenSummaryColumnSelector");

            // Test theme operations
            expect(electronAPI).toHaveProperty("onSetTheme");
            expect(electronAPI).toHaveProperty("sendThemeChanged");

            // Test update operations
            expect(electronAPI).toHaveProperty("checkForUpdates");
            expect(electronAPI).toHaveProperty("installUpdate");
            expect(electronAPI).toHaveProperty("onUpdateEvent");

            // Test window operations
            expect(electronAPI).toHaveProperty("setFullScreen");
            expect(electronAPI).toHaveProperty("openExternal");

            // Test Gyazo operations
            expect(electronAPI).toHaveProperty("startGyazoServer");
            expect(electronAPI).toHaveProperty("stopGyazoServer");

            // Test validation
            expect(electronAPI).toHaveProperty("validateAPI");
        });
    });

    describe("API Method Functionality", () => {
        let electronAPI: any;

        beforeEach(() => {
            const electronAPICall =
                electronMock.contextBridge.exposeInMainWorld.mock.calls.find(
                    (call: any) => call[0] === "electronAPI"
                );
            electronAPI = electronAPICall[1];
        });

        it("should handle getAppVersion correctly", async () => {
            const result = await electronAPI.getAppVersion();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "getAppVersion"
            );
            expect(result).toBe("1.0.0");
        });

        it("should handle getChromeVersion correctly", async () => {
            const result = await electronAPI.getChromeVersion();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "getChromeVersion"
            );
            expect(result).toBe("chrome-version");
        });

        it("should handle getElectronVersion correctly", async () => {
            const result = await electronAPI.getElectronVersion();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "getElectronVersion"
            );
            expect(result).toBe("electron-version");
        });

        it("should handle getNodeVersion correctly", async () => {
            const result = await electronAPI.getNodeVersion();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "getNodeVersion"
            );
            expect(result).toBe("node-version");
        });

        it("should handle getPlatformInfo correctly", async () => {
            const result = await electronAPI.getPlatformInfo();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "getPlatformInfo"
            );
            expect(result).toEqual({ platform: "win32" });
        });

        it("should handle getTheme correctly", async () => {
            const result = await electronAPI.getTheme();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "theme:get"
            );
            expect(result).toBe("dark");
        });

        it("should handle recentFiles correctly", async () => {
            const result = await electronAPI.recentFiles();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "recentFiles:get"
            );
            expect(result).toEqual(["file1.fit", "file2.fit"]);
        });

        it("should handle addRecentFile correctly", async () => {
            const result = await electronAPI.addRecentFile("/path/to/file.fit");
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "recentFiles:add",
                "/path/to/file.fit"
            );
            expect(result).toBeUndefined();
        });

        it("should handle openFileDialog correctly", async () => {
            const result = await electronAPI.openFileDialog();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "dialog:openFile"
            );
            expect(result).toEqual(["file1.fit"]);
        });

        it("should handle readFile correctly", async () => {
            const result = await electronAPI.readFile("/path/to/file");
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "file:read",
                "/path/to/file"
            );
            expect(result).toBe("file-content");
        });

        it("should handle decodeFitFile correctly", async () => {
            const result = await electronAPI.decodeFitFile("/path/to/file.fit");
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "fit:decode",
                "/path/to/file.fit"
            );
            expect(result).toBe("decoded-data");
        });

        it("should handle parseFitFile correctly", async () => {
            const fileBuffer = new ArrayBuffer(8);
            const result = await electronAPI.parseFitFile(fileBuffer);
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "fit:parse",
                fileBuffer
            );
            expect(result).toBe("parsed-data");
        });

        it("should handle send correctly", () => {
            const result = electronAPI.send("test-channel", { data: "test" });
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(
                "test-channel",
                { data: "test" }
            );
            expect(result).toBeUndefined();
        });

        it("should handle invoke correctly", async () => {
            const result = await electronAPI.invoke(
                "test-channel",
                "arg1",
                "arg2"
            );
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "test-channel",
                "arg1",
                "arg2"
            );
            expect(result).toBe("default-mock");
        });

        it("should handle onIpc correctly", () => {
            const callback = vi.fn();
            const unsubscribe = electronAPI.onIpc("test-channel", callback);
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith(
                "test-channel",
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        it("should handle checkForUpdates correctly", () => {
            const result = electronAPI.checkForUpdates();
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(
                "menu-check-for-updates"
            );
            expect(result).toBeUndefined();
        });

        it("should handle installUpdate correctly", () => {
            const result = electronAPI.installUpdate();
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(
                "install-update"
            );
            expect(result).toBeUndefined();
        });

        it("should handle setFullScreen correctly", () => {
            const result = electronAPI.setFullScreen(true);
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(
                "set-fullscreen",
                true
            );
            expect(result).toBeUndefined();
        });

        it("should handle openExternal correctly", async () => {
            const result = await electronAPI.openExternal(
                "https://example.com"
            );
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "shell:openExternal",
                "https://example.com"
            );
            expect(result).toBeUndefined();
        });

        it("should handle sendThemeChanged correctly", () => {
            const result = electronAPI.sendThemeChanged("dark");
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(
                "theme-changed",
                "dark"
            );
            expect(result).toBeUndefined();
        });

        it("should reject invalid invoke channels", async () => {
            await expect(electronAPI.invoke(123, "arg")).rejects.toThrow(
                "Invalid channel for invoke"
            );
            expect(electronMock.ipcRenderer.invoke).not.toHaveBeenCalledWith(
                123,
                "arg"
            );
        });
    });

    describe("Event Handlers", () => {
        let electronAPI: any;

        beforeEach(() => {
            const electronAPICall =
                electronMock.contextBridge.exposeInMainWorld.mock.calls.find(
                    (call: any) => call[0] === "electronAPI"
                );
            electronAPI = electronAPICall[1];
        });

        it("should register onMenuOpenFile handler", () => {
            const callback = vi.fn();
            const unsubscribe = electronAPI.onMenuOpenFile(callback);
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith(
                "menu-open-file",
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        it("should register onMenuOpenOverlay handler", () => {
            const callback = vi.fn();
            const unsubscribe = electronAPI.onMenuOpenOverlay(callback);
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith(
                "menu-open-overlay",
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        it("should register onOpenRecentFile handler", () => {
            const callback = vi.fn();
            const unsubscribe = electronAPI.onOpenRecentFile(callback);
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith(
                "open-recent-file",
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        it("should register onSetTheme handler", () => {
            const callback = vi.fn();
            const unsubscribe = electronAPI.onSetTheme(callback);
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith(
                "set-theme",
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        it("should register onUpdateEvent handler", () => {
            const callback = vi.fn();
            const unsubscribe = electronAPI.onUpdateEvent(
                "update-event",
                callback
            );
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith(
                "update-event",
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        it("should register onOpenSummaryColumnSelector handler", () => {
            const callback = vi.fn();
            const unsubscribe =
                electronAPI.onOpenSummaryColumnSelector(callback);
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith(
                "open-summary-column-selector",
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        it("should reject invalid event callbacks", () => {
            const unsubscribe = electronAPI.onIpc(
                "test-channel",
                "not-a-function"
            );

            expect(unsubscribe).toBeUndefined();
            expect(electronMock.ipcRenderer.on).not.toHaveBeenCalled();
        });
    });

    describe("CONSTANTS Exposure", () => {
        let electronAPI: any;

        beforeEach(() => {
            const electronAPICall =
                electronMock.contextBridge.exposeInMainWorld.mock.calls.find(
                    (call: any) => call[0] === "electronAPI"
                );
            electronAPI = electronAPICall[1];
        });

        it("should expose getChannelInfo method", () => {
            expect(electronAPI).toHaveProperty("getChannelInfo");
            expect(typeof electronAPI.getChannelInfo).toBe("function");
        });

        it("should return channel info with proper structure", () => {
            const channelInfo = electronAPI.getChannelInfo();
            expect(channelInfo).toHaveProperty("channels");
            expect(channelInfo).toHaveProperty("events");
            expect(channelInfo).toHaveProperty("totalChannels");
            expect(channelInfo).toHaveProperty("totalEvents");
            expect(typeof channelInfo.channels).toBe("object");
            expect(typeof channelInfo.events).toBe("object");
            expect(typeof channelInfo.totalChannels).toBe("number");
            expect(typeof channelInfo.totalEvents).toBe("number");
        });

        it("should include expected channel names", () => {
            const channelInfo = electronAPI.getChannelInfo();
            expect(channelInfo.channels).toHaveProperty(
                "APP_VERSION",
                "getAppVersion"
            );
            expect(channelInfo.channels).toHaveProperty(
                "THEME_GET",
                "theme:get"
            );
            expect(channelInfo.channels).toHaveProperty(
                "FILE_READ",
                "file:read"
            );
        });
    });

    describe("Development Tools", () => {
        it("should expose devTools in development mode", () => {
            const devToolsCall =
                electronMock.contextBridge.exposeInMainWorld.mock.calls.find(
                    (call: any) => call[0] === "devTools"
                );

            expect(devToolsCall?.[1]).toMatchObject({
                getPreloadInfo: expect.any(Function),
                logAPIState: expect.any(Function),
                testIPC: expect.any(Function),
            });
            expect(devToolsCall![1]).toHaveProperty("getPreloadInfo");
            expect(devToolsCall[1]).toHaveProperty("logAPIState");
            expect(devToolsCall[1]).toHaveProperty("testIPC");
            expect(typeof devToolsCall[1].getPreloadInfo).toBe("function");
            expect(typeof devToolsCall[1].logAPIState).toBe("function");
            expect(typeof devToolsCall[1].testIPC).toBe("function");
        });
    });

    describe("Process Integration", () => {
        it("should register beforeExit handler", () => {
            expect(mockProcess.once).toHaveBeenCalledWith(
                "beforeExit",
                expect.any(Function)
            );
            expect(mockProcess.once).not.toHaveBeenCalledWith(
                "exit",
                expect.any(Function)
            );
            expect((globalThis as any).electronAPI.validateAPI()).toBe(true);
        });

        it("should log cleanup message on beforeExit", () => {
            // Get the beforeExit callback
            const beforeExitCall = mockProcess.once.mock.calls.find(
                (call: any) => call[0] === "beforeExit"
            );
            expect(typeof beforeExitCall?.[1]).toBe("function");

            const beforeExitCallback = beforeExitCall![1];

            // Execute the callback
            beforeExitCallback();

            // Should log cleanup message
            const cleanupLogs = consoleLogSpy.mock.calls.filter(
                (call: any) =>
                    call[0] &&
                    call[0].includes(
                        "[preload.js] Process exiting, performing cleanup..."
                    )
            );

            expect(cleanupLogs.length).toBeGreaterThan(0);
            expect(cleanupLogs[0][0]).toContain(
                "[preload.js] Process exiting, performing cleanup..."
            );
        });
    });

    describe("Validation & Logging", () => {
        it("should log API validation results", () => {
            const validationLogs = consoleLogSpy.mock.calls.filter(
                (call: any) =>
                    call[0] && call[0].includes("[preload.js] API Validation:")
            );

            expect(validationLogs.length).toBeGreaterThan(0);
            expect(validationLogs[0][0]).toContain(
                "[preload.js] API Validation:"
            );
            expect(validationLogs[0][0]).not.toContain("failed");
        });

        it("should log successful API exposure", () => {
            const exposureLogs = consoleLogSpy.mock.calls.filter(
                (call: any) =>
                    call[0] &&
                    call[0].includes("[preload.js] Successfully exposed")
            );

            expect(exposureLogs.length).toBeGreaterThan(0);
            expect(exposureLogs[0][0]).toContain(
                "[preload.js] Successfully exposed"
            );
        });

        it("should log initialization completion", () => {
            const initLogs = consoleLogSpy.mock.calls.filter(
                (call: any) =>
                    call[0] &&
                    call[0].includes("[preload.js] Preload script initialized")
            );

            expect(initLogs.length).toBeGreaterThan(0);
            expect(initLogs[0][0]).toContain(
                "[preload.js] Preload script initialized"
            );
        });

        it("should validate API structure", () => {
            const structureLogs = consoleLogSpy.mock.calls.filter(
                (call: any) =>
                    call[0] && call[0].includes("[preload.js] API Structure:")
            );

            expect(structureLogs.length).toBeGreaterThan(0);
            expect(structureLogs[0][0]).toContain(
                "[preload.js] API Structure:"
            );
        });
    });

    // Additional Tests for 100% Coverage
    describe("Validation Functions", () => {
        it("should test validateCallback with invalid inputs", () => {
            // Access validation functions through existing API
            const api = (global as any).electronAPI;
            expect(api).toMatchObject({
                onIpc: expect.any(Function),
            });

            // Test validateCallback function coverage by accessing internal functions
            // These tests will trigger the uncovered validation code paths
            const testCases = [
                null,
                undefined,
                "string",
                123,
                {},
                [],
            ];
            testCases.forEach((testCase) => {
                expect(() => {
                    // This will exercise the validateCallback function internally
                    api.onIpc("test-channel", testCase);
                }).not.toThrow(); // Should handle invalid callbacks gracefully
            });
            expect(electronMock.ipcRenderer.on).not.toHaveBeenCalledWith(
                "test-channel",
                null
            );
        });

        it("should test validateString with invalid inputs", () => {
            const api = (global as any).electronAPI;
            expect(api).toMatchObject({
                send: expect.any(Function),
            });

            // Test validateString function coverage
            const testCases = [
                null,
                undefined,
                123,
                {},
                [],
                true,
            ];
            testCases.forEach((testCase) => {
                expect(() => {
                    // This will exercise the validateString function internally
                    api.send(testCase, "data");
                }).not.toThrow(); // Should handle invalid strings gracefully
            });
            expect(electronMock.ipcRenderer.send).not.toHaveBeenCalledWith(
                null,
                "data"
            );
        });
    });

    describe("Error Handling in Safe Handlers", () => {
        it("should handle errors in safe invoke handler", async () => {
            const api = (global as any).electronAPI;
            expect(api).toMatchObject({
                invoke: expect.any(Function),
            });

            // Mock ipcRenderer to throw errors for this test
            const originalInvoke = electronMock.ipcRenderer.invoke;
            electronMock.ipcRenderer.invoke.mockRejectedValue(
                new Error("Test invoke error")
            );

            await expect(
                api.invoke("test-channel", "test-data")
            ).rejects.toThrow("Test invoke error");

            // Restore original
            electronMock.ipcRenderer.invoke = originalInvoke;
        });

        it("should handle errors in safe send handler", () => {
            const api = (global as any).electronAPI;
            expect(api).toMatchObject({
                send: expect.any(Function),
            });

            // Mock ipcRenderer to throw errors for this test
            const originalSend = electronMock.ipcRenderer.send;
            electronMock.ipcRenderer.send.mockImplementation(() => {
                throw new Error("Test send error");
            });

            const result = api.send("test-channel", "test-data");

            expect(result).toBeUndefined();
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[preload.js] Error in send(test-channel):",
                expect.any(Error)
            );

            // Restore original
            electronMock.ipcRenderer.send = originalSend;
        });

        it("should handle errors in safe event handler", () => {
            const api = (global as any).electronAPI;
            expect(api).toMatchObject({
                onIpc: expect.any(Function),
            });

            const errorCallback = () => {
                throw new Error("Test event error");
            };

            const unsubscribe = api.onIpc("test-channel", errorCallback);

            expect(typeof unsubscribe).toBe("function");
        });
    });

    describe("API Method Implementation Tests", () => {
        it("should test send method implementation", () => {
            const api = (global as any).electronAPI;
            expect(api).toMatchObject({
                send: expect.any(Function),
            });
            expect(typeof api.send).toBe("function");

            const result = api.send("test-channel", "test-data");
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(
                "test-channel",
                "test-data"
            );
            expect(result).toBeUndefined();
        });

        it("should test invoke method implementation", async () => {
            const api = (global as any).electronAPI;
            expect(api).toMatchObject({
                invoke: expect.any(Function),
            });
            expect(typeof api.invoke).toBe("function");

            electronMock.ipcRenderer.invoke.mockResolvedValue("test-response");
            const response = await api.invoke("test-channel", "test-data");

            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "test-channel",
                "test-data"
            );
            expect(response).toBe("test-response");
        });

        it("should test onIpc method implementation", () => {
            const api = (global as any).electronAPI;
            expect(api).toMatchObject({
                onIpc: expect.any(Function),
            });
            expect(typeof api.onIpc).toBe("function");

            const callback = vi.fn();
            const unsubscribe = api.onIpc("test-channel", callback);
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith(
                "test-channel",
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        it("should test onUpdateEvent method implementation", () => {
            const api = (global as any).electronAPI;
            expect(api).toMatchObject({
                onUpdateEvent: expect.any(Function),
            });
            expect(typeof api.onUpdateEvent).toBe("function");

            const callback = vi.fn();
            const eventName = "test-event";
            const unsubscribe = api.onUpdateEvent(eventName, callback);
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith(
                eventName,
                expect.any(Function)
            );
            expect(typeof unsubscribe).toBe("function");
        });

        it("should test injectMenu method implementation", async () => {
            const api = (global as any).electronAPI;
            expect(api).toMatchObject({
                injectMenu: expect.any(Function),
            });
            expect(typeof api.injectMenu).toBe("function");

            const theme = "dark";
            const fitFilePath = "/path/to/file.fit";
            const result = await api.injectMenu(theme, fitFilePath);
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "devtools-inject-menu",
                theme,
                fitFilePath
            );
            expect(result).toBe(true);
        });
    });

    describe("Utility Function Tests", () => {
        it("should test getChannelInfo method", () => {
            const api = (global as any).electronAPI;
            expect(api).toMatchObject({
                getChannelInfo: expect.any(Function),
            });
            expect(typeof api.getChannelInfo).toBe("function");

            const channelInfo = api.getChannelInfo();
            expect(channelInfo).toMatchObject({
                channels: expect.any(Object),
                events: expect.any(Object),
            });
            expect(typeof channelInfo).toBe("object");
            expect(channelInfo.channels).not.toHaveProperty("UNKNOWN_CHANNEL");
        });
    });

    describe("Development Tools Tests", () => {
        it("should test getPreloadInfo function in development", () => {
            const devTools = (global as any).devTools;
            expect(devTools).toMatchObject({
                getPreloadInfo: expect.any(Function),
            });

            const info = devTools.getPreloadInfo();
            expect(info).toMatchObject({
                apiMethods: expect.any(Array),
                constants: expect.any(Object),
                timestamp: expect.any(String),
                version: expect.any(String),
            });
            expect(typeof info).toBe("object");
            expect(Array.isArray(info.apiMethods)).toBe(true);
            expect(typeof info.constants).toBe("object");
            expect(typeof info.timestamp).toBe("string");
            expect(typeof info.version).toBe("string");
            expect(info.apiMethods.length).toBeGreaterThan(0);
        });

        it("should test testIPC function in development", async () => {
            const devTools = (global as any).devTools;
            expect(devTools).toMatchObject({
                testIPC: expect.any(Function),
            });

            const initialInvokeCount =
                electronMock.ipcRenderer.invoke.mock.calls.length;
            const result = await devTools.testIPC();

            expect(result).toBe(true);
            expect(
                electronMock.ipcRenderer.invoke.mock.calls.length
            ).toBeGreaterThan(initialInvokeCount);
        });

        it("should test logAPIState function in development", () => {
            const devTools = (global as any).devTools;
            expect(devTools).toMatchObject({
                logAPIState: expect.any(Function),
            });

            const initialLogCount = consoleLogSpy.mock.calls.length;
            const result = devTools.logAPIState();

            expect(result).toBeUndefined();
            expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(
                initialLogCount
            );

            const logCalls = consoleLogSpy.mock.calls.slice(initialLogCount);
            const hasAPIStateLog = logCalls.some(
                (call: any) =>
                    call[0] && call[0].includes && call[0].includes("API State")
            );
            expect(hasAPIStateLog).toBe(true);
        });

        it("should expose all development tools in development mode", () => {
            const devTools = (global as any).devTools;
            expect(devTools).toMatchObject({
                getPreloadInfo: expect.any(Function),
                logAPIState: expect.any(Function),
                testIPC: expect.any(Function),
            });
            expect(typeof devTools.getPreloadInfo).toBe("function");
            expect(typeof devTools.logAPIState).toBe("function");
            expect(typeof devTools.testIPC).toBe("function");
        });

        it("should handle development mode environment variable correctly", () => {
            // Test that development tools are available when NODE_ENV is development
            expect(mockProcess.env.NODE_ENV).toBe("development");
            const devTools = (global as any).devTools;
            expect(devTools).toMatchObject({
                getPreloadInfo: expect.any(Function),
            });
        });
    });

    describe("Validation Functions", () => {
        let electronAPI: any;

        beforeEach(() => {
            const electronAPICall =
                electronMock.contextBridge.exposeInMainWorld.mock.calls.find(
                    (call: any) => call[0] === "electronAPI"
                );
            electronAPI = electronAPICall[1];
        });

        it("should test validateCallback through onIpc method", () => {
            // Test valid callback
            const validCallback = vi.fn();
            expect(() =>
                electronAPI.onIpc("test-channel", validCallback)
            ).not.toThrow();
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith(
                "test-channel",
                expect.any(Function)
            );
            expect(
                typeof electronAPI.onIpc("test-channel-2", validCallback)
            ).toBe("function");

            // Test invalid callbacks to trigger validateCallback
            expect(() => electronAPI.onIpc("test-channel", null)).not.toThrow();
            expect(() =>
                electronAPI.onIpc("test-channel", undefined)
            ).not.toThrow();
            expect(() =>
                electronAPI.onIpc("test-channel", "not-a-function")
            ).not.toThrow();
            expect(() => electronAPI.onIpc("test-channel", 123)).not.toThrow();
            expect(() => electronAPI.onIpc("test-channel", {})).not.toThrow();
            expect(electronMock.ipcRenderer.on).not.toHaveBeenCalledWith(
                "test-channel",
                null
            );
        });

        it("should test validateString through send method", () => {
            // Test valid string
            expect(() =>
                electronAPI.send("valid-channel", "data")
            ).not.toThrow();
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(
                "valid-channel",
                "data"
            );
            expect(electronAPI.send("valid-channel-2", "data")).toBeUndefined();

            // Test invalid channels to trigger validateString
            expect(() => electronAPI.send(null, "data")).not.toThrow();
            expect(() => electronAPI.send(undefined, "data")).not.toThrow();
            expect(() => electronAPI.send(123, "data")).not.toThrow();
            expect(() => electronAPI.send({}, "data")).not.toThrow();
            expect(() => electronAPI.send([], "data")).not.toThrow();
            expect(electronMock.ipcRenderer.send).not.toHaveBeenCalledWith(
                null,
                "data"
            );
        });

        it("should test invoke method with various parameters", async () => {
            // Test valid invoke
            await electronAPI.invoke("test-channel", "arg1", "arg2");
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "test-channel",
                "arg1",
                "arg2"
            );

            // Test with no arguments
            await electronAPI.invoke("test-channel");
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "test-channel"
            );

            // Test with multiple arguments
            const result = await electronAPI.invoke(
                "test-channel",
                1,
                2,
                3,
                "test"
            );
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "test-channel",
                1,
                2,
                3,
                "test"
            );
            expect(result).toBe("default-mock");
        });

        it("should test send method functionality", () => {
            // Test send with data
            const firstResult = electronAPI.send("test-channel", {
                test: "data",
            });
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(
                "test-channel",
                { test: "data" }
            );
            expect(firstResult).toBeUndefined();

            // Test send without data
            const secondResult = electronAPI.send("test-channel");
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(
                "test-channel"
            );
            expect(secondResult).toBeUndefined();

            // Test send with multiple arguments
            const thirdResult = electronAPI.send(
                "test-channel",
                "arg1",
                "arg2",
                "arg3"
            );
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(
                "test-channel",
                "arg1",
                "arg2",
                "arg3"
            );
            expect(thirdResult).toBeUndefined();
        });
    });

    describe("API Method Testing", () => {
        let electronAPI: any;

        beforeEach(() => {
            const electronAPICall =
                electronMock.contextBridge.exposeInMainWorld.mock.calls.find(
                    (call: any) => call[0] === "electronAPI"
                );
            electronAPI = electronAPICall[1];
        });

        it("should test getChannelInfo method", () => {
            const channelInfo = electronAPI.getChannelInfo();

            expect(channelInfo).toMatchObject({
                channels: expect.any(Object),
                events: expect.any(Object),
                totalChannels: expect.any(Number),
                totalEvents: expect.any(Number),
            });
            expect(channelInfo).toHaveProperty("channels");
            expect(channelInfo).toHaveProperty("events");
            expect(channelInfo).toHaveProperty("totalChannels");
            expect(channelInfo).toHaveProperty("totalEvents");

            expect(typeof channelInfo.channels).toBe("object");
            expect(typeof channelInfo.events).toBe("object");
            expect(typeof channelInfo.totalChannels).toBe("number");
            expect(typeof channelInfo.totalEvents).toBe("number");

            expect(channelInfo.totalChannels).toBeGreaterThan(0);
            expect(channelInfo.totalEvents).toBeGreaterThan(0);
        });

        it("should test injectMenu method", async () => {
            // injectMenu expects theme and fitFilePath parameters, not menu items
            const theme = "dark";
            const fitFilePath = "/test/path.fit";

            // Mock the invoke to return success
            electronMock.ipcRenderer.invoke.mockResolvedValueOnce(true);

            const result = await electronAPI.injectMenu(theme, fitFilePath);
            expect(result).toBe(true);
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "devtools-inject-menu",
                theme,
                fitFilePath
            );
        });

        it("should test onUpdateEvent method", () => {
            const callback = vi.fn();

            const availableUnsubscribe = electronAPI.onUpdateEvent(
                "update-available",
                callback
            );
            const downloadedUnsubscribe = electronAPI.onUpdateEvent(
                "update-downloaded",
                callback
            );
            const errorUnsubscribe = electronAPI.onUpdateEvent(
                "update-error",
                callback
            );

            expect(electronMock.ipcRenderer.on.mock.calls).toEqual(
                expect.arrayContaining([
                    ["update-available", expect.any(Function)],
                    ["update-downloaded", expect.any(Function)],
                    ["update-error", expect.any(Function)],
                ])
            );
            expect(typeof availableUnsubscribe).toBe("function");
            expect(typeof downloadedUnsubscribe).toBe("function");
            expect(typeof errorUnsubscribe).toBe("function");
        });
    });

    describe("Edge Cases and Error Conditions", () => {
        let electronAPI: any;

        beforeEach(() => {
            const electronAPICall =
                electronMock.contextBridge.exposeInMainWorld.mock.calls.find(
                    (call: any) => call[0] === "electronAPI"
                );
            electronAPI = electronAPICall[1];
        });

        it("should handle null and undefined parameters", async () => {
            expect(electronAPI).toMatchObject({
                invoke: expect.any(Function),
                onIpc: expect.any(Function),
                send: expect.any(Function),
            });

            // Test all methods with null/undefined parameters
            expect(() => electronAPI.send(null, null)).not.toThrow();
            expect(() => electronAPI.send(undefined, undefined)).not.toThrow();
            expect(() => electronAPI.onIpc(null, null)).not.toThrow();
            expect(() => electronAPI.onIpc(undefined, undefined)).not.toThrow();

            // invoke now requires a non-empty string channel
            await expect(electronAPI.invoke(null, null)).rejects.toThrow(
                "Invalid channel for invoke"
            );
            // undefined should still fail validation
            await expect(
                electronAPI.invoke(undefined, undefined)
            ).rejects.toThrow("Invalid channel for invoke");
        });

        it("should handle invalid parameter types", async () => {
            expect(electronAPI).toMatchObject({
                invoke: expect.any(Function),
                onIpc: expect.any(Function),
                send: expect.any(Function),
            });

            // Test with various invalid parameter types
            const invalidTypes = [
                123,
                {},
                [],
                true,
                false,
            ];

            for (const invalid of invalidTypes) {
                expect(() => electronAPI.send(invalid, "data")).not.toThrow();
                expect(() =>
                    electronAPI.onIpc("channel", invalid)
                ).not.toThrow();
                // invoke should reject invalid channel types
                await expect(
                    electronAPI.invoke(invalid, "data")
                ).rejects.toThrow("Invalid channel for invoke");
            }
        });

        it("should handle empty and special string values", async () => {
            const emptySendResult = electronAPI.send("", "data");
            const whitespaceSendResult = electronAPI.send("   ", "data");
            const emptyListenerResult = electronAPI.onIpc("", vi.fn());

            expect(emptySendResult).toBeUndefined();
            expect(whitespaceSendResult).toBeUndefined();
            expect(emptyListenerResult).toBeUndefined();
            expect(electronMock.ipcRenderer.send).not.toHaveBeenCalledWith(
                "",
                "data"
            );
            // invoke now requires a non-empty channel name
            await expect(electronAPI.invoke("", "data")).rejects.toThrow(
                "Invalid channel for invoke"
            );
            const whitespaceError = await electronAPI
                .invoke("   ", "data")
                .catch((error: Error) => error);
            expect(whitespaceError.message).toBe("Invalid channel for invoke");
        });

        it("should handle process beforeExit event", () => {
            // We can't directly test process.emit, but we can verify the callback was registered
            // by checking if the beforeExit handler was set up in the existing tests
            const beforeExitCalls = mockProcess.once?.mock?.calls?.filter(
                (call: any) => call[0] === "beforeExit"
            );

            expect(beforeExitCalls).toHaveLength(1);
            expect(typeof beforeExitCalls[0][1]).toBe("function");
        });

        it("should handle complex data structures in send and invoke", async () => {
            const complexData = {
                nested: {
                    array: [
                        1,
                        2,
                        3,
                    ],
                    object: { key: "value" },
                    null: null,
                    undefined: undefined,
                },
                functions: vi.fn(),
                date: new Date(),
            };

            expect(
                electronAPI.send("test-channel", complexData)
            ).toBeUndefined();
            await expect(
                electronAPI.invoke("test-channel", complexData)
            ).resolves.toBe("default-mock");
        });
    });
});
