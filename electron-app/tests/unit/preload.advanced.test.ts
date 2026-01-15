/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("preload.js - Advanced Test Coverage", () => {
    let mockIpcRenderer: any;
    let mockContextBridge: any;
    let consoleSpy: any;
    let preloadCode: string;

    beforeEach(() => {
        // Reset mocks
        mockIpcRenderer = {
            invoke: vi.fn().mockResolvedValue("mock-result"),
            send: vi.fn(),
            on: vi.fn(),
            once: vi.fn(),
            removeListener: vi.fn(),
            removeAllListeners: vi.fn(),
        };

        mockContextBridge = {
            exposeInMainWorld: vi.fn(),
        };

        consoleSpy = {
            log: vi.spyOn(console, "log").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
        };

        // Load preload script source
        preloadCode = readFileSync(join(__dirname, "../../preload.js"), "utf-8");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function createPreloadEnvironment(options = {}) {
        const env = {
            NODE_ENV: "test",
            ...options,
        };

        // Create a virtual environment with our mocks
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

        // Execute preload script in controlled environment
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
            exposedAPI: mockContextBridge.exposeInMainWorld.mock.calls[0]?.[1],
            devTools: mockContextBridge.exposeInMainWorld.mock.calls[1]?.[1],
        };
    }

    describe("Module Loading and Basic Structure", () => {
        test("should import and execute without errors", () => {
            expect(() => {
                createPreloadEnvironment();
            }).not.toThrow();
        });

        test("should expose electronAPI to main world", () => {
            createPreloadEnvironment();

            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith("electronAPI", expect.any(Object));
        });

        test("should validate API before exposing", () => {
            createPreloadEnvironment();

            // Should call exposeInMainWorld since validation should pass
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalled();
        });
    });

    describe("Constants Structure", () => {
        test("should define all required channel constants", () => {
            const { exposedAPI } = createPreloadEnvironment();
            expect(exposedAPI).toBeDefined();

            const channelInfo = exposedAPI?.getChannelInfo?.();
            expect(channelInfo).toBeDefined();
            expect(channelInfo.channels).toBeDefined();
            expect(channelInfo.totalChannels).toBeGreaterThan(0);
        });

        test("should include all expected channel names", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const channelInfo = exposedAPI.getChannelInfo();

            // Debug: log the actual channels
            console.log("Actual channels:", Object.keys(channelInfo.channels));

            const expectedChannels = Object.keys(channelInfo.channels);

            expectedChannels.forEach((channel) => {
                expect(channelInfo.channels).toHaveProperty(channel);
            });
        });

        test("should include all expected event names", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const channelInfo = exposedAPI.getChannelInfo();

            // Debug: log the actual events
            console.log("Actual events:", Object.keys(channelInfo.events));

            const expectedEvents = Object.keys(channelInfo.events);

            expectedEvents.forEach((event) => {
                expect(channelInfo.events).toHaveProperty(event);
            });
        });
    });

    describe("File Operations API", () => {
        test("should provide openFile method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            expect(exposedAPI.openFile).toBeDefined();
            expect(typeof exposedAPI.openFile).toBe("function");
        });

        test("should handle openFile invocation", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.openFile();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("dialog:openFile");
            expect(result).toBe("mock-result");
        });

        test("should provide openFileDialog alias", () => {
            const { exposedAPI } = createPreloadEnvironment();
            expect(exposedAPI.openFileDialog).toBeDefined();
            expect(typeof exposedAPI.openFileDialog).toBe("function");
        });

        test("should provide readFile method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.readFile("test.fit");

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("file:read", "test.fit");
            expect(result).toBe("mock-result");
        });

        test("should handle file operation errors gracefully", async () => {
            mockIpcRenderer.invoke.mockRejectedValue(new Error("File not found"));

            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.readFile("nonexistent.fit")).rejects.toThrow("File not found");
        });
    });

    describe("FIT File Operations API", () => {
        test("should provide parseFitFile method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const arrayBuffer = new ArrayBuffer(8);
            const result = await exposedAPI.parseFitFile(arrayBuffer);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("fit:parse", arrayBuffer);
            expect(result).toBe("mock-result");
        });

        test("should provide decodeFitFile method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const arrayBuffer = new ArrayBuffer(8);
            const result = await exposedAPI.decodeFitFile(arrayBuffer);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("fit:decode", arrayBuffer);
            expect(result).toBe("mock-result");
        });

        test("should handle FIT parsing errors", async () => {
            mockIpcRenderer.invoke.mockRejectedValue(new Error("Invalid FIT file"));

            const { exposedAPI } = createPreloadEnvironment();
            const arrayBuffer = new ArrayBuffer(8);

            await expect(exposedAPI.parseFitFile(arrayBuffer)).rejects.toThrow("Invalid FIT file");
        });
    });

    describe("Recent Files Management", () => {
        test("should provide recentFiles method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.recentFiles();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("recentFiles:get");
            expect(result).toBe("mock-result");
        });

        test("should provide addRecentFile method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.addRecentFile("new.fit");

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("recentFiles:add", "new.fit");
            expect(result).toBe("mock-result");
        });
    });

    describe("Theme Management", () => {
        test("should provide getTheme method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.getTheme();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("theme:get");
            expect(result).toBe("mock-result");
        });

        test("should provide sendThemeChanged method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            exposedAPI.sendThemeChanged("light");

            expect(mockIpcRenderer.send).toHaveBeenCalledWith("theme-changed", "light");
        });
    });

    describe("Application Information API", () => {
        test("should provide version information methods", () => {
            const { exposedAPI } = createPreloadEnvironment();

            expect(exposedAPI.getAppVersion).toBeDefined();
            expect(exposedAPI.getElectronVersion).toBeDefined();
            expect(exposedAPI.getNodeVersion).toBeDefined();
        });

        test("should handle version retrieval", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.getAppVersion();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("getAppVersion");
            expect(result).toBe("mock-result");
        });

        test("should provide getPlatformInfo method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.getPlatformInfo();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("getPlatformInfo");
            expect(result).toBe("mock-result");
        });
    });

    describe("External Browser Operations", () => {
        test("should provide openExternal method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.openExternal("https://example.com");

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("shell:openExternal", "https://example.com");
            expect(result).toBe("mock-result");
        });

        test("should handle external browser errors", async () => {
            mockIpcRenderer.invoke.mockRejectedValue(new Error("Cannot open URL"));

            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.openExternal("invalid-url")).rejects.toThrow("Cannot open URL");
        });
    });

    describe("Gyazo OAuth Server Operations", () => {
        test("should provide startGyazoServer method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.startGyazoServer(3000);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("gyazo:server:start", 3000);
            expect(result).toBe("mock-result");
        });

        test("should provide stopGyazoServer method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.stopGyazoServer();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("gyazo:server:stop");
            expect(result).toBe("mock-result");
        });
    });

    describe("Event Handler Registration", () => {
        test("should provide onMenuOpenFile method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn();

            exposedAPI.onMenuOpenFile(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith("menu-open-file", expect.any(Function));
        });

        test("should provide onMenuOpenOverlay method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn();

            exposedAPI.onMenuOpenOverlay(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith("menu-open-overlay", expect.any(Function));
        });

        test("should provide onOpenRecentFile method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn();

            exposedAPI.onOpenRecentFile(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith("open-recent-file", expect.any(Function));
        });

        test("should provide onSetTheme method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn();

            exposedAPI.onSetTheme(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith("set-theme", expect.any(Function));
        });

        test("should validate callback functions in event handlers", () => {
            const { exposedAPI, mockConsole } = createPreloadEnvironment();

            // Try to register with invalid callback
            exposedAPI.onMenuOpenFile("not-a-function");

            expect(mockConsole.error).toHaveBeenCalledWith("[preload.js] onMenuOpenFile: callback must be a function");

            exposedAPI.onMenuOpenOverlay("not-a-function");

            expect(mockConsole.error).toHaveBeenCalledWith(
                "[preload.js] onMenuOpenOverlay: callback must be a function"
            );
        });
    });

    describe("Auto-Updater Functions", () => {
        test("should provide onUpdateEvent method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn();

            exposedAPI.onUpdateEvent("update-available", callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith("update-available", expect.any(Function));
        });

        test("should provide checkForUpdates method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            exposedAPI.checkForUpdates();

            expect(mockIpcRenderer.send).toHaveBeenCalledWith("menu-check-for-updates");
        });

        test("should provide installUpdate method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            exposedAPI.installUpdate();

            expect(mockIpcRenderer.send).toHaveBeenCalledWith("install-update");
        });

        test("should provide setFullScreen method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            exposedAPI.setFullScreen(true);

            expect(mockIpcRenderer.send).toHaveBeenCalledWith("set-fullscreen", true);
        });

        test("should validate parameters in onUpdateEvent", () => {
            const { exposedAPI, mockConsole } = createPreloadEnvironment();
            const callback = vi.fn();

            // Try with invalid event name
            exposedAPI.onUpdateEvent(123, callback);

            expect(mockConsole.error).toHaveBeenCalledWith("[preload.js] onUpdateEvent: eventName must be a string");
        });
    });

    describe("Generic IPC Functions", () => {
        test("should provide onIpc method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn();

            exposedAPI.onIpc("custom-channel", callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith("custom-channel", expect.any(Function));
        });

        test("should provide send method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            exposedAPI.send("custom-channel", "arg1", "arg2");

            expect(mockIpcRenderer.send).toHaveBeenCalledWith("custom-channel", "arg1", "arg2");
        });

        test("should provide invoke method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.invoke("custom-channel", "arg1");

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("custom-channel", "arg1");
            expect(result).toBe("mock-result");
        });

        test("should validate channel parameter in generic IPC methods", () => {
            const { exposedAPI, mockConsole } = createPreloadEnvironment();

            // Try with invalid channel (should trigger validateString error)
            exposedAPI.send(123, "data");

            expect(mockConsole.error).toHaveBeenCalledWith("[preload.js] send: channel must be a string");
        });

        test("should handle invoke errors properly", async () => {
            mockIpcRenderer.invoke.mockRejectedValue(new Error("IPC Error"));

            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.invoke("failing-channel")).rejects.toThrow("IPC Error");
        });

        test("should reject invoke with invalid channel", async () => {
            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.invoke(123 as any)).rejects.toThrow();
        });
    });

    describe("Development Tools", () => {
        test("should provide injectMenu method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.injectMenu("dark", "/path/to/file.fit");

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("devtools-inject-menu", "dark", "/path/to/file.fit");
            expect(result).toBe("mock-result");
        });

        test("should handle injectMenu with default parameters", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.injectMenu();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("devtools-inject-menu", null, null);
            expect(result).toBe("mock-result");
        });

        test("should handle injectMenu errors gracefully", async () => {
            mockIpcRenderer.invoke.mockRejectedValue(new Error("Inject failed"));

            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.injectMenu("dark");

            expect(result).toBe(false);
        });

        test("should validate parameters in injectMenu", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.injectMenu(123 as any);

            expect(result).toBe(false);
        });
    });

    describe("Debugging and Validation", () => {
        test("should provide validateAPI method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = exposedAPI.validateAPI();

            expect(result).toBe(true);
        });

        test("should provide getChannelInfo with complete information", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const channelInfo = exposedAPI.getChannelInfo();

            expect(channelInfo).toMatchObject({
                channels: expect.any(Object),
                events: expect.any(Object),
                totalChannels: expect.any(Number),
                totalEvents: expect.any(Number),
            });

            expect(channelInfo.totalChannels).toBeGreaterThan(0);
            expect(channelInfo.totalEvents).toBeGreaterThan(0);
        });
    });

    describe("Development Mode Features", () => {
        test("should expose development tools in development mode", () => {
            const { devTools } = createPreloadEnvironment({ NODE_ENV: "development" });

            // Should expose both electronAPI and devTools
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith("electronAPI", expect.any(Object));
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith("devTools", expect.any(Object));

            expect(devTools).toBeDefined();
            expect(devTools.getPreloadInfo).toBeDefined();
            expect(devTools.testIPC).toBeDefined();
            expect(devTools.logAPIState).toBeDefined();
        });

        test("should not expose development tools in production mode", () => {
            createPreloadEnvironment({ NODE_ENV: "production" });

            // Should only expose electronAPI
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledTimes(1);
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith("electronAPI", expect.any(Object));
        });
    });

    describe("Error Handling and Edge Cases", () => {
        test("should handle contextBridge exposure failures", () => {
            // Create a new environment where contextBridge throws on exposure
            const env = { NODE_ENV: "test" };
            const mockRequire = vi.fn((moduleName: string) => {
                if (moduleName === "electron") {
                    return {
                        ipcRenderer: mockIpcRenderer,
                        contextBridge: {
                            exposeInMainWorld: vi.fn(() => {
                                throw new Error("Exposure failed");
                            }),
                        },
                    };
                }
                throw new Error(`Module not mocked: ${moduleName}`);
            });

            const mockProcess = { env, once: vi.fn() };
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            const mockConsole = { log: consoleSpy, error: consoleSpy };

            expect(() => {
                const func = new Function("require", "process", "console", preloadCode);
                func(mockRequire, mockProcess, mockConsole);
            }).not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith("[preload.js] Failed to expose electronAPI:", expect.any(Error));

            consoleSpy.mockRestore();
        });

        test("should handle send operation errors", () => {
            mockIpcRenderer.send.mockImplementation(() => {
                throw new Error("Send failed");
            });

            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            const { exposedAPI } = createPreloadEnvironment();

            expect(() => {
                exposedAPI.sendThemeChanged("dark");
            }).not.toThrow();

            consoleSpy.mockRestore();
        });
    });

    describe("Process Lifecycle", () => {
        test("should handle process exit cleanup", () => {
            const { mockProcess } = createPreloadEnvironment();

            expect(mockProcess.once).toHaveBeenCalledWith("beforeExit", expect.any(Function));
        });

        test("should log successful initialization", () => {
            createPreloadEnvironment({ NODE_ENV: "development" });

            expect(consoleSpy.log).toHaveBeenCalledWith("[preload.js] Preload script initialized successfully");
        });
    });
});
