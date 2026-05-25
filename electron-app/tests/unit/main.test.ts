/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Create mock window that the main.js initialization expects
const mockWindow = {
    isDestroyed: () => false,
    setFullScreen: vi.fn(),
    webContents: {
        executeJavaScript: vi.fn(() => Promise.resolve("dark")),
        isDestroyed: () => false,
        on: vi.fn(),
        send: vi.fn(),
    },
};

// Mock electron module before importing main.js
const mockElectron = {
    app: {
        getAppPath: vi.fn(() => "/mock/app/path"),
        getVersion: vi.fn(() => "1.0.0"),
        isPackaged: false,
        on: vi.fn(),
        quit: vi.fn(),
        whenReady: vi.fn(() => Promise.resolve()),
    },
    BrowserWindow: {
        getAllWindows: vi.fn<() => Array<typeof mockWindow>>(() => [
            mockWindow,
        ]),
        fromWebContents: vi.fn(),
        getFocusedWindow: vi.fn(() => null),
    },
    dialog: {
        showMessageBox: vi.fn(),
        showOpenDialog: vi.fn(),
        showSaveDialog: vi.fn(),
    },
    ipcMain: {
        handle: vi.fn(),
        on: vi.fn(),
        removeHandler: vi.fn(),
        removeListener: vi.fn(),
    },
    Menu: {
        getApplicationMenu: vi.fn(),
        setApplicationMenu: vi.fn(),
    },
    shell: {
        openExternal: vi.fn(),
    },
    session: {
        defaultSession: {
            webRequest: {
                onBeforeRequest: vi.fn(),
            },
        },
    },
};

// Mock auto-updater module
const mockAutoUpdater = {
    autoDownload: false,
    checkForUpdates: vi.fn(() => Promise.resolve()),
    downloadUpdate: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
    setFeedURL: vi.fn(),
};

// Mock server module
const mockServer = {
    listen: vi.fn(
        (
            port: number,
            hostOrCallback?: string | ((error?: Error) => void),
            callback?: (error?: Error) => void
        ) => {
            const readyCallback =
                typeof hostOrCallback === "function"
                    ? hostOrCallback
                    : callback;
            if (readyCallback) readyCallback();
            return mockServer;
        }
    ),
    on: vi.fn(),
    close: vi.fn(),
};

// Mock mainProcessState
const mockMainProcessState = {
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
};

// Mock fitParser
const mockFitParser = {
    parse: vi.fn(() => Promise.resolve({ success: true, data: {} })),
    decode: vi.fn(() => Promise.resolve({ success: true, data: {} })),
};

// Mock fs module
vi.mock("node:fs", () => ({
    default: {
        readFile: vi.fn(
            (
                path: string,
                callback: (error: Error | null, data?: Buffer) => void
            ) => {
                callback(null, Buffer.from("test file content"));
            }
        ),
        writeFile: vi.fn(),
        existsSync: vi.fn(() => true),
        createReadStream: vi.fn(),
        createWriteStream: vi.fn(),
    },
}));

// Mock http module
vi.mock("http", () => ({
    createServer: vi.fn(() => mockServer),
    default: {
        createServer: vi.fn(() => mockServer),
    },
}));

vi.mock("node:http", () => ({
    createServer: vi.fn(() => mockServer),
    default: {
        createServer: vi.fn(() => mockServer),
    },
}));

// Mock electron-updater
vi.mock("electron-updater", () => ({
    autoUpdater: mockAutoUpdater,
}));

// Mock path module
vi.mock("node:path", () => ({
    default: {
        join: vi.fn((...args: string[]) => args.join("/")),
        dirname: vi.fn(() => "/mock/dirname"),
        resolve: vi.fn((...args: string[]) => args.join("/")),
        extname: vi.fn(() => ".fit"),
        basename: vi.fn(() => "test.fit"),
    },
}));

// Mock crypto module
vi.mock("node:crypto", () => ({
    default: {
        randomBytes: vi.fn(() => Buffer.from("random")),
        createHash: vi.fn(() => ({
            update: vi.fn(),
            digest: vi.fn(() => "hash"),
        })),
    },
}));

// Mock child_process module
vi.mock("node:child_process", () => ({
    default: {
        exec: vi.fn(),
        spawn: vi.fn(),
    },
}));

// Mock os module
vi.mock("node:os", () => ({
    default: {
        platform: vi.fn(() => "test"),
        homedir: vi.fn(() => "/home/test"),
        tmpdir: vi.fn(() => "/tmp"),
    },
}));

// Mock url module
vi.mock("node:url", () => ({
    default: {
        parse: vi.fn(),
        format: vi.fn(),
    },
}));

// Mock util module
vi.mock("node:util", () => ({
    default: {
        promisify: vi.fn<<T>(fn: T) => T>((fn) => fn),
    },
}));

// Mock mainProcessState
vi.mock("../../../utils/state/mainProcessState.js", () => ({
    default: mockMainProcessState,
}));

// Mock fitParser
vi.mock("../../fitParser.js", () => ({
    default: mockFitParser,
}));

// Mock all utility modules
vi.mock("../../../utils/files/recentFiles.js", () => ({
    default: {
        get: vi.fn(() => []),
        add: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
    },
}));

const expectedMainExportKeys = [
    "CONSTANTS",
    "default",
    "ensureFitParserStateIntegration",
    "exposeDevHelpers",
    "getAppState",
    "getThemeFromRenderer",
    "initializeApplication",
    "isWindowUsable",
    "logWithContext",
    "resolveAutoUpdaterAsync",
    "resolveAutoUpdaterSync",
    "sendToRenderer",
    "setAppState",
    "setupApplicationEventHandlers",
    "setupAutoUpdater",
    "setupIPCHandlers",
    "setupMainLifecycle",
    "setupMenuAndEventHandlers",
    "startGyazoOAuthServer",
    "stopGyazoOAuthServer",
    "validateWindow",
];

type MainModule = {
    CONSTANTS: {
        DEFAULT_THEME: string;
        PLATFORMS: Record<string, string>;
    };
    getAppState: (key: string) => unknown;
    initializeApplication: (...args: unknown[]) => unknown;
    isWindowUsable: (window: unknown) => boolean;
    setAppState: (key: string, value: unknown) => void;
    setupAutoUpdater: (window: unknown, updater: unknown) => void;
    startGyazoOAuthServer: (...args: unknown[]) => unknown;
    stopGyazoOAuthServer: () => Promise<unknown>;
    validateWindow: (window: unknown, context: string) => boolean;
};

type MainImport = {
    default: MainModule;
};

type TimerHandle = ReturnType<typeof setTimeout>;

type TestGlobals = typeof globalThis & {
    __electronHoistedMock?: typeof mockElectron;
    __ffvGyazoStartupTimer?: TimerHandle;
    __ffvTestKeepalive?: TimerHandle;
    __ffvTestRetryTimers?: TimerHandle[];
    devHelpers?: {
        cleanupEventHandlers?: unknown;
        getAppState?: unknown;
        logState?: unknown;
        rebuildMenu?: unknown;
    };
};

const testGlobals = globalThis as TestGlobals;

async function importMainModule(): Promise<MainModule> {
    const imported = (await import("../../main.js")) as unknown as MainImport;
    return imported.default;
}

function getRegisteredIpcHandler(channel: string) {
    const registration = mockElectron.ipcMain.handle.mock.calls.find(
        ([registeredChannel]) => registeredChannel === channel
    );
    return registration?.[1];
}

function resetMockImplementations() {
    mockWindow.isDestroyed = () => false;
    mockWindow.setFullScreen.mockReset();
    mockWindow.webContents.executeJavaScript.mockReset();
    mockWindow.webContents.executeJavaScript.mockResolvedValue("dark");
    mockWindow.webContents.isDestroyed = () => false;
    mockWindow.webContents.on.mockReset();
    mockWindow.webContents.send.mockReset();

    mockElectron.app.getAppPath.mockReset();
    mockElectron.app.getAppPath.mockReturnValue("/mock/app/path");
    mockElectron.app.getVersion.mockReset();
    mockElectron.app.getVersion.mockReturnValue("1.0.0");
    mockElectron.app.isPackaged = false;
    mockElectron.app.on.mockReset();
    mockElectron.app.quit.mockReset();
    mockElectron.app.whenReady.mockReset();
    mockElectron.app.whenReady.mockResolvedValue(undefined);

    mockElectron.BrowserWindow.getAllWindows.mockReset();
    mockElectron.BrowserWindow.getAllWindows.mockReturnValue([mockWindow]);
    mockElectron.BrowserWindow.fromWebContents.mockReset();
    mockElectron.BrowserWindow.getFocusedWindow.mockReset();
    mockElectron.BrowserWindow.getFocusedWindow.mockReturnValue(null);

    mockElectron.dialog.showMessageBox.mockReset();
    mockElectron.dialog.showOpenDialog.mockReset();
    mockElectron.dialog.showSaveDialog.mockReset();
    mockElectron.ipcMain.handle.mockReset();
    mockElectron.ipcMain.on.mockReset();
    mockElectron.ipcMain.removeHandler.mockReset();
    mockElectron.ipcMain.removeListener.mockReset();
    mockElectron.Menu.getApplicationMenu.mockReset();
    mockElectron.Menu.setApplicationMenu.mockReset();
    mockElectron.shell.openExternal.mockReset();
    mockElectron.session.defaultSession.webRequest.onBeforeRequest.mockReset();

    mockAutoUpdater.autoDownload = false;
    mockAutoUpdater.checkForUpdates.mockReset();
    mockAutoUpdater.checkForUpdates.mockResolvedValue(undefined);
    mockAutoUpdater.downloadUpdate.mockReset();
    mockAutoUpdater.downloadUpdate.mockResolvedValue(undefined);
    mockAutoUpdater.on.mockReset();
    mockAutoUpdater.setFeedURL.mockReset();

    mockServer.listen.mockReset();
    mockServer.listen.mockImplementation(
        (
            port: number,
            hostOrCallback?: string | ((error?: Error) => void),
            callback?: (error?: Error) => void
        ) => {
            const readyCallback =
                typeof hostOrCallback === "function"
                    ? hostOrCallback
                    : callback;
            if (readyCallback) readyCallback();
            return mockServer;
        }
    );
    mockServer.on.mockReset();
    mockServer.close.mockReset();
}

describe("main.js - Electron Main Process", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        resetMockImplementations();

        // Reset environment
        process.env.NODE_ENV = "test";
        delete process.env.GYAZO_CLIENT_ID;
        delete process.env.GYAZO_CLIENT_SECRET;

        // Setup globalThis for hoisted mock support
        testGlobals.__electronHoistedMock = mockElectron;

        // Reset mainProcessState to fresh state
        mockMainProcessState.get.mockReturnValue(undefined);
        mockMainProcessState.set.mockReturnValue(undefined);

        // Provide a mock window to trigger full initialization
        mockElectron.BrowserWindow.getAllWindows.mockReturnValue([mockWindow]);
    });

    afterEach(() => {
        vi.clearAllMocks();
        delete testGlobals.__electronHoistedMock;
        delete testGlobals.devHelpers;
        const keepalive = testGlobals.__ffvTestKeepalive;
        if (keepalive) {
            clearInterval(keepalive);
        }
        delete testGlobals.__ffvTestKeepalive;
        const retryTimers = testGlobals.__ffvTestRetryTimers;
        if (Array.isArray(retryTimers)) {
            for (const timer of retryTimers) {
                clearTimeout(timer);
            }
        }
        delete testGlobals.__ffvTestRetryTimers;
        const gyazoTimer = testGlobals.__ffvGyazoStartupTimer;
        if (gyazoTimer) {
            clearTimeout(gyazoTimer);
        }
        delete testGlobals.__ffvGyazoStartupTimer;

        // Clear the main module from cache to reset its state
        const mainPath = require.resolve("../../main.js");
        if (require.cache[mainPath]) {
            delete require.cache[mainPath];
        }
    });

    describe("Module Import and Basic Tests", () => {
        it("should import main.js without errors", async () => {
            const mainModule = await importMainModule();

            expect(Object.keys(mainModule).sort()).toEqual(
                expectedMainExportKeys
            );
            expect(mainModule.CONSTANTS.DEFAULT_THEME).toBe("dark");
            expect(mainModule.initializeApplication).toBeTypeOf("function");
        });

        it("should handle test environment initialization", async () => {
            const mainModule = await importMainModule();
            const loadHandler = mockWindow.webContents.on.mock.calls.find(
                ([eventName]) => eventName === "did-finish-load"
            );

            expect(mainModule.getAppState("mainWindow")).toBe(mockWindow);
            expect(loadHandler?.[0]).toBe("did-finish-load");
            expect(loadHandler?.[1]).toBeTypeOf("function");
        });

        it("should handle missing electron gracefully", async () => {
            // Clear the hoisted mock to trigger error path
            delete testGlobals.__electronHoistedMock;

            const mainModule = await importMainModule();

            expect(mainModule.CONSTANTS.DEFAULT_THEME).toBe("dark");
            expect(mainModule.isWindowUsable(null)).toBe(false);
        });

        it("should handle state management during early sync path", async () => {
            const mainModule = await importMainModule();

            mainModule.setAppState("loadedFitFilePath", "/activities/test.fit");

            expect(mainModule.getAppState("loadedFitFilePath")).toBe(
                "/activities/test.fit"
            );
            mainModule.setAppState("loadedFitFilePath", null);
            expect(mainModule.getAppState("loadedFitFilePath")).toBeNull();
        });

        it("should complete early sync path when window exists", async () => {
            // Mock an existing window scenario
            mockElectron.BrowserWindow.getAllWindows.mockReturnValue([
                mockWindow,
            ]);

            const mainModule = await importMainModule();

            expect(mainModule.getAppState("mainWindow")).toBe(mockWindow);
            expect(mainModule.validateWindow(mockWindow, "unit test")).toBe(
                true
            );
        });
    });

    describe("Error Handling", () => {
        it("should handle initialization errors gracefully", async () => {
            // Mock an initialization error
            mockElectron.app.whenReady.mockImplementation(() => {
                throw new Error("Initialization failed");
            });

            const mainModule = await importMainModule();

            expect(mainModule.isWindowUsable(mockWindow)).toBe(true);
            expect(mainModule.getAppState("mainWindow")).toBe(mockWindow);
        });

        it("should handle window enumeration errors", async () => {
            // Mock window enumeration error
            mockElectron.BrowserWindow.getAllWindows.mockImplementation(() => {
                throw new Error("Window enumeration failed");
            });

            const mainModule = await importMainModule();
            const fallbackWindow = mainModule.getAppState("mainWindow");

            expect(fallbackWindow).not.toBe(mockWindow);
            expect(mainModule.isWindowUsable(fallbackWindow)).toBe(true);
        });

        it("should handle auto-updater setup errors", async () => {
            const mainModule = await importMainModule();
            const warnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const invalidUpdater = { autoDownload: false };

            mainModule.setupAutoUpdater(mockWindow, invalidUpdater);

            expect(invalidUpdater.autoDownload).toBe(false);
            expect(warnSpy).toHaveBeenCalledWith(
                "Cannot setup auto-updater: autoUpdater.on is not a function"
            );
        });

        it("should handle stopping when no Gyazo server exists", async () => {
            const mainModule = await importMainModule();

            await expect(mainModule.stopGyazoOAuthServer()).resolves.toEqual({
                message: "No server was running",
                success: true,
            });
            expect(mainModule.getAppState("gyazoServer")).toBeNull();
        });
    });

    describe("Development Features", () => {
        it("should not expose development helpers in test environment", async () => {
            const mainModule = await importMainModule();

            // Development helpers should not be available in test environment
            expect(testGlobals.devHelpers).toBeUndefined();
            expect(mainModule.getAppState("mainWindow")).toBe(mockWindow);
        });

        it("should handle development flag", async () => {
            // Mock command line arguments
            const originalArgv = process.argv;
            process.argv = [
                "node",
                "app.js",
                "--dev",
            ];

            try {
                await importMainModule();

                expect(testGlobals.devHelpers).toMatchObject({
                    cleanupEventHandlers: expect.any(Function),
                    getAppState: expect.any(Function),
                    logState: expect.any(Function),
                    rebuildMenu: expect.any(Function),
                });
            } finally {
                process.argv = originalArgv;
            }
        });
    });

    describe("Platform Compatibility", () => {
        it("should handle different platforms", async () => {
            const mainModule = await importMainModule();
            const warnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const destroyedWindow = {
                isDestroyed: () => true,
                webContents: {
                    isDestroyed: () => false,
                },
            };

            expect(
                Object.values(mainModule.CONSTANTS.PLATFORMS).sort()
            ).toEqual([
                "darwin",
                "linux",
                "win32",
            ]);
            expect(
                mainModule.validateWindow(destroyedWindow, "destroyed window")
            ).toBe(false);
            expect(warnSpy.mock.calls[0]?.[0]).toContain(
                "Window validation failed during destroyed window"
            );
            expect(
                JSON.parse(warnSpy.mock.calls[0]?.[1] as string)
            ).toMatchObject({
                hasWindow: true,
                isDestroyed: true,
            });
        });

        it("should handle file operations", async () => {
            await importMainModule();
            const fileReadHandler = getRegisteredIpcHandler("file:read");

            expect(fileReadHandler).toBeTypeOf("function");
            await expect(fileReadHandler({}, "")).rejects.toThrow(
                "Invalid file path provided"
            );
        });
    });

    describe("Gyazo OAuth Server", () => {
        it("should handle missing Gyazo environment variables", async () => {
            // Ensure no Gyazo environment variables
            delete process.env.GYAZO_CLIENT_ID;
            delete process.env.GYAZO_CLIENT_SECRET;

            const mainModule = await importMainModule();

            expect(mainModule.startGyazoOAuthServer).toBeTypeOf("function");
            expect(mainModule.stopGyazoOAuthServer).toBeTypeOf("function");
            expect(testGlobals.__ffvGyazoStartupTimer).toBeUndefined();
            await expect(mainModule.stopGyazoOAuthServer()).resolves.toEqual({
                message: "No server was running",
                success: true,
            });
        });
    });

    describe("Security Features", () => {
        it("should handle web security setup", async () => {
            await importMainModule();
            const requestHandler =
                mockElectron.session.defaultSession.webRequest.onBeforeRequest
                    .mock.calls[0]?.[0];
            const blockedCallback = vi.fn();
            const allowedCallback = vi.fn();

            expect(requestHandler).toBeTypeOf("function");
            requestHandler(
                { url: "https://ua.harryonline.net/script.js" },
                blockedCallback
            );
            requestHandler(
                { url: "https://example.com/app.js" },
                allowedCallback
            );
            expect(blockedCallback).toHaveBeenCalledWith({ cancel: true });
            expect(allowedCallback).toHaveBeenCalledWith({});
        });

        it("should handle URL validation", async () => {
            await importMainModule();
            const openExternalHandler =
                getRegisteredIpcHandler("shell:openExternal");

            expect(openExternalHandler).toBeTypeOf("function");
            await expect(openExternalHandler({}, "not-a-url")).rejects.toThrow(
                "Invalid URL provided"
            );
            await expect(
                openExternalHandler({}, "https://example.com")
            ).resolves.toBe(true);
            expect(mockElectron.shell.openExternal).toHaveBeenCalledWith(
                "https://example.com"
            );
        });
    });
});
