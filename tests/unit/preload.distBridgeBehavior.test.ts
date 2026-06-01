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

interface ExposedDevToolsApi {
    [methodName: string]: (...args: unknown[]) => unknown;
    getPreloadInfo: () => {
        apiMethods: string[];
        constants?: unknown;
        timestamp?: unknown;
    };
    testIPC: () => Promise<unknown>;
}

type ContextBridgeExpose = (name: string, api: unknown) => void;
type IpcInvoke = (...args: unknown[]) => Promise<unknown>;
type IpcListener = (...args: unknown[]) => void;
type ProcessListener = (...args: unknown[]) => void;
type ProcessListeners = (eventName: string) => ProcessListener[];
type ProcessOnce = (eventName: string, listener: ProcessListener) => void;
type ProcessRemoveListener = (
    eventName: string,
    listener: ProcessListener
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

interface MockProcessRef {
    env: Record<string, unknown>;
    listeners: ReturnType<typeof vi.fn<ProcessListeners>>;
    once: ReturnType<typeof vi.fn<ProcessOnce>>;
    removeListener: ReturnType<typeof vi.fn<ProcessRemoveListener>>;
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
            invoke: vi.fn<IpcInvoke>().mockResolvedValue("mock-result"),
            send: vi.fn<IpcListener>(),
            on: vi.fn<IpcListener>(),
            once: vi.fn<IpcListener>(),
            removeListener: vi.fn<IpcListener>(),
            removeAllListeners: vi.fn<IpcListener>(),
        };

        // Setup context bridge mock
        mockContextBridge = {
            exposeInMainWorld: vi.fn<ContextBridgeExpose>((name, api) => {
                if (name === "electronAPI") {
                    exposedAPI = api as ExposedPreloadApi;
                } else if (name === developmentToolsGlobalName) {
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
        preloadCode = readPreloadDistCode();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        exposedAPI = undefined as unknown as ExposedPreloadApi;
        exposedDevTools = undefined as unknown as ExposedDevToolsApi;
    });

    /**
     * Execute preload script in controlled environment
     */
    function createMockProcess(env: Record<string, unknown>): MockProcessRef {
        const beforeExitListeners: ProcessListener[] = [];

        return {
            env,
            listeners: vi.fn<ProcessListeners>((eventName) =>
                eventName === "beforeExit" ? [...beforeExitListeners] : []
            ),
            once: vi.fn<ProcessOnce>((eventName, listener) => {
                if (eventName === "beforeExit") {
                    beforeExitListeners.push(listener);
                }
            }),
            removeListener: vi.fn<ProcessRemoveListener>(
                (eventName, listener) => {
                    if (eventName !== "beforeExit") {
                        return;
                    }

                    const listenerIndex = beforeExitListeners.indexOf(listener);
                    if (listenerIndex >= 0) {
                        beforeExitListeners.splice(listenerIndex, 1);
                    }
                }
            ),
        };
    }

    function executePreloadScript(envOptions: Record<string, unknown> = {}) {
        const env = {
            NODE_ENV: "test",
            ...envOptions,
        };

        const mockRequire = vi.fn<RequireModule>((moduleName) =>
            resolvePreloadScriptRequire(moduleName, {
                ipcRenderer: mockIpcRenderer,
                contextBridge: mockContextBridge,
            })
        );

        const mockProcess = createMockProcess(env);

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

    function getPreloadApiMethodTypes() {
        return {
            getChannelInfo: typeof exposedAPI.getChannelInfo,
            validateAPI: typeof exposedAPI.validateAPI,
        };
    }

    function getDevToolsMethodTypes() {
        return {
            getPreloadInfo: typeof exposedDevTools.getPreloadInfo,
            logAPIState: typeof exposedDevTools["logAPIState"],
            testIPC: typeof exposedDevTools.testIPC,
        };
    }

    function getBeforeExitRegistration(mockProcess: MockProcessRef) {
        const [eventName, listener] = mockProcess.once.mock.calls[0] ?? [];
        return {
            eventName,
            listenerType: typeof listener,
        };
    }

    function expectIpcRegistration(channel: string) {
        const [registeredChannel, listener] =
            mockIpcRenderer.on.mock.calls.find(
                ([candidate]) => candidate === channel
            ) ?? [];

        expect({
            registeredChannel,
            listenerType: typeof listener,
        }).toStrictEqual({
            registeredChannel: channel,
            listenerType: "function",
        });

        return listener;
    }

    function runPreloadScript(
        mockRequire: (moduleName: string) => unknown,
        mockProcess: MockProcessRef,
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

    describe("module loading and initialization", () => {
        it("should initialize preload dependencies and lifecycle hooks", () => {
            expect.assertions(6);
            const { mockProcess, mockRequire } = executePreloadScript();

            expect(mockRequire).toHaveBeenCalledWith("electron");
            expect({
                exposedApi: mockContextBridge.exposeInMainWorld.mock.calls[0],
                methodTypes: getPreloadApiMethodTypes(),
            }).toStrictEqual({
                exposedApi: ["electronAPI", exposedAPI],
                methodTypes: {
                    getChannelInfo: "function",
                    validateAPI: "function",
                },
            });
            expect(exposedAPI.validateAPI()).toStrictEqual(true);
            expect(exposedAPI.getChannelInfo()).toStrictEqual({
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: 27,
                totalEvents: 10,
            });
            expect(getBeforeExitRegistration(mockProcess)).toStrictEqual({
                eventName: "beforeExit",
                listenerType: "function",
            });
            expect(consoleSpy.error).not.toHaveBeenCalled();
        });

        it("should expose electronAPI to main world", () => {
            expect.assertions(3);
            executePreloadScript();

            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                exposedAPI
            );
            expect(getPreloadApiMethodTypes()).toStrictEqual({
                getChannelInfo: "function",
                validateAPI: "function",
            });
            expect(exposedAPI.validateAPI()).toStrictEqual(true);
        });

        it("should validate API before exposing", () => {
            expect.assertions(2);
            executePreloadScript();

            expect(exposedAPI.validateAPI).toBeTypeOf("function");
            expect(exposedAPI.validateAPI()).toStrictEqual(true);
        });

        it("should not expose API if validation fails", () => {
            expect.assertions(4);
            // Mock contextBridge to be undefined to trigger validation failure
            mockContextBridge = undefined;

            const mockRequire = vi.fn<RequireModule>((moduleName) =>
                resolvePreloadScriptRequire(moduleName, {
                    ipcRenderer: mockIpcRenderer,
                    contextBridge: mockContextBridge,
                })
            );

            const mockProcess = createMockProcess({ NODE_ENV: "test" });

            const result = runPreloadScript(mockRequire, mockProcess, console);

            expect(result).toBeUndefined();
            expect({
                exposedAPI,
                hasContextBridge: mockContextBridge !== undefined,
                listenerRegistrations: mockIpcRenderer.on.mock.calls.length,
            }).toStrictEqual({
                exposedAPI: undefined,
                hasContextBridge: false,
                listenerRegistrations: 0,
            });
            expect(getBeforeExitRegistration(mockProcess)).toStrictEqual({
                eventName: "beforeExit",
                listenerType: "function",
            });
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] API validation failed - not exposing to main world"
            );
        });
    });

    describe("development mode features", () => {
        it("should expose development tools in development mode", () => {
            expect.assertions(2);
            executePreloadScript({ NODE_ENV: "development" });

            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                developmentToolsGlobalName,
                exposedDevTools
            );
            expect(getDevToolsMethodTypes()).toStrictEqual({
                getPreloadInfo: "function",
                logAPIState: "function",
                testIPC: "function",
            });
        });

        it("should not expose development tools in production mode", () => {
            expect.assertions(2);
            executePreloadScript({ NODE_ENV: "production" });

            // Should only have one call for electronAPI, not development tools.
            expect(
                mockContextBridge.exposeInMainWorld
            ).toHaveBeenCalledExactlyOnceWith("electronAPI", exposedAPI);
            expect(
                mockContextBridge.exposeInMainWorld.mock.calls.map(
                    ([name]) => name
                )
            ).not.toContain(developmentToolsGlobalName);
        });

        it("development tools should provide utilities", () => {
            expect.assertions(1);
            executePreloadScript({ NODE_ENV: "development" });

            expect(getDevToolsMethodTypes()).toStrictEqual({
                getPreloadInfo: "function",
                logAPIState: "function",
                testIPC: "function",
            });
        });

        it("getPreloadInfo should return preload information", () => {
            expect.assertions(2);
            const mockDate = new Date("2026-06-01T12:00:00.000Z");
            vi.useFakeTimers();
            vi.setSystemTime(mockDate);
            executePreloadScript({ NODE_ENV: "development" });

            const preloadInfo = exposedDevTools.getPreloadInfo();

            expect(preloadInfo).toStrictEqual({
                apiMethods: Object.keys(exposedAPI),
                constants: {
                    CHANNELS: EXPECTED_PRELOAD_CHANNELS,
                    DEFAULT_VALUES: {
                        FIT_FILE_PATH: null,
                        THEME: null,
                    },
                    EVENTS: EXPECTED_PRELOAD_EVENTS,
                },
                timestamp: mockDate.toISOString(),
                version: "1.0.0",
            });
            expect(preloadInfo.version).toBe("1.0.0");

            vi.useRealTimers();
        });

        it("testIPC should test IPC communication", async () => {
            expect.assertions(2);
            mockIpcRenderer.invoke.mockResolvedValue("1.0.0");
            executePreloadScript({ NODE_ENV: "development" });

            await expect(exposedDevTools.testIPC()).resolves.toStrictEqual(
                true
            );
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getAppVersion"
            );
        });

        it("testIPC should handle IPC failures", async () => {
            expect.assertions(2);
            const ipcError = new Error("IPC failed");
            mockIpcRenderer.invoke.mockRejectedValue(ipcError);
            executePreloadScript({ NODE_ENV: "development" });

            await expect(exposedDevTools.testIPC()).resolves.toStrictEqual(
                false
            );
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] IPC test failed:",
                ipcError
            );
        });
    });

    describe("api structure and methods", () => {
        it("should have all expected API methods", () => {
            expect.assertions(32);
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
                expect(exposedAPI[method]).toBeTypeOf("function");
            });
        });

        it("getChannelInfo should return channel information", () => {
            expect.assertions(1);
            executePreloadScript();

            const channelInfo = exposedAPI.getChannelInfo();

            expect(channelInfo).toStrictEqual({
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: 27,
                totalEvents: 10,
            });
        });

        it("validateAPI should perform comprehensive validation", () => {
            expect.assertions(2);
            executePreloadScript();

            expect(exposedAPI.validateAPI()).toStrictEqual(true);
            expect(exposedAPI.getChannelInfo()).toStrictEqual({
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: 27,
                totalEvents: 10,
            });
        });

        it("getChannelInfo should not include unknown channels", () => {
            expect.assertions(2);
            executePreloadScript();

            const channelInfo = exposedAPI.getChannelInfo();

            expect(channelInfo.channels).not.toHaveProperty("UNKNOWN_CHANNEL");
            expect(channelInfo.events).not.toHaveProperty("UNKNOWN_EVENT");
        });
    });

    describe("invoke methods", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        it("addRecentFile should invoke correct channel", async () => {
            expect.assertions(2);
            const filePath = "/path/to/file.fit";
            const result = await exposedAPI.addRecentFile(filePath);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "recentFiles:add",
                filePath
            );
            expect(result).toBe("mock-result");
        });

        it("decodeFitFile should invoke correct channel", async () => {
            expect.assertions(2);
            const arrayBuffer = new ArrayBuffer(8);
            const result = await exposedAPI.decodeFitFile(arrayBuffer);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "fit:decode",
                arrayBuffer
            );
            expect(result).toBe("mock-result");
        });

        it("getAppVersion should invoke correct channel", async () => {
            expect.assertions(2);
            const result = await exposedAPI.getAppVersion();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getAppVersion"
            );
            expect(result).toBe("mock-result");
        });

        it("getChromeVersion should invoke correct channel", async () => {
            expect.assertions(2);
            const result = await exposedAPI.getChromeVersion();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getChromeVersion"
            );
            expect(result).toBe("mock-result");
        });

        it("getElectronVersion should invoke correct channel", async () => {
            expect.assertions(2);
            const result = await exposedAPI.getElectronVersion();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getElectronVersion"
            );
            expect(result).toBe("mock-result");
        });

        it("getLicenseInfo should invoke correct channel", async () => {
            expect.assertions(2);
            const result = await exposedAPI.getLicenseInfo();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getLicenseInfo"
            );
            expect(result).toBe("mock-result");
        });

        it("getNodeVersion should invoke correct channel", async () => {
            expect.assertions(2);
            const result = await exposedAPI.getNodeVersion();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getNodeVersion"
            );
            expect(result).toBe("mock-result");
        });

        it("getPlatformInfo should invoke correct channel", async () => {
            expect.assertions(2);
            const result = await exposedAPI.getPlatformInfo();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getPlatformInfo"
            );
            expect(result).toBe("mock-result");
        });

        it("getTheme should invoke correct channel", async () => {
            expect.assertions(2);
            const result = await exposedAPI.getTheme();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("theme:get");
            expect(result).toBe("mock-result");
        });

        it("openExternal should invoke correct channel", async () => {
            expect.assertions(2);
            const url = "https://example.com";
            const result = await exposedAPI.openExternal(url);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "shell:openExternal",
                url
            );
            expect(result).toBe("mock-result");
        });

        it("openFile should invoke correct channel", async () => {
            expect.assertions(2);
            const result = await exposedAPI.openFile();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "dialog:openFile"
            );
            expect(result).toBe("mock-result");
        });

        it("openFileDialog should invoke correct channel", async () => {
            expect.assertions(2);
            const result = await exposedAPI.openFileDialog();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "dialog:openFile"
            );
            expect(result).toBe("mock-result");
        });

        it("parseFitFile should invoke correct channel", async () => {
            expect.assertions(2);
            const arrayBuffer = new ArrayBuffer(8);
            const result = await exposedAPI.parseFitFile(arrayBuffer);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "fit:parse",
                arrayBuffer
            );
            expect(result).toBe("mock-result");
        });

        it("readFile should invoke correct channel", async () => {
            expect.assertions(2);
            const filePath = "/path/to/file.fit";
            const result = await exposedAPI.readFile(filePath);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "file:read",
                filePath
            );
            expect(result).toBe("mock-result");
        });

        it("recentFiles should invoke correct channel", async () => {
            expect.assertions(2);
            const result = await exposedAPI.recentFiles();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "recentFiles:get"
            );
            expect(result).toBe("mock-result");
        });

        it("startGyazoServer should invoke correct channel", async () => {
            expect.assertions(2);
            const port = 3000;
            const result = await exposedAPI.startGyazoServer(port);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "gyazo:server:start",
                port
            );
            expect(result).toBe("mock-result");
        });

        it("stopGyazoServer should invoke correct channel", async () => {
            expect.assertions(2);
            const result = await exposedAPI.stopGyazoServer();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "gyazo:server:stop"
            );
            expect(result).toBe("mock-result");
        });

        it("getTheme should surface IPC rejection", async () => {
            expect.assertions(2);
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

    describe("send methods", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        it("checkForUpdates should send correct event", () => {
            expect.assertions(2);

            const result = exposedAPI.checkForUpdates();

            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "menu-check-for-updates"
            );
        });

        it("installUpdate should send correct event", () => {
            expect.assertions(2);

            const result = exposedAPI.installUpdate();

            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).toHaveBeenCalledWith("install-update");
        });

        it("sendThemeChanged should send correct event", () => {
            expect.assertions(2);
            const theme = "dark";

            const result = exposedAPI.sendThemeChanged(theme);

            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "theme-changed",
                theme
            );
        });

        it("setFullScreen should send correct event", () => {
            expect.assertions(2);
            const flag = true;

            const result = exposedAPI.setFullScreen(flag);

            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "set-fullscreen",
                flag
            );
        });

        it("checkForUpdates should report send failures", () => {
            expect.assertions(2);
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

    describe("event handler registration", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        it("onMenuOpenFile should register event handler", () => {
            expect.assertions(2);
            const callback = vi.fn<IpcListener>();
            const unsubscribe = exposedAPI.onMenuOpenFile(callback);

            expectIpcRegistration("menu-open-file");
            expect(unsubscribe).toBeTypeOf("function");
        });

        it("onMenuOpenOverlay should register event handler", () => {
            expect.assertions(2);
            const callback = vi.fn<IpcListener>();
            const unsubscribe = exposedAPI.onMenuOpenOverlay(callback);

            expectIpcRegistration("menu-open-overlay");
            expect(unsubscribe).toBeTypeOf("function");
        });

        it("onOpenRecentFile should register event handler", () => {
            expect.assertions(2);
            const callback = vi.fn<IpcListener>();
            const unsubscribe = exposedAPI.onOpenRecentFile(callback);

            expectIpcRegistration("open-recent-file");
            expect(unsubscribe).toBeTypeOf("function");
        });

        it("onOpenSummaryColumnSelector should register event handler", () => {
            expect.assertions(2);
            const callback = vi.fn<IpcListener>();
            const unsubscribe =
                exposedAPI.onOpenSummaryColumnSelector(callback);

            expectIpcRegistration("open-summary-column-selector");
            expect(unsubscribe).toBeTypeOf("function");
        });

        it("onSetTheme should register event handler", () => {
            expect.assertions(2);
            const callback = vi.fn<IpcListener>();
            const unsubscribe = exposedAPI.onSetTheme(callback);

            expectIpcRegistration("set-theme");
            expect(unsubscribe).toBeTypeOf("function");
        });

        it("onUpdateEvent should register event handler", () => {
            expect.assertions(2);
            const eventName = "update-available";
            const callback = vi.fn<IpcListener>();
            const unsubscribe = exposedAPI.onUpdateEvent(eventName, callback);

            expectIpcRegistration(eventName);
            expect(unsubscribe).toBeTypeOf("function");
        });

        it("onIpc should register generic event handler", () => {
            expect.assertions(2);
            const channel = "custom-channel";
            const callback = vi.fn<IpcListener>();
            const unsubscribe = exposedAPI.onIpc(channel, callback);

            expectIpcRegistration(channel);
            expect(unsubscribe).toBeTypeOf("function");
        });

        it("onMenuOpenFile should reject invalid callbacks", () => {
            expect.assertions(3);
            const unsubscribe = exposedAPI.onMenuOpenFile("not-a-function");

            expect(unsubscribe).toBeTypeOf("function");
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] onMenuOpenFile: callback must be a function"
            );
        });
    });

    describe("generic IPC methods", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        it("invoke should call ipcRenderer.invoke", async () => {
            expect.assertions(2);
            const channel = "test-channel";
            const args = ["arg1", "arg2"];
            const result = await exposedAPI.invoke(channel, ...args);

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                channel,
                ...args
            );
            expect(result).toBe("mock-result");
        });

        it("send should call ipcRenderer.send", () => {
            expect.assertions(2);
            const channel = "test-channel";
            const args = ["arg1", "arg2"];

            const result = exposedAPI.send(channel, ...args);

            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).toHaveBeenCalledWith(channel, ...args);
        });

        it("send should reject invalid channels", () => {
            expect.assertions(3);

            const result = exposedAPI.send(123);

            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] send: channel must be a string"
            );
        });
    });

    describe("special methods", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        it("injectMenu should validate parameters and invoke channel", async () => {
            expect.assertions(2);
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

        it("injectMenu should handle default parameters", async () => {
            expect.assertions(2);
            const result = await exposedAPI.injectMenu();

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "devtools-inject-menu",
                null,
                null
            );
            expect(result).toBe("mock-result");
        });

        it("injectMenu should validate theme parameter", async () => {
            expect.assertions(3);
            const invalidTheme = 123; // Not a string or null

            await expect(
                exposedAPI.injectMenu(invalidTheme)
            ).resolves.toStrictEqual(false);
            expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] injectMenu: theme must be a string or null"
            );
        });

        it("injectMenu should validate fitFilePath parameter", async () => {
            expect.assertions(3);
            const invalidPath = 123; // Not a string or null

            await expect(
                exposedAPI.injectMenu("dark", invalidPath)
            ).resolves.toStrictEqual(false);
            expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] injectMenu: fitFilePath must be a string or null"
            );
        });
    });

    describe("error handling", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        it("should handle IPC invoke errors", async () => {
            expect.assertions(2);
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

        it("should handle IPC send errors", () => {
            expect.assertions(2);
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

        it("should handle event registration errors", () => {
            expect.assertions(2);
            const error = new Error("Event error");
            mockIpcRenderer.on.mockImplementation(() => {
                throw error;
            });

            const unsubscribe = exposedAPI.onMenuOpenFile(vi.fn<IpcListener>());

            expect(unsubscribe).toBeTypeOf("function");
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error setting up onMenuOpenFile event handler:",
                error
            );
        });

        it("should validate callback in event handlers", () => {
            expect.assertions(3);
            const unsubscribe = exposedAPI.onMenuOpenFile("not-a-function");

            expect(unsubscribe).toBeTypeOf("function");
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] onMenuOpenFile: callback must be a function"
            );
        });

        it("should validate callback in onUpdateEvent", () => {
            expect.assertions(3);
            const unsubscribe = exposedAPI.onUpdateEvent(
                "test-event",
                "not-a-function"
            );

            expect({
                listenerRegistrations: mockIpcRenderer.on.mock.calls.length,
                unsubscribe,
            }).toStrictEqual({
                listenerRegistrations: 0,
                unsubscribe: undefined,
            });
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] onUpdateEvent: callback must be a function"
            );
        });

        it("should validate eventName in onUpdateEvent", () => {
            expect.assertions(3);
            const unsubscribe = exposedAPI.onUpdateEvent(
                123,
                vi.fn<IpcListener>()
            );

            expect({
                listenerRegistrations: mockIpcRenderer.on.mock.calls.length,
                unsubscribe,
            }).toStrictEqual({
                listenerRegistrations: 0,
                unsubscribe: undefined,
            });
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] onUpdateEvent: eventName must be a string"
            );
        });

        it("should validate channel in generic methods", async () => {
            expect.assertions(2);
            await expect(exposedAPI.invoke(123)).rejects.toThrow(
                "Invalid channel for invoke"
            );
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] invoke: channel must be a string"
            );
        });

        it("should validate channel in send method", () => {
            expect.assertions(3);

            const result = exposedAPI.send(123);

            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] send: channel must be a string"
            );
        });

        it("should validate channel in onIpc method", () => {
            expect.assertions(3);
            const unsubscribe = exposedAPI.onIpc(123, vi.fn<IpcListener>());

            expect({
                listenerRegistrations: mockIpcRenderer.on.mock.calls.length,
                unsubscribe,
            }).toStrictEqual({
                listenerRegistrations: 0,
                unsubscribe: undefined,
            });
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] onIpc: channel must be a string"
            );
        });

        it("should validate callback in onIpc method", () => {
            expect.assertions(3);
            const unsubscribe = exposedAPI.onIpc(
                "test-channel",
                "not-a-function"
            );

            expect({
                listenerRegistrations: mockIpcRenderer.on.mock.calls.length,
                unsubscribe,
            }).toStrictEqual({
                listenerRegistrations: 0,
                unsubscribe: undefined,
            });
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] onIpc: callback must be a function"
            );
        });
    });

    describe("event callback error handling", () => {
        beforeEach(() => {
            executePreloadScript();
        });

        it("should handle errors in event callbacks", () => {
            expect.assertions(3);
            const callbackError = new Error("Callback error");
            const errorCallback = vi.fn<IpcListener>(() => {
                throw callbackError;
            });

            exposedAPI.onMenuOpenFile(errorCallback);

            const registeredCallback = mockIpcRenderer.on.mock.calls[0][1];

            const result = registeredCallback({}, "test-data");

            expect(result).toBeUndefined();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error in onMenuOpenFile callback:",
                callbackError
            );
            expect(errorCallback).toHaveBeenCalledWith("test-data");
        });

        it("should handle errors in transform callbacks", () => {
            expect.assertions(3);
            const callback = vi.fn<IpcListener>();

            exposedAPI.onOpenRecentFile(callback);

            const registeredCallback = mockIpcRenderer.on.mock.calls[0][1];
            const event = {};

            const result = registeredCallback(event, "test-file-path");

            expect(result).toBeUndefined();
            expect(callback).toHaveBeenCalledWith("test-file-path");
            expect(callback).not.toHaveBeenCalledWith(event, "test-file-path");
        });

        it("should handle errors in onUpdateEvent callbacks", () => {
            expect.assertions(3);
            const updateCallbackError = new Error("Update callback error");
            const errorCallback = vi.fn<IpcListener>(() => {
                throw updateCallbackError;
            });

            exposedAPI.onUpdateEvent("test-event", errorCallback);

            const registeredCallback = mockIpcRenderer.on.mock.calls[0][1];

            const result = registeredCallback({}, "test-data");

            expect(result).toBeUndefined();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error in onUpdateEvent(test-event) callback:",
                updateCallbackError
            );
            expect(errorCallback).toHaveBeenCalledWith("test-data");
        });
    });

    describe("process lifecycle", () => {
        it("should register beforeExit handler", () => {
            expect.assertions(3);
            const mockProcess = createMockProcess({
                NODE_ENV: "development",
            });

            const mockRequire = vi.fn<RequireModule>((moduleName) =>
                resolvePreloadScriptRequire(moduleName, {
                    ipcRenderer: mockIpcRenderer,
                    contextBridge: mockContextBridge,
                })
            );

            const result = runPreloadScript(mockRequire, mockProcess, console);

            expect(result).toBeUndefined();
            expect(getBeforeExitRegistration(mockProcess)).toStrictEqual({
                eventName: "beforeExit",
                listenerType: "function",
            });
            expect(
                mockProcess.once.mock.calls.map(([eventName]) => eventName)
            ).not.toContain("exit");
        });
    });

    describe("constants and configuration", () => {
        it("should expose channel information correctly", () => {
            expect.assertions(11);
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

    describe("development vs production behavior", () => {
        it("should log in development mode", () => {
            expect.assertions(2);
            executePreloadScript({ NODE_ENV: "development" });

            expect(consoleSpy.log).toHaveBeenCalledWith(
                "[preload.js] Successfully exposed electronAPI to main world"
            );
            expect(exposedDevTools.getPreloadInfo).toBeTypeOf("function");
        });

        it("should not log in production mode", () => {
            expect.assertions(2);
            executePreloadScript({ NODE_ENV: "production" });

            expect(consoleSpy.log).not.toHaveBeenCalledWith(
                "[preload.js] Successfully exposed electronAPI to main world"
            );
            expect(
                mockContextBridge.exposeInMainWorld.mock.calls.map(
                    ([name]) => name
                )
            ).not.toContain(developmentToolsGlobalName);
        });
    });

    describe("edge cases and robustness", () => {
        it("should handle module loading failures gracefully", () => {
            expect.assertions(1);
            const mockRequire = vi.fn<RequireModule>(() => {
                throw new Error("Module loading failed");
            });

            expect(() => {
                runPreloadScript(
                    mockRequire,
                    createMockProcess({ NODE_ENV: "test" }),
                    console
                );
            }).toThrow("Module loading failed");
        });

        it("should handle contextBridge exposure failures", () => {
            expect.assertions(4);
            const exposureError = new Error("Exposure failed");
            mockContextBridge.exposeInMainWorld.mockImplementation(() => {
                throw exposureError;
            });

            const { mockProcess } = executePreloadScript();

            expect(exposedAPI).toBeUndefined();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Failed to expose electronAPI:",
                exposureError
            );
            expect(getBeforeExitRegistration(mockProcess)).toStrictEqual({
                eventName: "beforeExit",
                listenerType: "function",
            });
            expect(consoleSpy.log).not.toHaveBeenCalledWith(
                "[preload.js] Successfully exposed electronAPI to main world"
            );
        });

        it("should handle development tools exposure failures in development", () => {
            expect.assertions(4);
            const devToolsExposureError = new Error("DevTools exposure failed");
            mockContextBridge.exposeInMainWorld.mockImplementation(
                (name: string) => {
                    if (name === developmentToolsGlobalName) {
                        throw devToolsExposureError;
                    }
                }
            );

            executePreloadScript({ NODE_ENV: "development" });

            expect(exposedDevTools).toBeUndefined();
            const [devToolsCallName, devToolsApi] =
                mockContextBridge.exposeInMainWorld.mock.calls.find(
                    ([name]) => name === developmentToolsGlobalName
                ) ?? [];
            expect({
                devToolsCallName,
                methodTypes: {
                    getPreloadInfo: typeof (devToolsApi as ExposedDevToolsApi)
                        ?.getPreloadInfo,
                    logAPIState: typeof (devToolsApi as ExposedDevToolsApi)
                        ?.logAPIState,
                    testIPC: typeof (devToolsApi as ExposedDevToolsApi)
                        ?.testIPC,
                },
            }).toStrictEqual({
                devToolsCallName: developmentToolsGlobalName,
                methodTypes: {
                    getPreloadInfo: "function",
                    logAPIState: "function",
                    testIPC: "function",
                },
            });
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Failed to expose development tools:",
                devToolsExposureError
            );
            expect(consoleSpy.log).toHaveBeenCalledWith(
                "[preload.js] Successfully exposed electronAPI to main world"
            );
        });
    });
});
