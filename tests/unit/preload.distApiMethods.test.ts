// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolvePreloadScriptRequire } from "../vitest/helpers/preloadModuleMocks";
import { readPreloadDistCode } from "../vitest/helpers/preloadDist";

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

type ContextBridgeExpose = (name: string, api: unknown) => void;
type IpcInvoke = (...args: unknown[]) => Promise<unknown>;
type IpcListener = (...args: unknown[]) => void;
type ProcessOnce = (
    eventName: string,
    listener: (...args: unknown[]) => void
) => void;
type RequireModule = (moduleName: string) => unknown;

interface MockIpcRenderer {
    invoke: ReturnType<typeof vi.fn<IpcInvoke>>;
    on: ReturnType<typeof vi.fn<IpcListener>>;
    once: ReturnType<typeof vi.fn<IpcListener>>;
    removeAllListeners: ReturnType<typeof vi.fn<IpcListener>>;
    removeListener: ReturnType<typeof vi.fn<IpcListener>>;
    send: ReturnType<typeof vi.fn<IpcListener>>;
}

interface MockContextBridge {
    exposeInMainWorld: ReturnType<typeof vi.fn<ContextBridgeExpose>>;
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

const developmentToolsGlobalName = ["dev", "Tools"].join("");

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
            invoke: vi.fn<IpcInvoke>().mockResolvedValue("mock-result"),
            send: vi.fn<IpcListener>(),
            on: vi.fn<IpcListener>(),
            once: vi.fn<IpcListener>(),
            removeListener: vi.fn<IpcListener>(),
            removeAllListeners: vi.fn<IpcListener>(),
        };

        mockContextBridge = {
            exposeInMainWorld: vi.fn<ContextBridgeExpose>(),
        };

        consoleSpy = {
            log: vi.spyOn(console, "log").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
        };

        preloadCode = readPreloadDistCode();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function createPreloadEnvironment(options = {}) {
        const env = {
            NODE_ENV: "test",
            ...options,
        };

        const mockRequire = vi.fn<RequireModule>((moduleName) =>
            resolvePreloadScriptRequire(moduleName, {
                ipcRenderer: mockIpcRenderer,
                contextBridge: mockContextBridge,
            })
        );

        const mockProcess = {
            env,
            once: vi.fn<ProcessOnce>(),
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
            once: ReturnType<typeof vi.fn<ProcessOnce>>;
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

    describe("module Loading and Basic Structure", () => {
        it("should import and execute without errors", () => {
            expect.assertions(5);
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
            expect(exposedAPI?.validateAPI()).toStrictEqual(true);
            expect(mockProcess.once).toHaveBeenCalledWith(
                "beforeExit",
                expect.any(Function)
            );
            expect(consoleSpy.error).not.toHaveBeenCalled();
        });

        it("should expose electronAPI to main world", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();

            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                exposedAPI
            );
            expect(exposedAPI.validateAPI()).toStrictEqual(true);
        });

        it("should validate API before exposing", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();

            expect(exposedAPI.validateAPI()).toStrictEqual(true);
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                exposedAPI
            );
        });
    });

    describe("constants Structure", () => {
        it("should define all required channel constants", () => {
            expect.assertions(2);
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

        it("should include all expected channel names", () => {
            expect.assertions(27);
            const { exposedAPI } = createPreloadEnvironment();
            const channelInfo = exposedAPI.getChannelInfo();

            const expectedChannels = Object.keys(channelInfo.channels);

            expectedChannels.forEach((channel) => {
                expect(channelInfo.channels).toHaveProperty(channel);
            });
        });

        it("should include all expected event names", () => {
            expect.assertions(10);
            const { exposedAPI } = createPreloadEnvironment();
            const channelInfo = exposedAPI.getChannelInfo();

            const expectedEvents = Object.keys(channelInfo.events);

            expectedEvents.forEach((event) => {
                expect(channelInfo.events).toHaveProperty(event);
            });
        });
    });

    describe("file Operations API", () => {
        it("should provide openFile method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            expect(exposedAPI.openFile).toBeTypeOf("function");
            expect(exposedAPI.openFileDialog).toBeTypeOf("function");
        });

        it("should handle openFile invocation", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.openFile();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "dialog:openFile"
            );
            expect(result).toBe("mock-result");
        });

        it("should provide openFileDialog alias", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.openFileDialog();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "dialog:openFile"
            );
            expect(result).toBe("mock-result");
        });

        it("should provide readFile method", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.readFile("test.fit");

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "file:read",
                "test.fit"
            );
            expect(result).toBe("mock-result");
        });

        it("should handle file operation errors gracefully", async () => {
            expect.assertions(1);
            mockIpcRenderer.invoke.mockRejectedValue(
                new Error("File not found")
            );

            const { exposedAPI } = createPreloadEnvironment();

            await expect(
                exposedAPI.readFile("nonexistent.fit")
            ).rejects.toThrow("File not found");
        });
    });

    describe("fIT File Operations API", () => {
        it("should provide parseFitFile method", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const arrayBuffer = new ArrayBuffer(8);
            const result = await exposedAPI.parseFitFile(arrayBuffer);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "fit:parse",
                arrayBuffer
            );
            expect(result).toBe("mock-result");
        });

        it("should provide decodeFitFile method", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const arrayBuffer = new ArrayBuffer(8);
            const result = await exposedAPI.decodeFitFile(arrayBuffer);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "fit:decode",
                arrayBuffer
            );
            expect(result).toBe("mock-result");
        });

        it("should handle FIT parsing errors", async () => {
            expect.assertions(1);
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

    describe("recent Files Management", () => {
        it("should provide recentFiles method", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.recentFiles();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "recentFiles:get"
            );
            expect(result).toBe("mock-result");
        });

        it("should provide addRecentFile method", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.addRecentFile("new.fit");

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "recentFiles:add",
                "new.fit"
            );
            expect(result).toBe("mock-result");
        });

        it("should propagate recent file retrieval errors", async () => {
            expect.assertions(1);
            mockIpcRenderer.invoke.mockRejectedValue(
                new Error("recent files unavailable")
            );

            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.recentFiles()).rejects.toThrow(
                "recent files unavailable"
            );
        });
    });

    describe("theme Management", () => {
        it("should provide getTheme method", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.getTheme();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("theme:get");
            expect(result).toBe("mock-result");
        });

        it("should provide sendThemeChanged method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = exposedAPI.sendThemeChanged("light");

            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "theme-changed",
                "light"
            );
            expect(result).toBeUndefined();
        });
    });

    describe("application Information API", () => {
        it("should provide version information methods", () => {
            expect.assertions(4);
            const { exposedAPI } = createPreloadEnvironment();

            expect(exposedAPI.getAppVersion).toBeTypeOf("function");
            expect(exposedAPI.getElectronVersion).toBeTypeOf("function");
            expect(exposedAPI.getNodeVersion).toBeTypeOf("function");
            expect(exposedAPI.getChromeVersion).toBeTypeOf("function");
        });

        it("should handle version retrieval", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.getAppVersion();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getAppVersion"
            );
            expect(result).toBe("mock-result");
        });

        it("should provide getPlatformInfo method", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.getPlatformInfo();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getPlatformInfo"
            );
            expect(result).toBe("mock-result");
        });

        it("should propagate version lookup failures", async () => {
            expect.assertions(1);
            mockIpcRenderer.invoke.mockRejectedValue(
                new Error("version unavailable")
            );

            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.getAppVersion()).rejects.toThrow(
                "version unavailable"
            );
        });
    });

    describe("external Browser Operations", () => {
        it("should provide openExternal method", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.openExternal("https://example.com");

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "shell:openExternal",
                "https://example.com"
            );
            expect(result).toBe("mock-result");
        });

        it("should handle external browser errors", async () => {
            expect.assertions(1);
            mockIpcRenderer.invoke.mockRejectedValue(
                new Error("Cannot open URL")
            );

            const { exposedAPI } = createPreloadEnvironment();

            await expect(
                exposedAPI.openExternal("invalid-url")
            ).rejects.toThrow("Cannot open URL");
        });
    });

    describe("gyazo OAuth Server Operations", () => {
        it("should provide startGyazoServer method", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.startGyazoServer(3000);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "gyazo:server:start",
                3000
            );
            expect(result).toBe("mock-result");
        });

        it("should provide stopGyazoServer method", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.stopGyazoServer();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "gyazo:server:stop"
            );
            expect(result).toBe("mock-result");
        });

        it("should propagate Gyazo server startup failures", async () => {
            expect.assertions(1);
            mockIpcRenderer.invoke.mockRejectedValue(
                new Error("port unavailable")
            );

            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.startGyazoServer(3000)).rejects.toThrow(
                "port unavailable"
            );
        });
    });

    describe("event Handler Registration", () => {
        it("should provide onMenuOpenFile method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn<IpcListener>();

            const unsubscribe = exposedAPI.onMenuOpenFile(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "menu-open-file",
                expect.any(Function)
            );
            expect(unsubscribe).toBeTypeOf("function");
        });

        it("should provide onMenuOpenOverlay method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn<IpcListener>();

            const unsubscribe = exposedAPI.onMenuOpenOverlay(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "menu-open-overlay",
                expect.any(Function)
            );
            expect(unsubscribe).toBeTypeOf("function");
        });

        it("should provide onOpenRecentFile method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn<IpcListener>();

            const unsubscribe = exposedAPI.onOpenRecentFile(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "open-recent-file",
                expect.any(Function)
            );
            expect(unsubscribe).toBeTypeOf("function");
        });

        it("should provide onSetTheme method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn<IpcListener>();

            const unsubscribe = exposedAPI.onSetTheme(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "set-theme",
                expect.any(Function)
            );
            expect(unsubscribe).toBeTypeOf("function");
        });

        it("should validate callback functions in event handlers", () => {
            expect.assertions(5);
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

    describe("auto-Updater Functions", () => {
        it("should provide onUpdateEvent method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn<IpcListener>();

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

        it("should provide checkForUpdates method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = exposedAPI.checkForUpdates();

            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "menu-check-for-updates"
            );
            expect(result).toBeUndefined();
        });

        it("should provide installUpdate method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = exposedAPI.installUpdate();

            expect(mockIpcRenderer.send).toHaveBeenCalledWith("install-update");
            expect(result).toBeUndefined();
        });

        it("should provide setFullScreen method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = exposedAPI.setFullScreen(true);

            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "set-fullscreen",
                true
            );
            expect(result).toBeUndefined();
        });

        it("should validate parameters in onUpdateEvent", () => {
            expect.assertions(2);
            const { exposedAPI, mockConsole } = createPreloadEnvironment();
            const callback = vi.fn<IpcListener>();

            // Try with invalid event name
            const result = exposedAPI.onUpdateEvent(123, callback);

            expect(mockConsole.error).toHaveBeenCalledWith(
                "[preload.js] onUpdateEvent: eventName must be a string"
            );
            expect(result).toBeUndefined();
        });
    });

    describe("generic IPC Functions", () => {
        it("should provide onIpc method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn<IpcListener>();

            const unsubscribe = exposedAPI.onIpc("custom-channel", callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "custom-channel",
                expect.any(Function)
            );
            expect(unsubscribe).toBeTypeOf("function");
        });

        it("should provide send method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = exposedAPI.send("custom-channel", "arg1", "arg2");

            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "custom-channel",
                "arg1",
                "arg2"
            );
            expect(result).toBeUndefined();
        });

        it("should provide invoke method", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.invoke("custom-channel", "arg1");

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "custom-channel",
                "arg1"
            );
            expect(result).toBe("mock-result");
        });

        it("should validate channel parameter in generic IPC methods", () => {
            expect.assertions(3);
            const { exposedAPI, mockConsole } = createPreloadEnvironment();

            // Try with invalid channel (should trigger validateString error)
            const result = exposedAPI.send(123, "data");

            expect(mockConsole.error).toHaveBeenCalledWith(
                "[preload.js] send: channel must be a string"
            );
            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).not.toHaveBeenCalledWith(123, "data");
        });

        it("should handle invoke errors properly", async () => {
            expect.assertions(1);
            mockIpcRenderer.invoke.mockRejectedValue(new Error("IPC Error"));

            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.invoke("failing-channel")).rejects.toThrow(
                "IPC Error"
            );
        });

        it("should reject invoke with invalid channel", async () => {
            expect.assertions(1);
            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.invoke(123)).rejects.toThrow(
                "Invalid channel for invoke"
            );
        });
    });

    describe("development Tools", () => {
        it("should provide injectMenu method", async () => {
            expect.assertions(2);
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

        it("should handle injectMenu with default parameters", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.injectMenu();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "devtools-inject-menu",
                null,
                null
            );
            expect(result).toBe("mock-result");
        });

        it("should handle injectMenu errors gracefully", async () => {
            expect.assertions(2);
            mockIpcRenderer.invoke.mockRejectedValue(
                new Error("Inject failed")
            );

            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.injectMenu("dark")).resolves.toStrictEqual(
                false
            );
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error in injectMenu:",
                expect.any(Error)
            );
        });

        it("should reject invalid parameters in injectMenu", async () => {
            expect.assertions(3);
            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.injectMenu(123)).resolves.toStrictEqual(
                false
            );
            expect(mockIpcRenderer.invoke).not.toHaveBeenCalledWith(
                "devtools-inject-menu",
                123
            );
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] injectMenu: theme must be a string or null"
            );
        });
    });

    describe("debugging and Validation", () => {
        it("should provide validateAPI method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            expect(exposedAPI.validateAPI()).toStrictEqual(true);
            expect(exposedAPI.getChannelInfo()).toMatchObject({
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: 27,
                totalEvents: 10,
            });
        });

        it("should provide getChannelInfo with complete information", () => {
            expect.assertions(1);
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

    describe("development Mode Features", () => {
        it("should expose development tools in development mode", () => {
            expect.assertions(3);
            const { devTools, exposedAPI } = createPreloadEnvironment({
                NODE_ENV: "development",
            });

            // Should expose both electronAPI and development tools.
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                exposedAPI
            );
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                developmentToolsGlobalName,
                devTools
            );

            expect(devTools).toMatchObject({
                getPreloadInfo: expect.any(Function),
                logAPIState: expect.any(Function),
                testIPC: expect.any(Function),
            });
        });

        it("should not expose development tools in production mode", () => {
            expect.assertions(2);
            const { devTools, exposedAPI } = createPreloadEnvironment({
                NODE_ENV: "production",
            });

            // Should only expose electronAPI
            expect(
                mockContextBridge.exposeInMainWorld
            ).toHaveBeenCalledExactlyOnceWith("electronAPI", exposedAPI);
            expect(devTools).toBeUndefined();
        });
    });

    describe("error Handling and Edge Cases", () => {
        it("should handle contextBridge exposure failures", () => {
            expect.assertions(3);
            // Create a new environment where contextBridge throws on exposure
            const env = { NODE_ENV: "test" };
            const mockRequire = vi.fn<RequireModule>((moduleName) =>
                resolvePreloadScriptRequire(moduleName, {
                    ipcRenderer: mockIpcRenderer,
                    contextBridge: {
                        exposeInMainWorld: vi.fn<ContextBridgeExpose>(() => {
                            throw new Error("Exposure failed");
                        }),
                    },
                })
            );

            const mockProcess = { env, once: vi.fn<ProcessOnce>() };
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

        it("should handle send operation errors", () => {
            expect.assertions(3);
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

    describe("process Lifecycle", () => {
        it("should handle process exit cleanup", () => {
            expect.assertions(2);
            const { mockProcess } = createPreloadEnvironment();

            expect(mockProcess.once).toHaveBeenCalledWith(
                "beforeExit",
                expect.any(Function)
            );
            expect(mockProcess.env.NODE_ENV).toBe("test");
        });

        it("should log successful initialization", () => {
            expect.assertions(2);
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
