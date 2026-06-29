import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolvePreloadScriptRequire } from "../vitest/helpers/preloadModuleMocks";
import { readPreloadDistCode } from "../vitest/helpers/preloadDist";

type MockFunction = ReturnType<typeof vi.fn>;
type MockWithCalls = { mock: { calls: unknown[][] } };
type IpcListener = (...args: unknown[]) => void;
type Unsubscribe = (() => void) | undefined;
type VoidMockHandler = (...args: unknown[]) => void;
type UnhandledRejectionHandler = (
    reason: unknown,
    promise: Promise<unknown>
) => void;

interface ElectronMock {
    contextBridge: {
        exposeInMainWorld: MockFunction;
    };
    ipcRenderer: {
        invoke: MockFunction;
        on: MockFunction;
        removeAllListeners: MockFunction;
        send: MockFunction;
    };
}

interface MockProcess {
    env: {
        NODE_ENV: string;
    };
    listeners: MockFunction;
    once: MockFunction;
    removeListener: MockFunction;
}

interface ChannelInfo {
    channels: Record<string, unknown>;
    events: Record<string, unknown>;
    totalChannels: number;
    totalEvents: number;
}

interface PreloadElectronAPI {
    addRecentFile: (filePath: unknown) => Promise<unknown>;
    checkForUpdates: () => void;
    decodeFitFile: (arrayBuffer: ArrayBuffer) => Promise<unknown>;
    getAppVersion: () => Promise<unknown>;
    getChannelInfo: () => ChannelInfo;
    getChromeVersion: () => Promise<unknown>;
    getElectronVersion: () => Promise<unknown>;
    getLicenseInfo: () => Promise<unknown>;
    getNodeVersion: () => Promise<unknown>;
    getPlatformInfo: () => Promise<unknown>;
    getTheme: () => Promise<unknown>;
    injectMenu: (theme: unknown, fitFilePath: unknown) => Promise<unknown>;
    installUpdate: () => void;
    onMenuOpenFile: (callback: IpcListener) => Unsubscribe;
    onMenuOpenOverlay: (callback: IpcListener) => Unsubscribe;
    onOpenRecentFile: (callback: IpcListener) => Unsubscribe;
    onOpenSummaryColumnSelector: (callback: IpcListener) => Unsubscribe;
    onSetTheme: (callback: IpcListener) => Unsubscribe;
    onUpdateEvent: (eventName: unknown, callback: IpcListener) => Unsubscribe;
    openExternal: (url: unknown) => Promise<unknown>;
    openFile: (filePath: unknown) => Promise<unknown>;
    openFileDialog: () => Promise<unknown>;
    parseFitFile: (fileBuffer: unknown) => Promise<unknown>;
    readFile: (filePath: unknown) => Promise<unknown>;
    recentFiles: () => Promise<unknown>;
    sendThemeChanged: (theme: unknown) => void;
    setFullScreen: (fullscreen: unknown) => void;
    startGyazoServer: () => Promise<unknown>;
    stopGyazoServer: () => Promise<unknown>;
    validateAPI: () => boolean;
}

interface PreloadDevTools {
    getPreloadInfo: () => {
        apiMethods: unknown[];
        constants: Record<string, unknown>;
        timestamp: string;
        version: string;
    };
    logAPIState: () => void;
    testIPC: () => Promise<unknown>;
}

type PreloadTestGlobal = typeof globalThis & {
    [apiName: string]: unknown;
    devTools?: PreloadDevTools;
    electronAPI?: PreloadElectronAPI;
};

type ExposeCall = [string, unknown];
type BeforeExitCall = ["beforeExit", () => void];

const ELECTRON_API_NAME = "electronAPI";
const DEVTOOLS_API_NAME = "devTools"; // eslint-disable-line case-police/string-check -- preload exposes this exact camelCase API name.

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

const EXPECTED_PRELOAD_CONSTANTS = {
    CHANNELS: EXPECTED_PRELOAD_CHANNELS,
    DEFAULT_VALUES: {
        FIT_FILE_PATH: null,
        THEME: null,
    },
    EVENTS: EXPECTED_PRELOAD_EVENTS,
} as const;

const EXPECTED_ELECTRON_API_METHODS = [
    "addRecentFile",
    "checkForUpdates",
    "decodeFitFile",
    "getAppVersion",
    "getChannelInfo",
    "getChromeVersion",
    "getElectronVersion",
    "getErrors",
    "getFitBrowserFolder",
    "getLicenseInfo",
    "getMainState",
    "getMetrics",
    "getNodeVersion",
    "getOperation",
    "getOperations",
    "getPlatformInfo",
    "getTheme",
    "injectMenu",
    "installUpdate",
    "isFitBrowserEnabled",
    "listenToMainState",
    "listFitBrowserFolder",
    "notifyFitFileLoaded",
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
    "openFolderDialog",
    "openOverlayDialog",
    "parseFitFile",
    "readFile",
    "recentFiles",
    "requestExport",
    "requestSaveAs",
    "sendThemeChanged",
    "setFitBrowserEnabled",
    "setFitBrowserFolder",
    "setFullScreen",
    "setMainState",
    "startGyazoServer",
    "stopGyazoServer",
    "subscribeToMainState",
    "unlistenFromMainState",
    "validateAPI",
    "writeClipboardPngDataUrl",
    "writeClipboardText",
] as const;

const EXPECTED_DEVTOOLS_METHODS = [
    "getPreloadInfo",
    "logAPIState",
    "testIPC",
] as const;

function getMockCalls(mock: MockWithCalls): unknown[][] {
    return mock.mock.calls;
}

function getPreloadGlobal(target: unknown = globalThis): PreloadTestGlobal {
    return target as PreloadTestGlobal;
}

function isExposeCall(call: unknown[]): call is ExposeCall {
    return typeof call[0] === "string" && call.length >= 2;
}

function isBeforeExitCall(call: unknown[]): call is BeforeExitCall {
    return call[0] === "beforeExit" && typeof call[1] === "function";
}

function firstArgumentEquals(call: unknown[], text: string): boolean {
    return call[0] === text;
}

function resolveIpcInvoke(channel: string): Promise<unknown> {
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
            return Promise.resolve(["file1.fit", "file2.fit"]);
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
}

describe("preload.js - Comprehensive API Testing", () => {
    let electronMock: ElectronMock;
    let consoleLogSpy: MockWithCalls;
    let consoleErrorSpy: MockWithCalls;
    let removeUnhandledRejectionHandler: (() => void) | undefined;
    let mockProcess: MockProcess;

    function findExposedCall(apiName: string): ExposeCall | undefined {
        return getMockCalls(electronMock.contextBridge.exposeInMainWorld).find(
            (call): call is ExposeCall =>
                isExposeCall(call) && call[0] === apiName
        );
    }

    function getRequiredExposedCall(apiName: string): ExposeCall {
        const exposedCall = findExposedCall(apiName);

        if (!exposedCall) {
            throw new TypeError(`Expected ${apiName} exposure`);
        }

        return exposedCall;
    }

    function getElectronAPI(): PreloadElectronAPI {
        return getRequiredExposedCall(
            ELECTRON_API_NAME
        )[1] as PreloadElectronAPI;
    }

    function getDevTools(): PreloadDevTools {
        return getRequiredExposedCall(DEVTOOLS_API_NAME)[1] as PreloadDevTools;
    }

    function expectIpcRegistration(channel: string): unknown {
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

    function getIpcRegistration(channel: string): {
        listener: unknown;
        registeredChannel: unknown;
    } {
        const [registeredChannel, listener] =
            electronMock.ipcRenderer.on.mock.calls.find(
                ([candidate]) => candidate === channel
            ) ?? [];

        return {
            listener,
            registeredChannel,
        };
    }

    function getIpcFallbackLifecycle({
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

        return {
            callbackCalls: callback.mock.calls,
            cleanupCalls:
                electronMock.ipcRenderer.removeAllListeners.mock.calls,
            registration: {
                listenerType: typeof listener,
                registeredChannel,
            },
            unsubscribeResult,
        };
    }

    function getBeforeExitRegistration(): {
        eventName: unknown;
        listenerType: string;
    } {
        const [eventName, listener] =
            getMockCalls(mockProcess.once).find(isBeforeExitCall) ?? [];

        return {
            eventName,
            listenerType: typeof listener,
        };
    }

    function getRequiredBeforeExitCall(): BeforeExitCall {
        const beforeExitCall = getMockCalls(mockProcess.once).find(
            isBeforeExitCall
        );

        if (!beforeExitCall) {
            throw new TypeError("Expected beforeExit registration");
        }

        return beforeExitCall;
    }

    beforeEach(() => {
        // Reset everything completely
        vi.resetAllMocks();
        vi.resetModules();
        vi.clearAllMocks();

        // Add unhandled promise rejection handler for tests
        const runtimeProcess = process;
        const unhandledRejectionHandler: UnhandledRejectionHandler = (
            reason
        ) => {
            console.error("Unhandled Promise Rejection in test:", reason);
            // Don't throw to prevent test failures, just log
        };
        runtimeProcess.on("unhandledRejection", unhandledRejectionHandler);
        removeUnhandledRejectionHandler = () => {
            runtimeProcess.removeListener(
                "unhandledRejection",
                unhandledRejectionHandler
            );
        };

        // Create comprehensive electron mock
        electronMock = {
            ipcRenderer: {
                invoke: vi
                    .fn<typeof resolveIpcInvoke>()
                    .mockImplementation(resolveIpcInvoke),
                send: vi.fn<VoidMockHandler>(),
                on: vi.fn<VoidMockHandler>(),
                removeAllListeners: vi.fn<VoidMockHandler>(),
            },
            contextBridge: {
                exposeInMainWorld: vi
                    .fn<(apiName: string, api: unknown) => void>()
                    .mockImplementation((apiName: string, api: unknown) => {
                        // Actually expose the API to the global object for tests
                        getPreloadGlobal()[apiName] = api;
                        getPreloadGlobal(global)[apiName] = api;
                    }),
            },
        };

        // Mock console methods
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});

        // Mock process object
        const beforeExitListeners: VoidMockHandler[] = [];
        mockProcess = {
            env: { NODE_ENV: "development" },
            listeners: vi
                .fn<(eventName: string) => VoidMockHandler[]>()
                .mockImplementation((eventName: string) =>
                    eventName === "beforeExit" ? [...beforeExitListeners] : []
                ),
            once: vi
                .fn<(eventName: string, listener: VoidMockHandler) => void>()
                .mockImplementation(
                    (eventName: string, listener: VoidMockHandler) => {
                        if (eventName === "beforeExit") {
                            beforeExitListeners.push(listener);
                        }
                    }
                ),
            removeListener: vi
                .fn<(eventName: string, listener: VoidMockHandler) => void>()
                .mockImplementation(
                    (eventName: string, listener: VoidMockHandler) => {
                        if (eventName !== "beforeExit") {
                            return;
                        }

                        const listenerIndex =
                            beforeExitListeners.indexOf(listener);
                        if (listenerIndex >= 0) {
                            beforeExitListeners.splice(listenerIndex, 1);
                        }
                    }
                ),
        };

        // Load and execute preload script
        const preloadCode = readPreloadDistCode();

        const mockRequire = vi
            .fn<(module: string) => unknown>()
            .mockImplementation((module: string) =>
                resolvePreloadScriptRequire(module, electronMock)
            );

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
        removeUnhandledRejectionHandler?.();
        removeUnhandledRejectionHandler = undefined;
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe("api exposure", () => {
        it("should expose electronAPI to main world", () => {
            expect.assertions(3);

            const exposedCall = getRequiredExposedCall(ELECTRON_API_NAME);

            expect(exposedCall[0]).toBe(ELECTRON_API_NAME);
            expect(
                Object.keys(exposedCall[1] as Record<string, unknown>)
            ).toEqual(EXPECTED_ELECTRON_API_METHODS);
            expect((exposedCall[1] as PreloadElectronAPI).validateAPI()).toBe(
                true
            );
        });

        it("should expose developer tools to main world", () => {
            expect.assertions(2);

            const exposedCall = getRequiredExposedCall(DEVTOOLS_API_NAME);

            expect(exposedCall[0]).toBe(DEVTOOLS_API_NAME);
            expect(
                Object.keys(exposedCall[1] as Record<string, unknown>)
            ).toEqual(EXPECTED_DEVTOOLS_METHODS);
        });

        it("should expose exactly 2 APIs", () => {
            expect.assertions(5);

            expect(
                electronMock.contextBridge.exposeInMainWorld
            ).toHaveBeenCalledTimes(2);
            expect(
                getMockCalls(electronMock.contextBridge.exposeInMainWorld).map(
                    ([apiName]) => apiName
                )
            ).toEqual([ELECTRON_API_NAME, DEVTOOLS_API_NAME]);
            expect(
                getMockCalls(electronMock.contextBridge.exposeInMainWorld).map(
                    ([apiName]) => apiName
                )
            ).not.toContain("__proto__");
            expect(getPreloadGlobal().electronAPI).toBe(getElectronAPI());
            expect(getPreloadGlobal().devTools).toBe(getDevTools());
        });

        it("should expose electronAPI with all expected methods", () => {
            expect.assertions(2);

            const electronAPICall = getRequiredExposedCall("electronAPI");

            expect(
                Object.keys(electronAPICall[1] as Record<string, unknown>)
            ).toEqual(EXPECTED_ELECTRON_API_METHODS);

            const electronAPI = electronAPICall[1] as Record<string, unknown>;

            expect(
                EXPECTED_ELECTRON_API_METHODS.map((methodName) => [
                    methodName,
                    typeof electronAPI[methodName],
                ])
            ).toEqual(
                EXPECTED_ELECTRON_API_METHODS.map((methodName) => [
                    methodName,
                    "function",
                ])
            );
        });
    });

    describe("api method functionality", () => {
        let electronAPI: PreloadElectronAPI;

        beforeEach(() => {
            electronAPI = getElectronAPI();
        });

        it("should handle getAppVersion correctly", async () => {
            expect.assertions(2);

            const result = await electronAPI.getAppVersion();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "getAppVersion"
            );
            expect(result).toBe("1.0.0");
        });

        it("should handle getChromeVersion correctly", async () => {
            expect.assertions(2);

            const result = await electronAPI.getChromeVersion();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "getChromeVersion"
            );
            expect(result).toBe("chrome-version");
        });

        it("should handle getElectronVersion correctly", async () => {
            expect.assertions(2);

            const result = await electronAPI.getElectronVersion();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "getElectronVersion"
            );
            expect(result).toBe("electron-version");
        });

        it("should handle getNodeVersion correctly", async () => {
            expect.assertions(2);

            const result = await electronAPI.getNodeVersion();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "getNodeVersion"
            );
            expect(result).toBe("node-version");
        });

        it("should handle getPlatformInfo correctly", async () => {
            expect.assertions(2);

            const result = await electronAPI.getPlatformInfo();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "getPlatformInfo"
            );
            expect(result).toEqual({ platform: "win32" });
        });

        it("should handle getTheme correctly", async () => {
            expect.assertions(2);

            const result = await electronAPI.getTheme();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "theme:get"
            );
            expect(result).toBe("dark");
        });

        it("should handle recentFiles correctly", async () => {
            expect.assertions(2);

            const result = await electronAPI.recentFiles();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "recentFiles:get"
            );
            expect(result).toEqual(["file1.fit", "file2.fit"]);
        });

        it("should handle addRecentFile correctly", async () => {
            expect.assertions(2);

            const result = await electronAPI.addRecentFile("/path/to/file.fit");
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "recentFiles:add",
                "/path/to/file.fit"
            );
            expect({ returnValue: result }).toStrictEqual({
                returnValue: undefined,
            });
        });

        it("should handle openFileDialog correctly", async () => {
            expect.assertions(2);

            const result = await electronAPI.openFileDialog();
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "dialog:openFile"
            );
            expect(result).toEqual(["file1.fit"]);
        });

        it("should handle readFile correctly", async () => {
            expect.assertions(2);

            const result = await electronAPI.readFile("/path/to/file.fit");
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "file:read",
                "/path/to/file.fit"
            );
            expect(result).toBe("file-content");
        });

        it("should handle decodeFitFile correctly", async () => {
            expect.assertions(2);

            const fileBuffer = new ArrayBuffer(8);
            const result = await electronAPI.decodeFitFile(fileBuffer);
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "fit:decode",
                fileBuffer
            );
            expect(result).toBe("decoded-data");
        });

        it("should handle parseFitFile correctly", async () => {
            expect.assertions(2);

            const fileBuffer = new ArrayBuffer(8);
            const result = await electronAPI.parseFitFile(fileBuffer);
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "fit:parse",
                fileBuffer
            );
            expect(result).toBe("parsed-data");
        });

        it("should handle checkForUpdates correctly", () => {
            expect.assertions(2);

            const result = electronAPI.checkForUpdates();
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(
                "menu-check-for-updates"
            );
            expect({ returnValue: result }).toStrictEqual({
                returnValue: undefined,
            });
        });

        it("should handle installUpdate correctly", () => {
            expect.assertions(2);

            const result = electronAPI.installUpdate();
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(
                "install-update"
            );
            expect({ returnValue: result }).toStrictEqual({
                returnValue: undefined,
            });
        });

        it("should handle setFullScreen correctly", () => {
            expect.assertions(2);

            const result = electronAPI.setFullScreen(true);
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(
                "set-fullscreen",
                true
            );
            expect({ returnValue: result }).toStrictEqual({
                returnValue: undefined,
            });
        });

        it("should handle openExternal correctly", async () => {
            expect.assertions(2);

            const result = await electronAPI.openExternal(
                "https://example.com"
            );
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "shell:openExternal",
                "https://example.com"
            );
            expect({ returnValue: result }).toStrictEqual({
                returnValue: undefined,
            });
        });

        it("should handle sendThemeChanged correctly", () => {
            expect.assertions(2);

            const result = electronAPI.sendThemeChanged("dark");
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(
                "theme-changed",
                "dark"
            );
            expect({ returnValue: result }).toStrictEqual({
                returnValue: undefined,
            });
        });
    });

    describe("event handlers", () => {
        let electronAPI: PreloadElectronAPI;

        beforeEach(() => {
            electronAPI = getElectronAPI();
        });

        it("should register onMenuOpenFile handler", () => {
            expect.assertions(1);

            const callback = vi.fn<IpcListener>();
            const unsubscribe = electronAPI.onMenuOpenFile(
                callback
            ) as () => void;

            expect(
                getIpcFallbackLifecycle({
                    callback,
                    channel: "menu-open-file",
                    unsubscribe,
                })
            ).toStrictEqual({
                callbackCalls: [[]],
                cleanupCalls: [["menu-open-file"]],
                registration: {
                    listenerType: "function",
                    registeredChannel: "menu-open-file",
                },
                unsubscribeResult: undefined,
            });
        });

        it("should register onMenuOpenOverlay handler", () => {
            expect.assertions(1);

            const callback = vi.fn<IpcListener>();
            const unsubscribe = electronAPI.onMenuOpenOverlay(
                callback
            ) as () => void;

            expect(
                getIpcFallbackLifecycle({
                    callback,
                    channel: "menu-open-overlay",
                    unsubscribe,
                })
            ).toStrictEqual({
                callbackCalls: [[]],
                cleanupCalls: [["menu-open-overlay"]],
                registration: {
                    listenerType: "function",
                    registeredChannel: "menu-open-overlay",
                },
                unsubscribeResult: undefined,
            });
        });

        it("should register onOpenRecentFile handler", () => {
            expect.assertions(1);

            const callback = vi.fn<IpcListener>();
            const unsubscribe = electronAPI.onOpenRecentFile(
                callback
            ) as () => void;

            expect(
                getIpcFallbackLifecycle({
                    callback,
                    channel: "open-recent-file",
                    eventArgs: ["ride.fit"],
                    unsubscribe,
                })
            ).toStrictEqual({
                callbackCalls: [["ride.fit"]],
                cleanupCalls: [["open-recent-file"]],
                registration: {
                    listenerType: "function",
                    registeredChannel: "open-recent-file",
                },
                unsubscribeResult: undefined,
            });
        });

        it("should register onSetTheme handler", () => {
            expect.assertions(1);

            const callback = vi.fn<IpcListener>();
            const unsubscribe = electronAPI.onSetTheme(callback) as () => void;

            expect(
                getIpcFallbackLifecycle({
                    callback,
                    channel: "set-theme",
                    eventArgs: ["dark"],
                    unsubscribe,
                })
            ).toStrictEqual({
                callbackCalls: [["dark"]],
                cleanupCalls: [["set-theme"]],
                registration: {
                    listenerType: "function",
                    registeredChannel: "set-theme",
                },
                unsubscribeResult: undefined,
            });
        });

        it("should register onUpdateEvent handler", () => {
            expect.assertions(2);

            const callback = vi.fn<IpcListener>();
            const unsubscribe = electronAPI.onUpdateEvent(
                "update-event",
                callback
            );
            expectIpcRegistration("update-event");
            expect(unsubscribe).toBeTypeOf("function");
        });

        it("should register onOpenSummaryColumnSelector handler", () => {
            expect.assertions(1);

            const callback = vi.fn<IpcListener>();
            const unsubscribe = electronAPI.onOpenSummaryColumnSelector(
                callback
            ) as () => void;

            expect(
                getIpcFallbackLifecycle({
                    callback,
                    channel: "open-summary-column-selector",
                    unsubscribe,
                })
            ).toStrictEqual({
                callbackCalls: [[]],
                cleanupCalls: [["open-summary-column-selector"]],
                registration: {
                    listenerType: "function",
                    registeredChannel: "open-summary-column-selector",
                },
                unsubscribeResult: undefined,
            });
        });
    });

    describe("constants exposure", () => {
        let electronAPI: PreloadElectronAPI;

        beforeEach(() => {
            electronAPI = getElectronAPI();
        });

        it("should expose getChannelInfo method", () => {
            expect.assertions(2);

            expect(electronAPI).toHaveProperty("getChannelInfo");
            expect(electronAPI.getChannelInfo()).toStrictEqual({
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: Object.keys(EXPECTED_PRELOAD_CHANNELS).length,
                totalEvents: Object.keys(EXPECTED_PRELOAD_EVENTS).length,
            });
        });

        it("should return channel info with proper structure", () => {
            expect.assertions(1);

            const channelInfo = electronAPI.getChannelInfo();

            expect(channelInfo).toStrictEqual({
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: Object.keys(EXPECTED_PRELOAD_CHANNELS).length,
                totalEvents: Object.keys(EXPECTED_PRELOAD_EVENTS).length,
            });
        });

        it("should include expected channel names", () => {
            expect.assertions(3);

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

    describe("development tools", () => {
        it("should expose developer tools in development mode", () => {
            expect.assertions(3);

            const devTools = getDevTools();

            expect(Object.keys(devTools)).toStrictEqual(
                EXPECTED_DEVTOOLS_METHODS
            );
            expect(Object.keys(devTools)).not.toContain("dangerousEval");
            expect({
                getPreloadInfo: typeof devTools.getPreloadInfo,
                logAPIState: typeof devTools.logAPIState,
                testIPC: typeof devTools.testIPC,
            }).toStrictEqual({
                getPreloadInfo: "function",
                logAPIState: "function",
                testIPC: "function",
            });
        });
    });

    describe("process integration", () => {
        it("should register beforeExit handler", () => {
            expect.assertions(3);

            expect(getBeforeExitRegistration()).toStrictEqual({
                eventName: "beforeExit",
                listenerType: "function",
            });
            expect(
                getMockCalls(mockProcess.once).map(([event]) => event)
            ).not.toContain("exit");
            expect(getElectronAPI().validateAPI()).toStrictEqual(true);
        });

        it("should log cleanup message on beforeExit", () => {
            expect.assertions(2);

            const beforeExitCall = getRequiredBeforeExitCall();
            const beforeExitCallback = beforeExitCall[1];

            beforeExitCallback();

            const cleanupLogs = getMockCalls(consoleLogSpy).filter((call) =>
                firstArgumentEquals(
                    call,
                    "[preload.js] Process exiting, performing cleanup..."
                )
            );

            expect(cleanupLogs).toEqual([
                ["[preload.js] Process exiting, performing cleanup..."],
            ]);
            expect(getMockCalls(mockProcess.removeListener)).toStrictEqual([
                ["beforeExit", beforeExitCallback],
            ]);
        });
    });

    describe("validation and logging", () => {
        it("should log API validation results", () => {
            expect.assertions(2);

            const validationLogs = getMockCalls(consoleLogSpy).filter((call) =>
                firstArgumentEquals(call, "[preload.js] API Validation:")
            );

            expect(validationLogs).toEqual([
                [
                    "[preload.js] API Validation:",
                    {
                        channelCount: Object.keys(EXPECTED_PRELOAD_CHANNELS)
                            .length,
                        eventCount: Object.keys(EXPECTED_PRELOAD_EVENTS).length,
                        hasContextBridge: true,
                        hasIpcRenderer: true,
                    },
                ],
            ]);
            expect(validationLogs[0][0]).not.toContain("failed");
        });

        it("should log successful API exposure", () => {
            expect.assertions(1);

            const exposureLogs = getMockCalls(consoleLogSpy).filter((call) =>
                firstArgumentEquals(
                    call,
                    "[preload.js] Successfully exposed electronAPI to main world"
                )
            );

            expect(exposureLogs).toEqual([
                ["[preload.js] Successfully exposed electronAPI to main world"],
            ]);
        });

        it("should log initialization completion", () => {
            expect.assertions(1);

            const initLogs = getMockCalls(consoleLogSpy).filter((call) =>
                firstArgumentEquals(
                    call,
                    "[preload.js] Preload script initialized successfully"
                )
            );

            expect(initLogs).toEqual([
                ["[preload.js] Preload script initialized successfully"],
            ]);
        });

        it("should validate API structure", () => {
            expect.assertions(1);

            const structureLogs = getMockCalls(consoleLogSpy).filter((call) =>
                firstArgumentEquals(call, "[preload.js] API Structure:")
            );

            expect(structureLogs).toEqual([
                [
                    "[preload.js] API Structure:",
                    {
                        methods: EXPECTED_ELECTRON_API_METHODS,
                        properties: [],
                        total: EXPECTED_ELECTRON_API_METHODS.length,
                    },
                ],
            ]);
        });
    });

    describe("api method implementation tests", () => {
        it("should test onUpdateEvent method implementation", () => {
            expect.assertions(4);

            const api = getElectronAPI();
            expect(api).toHaveProperty("onUpdateEvent");
            expect(api.onUpdateEvent).toBeTypeOf("function");

            const callback = vi.fn<IpcListener>();
            const eventName = "test-event";
            const unsubscribe = api.onUpdateEvent(eventName, callback);
            expectIpcRegistration(eventName);
            expect(unsubscribe).toBeTypeOf("function");
        });

        it("should test injectMenu method implementation", async () => {
            expect.assertions(4);

            const api = getElectronAPI();
            expect(api).toHaveProperty("injectMenu");
            expect(api.injectMenu).toBeTypeOf("function");

            const theme = "dark";
            const fitFilePath = "/path/to/file.fit";
            await expect(
                api.injectMenu(theme, fitFilePath)
            ).resolves.toStrictEqual(true);
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "devtools-inject-menu",
                theme,
                fitFilePath
            );
        });
    });

    describe("utility function tests", () => {
        it("should test getChannelInfo method", () => {
            expect.assertions(4);

            const api = getElectronAPI();
            expect(api).toHaveProperty("getChannelInfo");
            expect(api.getChannelInfo).toBeTypeOf("function");

            const channelInfo = api.getChannelInfo();
            expect(channelInfo).toEqual({
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: Object.keys(EXPECTED_PRELOAD_CHANNELS).length,
                totalEvents: Object.keys(EXPECTED_PRELOAD_EVENTS).length,
            });
            expect(channelInfo.channels).not.toHaveProperty("UNKNOWN_CHANNEL");
        });
    });

    describe("development tools tests", () => {
        it("should test getPreloadInfo function in development", () => {
            expect.assertions(3);

            const devTools = getDevTools();
            expect(devTools.getPreloadInfo).toBeTypeOf("function");
            const mockDate = new Date("2026-06-01T12:00:00.000Z");
            vi.useFakeTimers();
            vi.setSystemTime(mockDate);

            const info = devTools.getPreloadInfo();
            expect(info).toEqual({
                apiMethods: EXPECTED_ELECTRON_API_METHODS,
                constants: EXPECTED_PRELOAD_CONSTANTS,
                timestamp: mockDate.toISOString(),
                version: "1.0.0",
            });
            expect(info.apiMethods).not.toContain("__proto__");

            vi.useRealTimers();
        });

        it("should test testIPC function in development", async () => {
            expect.assertions(3);

            const devTools = getDevTools();
            expect(devTools.testIPC).toBeTypeOf("function");

            const initialInvokeCount =
                electronMock.ipcRenderer.invoke.mock.calls.length;
            await expect(devTools.testIPC()).resolves.toStrictEqual(true);
            expect(
                electronMock.ipcRenderer.invoke.mock.calls.length
            ).toBeGreaterThan(initialInvokeCount);
        });

        it("should test logAPIState function in development", () => {
            expect.assertions(4);

            const devTools = getDevTools();
            expect(devTools.logAPIState).toBeTypeOf("function");

            const initialLogCount = getMockCalls(consoleLogSpy).length;
            const result = devTools.logAPIState();

            expect({ returnValue: result }).toStrictEqual({
                returnValue: undefined,
            });
            expect(getMockCalls(consoleLogSpy).length).toBeGreaterThan(
                initialLogCount
            );

            const logCalls = getMockCalls(consoleLogSpy).slice(initialLogCount);
            expect(
                logCalls.some((call) =>
                    call.some(
                        (value) =>
                            typeof value === "string" &&
                            value.includes("API State")
                    )
                )
            ).toBe(true);
        });

        it("should expose all development tools in development mode", () => {
            expect.assertions(4);

            const devTools = getDevTools();
            expect({
                getPreloadInfo: typeof devTools.getPreloadInfo,
                logAPIState: typeof devTools.logAPIState,
                testIPC: typeof devTools.testIPC,
            }).toStrictEqual({
                getPreloadInfo: "function",
                logAPIState: "function",
                testIPC: "function",
            });
            expect(devTools.getPreloadInfo).toBeTypeOf("function");
            expect(devTools.logAPIState).toBeTypeOf("function");
            expect(devTools.testIPC).toBeTypeOf("function");
        });

        it("should handle development mode environment variable correctly", () => {
            expect.assertions(2);

            // Test that development tools are available when NODE_ENV is development
            expect(mockProcess.env.NODE_ENV).toBe("development");
            const devTools = getDevTools();
            expect(devTools.getPreloadInfo).toBeTypeOf("function");
        });
    });

    describe("api method testing", () => {
        let electronAPI: PreloadElectronAPI;

        beforeEach(() => {
            electronAPI = getElectronAPI();
        });

        it("should test getChannelInfo method", () => {
            expect.assertions(2);

            const channelInfo = electronAPI.getChannelInfo();

            expect(channelInfo).toEqual({
                channels: EXPECTED_PRELOAD_CHANNELS,
                events: EXPECTED_PRELOAD_EVENTS,
                totalChannels: Object.keys(EXPECTED_PRELOAD_CHANNELS).length,
                totalEvents: Object.keys(EXPECTED_PRELOAD_EVENTS).length,
            });
            expect(channelInfo.channels).not.toHaveProperty("UNKNOWN_CHANNEL");
        });

        it("should test injectMenu method", async () => {
            expect.assertions(2);

            // injectMenu expects theme and fitFilePath parameters, not menu items
            const theme = "dark";
            const fitFilePath = "/test/path.fit";

            // Mock the invoke to return success
            electronMock.ipcRenderer.invoke.mockResolvedValueOnce(true);

            await expect(
                electronAPI.injectMenu(theme, fitFilePath)
            ).resolves.toStrictEqual(true);
            expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
                "devtools-inject-menu",
                theme,
                fitFilePath
            );
        });

        it("should test onUpdateEvent method", () => {
            expect.assertions(4);

            const callback = vi.fn<IpcListener>();

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

            expect(
                electronMock.ipcRenderer.on.mock.calls.map(
                    ([eventName, listener]) => [eventName, typeof listener]
                )
            ).toEqual([
                ["update-available", "function"],
                ["update-downloaded", "function"],
                ["update-error", "function"],
            ]);
            expect(availableUnsubscribe).toBeTypeOf("function");
            expect(downloadedUnsubscribe).toBeTypeOf("function");
            expect(errorUnsubscribe).toBeTypeOf("function");
        });
    });

    describe("edge cases and error conditions", () => {
        let electronAPI: PreloadElectronAPI;

        beforeEach(() => {
            electronAPI = getElectronAPI();
        });

        it("should handle process beforeExit event", () => {
            expect.assertions(2);

            // We can't directly test process.emit, but we can verify the callback was registered
            // by checking if the beforeExit handler was set up in the existing tests
            const beforeExitCalls = getMockCalls(mockProcess.once).filter(
                isBeforeExitCall
            );

            expect(beforeExitCalls).toHaveLength(1);
            expect(beforeExitCalls[0][1]).toBeTypeOf("function");
        });
    });
});
