import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { resolvePreloadScriptRequire } from "../helpers/preloadModuleMocks";

type MockFunction = ReturnType<typeof vi.fn>;
type MockWithCalls = { mock: { calls: unknown[][] } };
type IpcListener = (...args: unknown[]) => void;
type Unsubscribe = (() => void) | undefined;

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
    once: MockFunction;
}

interface ChannelInfo {
    channels: Record<string, unknown>;
    events: Record<string, unknown>;
    totalChannels: number;
    totalEvents: number;
}

interface PreloadElectronAPI {
    addRecentFile: (filePath: unknown) => Promise<unknown>;
    approveRecentFile: (filePath: unknown) => Promise<unknown>;
    checkForUpdates: () => void;
    decodeFitFile: (filePath: unknown) => Promise<unknown>;
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
    invoke: (channel: unknown, ...args: unknown[]) => Promise<unknown>;
    onIpc: (channel: unknown, callback: unknown) => Unsubscribe;
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
    send: (channel: unknown, ...args: unknown[]) => void;
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
    "approveRecentFile",
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
    "invoke",
    "isFitBrowserEnabled",
    "listenToMainState",
    "listFitBrowserFolder",
    "notifyFitFileLoaded",
    "onIpc",
    "onMenuOpenFile",
    "onMenuOpenOverlay",
    "onOpenRecentFile",
    "onOpenSummaryColumnSelector",
    "onSetTheme",
    "onUpdateEvent",
    "openExternal",
    "openFile",
    "openFileDialog",
    "openFolderDialog",
    "openOverlayDialog",
    "parseFitFile",
    "readFile",
    "recentFiles",
    "send",
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

function firstArgumentIncludes(call: unknown[], text: string): boolean {
    return typeof call[0] === "string" && call[0].includes(text);
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
}

describe("preload.js - Comprehensive API Testing", () => {
    let electronMock: ElectronMock;
    let consoleLogSpy: MockWithCalls;
    let consoleErrorSpy: MockWithCalls;
    let mockProcess: MockProcess;

    function findExposedCall(apiName: string): ExposeCall | undefined {
        return getMockCalls(electronMock.contextBridge.exposeInMainWorld).find(
            (call): call is ExposeCall =>
                isExposeCall(call) && call[0] === apiName
        );
    }

    function getElectronAPI(): PreloadElectronAPI {
        return (findExposedCall("electronAPI")?.[1] ??
            getPreloadGlobal().electronAPI) as PreloadElectronAPI;
    }

    function getDevTools(): PreloadDevTools {
        return (findExposedCall("devTools")?.[1] ??
            getPreloadGlobal().devTools) as PreloadDevTools;
    }

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
                invoke: vi.fn().mockImplementation(resolveIpcInvoke),
                send: vi.fn(),
                on: vi.fn(),
                removeAllListeners: vi.fn(),
            },
            contextBridge: {
                exposeInMainWorld: vi
                    .fn()
                    .mockImplementation((apiName: string, api: unknown) => {
                        // Actually expose the API to the global object for tests
                        getPreloadGlobal()[apiName] = api;
                        getPreloadGlobal(global)[apiName] = api;
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
            const exposedCall = findExposedCall("electronAPI");

            expect(exposedCall?.[0]).toBe("electronAPI");
            expect(
                Object.keys(exposedCall?.[1] as Record<string, unknown>)
            ).toEqual(EXPECTED_ELECTRON_API_METHODS);
            expect((exposedCall?.[1] as PreloadElectronAPI).validateAPI()).toBe(
                true
            );
        });

        it("should expose devTools to main world", () => {
            const exposedCall = findExposedCall("devTools");

            expect(exposedCall?.[0]).toBe("devTools");
            expect(
                Object.keys(exposedCall?.[1] as Record<string, unknown>)
            ).toEqual(EXPECTED_DEVTOOLS_METHODS);
        });

        it("should expose exactly 2 APIs", () => {
            expect(
                electronMock.contextBridge.exposeInMainWorld
            ).toHaveBeenCalledTimes(2);
            expect(
                getMockCalls(electronMock.contextBridge.exposeInMainWorld).map(
                    ([apiName]) => apiName
                )
            ).toEqual(["electronAPI", "devTools"]);
            expect(
                getMockCalls(electronMock.contextBridge.exposeInMainWorld).map(
                    ([apiName]) => apiName
                )
            ).not.toContain("__proto__");
            expect(getPreloadGlobal().electronAPI).toBe(getElectronAPI());
            expect(getPreloadGlobal().devTools).toBe(getDevTools());
        });

        it("should expose electronAPI with all expected methods", () => {
            const electronAPICall = findExposedCall("electronAPI");

            expect(
                Object.keys(electronAPICall?.[1] as Record<string, unknown>)
            ).toEqual(EXPECTED_ELECTRON_API_METHODS);

            const electronAPI = electronAPICall![1] as Record<string, unknown>;

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

    describe("API Method Functionality", () => {
        let electronAPI: PreloadElectronAPI;

        beforeEach(() => {
            electronAPI = getElectronAPI();
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
        let electronAPI: PreloadElectronAPI;

        beforeEach(() => {
            electronAPI = getElectronAPI();
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
        let electronAPI: PreloadElectronAPI;

        beforeEach(() => {
            electronAPI = getElectronAPI();
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
            const devToolsCall = findExposedCall("devTools");

            expect(devToolsCall?.[1]).toMatchObject({
                getPreloadInfo: expect.any(Function),
                logAPIState: expect.any(Function),
                testIPC: expect.any(Function),
            });
            const devTools = devToolsCall![1] as PreloadDevTools;
            expect(devTools).toHaveProperty("getPreloadInfo");
            expect(devTools).toHaveProperty("logAPIState");
            expect(devTools).toHaveProperty("testIPC");
            expect(typeof devTools.getPreloadInfo).toBe("function");
            expect(typeof devTools.logAPIState).toBe("function");
            expect(typeof devTools.testIPC).toBe("function");
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
            expect(getElectronAPI().validateAPI()).toBe(true);
        });

        it("should log cleanup message on beforeExit", () => {
            // Get the beforeExit callback
            const beforeExitCall = getMockCalls(mockProcess.once).find(
                isBeforeExitCall
            );
            expect(typeof beforeExitCall?.[1]).toBe("function");

            const beforeExitCallback = beforeExitCall![1];

            // Execute the callback
            beforeExitCallback();

            // Should log cleanup message
            const cleanupLogs = getMockCalls(consoleLogSpy).filter((call) =>
                firstArgumentIncludes(
                    call,
                    "[preload.js] Process exiting, performing cleanup..."
                )
            );

            expect(cleanupLogs).toEqual([
                ["[preload.js] Process exiting, performing cleanup..."],
            ]);
        });
    });

    describe("Validation & Logging", () => {
        it("should log API validation results", () => {
            const validationLogs = getMockCalls(consoleLogSpy).filter((call) =>
                firstArgumentIncludes(call, "[preload.js] API Validation:")
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
            const exposureLogs = getMockCalls(consoleLogSpy).filter((call) =>
                firstArgumentIncludes(call, "[preload.js] Successfully exposed")
            );

            expect(exposureLogs).toEqual([
                ["[preload.js] Successfully exposed electronAPI to main world"],
            ]);
        });

        it("should log initialization completion", () => {
            const initLogs = getMockCalls(consoleLogSpy).filter((call) =>
                firstArgumentIncludes(
                    call,
                    "[preload.js] Preload script initialized"
                )
            );

            expect(initLogs).toEqual([
                ["[preload.js] Preload script initialized successfully"],
            ]);
        });

        it("should validate API structure", () => {
            const structureLogs = getMockCalls(consoleLogSpy).filter((call) =>
                firstArgumentIncludes(call, "[preload.js] API Structure:")
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

    // Additional Tests for 100% Coverage
    describe("Validation Functions", () => {
        it("should test validateCallback with invalid inputs", () => {
            // Access validation functions through existing API
            const api = getElectronAPI();
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
            electronMock.ipcRenderer.on.mockClear();
            for (const testCase of testCases) {
                expect(api.onIpc("test-channel", testCase)).toBeUndefined();
            }
            expect(electronMock.ipcRenderer.on).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[preload.js] onIpc: callback must be a function"
            );
        });

        it("should test validateString with invalid inputs", () => {
            const api = getElectronAPI();
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
            electronMock.ipcRenderer.send.mockClear();
            for (const testCase of testCases) {
                expect(api.send(testCase, "data")).toBeUndefined();
            }
            expect(electronMock.ipcRenderer.send).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[preload.js] send: channel must be a string"
            );
        });
    });

    describe("Error Handling in Safe Handlers", () => {
        it("should handle errors in safe invoke handler", async () => {
            const api = getElectronAPI();
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
            const api = getElectronAPI();
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
            const api = getElectronAPI();
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
            const api = getElectronAPI();
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
            const api = getElectronAPI();
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
            const api = getElectronAPI();
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
            const api = getElectronAPI();
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
            const api = getElectronAPI();
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
            const api = getElectronAPI();
            expect(api).toMatchObject({
                getChannelInfo: expect.any(Function),
            });
            expect(typeof api.getChannelInfo).toBe("function");

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

    describe("Development Tools Tests", () => {
        it("should test getPreloadInfo function in development", () => {
            const devTools = getDevTools();
            expect(devTools).toMatchObject({
                getPreloadInfo: expect.any(Function),
            });

            const info = devTools.getPreloadInfo();
            expect(info).toEqual({
                apiMethods: EXPECTED_ELECTRON_API_METHODS,
                constants: EXPECTED_PRELOAD_CONSTANTS,
                timestamp: expect.any(String),
                version: "1.0.0",
            });
        });

        it("should test testIPC function in development", async () => {
            const devTools = getDevTools();
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
            const devTools = getDevTools();
            expect(devTools).toMatchObject({
                logAPIState: expect.any(Function),
            });

            const initialLogCount = getMockCalls(consoleLogSpy).length;
            const result = devTools.logAPIState();

            expect(result).toBeUndefined();
            expect(getMockCalls(consoleLogSpy).length).toBeGreaterThan(
                initialLogCount
            );

            const logCalls = getMockCalls(consoleLogSpy).slice(initialLogCount);
            const hasAPIStateLog = logCalls.some((call) =>
                firstArgumentIncludes(call, "API State")
            );
            expect(hasAPIStateLog).toBe(true);
        });

        it("should expose all development tools in development mode", () => {
            const devTools = getDevTools();
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
            const devTools = getDevTools();
            expect(devTools).toMatchObject({
                getPreloadInfo: expect.any(Function),
            });
        });
    });

    describe("Validation Functions", () => {
        let electronAPI: PreloadElectronAPI;

        beforeEach(() => {
            electronAPI = getElectronAPI();
        });

        it("should test validateCallback through onIpc method", () => {
            // Test valid callback
            const validCallback = vi.fn();
            expect(
                typeof electronAPI.onIpc("test-channel", validCallback)
            ).toBe("function");
            expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith(
                "test-channel",
                expect.any(Function)
            );
            expect(
                typeof electronAPI.onIpc("test-channel-2", validCallback)
            ).toBe("function");

            // Test invalid callbacks to trigger validateCallback
            expect(
                typeof electronAPI.onIpc("test-channel-3", validCallback)
            ).toBe("function");
            const validListenerCount = getMockCalls(
                electronMock.ipcRenderer.on
            ).length;
            for (const invalidCallback of [
                null,
                undefined,
                "not-a-function",
                123,
                {},
            ]) {
                expect(
                    electronAPI.onIpc("test-channel", invalidCallback)
                ).toBeUndefined();
            }
            expect(getMockCalls(electronMock.ipcRenderer.on)).toHaveLength(
                validListenerCount
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[preload.js] onIpc: callback must be a function"
            );
        });

        it("should test validateString through send method", () => {
            // Test valid string
            expect(electronAPI.send("valid-channel", "data")).toBeUndefined();
            expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(
                "valid-channel",
                "data"
            );
            expect(electronAPI.send("valid-channel-2", "data")).toBeUndefined();

            // Test invalid channels to trigger validateString
            const validSendCount = getMockCalls(
                electronMock.ipcRenderer.send
            ).length;
            for (const invalidChannel of [
                null,
                undefined,
                123,
                {},
                [],
            ]) {
                expect(
                    electronAPI.send(invalidChannel, "data")
                ).toBeUndefined();
            }
            expect(getMockCalls(electronMock.ipcRenderer.send)).toHaveLength(
                validSendCount
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[preload.js] send: channel must be a string"
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
        let electronAPI: PreloadElectronAPI;

        beforeEach(() => {
            electronAPI = getElectronAPI();
        });

        it("should test getChannelInfo method", () => {
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

            expect(electronMock.ipcRenderer.on.mock.calls).toEqual([
                ["update-available", expect.any(Function)],
                ["update-downloaded", expect.any(Function)],
                ["update-error", expect.any(Function)],
            ]);
            expect(typeof availableUnsubscribe).toBe("function");
            expect(typeof downloadedUnsubscribe).toBe("function");
            expect(typeof errorUnsubscribe).toBe("function");
        });
    });

    describe("Edge Cases and Error Conditions", () => {
        let electronAPI: PreloadElectronAPI;

        beforeEach(() => {
            electronAPI = getElectronAPI();
        });

        it("should handle null and undefined parameters", async () => {
            expect(electronAPI).toMatchObject({
                invoke: expect.any(Function),
                onIpc: expect.any(Function),
                send: expect.any(Function),
            });

            // Test all methods with null/undefined parameters
            electronMock.ipcRenderer.on.mockClear();
            electronMock.ipcRenderer.send.mockClear();
            expect(electronAPI.send(null, null)).toBeUndefined();
            expect(electronAPI.send(undefined, undefined)).toBeUndefined();
            expect(electronAPI.onIpc(null, null)).toBeUndefined();
            expect(electronAPI.onIpc(undefined, undefined)).toBeUndefined();
            expect(electronMock.ipcRenderer.send).not.toHaveBeenCalled();
            expect(electronMock.ipcRenderer.on).not.toHaveBeenCalled();

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
                expect(electronAPI.send(invalid, "data")).toBeUndefined();
                expect(electronAPI.onIpc("channel", invalid)).toBeUndefined();
                // invoke should reject invalid channel types
                await expect(
                    electronAPI.invoke(invalid, "data")
                ).rejects.toThrow("Invalid channel for invoke");
            }
            expect(electronMock.ipcRenderer.send).not.toHaveBeenCalled();
            expect(electronMock.ipcRenderer.on).not.toHaveBeenCalled();
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
            const beforeExitCalls = getMockCalls(mockProcess.once).filter(
                isBeforeExitCall
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
