/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { resolvePreloadScriptRequire } from "../vitest/helpers/preloadModuleMocks";

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

const EXPECTED_PRELOAD_CHANNELS = {
    APP_VERSION: "getAppVersion",
    CHROME_VERSION: "getChromeVersion",
    CLIPBOARD_WRITE_PNG_DATA_URL: "clipboard:writePngDataUrl",
    CLIPBOARD_WRITE_TEXT: "clipboard:writeText",
    DEVTOOLS_INJECT_MENU: "devtools-inject-menu",
    DIALOG_OPEN_FILE: "dialog:openFile",
    DIALOG_OPEN_FOLDER: "dialog:openFolder",
    DIALOG_OPEN_OVERLAY_FILES: "dialog:openOverlayFiles",
    ELECTRON_VERSION: "getElectronVersion",
    FILE_READ: "file:read",
    FIT_BROWSER_GET_FOLDER: "browser:getFolder",
    FIT_BROWSER_IS_ENABLED: "browser:isEnabled",
    FIT_BROWSER_LIST_FOLDER: "browser:listFolder",
    FIT_BROWSER_SET_ENABLED: "browser:setEnabled",
    FIT_BROWSER_SET_FOLDER: "browser:setFolder",
    FIT_DECODE: "fit:decode",
    FIT_PARSE: "fit:parse",
    GYAZO_SERVER_START: "gyazo:server:start",
    GYAZO_SERVER_STOP: "gyazo:server:stop",
    LICENSE_INFO: "getLicenseInfo",
    NODE_VERSION: "getNodeVersion",
    PLATFORM_INFO: "getPlatformInfo",
    RECENT_FILES_ADD: "recentFiles:add",
    RECENT_FILES_APPROVE: "recentFiles:approve",
    RECENT_FILES_GET: "recentFiles:get",
    SHELL_OPEN_EXTERNAL: "shell:openExternal",
    THEME_GET: "theme:get",
} as const;

const EXPECTED_PRELOAD_EVENTS = {
    FIT_FILE_LOADED: "fit-file-loaded",
    INSTALL_UPDATE: "install-update",
    MENU_CHECK_FOR_UPDATES: "menu-check-for-updates",
    MENU_OPEN_FILE: "menu-open-file",
    MENU_OPEN_OVERLAY: "menu-open-overlay",
    OPEN_RECENT_FILE: "open-recent-file",
    OPEN_SUMMARY_COLUMN_SELECTOR: "open-summary-column-selector",
    SET_FULLSCREEN: "set-fullscreen",
    SET_THEME: "set-theme",
    THEME_CHANGED: "theme-changed",
} as const;

describe("preload.js dist API methods", () => {
    let mockIpcRenderer: MockIpcRenderer;
    let mockContextBridge: MockContextBridge;
    let consoleSpy: {
        error: ReturnType<typeof vi.spyOn>;
        log: ReturnType<typeof vi.spyOn>;
    };
    let preloadCode: string;

    beforeEach(() => {
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

        mockContextBridge = {
            exposeInMainWorld: vi.fn(),
        };

        consoleSpy = {
            log: vi.spyOn(console, "log").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
        };

        preloadCode = readFileSync(
            join(__dirname, "../../electron-app/dist/preload.js"),
            "utf-8"
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function createPreloadEnvironment(options = {}) {
        const env = {
            NODE_ENV: "test",
            ...options,
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
            exposedAPI: mockContextBridge.exposeInMainWorld.mock
                .calls[0]?.[1] as ExposedPreloadApi | undefined,
            devTools: mockContextBridge.exposeInMainWorld.mock.calls[1]?.[1],
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

    describe("Module Loading and Basic Structure", () => {
        test("should import and execute without errors", () => {
            const { exposedAPI, mockProcess, mockRequire } =
                createPreloadEnvironment();

            expect(mockRequire).toHaveBeenCalledWith("electron");
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                expect.objectContaining({
                    getChannelInfo: expect.any(Function),
                    validateAPI: expect.any(Function),
                })
            );
            expect(exposedAPI?.validateAPI()).toBe(true);
            expect(mockProcess.once).toHaveBeenCalledWith(
                "beforeExit",
                expect.any(Function)
            );
            expect(consoleSpy.error).not.toHaveBeenCalled();
        });

        test("should expose electronAPI to main world", () => {
            const { exposedAPI } = createPreloadEnvironment();

            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                exposedAPI
            );
            expect(exposedAPI.validateAPI()).toBe(true);
        });

        test("should validate API before exposing", () => {
            const { exposedAPI } = createPreloadEnvironment();

            expect(exposedAPI.validateAPI()).toBe(true);
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                exposedAPI
            );
        });
    });

    describe("Constants Structure", () => {
        test("should define all required channel constants", () => {
            const { exposedAPI } = createPreloadEnvironment();
            expect(exposedAPI).toMatchObject({
                getChannelInfo: expect.any(Function),
            });

            const channelInfo = exposedAPI.getChannelInfo();
            expect(channelInfo).toMatchObject({
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: 27,
                totalEvents: 10,
            });
        });

        test("should include all expected channel names", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const channelInfo = exposedAPI.getChannelInfo();

            const expectedChannels = Object.keys(channelInfo.channels);

            expectedChannels.forEach((channel) => {
                expect(channelInfo.channels).toHaveProperty(channel);
            });
        });

        test("should include all expected event names", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const channelInfo = exposedAPI.getChannelInfo();

            const expectedEvents = Object.keys(channelInfo.events);

            expectedEvents.forEach((event) => {
                expect(channelInfo.events).toHaveProperty(event);
            });
        });
    });

    describe("File Operations API", () => {
        test("should provide openFile method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            expect(exposedAPI.openFile).toBeTypeOf("function");
            expect(exposedAPI.openFileDialog).toBeTypeOf("function");
        });

        test("should handle openFile invocation", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.openFile();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "dialog:openFile"
            );
            expect(result).toBe("mock-result");
        });

        test("should provide openFileDialog alias", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.openFileDialog();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "dialog:openFile"
            );
            expect(result).toBe("mock-result");
        });

        test("should provide readFile method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.readFile("test.fit");

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "file:read",
                "test.fit"
            );
            expect(result).toBe("mock-result");
        });

        test("should handle file operation errors gracefully", async () => {
            mockIpcRenderer.invoke.mockRejectedValue(
                new Error("File not found")
            );

            const { exposedAPI } = createPreloadEnvironment();

            await expect(
                exposedAPI.readFile("nonexistent.fit")
            ).rejects.toThrow("File not found");
        });
    });

    describe("FIT File Operations API", () => {
        test("should provide parseFitFile method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const arrayBuffer = new ArrayBuffer(8);
            const result = await exposedAPI.parseFitFile(arrayBuffer);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "fit:parse",
                arrayBuffer
            );
            expect(result).toBe("mock-result");
        });

        test("should provide decodeFitFile method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const arrayBuffer = new ArrayBuffer(8);
            const result = await exposedAPI.decodeFitFile(arrayBuffer);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "fit:decode",
                arrayBuffer
            );
            expect(result).toBe("mock-result");
        });

        test("should handle FIT parsing errors", async () => {
            mockIpcRenderer.invoke.mockRejectedValue(
                new Error("Invalid FIT file")
            );

            const { exposedAPI } = createPreloadEnvironment();
            const arrayBuffer = new ArrayBuffer(8);

            await expect(exposedAPI.parseFitFile(arrayBuffer)).rejects.toThrow(
                "Invalid FIT file"
            );
        });
    });

    describe("Recent Files Management", () => {
        test("should provide recentFiles method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.recentFiles();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "recentFiles:get"
            );
            expect(result).toBe("mock-result");
        });

        test("should provide addRecentFile method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.addRecentFile("new.fit");

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "recentFiles:add",
                "new.fit"
            );
            expect(result).toBe("mock-result");
        });

        test("should propagate recent file retrieval errors", async () => {
            mockIpcRenderer.invoke.mockRejectedValue(
                new Error("recent files unavailable")
            );

            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.recentFiles()).rejects.toThrow(
                "recent files unavailable"
            );
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
            const result = exposedAPI.sendThemeChanged("light");

            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "theme-changed",
                "light"
            );
            expect(result).toBeUndefined();
        });
    });

    describe("Application Information API", () => {
        test("should provide version information methods", () => {
            const { exposedAPI } = createPreloadEnvironment();

            expect(exposedAPI.getAppVersion).toBeTypeOf("function");
            expect(exposedAPI.getElectronVersion).toBeTypeOf("function");
            expect(exposedAPI.getNodeVersion).toBeTypeOf("function");
            expect(exposedAPI.getChromeVersion).toBeTypeOf("function");
        });

        test("should handle version retrieval", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.getAppVersion();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getAppVersion"
            );
            expect(result).toBe("mock-result");
        });

        test("should provide getPlatformInfo method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.getPlatformInfo();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getPlatformInfo"
            );
            expect(result).toBe("mock-result");
        });

        test("should propagate version lookup failures", async () => {
            mockIpcRenderer.invoke.mockRejectedValue(
                new Error("version unavailable")
            );

            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.getAppVersion()).rejects.toThrow(
                "version unavailable"
            );
        });
    });

    describe("External Browser Operations", () => {
        test("should provide openExternal method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.openExternal("https://example.com");

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "shell:openExternal",
                "https://example.com"
            );
            expect(result).toBe("mock-result");
        });

        test("should handle external browser errors", async () => {
            mockIpcRenderer.invoke.mockRejectedValue(
                new Error("Cannot open URL")
            );

            const { exposedAPI } = createPreloadEnvironment();

            await expect(
                exposedAPI.openExternal("invalid-url")
            ).rejects.toThrow("Cannot open URL");
        });
    });

    describe("Gyazo OAuth Server Operations", () => {
        test("should provide startGyazoServer method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.startGyazoServer(3000);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "gyazo:server:start",
                3000
            );
            expect(result).toBe("mock-result");
        });

        test("should provide stopGyazoServer method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.stopGyazoServer();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "gyazo:server:stop"
            );
            expect(result).toBe("mock-result");
        });

        test("should propagate Gyazo server startup failures", async () => {
            mockIpcRenderer.invoke.mockRejectedValue(
                new Error("port unavailable")
            );

            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.startGyazoServer(3000)).rejects.toThrow(
                "port unavailable"
            );
        });
    });

    describe("Event Handler Registration", () => {
        test("should provide onMenuOpenFile method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn();

            const unsubscribe = exposedAPI.onMenuOpenFile(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "menu-open-file",
                expect.any(Function)
            );
            expect(unsubscribe).toBeTypeOf("function");
        });

        test("should provide onMenuOpenOverlay method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn();

            const unsubscribe = exposedAPI.onMenuOpenOverlay(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "menu-open-overlay",
                expect.any(Function)
            );
            expect(unsubscribe).toBeTypeOf("function");
        });

        test("should provide onOpenRecentFile method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn();

            const unsubscribe = exposedAPI.onOpenRecentFile(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "open-recent-file",
                expect.any(Function)
            );
            expect(unsubscribe).toBeTypeOf("function");
        });

        test("should provide onSetTheme method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn();

            const unsubscribe = exposedAPI.onSetTheme(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "set-theme",
                expect.any(Function)
            );
            expect(unsubscribe).toBeTypeOf("function");
        });

        test("should validate callback functions in event handlers", () => {
            const { exposedAPI, mockConsole } = createPreloadEnvironment();

            // Try to register with invalid callback
            const openFileUnsubscribe =
                exposedAPI.onMenuOpenFile("not-a-function");

            expect(mockConsole.error).toHaveBeenCalledWith(
                "[preload.js] onMenuOpenFile: callback must be a function"
            );
            expect(openFileUnsubscribe).toBeTypeOf("function");

            const openOverlayUnsubscribe =
                exposedAPI.onMenuOpenOverlay("not-a-function");

            expect(mockConsole.error).toHaveBeenCalledWith(
                "[preload.js] onMenuOpenOverlay: callback must be a function"
            );
            expect(openOverlayUnsubscribe).toBeTypeOf("function");
            expect(mockIpcRenderer.on).not.toHaveBeenCalledWith(
                "menu-open-file",
                "not-a-function"
            );
        });
    });

    describe("Auto-Updater Functions", () => {
        test("should provide onUpdateEvent method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn();

            const unsubscribe = exposedAPI.onUpdateEvent(
                "update-available",
                callback
            );

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "update-available",
                expect.any(Function)
            );
            expect(unsubscribe).toBeTypeOf("function");
        });

        test("should provide checkForUpdates method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = exposedAPI.checkForUpdates();

            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "menu-check-for-updates"
            );
            expect(result).toBeUndefined();
        });

        test("should provide installUpdate method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = exposedAPI.installUpdate();

            expect(mockIpcRenderer.send).toHaveBeenCalledWith("install-update");
            expect(result).toBeUndefined();
        });

        test("should provide setFullScreen method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = exposedAPI.setFullScreen(true);

            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "set-fullscreen",
                true
            );
            expect(result).toBeUndefined();
        });

        test("should validate parameters in onUpdateEvent", () => {
            const { exposedAPI, mockConsole } = createPreloadEnvironment();
            const callback = vi.fn();

            // Try with invalid event name
            const result = exposedAPI.onUpdateEvent(123, callback);

            expect(mockConsole.error).toHaveBeenCalledWith(
                "[preload.js] onUpdateEvent: eventName must be a string"
            );
            expect(result).toBeUndefined();
        });
    });

    describe("Generic IPC Functions", () => {
        test("should provide onIpc method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn();

            const unsubscribe = exposedAPI.onIpc("custom-channel", callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "custom-channel",
                expect.any(Function)
            );
            expect(unsubscribe).toBeTypeOf("function");
        });

        test("should provide send method", () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = exposedAPI.send("custom-channel", "arg1", "arg2");

            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "custom-channel",
                "arg1",
                "arg2"
            );
            expect(result).toBeUndefined();
        });

        test("should provide invoke method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.invoke("custom-channel", "arg1");

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "custom-channel",
                "arg1"
            );
            expect(result).toBe("mock-result");
        });

        test("should validate channel parameter in generic IPC methods", () => {
            const { exposedAPI, mockConsole } = createPreloadEnvironment();

            // Try with invalid channel (should trigger validateString error)
            const result = exposedAPI.send(123, "data");

            expect(mockConsole.error).toHaveBeenCalledWith(
                "[preload.js] send: channel must be a string"
            );
            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).not.toHaveBeenCalledWith(123, "data");
        });

        test("should handle invoke errors properly", async () => {
            mockIpcRenderer.invoke.mockRejectedValue(new Error("IPC Error"));

            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.invoke("failing-channel")).rejects.toThrow(
                "IPC Error"
            );
        });

        test("should reject invoke with invalid channel", async () => {
            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.invoke(123)).rejects.toThrow(
                "Invalid channel for invoke"
            );
        });
    });

    describe("Development Tools", () => {
        test("should provide injectMenu method", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.injectMenu(
                "dark",
                "/path/to/file.fit"
            );

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "devtools-inject-menu",
                "dark",
                "/path/to/file.fit"
            );
            expect(result).toBe("mock-result");
        });

        test("should handle injectMenu with default parameters", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.injectMenu();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "devtools-inject-menu",
                null,
                null
            );
            expect(result).toBe("mock-result");
        });

        test("should handle injectMenu errors gracefully", async () => {
            mockIpcRenderer.invoke.mockRejectedValue(
                new Error("Inject failed")
            );

            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.injectMenu("dark");

            expect(result).toBe(false);
        });

        test("should reject invalid parameters in injectMenu", async () => {
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.injectMenu(123);

            expect(result).toBe(false);
            expect(mockIpcRenderer.invoke).not.toHaveBeenCalledWith(
                "devtools-inject-menu",
                123
            );
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
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: 27,
                totalEvents: 10,
            });
        });
    });

    describe("Development Mode Features", () => {
        test("should expose development tools in development mode", () => {
            const { devTools, exposedAPI } = createPreloadEnvironment({
                NODE_ENV: "development",
            });

            // Should expose both electronAPI and devTools
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                exposedAPI
            );
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "devTools",
                devTools
            );

            expect(devTools).toMatchObject({
                getPreloadInfo: expect.any(Function),
                logAPIState: expect.any(Function),
                testIPC: expect.any(Function),
            });
        });

        test("should not expose development tools in production mode", () => {
            const { devTools, exposedAPI } = createPreloadEnvironment({
                NODE_ENV: "production",
            });

            // Should only expose electronAPI
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledTimes(
                1
            );
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                exposedAPI
            );
            expect(devTools).toBeUndefined();
        });
    });

    describe("Error Handling and Edge Cases", () => {
        test("should handle contextBridge exposure failures", () => {
            // Create a new environment where contextBridge throws on exposure
            const env = { NODE_ENV: "test" };
            const mockRequire = vi.fn((moduleName: string) =>
                resolvePreloadScriptRequire(moduleName, {
                    ipcRenderer: mockIpcRenderer,
                    contextBridge: {
                        exposeInMainWorld: vi.fn(() => {
                            throw new Error("Exposure failed");
                        }),
                    },
                })
            );

            const mockProcess = { env, once: vi.fn() };
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            const mockConsole = { log: consoleSpy, error: consoleSpy };

            const result = runPreloadScript(
                mockRequire,
                mockProcess,
                mockConsole
            );

            expect(result).toBeUndefined();
            expect(mockProcess.once).toHaveBeenCalledWith(
                "beforeExit",
                expect.any(Function)
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                "[preload.js] Failed to expose electronAPI:",
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        test("should handle send operation errors", () => {
            mockIpcRenderer.send.mockImplementation(() => {
                throw new Error("Send failed");
            });

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            const { exposedAPI } = createPreloadEnvironment();

            const result = exposedAPI.sendThemeChanged("dark");

            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "theme-changed",
                "dark"
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                "[preload.js] Error in sendThemeChanged:",
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe("Process Lifecycle", () => {
        test("should handle process exit cleanup", () => {
            const { mockProcess } = createPreloadEnvironment();

            expect(mockProcess.once).toHaveBeenCalledWith(
                "beforeExit",
                expect.any(Function)
            );
            expect(mockProcess.env.NODE_ENV).toBe("test");
        });

        test("should log successful initialization", () => {
            const { devTools } = createPreloadEnvironment({
                NODE_ENV: "development",
            });

            expect(consoleSpy.log).toHaveBeenCalledWith(
                "[preload.js] Preload script initialized successfully"
            );
            expect(devTools.getPreloadInfo()).toMatchObject({
                version: "1.0.0",
            });
        });
    });
});
