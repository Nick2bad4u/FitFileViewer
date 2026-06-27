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
    RECENT_FILES_GET: "recentFiles:get",
    SHELL_OPEN_EXTERNAL: "shell:openExternal",
    THEME_GET: "theme:get",
} as const;

const EXPECTED_PRELOAD_EVENTS = {
    DECODER_OPTIONS_CHANGED: "decoder-options-changed",
    EXPORT_FILE: "export-file",
    FIT_BROWSER_ENABLED_CHANGED: "fit-browser-enabled-changed",
    FIT_FILE_LOADED: "fit-file-loaded",
    GYAZO_OAUTH_CALLBACK: "gyazo-oauth-callback",
    INSTALL_UPDATE: "install-update",
    MENU_ABOUT: "menu-about",
    MENU_CHECK_FOR_UPDATES: "menu-check-for-updates",
    MENU_EXPORT: "menu-export",
    MENU_KEYBOARD_SHORTCUTS: "menu-keyboard-shortcuts",
    MENU_OPEN_FILE: "menu-open-file",
    MENU_OPEN_OVERLAY: "menu-open-overlay",
    MENU_PRINT: "menu-print",
    MENU_RESTART_UPDATE: "menu-restart-update",
    MENU_SAVE_AS: "menu-save-as",
    OPEN_ACCENT_COLOR_PICKER: "open-accent-color-picker",
    OPEN_RECENT_FILE: "open-recent-file",
    OPEN_SUMMARY_COLUMN_SELECTOR: "open-summary-column-selector",
    SET_FONT_SIZE: "set-font-size",
    SET_FULLSCREEN: "set-fullscreen",
    SET_HIGH_CONTRAST: "set-high-contrast",
    SET_THEME: "set-theme",
    SHOW_NOTIFICATION: "show-notification",
    THEME_CHANGED: "theme-changed",
    UNLOAD_FIT_FILE: "unload-fit-file",
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
        const { listener, registeredChannel } = getIpcRegistration(channel);

        expect({
            registeredChannel,
            listenerType: typeof listener,
        }).toStrictEqual({
            registeredChannel: channel,
            listenerType: "function",
        });

        return listener;
    }

    function getIpcRegistration(channel: string) {
        const [registeredChannel, listener] =
            mockIpcRenderer.on.mock.calls.find(
                ([candidate]) => candidate === channel
            ) ?? [];

        return {
            listener,
            registeredChannel,
        };
    }

    function getIpcRegistrationLifecycle({
        callback,
        channel,
        eventArgs = [],
        unsubscribe,
    }: {
        callback: ReturnType<typeof vi.fn<IpcListener>>;
        channel: string;
        eventArgs?: unknown[];
        unsubscribe: () => void;
    }) {
        const { listener, registeredChannel } = getIpcRegistration(channel);
        const registeredListener = listener as IpcListener;

        registeredListener({ sender: "main" }, ...eventArgs);
        const unsubscribeResult = unsubscribe();
        const [removedChannel, removedListener] =
            mockIpcRenderer.removeListener.mock.calls.at(-1) ?? [];

        return {
            callbackCalls: callback.mock.calls,
            cleanup: {
                removedChannel,
                removedRegisteredListener: removedListener === listener,
            },
            registration: {
                registeredChannel,
                listenerType: typeof listener,
            },
            unsubscribeResult,
        };
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
                totalChannels: 26,
                totalEvents: Object.keys(EXPECTED_PRELOAD_EVENTS).length,
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
            expect.assertions(3);
            executePreloadScript();

            expect(
                mockContextBridge.exposeInMainWorld
            ).toHaveBeenCalledExactlyOnceWith("electronAPI", exposedAPI);
            expect(exposedAPI.validateAPI()).toStrictEqual(true);
            expect(exposedAPI.getChannelInfo()).toStrictEqual({
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: 26,
                totalEvents: Object.keys(EXPECTED_PRELOAD_EVENTS).length,
            });
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
            expect.assertions(2);
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
                "onDecoderOptionsChanged",
                "onExportFile",
                "onFitBrowserEnabledChanged",
                "onGyazoOAuthCallback",
                "onMenuAbout",
                "onMenuCheckForUpdates",
                "onMenuExport",
                "onMenuKeyboardShortcuts",
                "onMenuOpenFile",
                "onMenuOpenOverlay",
                "onMenuPrint",
                "onMenuRestartUpdate",
                "onMenuSaveAs",
                "onOpenAccentColorPicker",
                "onOpenRecentFile",
                "onOpenSummaryColumnSelector",
                "onSetFontSize",
                "onSetHighContrast",
                "onSetTheme",
                "onShowNotification",
                "onUnloadFitFile",
                "onUpdateEvent",
                "openExternal",
                "openFile",
                "openFileDialog",
                "parseFitFile",
                "readFile",
                "recentFiles",
                "requestExport",
                "requestSaveAs",
                "sendThemeChanged",
                "setFullScreen",
                "startGyazoServer",
                "stopGyazoServer",
                "validateAPI",
            ];
            const expectedMethodTypes = Object.fromEntries(
                expectedMethods.map((method) => [method, "function"])
            );

            expect(
                expectedMethods.filter((method) =>
                    Object.hasOwn(exposedAPI, method)
                )
            ).toStrictEqual(expectedMethods);
            expect(
                Object.fromEntries(
                    expectedMethods.map((method) => [
                        method,
                        typeof exposedAPI[method],
                    ])
                )
            ).toStrictEqual(expectedMethodTypes);
        });

        it("getChannelInfo should return channel information", () => {
            expect.assertions(1);
            executePreloadScript();

            const channelInfo = exposedAPI.getChannelInfo();

            expect(channelInfo).toStrictEqual({
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: 26,
                totalEvents: Object.keys(EXPECTED_PRELOAD_EVENTS).length,
            });
        });

        it("validateAPI should perform comprehensive validation", () => {
            expect.assertions(2);
            executePreloadScript();

            expect(exposedAPI.validateAPI()).toStrictEqual(true);
            expect(exposedAPI.getChannelInfo()).toStrictEqual({
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: 26,
                totalEvents: Object.keys(EXPECTED_PRELOAD_EVENTS).length,
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
            expect.assertions(1);
            const callback = vi.fn<IpcListener>();
            const unsubscribe = exposedAPI.onMenuOpenFile(
                callback
            ) as () => void;

            expect(
                getIpcRegistrationLifecycle({
                    callback,
                    channel: "menu-open-file",
                    unsubscribe,
                })
            ).toStrictEqual({
                callbackCalls: [[]],
                cleanup: {
                    removedChannel: "menu-open-file",
                    removedRegisteredListener: true,
                },
                registration: {
                    listenerType: "function",
                    registeredChannel: "menu-open-file",
                },
                unsubscribeResult: undefined,
            });
        });

        it("onMenuOpenOverlay should register event handler", () => {
            expect.assertions(1);
            const callback = vi.fn<IpcListener>();
            const unsubscribe = exposedAPI.onMenuOpenOverlay(
                callback
            ) as () => void;

            expect(
                getIpcRegistrationLifecycle({
                    callback,
                    channel: "menu-open-overlay",
                    unsubscribe,
                })
            ).toStrictEqual({
                callbackCalls: [[]],
                cleanup: {
                    removedChannel: "menu-open-overlay",
                    removedRegisteredListener: true,
                },
                registration: {
                    listenerType: "function",
                    registeredChannel: "menu-open-overlay",
                },
                unsubscribeResult: undefined,
            });
        });

        it("onOpenRecentFile should register event handler", () => {
            expect.assertions(1);
            const callback = vi.fn<IpcListener>();
            const unsubscribe = exposedAPI.onOpenRecentFile(
                callback
            ) as () => void;

            expect(
                getIpcRegistrationLifecycle({
                    callback,
                    channel: "open-recent-file",
                    eventArgs: ["ride.fit"],
                    unsubscribe,
                })
            ).toStrictEqual({
                callbackCalls: [["ride.fit"]],
                cleanup: {
                    removedChannel: "open-recent-file",
                    removedRegisteredListener: true,
                },
                registration: {
                    listenerType: "function",
                    registeredChannel: "open-recent-file",
                },
                unsubscribeResult: undefined,
            });
        });

        it("onOpenSummaryColumnSelector should register event handler", () => {
            expect.assertions(1);
            const callback = vi.fn<IpcListener>();
            const unsubscribe = exposedAPI.onOpenSummaryColumnSelector(
                callback
            ) as () => void;

            expect(
                getIpcRegistrationLifecycle({
                    callback,
                    channel: "open-summary-column-selector",
                    unsubscribe,
                })
            ).toStrictEqual({
                callbackCalls: [[]],
                cleanup: {
                    removedChannel: "open-summary-column-selector",
                    removedRegisteredListener: true,
                },
                registration: {
                    listenerType: "function",
                    registeredChannel: "open-summary-column-selector",
                },
                unsubscribeResult: undefined,
            });
        });

        it("onSetTheme should register event handler", () => {
            expect.assertions(1);
            const callback = vi.fn<IpcListener>();
            const unsubscribe = exposedAPI.onSetTheme(callback) as () => void;

            expect(
                getIpcRegistrationLifecycle({
                    callback,
                    channel: "set-theme",
                    eventArgs: ["dark"],
                    unsubscribe,
                })
            ).toStrictEqual({
                callbackCalls: [["dark"]],
                cleanup: {
                    removedChannel: "set-theme",
                    removedRegisteredListener: true,
                },
                registration: {
                    listenerType: "function",
                    registeredChannel: "set-theme",
                },
                unsubscribeResult: undefined,
            });
        });

        it("onUpdateEvent should register event handler", () => {
            expect.assertions(1);
            const eventName = "update-available";
            const callback = vi.fn<IpcListener>();
            const unsubscribe = exposedAPI.onUpdateEvent(
                eventName,
                callback
            ) as () => void;

            expect(
                getIpcRegistrationLifecycle({
                    callback,
                    channel: eventName,
                    eventArgs: ["1.2.3"],
                    unsubscribe,
                })
            ).toStrictEqual({
                callbackCalls: [["1.2.3"]],
                cleanup: {
                    removedChannel: eventName,
                    removedRegisteredListener: true,
                },
                registration: {
                    listenerType: "function",
                    registeredChannel: eventName,
                },
                unsubscribeResult: undefined,
            });
        });

        it("onMenuOpenFile should reject invalid callbacks", () => {
            expect.assertions(4);
            const unsubscribe = exposedAPI.onMenuOpenFile(
                "not-a-function"
            ) as () => void;

            expect(unsubscribe()).toBeUndefined();
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
            expect(mockIpcRenderer.removeListener).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] onMenuOpenFile: callback must be a function"
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
            expect(consoleSpy.error).not.toHaveBeenCalled();
        });

        it("injectMenu should validate fitFilePath parameter", async () => {
            expect.assertions(3);
            const invalidPath = 123; // Not a string or null

            await expect(
                exposedAPI.injectMenu("dark", invalidPath)
            ).resolves.toStrictEqual(false);
            expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();
            expect(consoleSpy.error).not.toHaveBeenCalled();
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
            expect.assertions(4);
            const error = new Error("Event error");
            mockIpcRenderer.on.mockImplementation(() => {
                throw error;
            });

            const unsubscribe = exposedAPI.onMenuOpenFile(
                vi.fn<IpcListener>()
            ) as () => void;

            expect(unsubscribe()).toBeUndefined();
            expect(mockIpcRenderer.removeListener).not.toHaveBeenCalled();
            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                "menu-open-file",
                expect.any(Function)
            );
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error setting up onMenuOpenFile event handler:",
                error
            );
        });

        it("should validate callback in event handlers", () => {
            expect.assertions(4);
            const unsubscribe = exposedAPI.onMenuOpenFile(
                "not-a-function"
            ) as () => void;

            expect(unsubscribe()).toBeUndefined();
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
            expect(mockIpcRenderer.removeListener).not.toHaveBeenCalled();
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
            const preloadInfo = exposedDevTools.getPreloadInfo();

            expect(consoleSpy.log).toHaveBeenCalledWith(
                "[preload.js] Successfully exposed electronAPI to main world"
            );
            expect(preloadInfo.apiMethods.toSorted()).toStrictEqual(
                Object.keys(exposedAPI).toSorted()
            );
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
