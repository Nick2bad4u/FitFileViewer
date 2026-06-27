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
        timestamp: string;
        version: string;
    };
    logAPIState: () => void;
    testIPC: () => Promise<boolean>;
}

type ContextBridgeExpose = (name: string, api: unknown) => void;
type IpcInvoke = (...args: unknown[]) => Promise<unknown>;
type IpcListener = (...args: unknown[]) => void;
type IpcOnCall = [string, IpcListener];
type ProcessListener = (...args: unknown[]) => void;
type ProcessListeners = (eventName: string) => ProcessListener[];
type ProcessListenerMutation = (
    eventName: string,
    listener: ProcessListener
) => void;
type ProcessOnce = (eventName: string, listener: ProcessListener) => void;
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

    function getRequiredExposeCall(name: string): [string, unknown] {
        const call = mockContextBridge.exposeInMainWorld.mock.calls.find(
            ([exposedName]) => exposedName === name
        );

        if (!call) {
            throw new TypeError(`Expected ${name} exposure`);
        }

        return call;
    }

    function getOptionalExposedApi<T>(name: string): T | undefined {
        const call = mockContextBridge.exposeInMainWorld.mock.calls.find(
            ([exposedName]) => exposedName === name
        );

        return call ? (call[1] as T) : undefined;
    }

    function getRequiredExposedApi(): ExposedPreloadApi {
        return getRequiredExposeCall("electronAPI")[1] as ExposedPreloadApi;
    }

    function getRequiredDevTools(
        devTools: ExposedDevTools | undefined
    ): ExposedDevTools {
        if (!devTools) {
            throw new TypeError("Expected development tools exposure");
        }

        return devTools;
    }

    function getRequiredIpcOnCall(): IpcOnCall {
        const call = mockIpcRenderer.on.mock.calls.at(0);

        if (!call) {
            throw new TypeError("Expected ipcRenderer.on registration");
        }

        return call as IpcOnCall;
    }

    function getRequiredBeforeExitListener(
        listeners: ProcessListener[]
    ): ProcessListener {
        const listener = listeners.at(0);

        if (!listener) {
            throw new TypeError("Expected beforeExit listener");
        }

        return listener;
    }

    function getRequiredConsoleLogCall(message: string): [unknown, unknown] {
        const call = consoleSpy.log.mock.calls.find(
            ([loggedMessage]) => loggedMessage === message
        );

        if (!call) {
            throw new TypeError(`Expected console log for ${message}`);
        }

        return call as [unknown, unknown];
    }

    function getRequiredLoggedError(
        calls: unknown[][],
        message: string
    ): Error {
        const call = calls.find(([loggedMessage]) => loggedMessage === message);

        if (!call) {
            throw new TypeError(`Expected console error for ${message}`);
        }

        const error = call[1];

        if (!(error instanceof Error)) {
            throw new TypeError(`Expected Error payload for ${message}`);
        }

        return error;
    }

    function createPreloadEnvironment(options = {}) {
        const env = {
            NODE_ENV: "test",
            ...options,
        };
        let beforeExitListeners: ProcessListener[] = [];

        const mockRequire = vi.fn<RequireModule>((moduleName) =>
            resolvePreloadScriptRequire(moduleName, {
                ipcRenderer: mockIpcRenderer,
                contextBridge: mockContextBridge,
            })
        );

        const mockProcess = {
            env,
            listeners: vi.fn<ProcessListeners>((eventName) =>
                eventName === "beforeExit" ? beforeExitListeners : []
            ),
            once: vi.fn<ProcessOnce>((eventName, listener) => {
                if (eventName === "beforeExit") {
                    beforeExitListeners.push(listener);
                }
            }),
            removeListener: vi.fn<ProcessListenerMutation>(
                (eventName, listener) => {
                    if (eventName === "beforeExit") {
                        beforeExitListeners = beforeExitListeners.filter(
                            (currentListener) => currentListener !== listener
                        );
                    }
                }
            ),
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
            exposedAPI: getRequiredExposedApi(),
            devTools: getOptionalExposedApi<ExposedDevTools>(
                developmentToolsGlobalName
            ),
            getBeforeExitListeners: () => beforeExitListeners,
        };
    }

    function runPreloadScript(
        mockRequire: (moduleName: string) => unknown,
        mockProcess: {
            env: Record<string, unknown>;
            listeners: ReturnType<typeof vi.fn<ProcessListeners>>;
            once: ReturnType<typeof vi.fn<ProcessOnce>>;
            removeListener: ReturnType<typeof vi.fn<ProcessListenerMutation>>;
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
            expect.assertions(8);
            const {
                exposedAPI,
                getBeforeExitListeners,
                mockProcess,
                mockRequire,
            } = createPreloadEnvironment();

            expect(mockRequire).toHaveBeenCalledWith("electron");
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                exposedAPI
            );
            expect(
                Object.fromEntries(
                    ["getChannelInfo", "validateAPI"].map((methodName) => [
                        methodName,
                        Object.hasOwn(exposedAPI, methodName),
                    ])
                )
            ).toStrictEqual({
                getChannelInfo: true,
                validateAPI: true,
            });
            expect(exposedAPI.validateAPI()).toStrictEqual(true);
            const beforeExitListener = getRequiredBeforeExitListener(
                getBeforeExitListeners()
            );
            expect(mockProcess.once.mock.calls[0]).toStrictEqual([
                "beforeExit",
                beforeExitListener,
            ]);
            expect(getBeforeExitListeners()).toHaveLength(1);
            beforeExitListener();
            expect(getBeforeExitListeners()).toHaveLength(0);
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
            expect.assertions(1);
            const { exposedAPI } = createPreloadEnvironment();
            const channelInfo = exposedAPI.getChannelInfo();

            expect(channelInfo).toStrictEqual({
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: 26,
                totalEvents: Object.keys(EXPECTED_PRELOAD_EVENTS).length,
            });
        });

        it("should include all expected channel names", () => {
            expect.assertions(26);
            const { exposedAPI } = createPreloadEnvironment();
            const channelInfo = exposedAPI.getChannelInfo();

            const expectedChannels = Object.keys(channelInfo.channels);

            expectedChannels.forEach((channel) => {
                expect(channelInfo.channels).toHaveProperty(channel);
            });
        });

        it("should include all expected event names", () => {
            expect.assertions(Object.keys(EXPECTED_PRELOAD_EVENTS).length);
            const { exposedAPI } = createPreloadEnvironment();
            const channelInfo = exposedAPI.getChannelInfo();

            const expectedEvents = Object.keys(channelInfo.events);

            expectedEvents.forEach((event) => {
                expect(channelInfo.events).toHaveProperty(event);
            });
        });
    });

    describe("file Operations API", () => {
        it("should route open file aliases through the dialog channel", async () => {
            expect.assertions(3);
            const { exposedAPI } = createPreloadEnvironment();
            const results = await Promise.all([
                exposedAPI.openFile(),
                exposedAPI.openFileDialog(),
            ]);

            expect(results).toStrictEqual(["mock-result", "mock-result"]);
            expect(mockIpcRenderer.invoke).toHaveBeenCalledTimes(2);
            expect(mockIpcRenderer.invoke.mock.calls).toStrictEqual([
                ["dialog:openFile"],
                ["dialog:openFile"],
            ]);
        });

        it("should provide readFile method", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const result = await exposedAPI.readFile("C:/rides/test.fit");

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "file:read",
                "C:/rides/test.fit"
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
                exposedAPI.readFile("C:/rides/nonexistent.fit")
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
            const result = await exposedAPI.addRecentFile("C:/rides/new.fit");

            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "recentFiles:add",
                "C:/rides/new.fit"
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

            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "theme-changed",
                "light"
            );
        });
    });

    describe("application Information API", () => {
        it("should route version information methods through their channels", async () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();
            const results = await Promise.all([
                exposedAPI.getAppVersion(),
                exposedAPI.getElectronVersion(),
                exposedAPI.getNodeVersion(),
                exposedAPI.getChromeVersion(),
            ]);

            expect(results).toStrictEqual([
                "mock-result",
                "mock-result",
                "mock-result",
                "mock-result",
            ]);
            expect(mockIpcRenderer.invoke.mock.calls).toStrictEqual([
                ["getAppVersion"],
                ["getElectronVersion"],
                ["getNodeVersion"],
                ["getChromeVersion"],
            ]);
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
                exposedAPI.openExternal("https://example.com/unavailable")
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
            expect.assertions(3);
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn<IpcListener>();

            const unsubscribe = exposedAPI.onMenuOpenFile(callback);
            const [channel, registeredListener] = getRequiredIpcOnCall();

            expect(channel).toBe("menu-open-file");
            registeredListener({}, "activity.fit");
            expect(callback).toHaveBeenCalledWith("activity.fit");
            unsubscribe();
            expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith(
                "menu-open-file",
                registeredListener
            );
        });

        it("should provide onMenuOpenOverlay method", () => {
            expect.assertions(3);
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn<IpcListener>();

            const unsubscribe = exposedAPI.onMenuOpenOverlay(callback);
            const [channel, registeredListener] = getRequiredIpcOnCall();

            expect(channel).toBe("menu-open-overlay");
            registeredListener({}, "overlay.fit");
            expect(callback).toHaveBeenCalledWith("overlay.fit");
            unsubscribe();
            expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith(
                "menu-open-overlay",
                registeredListener
            );
        });

        it("should provide onOpenRecentFile method", () => {
            expect.assertions(3);
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn<IpcListener>();

            const unsubscribe = exposedAPI.onOpenRecentFile(callback);
            const [channel, registeredListener] = getRequiredIpcOnCall();

            expect(channel).toBe("open-recent-file");
            registeredListener({}, "recent.fit");
            expect(callback).toHaveBeenCalledWith("recent.fit");
            unsubscribe();
            expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith(
                "open-recent-file",
                registeredListener
            );
        });

        it("should provide onSetTheme method", () => {
            expect.assertions(3);
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn<IpcListener>();

            const unsubscribe = exposedAPI.onSetTheme(callback);
            const [channel, registeredListener] = getRequiredIpcOnCall();

            expect(channel).toBe("set-theme");
            registeredListener({}, "dark");
            expect(callback).toHaveBeenCalledWith("dark");
            unsubscribe();
            expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith(
                "set-theme",
                registeredListener
            );
        });

        it("should validate callback functions in event handlers", () => {
            expect.assertions(7);
            const { exposedAPI, mockConsole } = createPreloadEnvironment();

            const openFileUnsubscribe =
                exposedAPI.onMenuOpenFile("not-a-function");
            const openOverlayUnsubscribe =
                exposedAPI.onMenuOpenOverlay("not-a-function");

            expect(openFileUnsubscribe()).toBeUndefined();
            expect(openOverlayUnsubscribe()).toBeUndefined();
            expect(mockConsole.error).toHaveBeenCalledWith(
                "[preload.js] onMenuOpenFile: callback must be a function"
            );
            expect(mockConsole.error).toHaveBeenCalledWith(
                "[preload.js] onMenuOpenOverlay: callback must be a function"
            );
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
            expect(mockIpcRenderer.removeListener).not.toHaveBeenCalled();
            expect(mockConsole.error).toHaveBeenCalledTimes(2);
        });
    });

    describe("auto-Updater Functions", () => {
        it("should provide onUpdateEvent method", () => {
            expect.assertions(3);
            const { exposedAPI } = createPreloadEnvironment();
            const callback = vi.fn<IpcListener>();

            const unsubscribe = exposedAPI.onUpdateEvent(
                "update-available",
                callback
            );
            const [channel, registeredListener] = getRequiredIpcOnCall();

            expect(channel).toBe("update-available");
            registeredListener({}, { version: "29.9.0" });
            expect(callback).toHaveBeenCalledWith({ version: "29.9.0" });
            unsubscribe();
            expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith(
                "update-available",
                registeredListener
            );
        });

        it("should provide checkForUpdates method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();

            const result = exposedAPI.checkForUpdates();

            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "menu-check-for-updates"
            );
        });

        it("should provide installUpdate method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();

            const result = exposedAPI.installUpdate();

            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).toHaveBeenCalledWith("install-update");
        });

        it("should provide setFullScreen method", () => {
            expect.assertions(2);
            const { exposedAPI } = createPreloadEnvironment();

            const result = exposedAPI.setFullScreen(true);

            expect(result).toBeUndefined();
            expect(mockIpcRenderer.send).toHaveBeenCalledWith(
                "set-fullscreen",
                true
            );
        });

        it("should validate parameters in onUpdateEvent", () => {
            expect.assertions(3);
            const { exposedAPI, mockConsole } = createPreloadEnvironment();
            const callback = vi.fn<IpcListener>();

            const unsubscribe = exposedAPI.onUpdateEvent(123, callback);

            expect(unsubscribe).toBeUndefined();
            expect(mockConsole.error).toHaveBeenCalledWith(
                "[preload.js] onUpdateEvent: eventName must be a string"
            );
            expect(mockIpcRenderer.on).not.toHaveBeenCalled();
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
            const injectError = new Error("Inject failed");
            mockIpcRenderer.invoke.mockRejectedValue(injectError);

            const { exposedAPI } = createPreloadEnvironment();

            await expect(exposedAPI.injectMenu("dark")).resolves.toStrictEqual(
                false
            );
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[preload.js] Error in injectMenu:",
                injectError
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
            expect(consoleSpy.error).not.toHaveBeenCalled();
        });
    });

    describe("debugging and Validation", () => {
        it("should provide validateAPI method", () => {
            expect.assertions(3);
            const { exposedAPI } = createPreloadEnvironment();
            expect(exposedAPI.validateAPI()).toStrictEqual(true);
            expect(exposedAPI.getChannelInfo()).toStrictEqual({
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: 26,
                totalEvents: Object.keys(EXPECTED_PRELOAD_EVENTS).length,
            });
            expect(exposedAPI.getChannelInfo().channels).not.toHaveProperty(
                "UNKNOWN_CHANNEL"
            );
        });

        it("should provide getChannelInfo with complete information", () => {
            expect.assertions(1);
            const { exposedAPI } = createPreloadEnvironment();
            const channelInfo = exposedAPI.getChannelInfo();

            expect(channelInfo).toStrictEqual({
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: 26,
                totalEvents: Object.keys(EXPECTED_PRELOAD_EVENTS).length,
            });
        });
    });

    describe("development Mode Features", () => {
        it("should expose development tools in development mode", async () => {
            expect.assertions(8);
            const { devTools, exposedAPI } = createPreloadEnvironment({
                NODE_ENV: "development",
            });
            const requiredDevTools = getRequiredDevTools(devTools);
            const preloadInfo = requiredDevTools.getPreloadInfo();

            // Should expose both electronAPI and development tools.
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                exposedAPI
            );
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                developmentToolsGlobalName,
                requiredDevTools
            );

            expect(Object.keys(requiredDevTools).sort()).toStrictEqual([
                "getPreloadInfo",
                "logAPIState",
                "testIPC",
            ]);
            expect({
                apiMethods: preloadInfo.apiMethods,
                channels: preloadInfo.constants.CHANNELS,
                events: preloadInfo.constants.EVENTS,
                version: preloadInfo.version,
            }).toStrictEqual({
                apiMethods: Object.keys(exposedAPI),
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                version: "1.0.0",
            });
            expect(preloadInfo.timestamp).toSatisfy((timestamp: string) =>
                Number.isFinite(Date.parse(timestamp))
            );
            requiredDevTools.logAPIState();
            const apiStateLog = getRequiredConsoleLogCall(
                "[preload.js] Current API State:"
            );
            const apiStatePayload = apiStateLog[1] as Record<string, unknown>;
            expect({
                electronAPI: apiStatePayload.electronAPI,
                methodCount: apiStatePayload.methodCount,
                message: apiStateLog[0],
            }).toStrictEqual({
                electronAPI: "object",
                methodCount: Object.keys(exposedAPI).length,
                message: "[preload.js] Current API State:",
            });
            await expect(requiredDevTools.testIPC()).resolves.toBe(true);
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
                "getAppVersion"
            );
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
            expect(
                mockContextBridge.exposeInMainWorld.mock.calls.map(
                    ([name]) => name
                )
            ).not.toContain(developmentToolsGlobalName);
        });
    });

    describe("error Handling and Edge Cases", () => {
        it("should handle contextBridge exposure failures", () => {
            expect.assertions(5);
            // Create a new environment where contextBridge throws on exposure
            const env = { NODE_ENV: "test" };
            let beforeExitListeners: ProcessListener[] = [];
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

            const mockProcess = {
                env,
                listeners: vi.fn<ProcessListeners>((eventName) =>
                    eventName === "beforeExit" ? beforeExitListeners : []
                ),
                once: vi.fn<ProcessOnce>((eventName, listener) => {
                    if (eventName === "beforeExit") {
                        beforeExitListeners.push(listener);
                    }
                }),
                removeListener: vi.fn<ProcessListenerMutation>(
                    (eventName, listener) => {
                        if (eventName === "beforeExit") {
                            beforeExitListeners = beforeExitListeners.filter(
                                (currentListener) =>
                                    currentListener !== listener
                            );
                        }
                    }
                ),
            };
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
            const beforeExitListener =
                getRequiredBeforeExitListener(beforeExitListeners);
            expect(mockProcess.once.mock.calls[0]).toStrictEqual([
                "beforeExit",
                beforeExitListener,
            ]);
            expect(beforeExitListeners).toHaveLength(1);
            const exposureError = getRequiredLoggedError(
                consoleSpy.mock.calls,
                "[preload.js] Failed to expose electronAPI:"
            );
            expect(exposureError).toBeInstanceOf(Error);
            expect(exposureError.message).toBe("Exposure failed");

            consoleSpy.mockRestore();
        });

        it("should handle send operation errors", () => {
            expect.assertions(4);
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
            const sendError = getRequiredLoggedError(
                consoleSpy.mock.calls,
                "[preload.js] Error in sendThemeChanged:"
            );
            expect(sendError).toBeInstanceOf(Error);
            expect(sendError.message).toBe("Send failed");

            consoleSpy.mockRestore();
        });
    });

    describe("process Lifecycle", () => {
        it("should handle process exit cleanup", () => {
            expect.assertions(4);
            const { getBeforeExitListeners, mockProcess } =
                createPreloadEnvironment();
            const beforeExitListener = getRequiredBeforeExitListener(
                getBeforeExitListeners()
            );

            expect(mockProcess.once.mock.calls[0]).toStrictEqual([
                "beforeExit",
                beforeExitListener,
            ]);
            expect(getBeforeExitListeners()).toHaveLength(1);
            beforeExitListener();
            expect(getBeforeExitListeners()).toHaveLength(0);
            expect(mockProcess.env.NODE_ENV).toBe("test");
        });

        it("should log successful initialization", () => {
            expect.assertions(3);
            const { devTools } = createPreloadEnvironment({
                NODE_ENV: "development",
            });
            const requiredDevTools = getRequiredDevTools(devTools);

            expect(consoleSpy.log).toHaveBeenCalledWith(
                "[preload.js] Preload script initialized successfully"
            );
            expect(consoleSpy.error).not.toHaveBeenCalled();
            expect({
                version: requiredDevTools.getPreloadInfo().version,
            }).toStrictEqual({
                version: "1.0.0",
            });
        });
    });
});
