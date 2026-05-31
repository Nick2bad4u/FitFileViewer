// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";

type MockWindow = {
    isDestroyed: () => boolean;
    setFullScreen: Mock<(fullscreen: boolean) => void>;
    webContents: {
        executeJavaScript: Mock<(script?: string) => Promise<string>>;
        isDestroyed: () => boolean;
        on: Mock<
            (eventName: string, listener: (...args: unknown[]) => void) => void
        >;
        send: Mock<(channel: string, ...args: unknown[]) => void>;
    };
};

type MockServer = {
    close: Mock<(callback?: () => void) => void>;
    listen: Mock<
        (
            port: number,
            hostOrCallback?: string | ((error?: Error) => void),
            callback?: (error?: Error) => void
        ) => MockServer
    >;
    on: Mock<
        (eventName: string, listener: (...args: unknown[]) => void) => void
    >;
};

// Create mock window that the main.js initialization expects
const mockWindow: MockWindow = {
    isDestroyed: () => false,
    setFullScreen: vi.fn<(fullscreen: boolean) => void>(),
    webContents: {
        executeJavaScript: vi
            .fn<(script?: string) => Promise<string>>()
            .mockResolvedValue("dark"),
        isDestroyed: () => false,
        on: vi.fn<
            (eventName: string, listener: (...args: unknown[]) => void) => void
        >(),
        send: vi.fn<(channel: string, ...args: unknown[]) => void>(),
    },
};

// Mock electron module before importing main.js
const mockElectron = {
    app: {
        getAppPath: vi.fn<() => string>().mockReturnValue("/mock/app/path"),
        getVersion: vi.fn<() => string>().mockReturnValue("1.0.0"),
        isPackaged: false,
        on: vi.fn<
            (eventName: string, listener: (...args: unknown[]) => void) => void
        >(),
        quit: vi.fn<() => void>(),
        whenReady: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    },
    BrowserWindow: {
        getAllWindows: vi.fn<() => Array<typeof mockWindow>>(() => [
            mockWindow,
        ]),
        fromWebContents: vi.fn<(webContents: unknown) => MockWindow | null>(),
        getFocusedWindow: vi
            .fn<() => MockWindow | null>()
            .mockReturnValue(null),
    },
    dialog: {
        showMessageBox: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
        showOpenDialog: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
        showSaveDialog: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    },
    ipcMain: {
        handle: vi.fn<
            (channel: string, listener: (...args: unknown[]) => unknown) => void
        >(),
        on: vi.fn<
            (channel: string, listener: (...args: unknown[]) => void) => void
        >(),
        removeHandler: vi.fn<(channel: string) => void>(),
        removeListener:
            vi.fn<
                (
                    channel: string,
                    listener: (...args: unknown[]) => void
                ) => void
            >(),
    },
    Menu: {
        getApplicationMenu: vi.fn<() => unknown>(),
        setApplicationMenu: vi.fn<(menu: unknown) => void>(),
    },
    shell: {
        openExternal: vi.fn<(url: string) => Promise<void>>(),
    },
    session: {
        defaultSession: {
            webRequest: {
                onBeforeRequest:
                    vi.fn<
                        (
                            listener: (
                                details: { url: string },
                                callback: (
                                    response: Record<string, unknown>
                                ) => void
                            ) => void
                        ) => void
                    >(),
            },
        },
    },
};

// Mock auto-updater module
const mockAutoUpdater = {
    autoDownload: false,
    checkForUpdates: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    downloadUpdate: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    on: vi.fn<
        (eventName: string, listener: (...args: unknown[]) => void) => void
    >(),
    setFeedURL: vi.fn<(options: unknown) => void>(),
};

// Mock server module
const mockServer: MockServer = {
    listen: vi.fn<
        (
            port: number,
            hostOrCallback?: string | ((error?: Error) => void),
            callback?: (error?: Error) => void
        ) => MockServer
    >(
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
    on: vi.fn<
        (eventName: string, listener: (...args: unknown[]) => void) => void
    >(),
    close: vi.fn<(callback?: () => void) => void>(),
};

// Mock mainProcessState
const mockMainProcessState = {
    get: vi.fn<(key: string) => unknown>(),
    set: vi.fn<(key: string, value: unknown) => void>(),
    has: vi.fn<(key: string) => boolean>(),
    delete: vi.fn<(key: string) => boolean>(),
    clear: vi.fn<() => void>(),
};

// Mock fitParser
const mockFitParser = {
    parse: vi
        .fn<
            (
                buffer?: unknown
            ) => Promise<{ data: Record<string, unknown>; success: true }>
        >()
        .mockResolvedValue({ success: true, data: {} }),
    decode: vi
        .fn<
            (
                buffer?: unknown
            ) => Promise<{ data: Record<string, unknown>; success: true }>
        >()
        .mockResolvedValue({ success: true, data: {} }),
};

// Mock fs module
vi.mock(import("node:fs"), () => ({
    default: {
        readFile: vi.fn<
            (
                filePath: string,
                callback: (error: Error | null, data?: Buffer) => void
            ) => void
        >(
            (
                filePath: string,
                callback: (error: Error | null, data?: Buffer) => void
            ) => {
                callback(null, Buffer.from("test file content"));
            }
        ),
        writeFile: vi.fn<(...args: unknown[]) => void>(),
        existsSync: vi
            .fn<(filePath: string) => boolean>()
            .mockReturnValue(true),
        createReadStream: vi.fn<(filePath: string) => unknown>(),
        createWriteStream: vi.fn<(filePath: string) => unknown>(),
    },
}));

// Mock http module
vi.mock(import("http"), () => ({
    createServer: vi.fn<(...args: unknown[]) => MockServer>(() => mockServer),
    default: {
        createServer: vi.fn<(...args: unknown[]) => MockServer>(
            () => mockServer
        ),
    },
}));

vi.mock(import("node:http"), () => ({
    createServer: vi.fn<(...args: unknown[]) => MockServer>(() => mockServer),
    default: {
        createServer: vi.fn<(...args: unknown[]) => MockServer>(
            () => mockServer
        ),
    },
}));

// Mock electron-updater
vi.mock(import("electron-updater"), () => ({
    autoUpdater: mockAutoUpdater,
}));

// Mock path module
vi.mock(import("node:path"), () => ({
    default: {
        join: vi.fn<(...args: string[]) => string>((...args) => args.join("/")),
        dirname: vi.fn<(filePath: string) => string>(() => "/mock/dirname"),
        resolve: vi.fn<(...args: string[]) => string>((...args) =>
            args.join("/")
        ),
        extname: vi.fn<(filePath: string) => string>(() => ".fit"),
        basename: vi.fn<(filePath: string) => string>(() => "test.fit"),
    },
}));

// Mock crypto module
vi.mock(import("node:crypto"), () => ({
    default: {
        randomBytes: vi.fn<(size: number) => Buffer>(() =>
            Buffer.from("random")
        ),
        createHash: vi.fn<
            (algorithm: string) => {
                digest: Mock<(encoding?: string) => string>;
                update: Mock<(data: unknown) => unknown>;
            }
        >(() => ({
            update: vi.fn<(data: unknown) => unknown>(),
            digest: vi.fn<(encoding?: string) => string>(() => "hash"),
        })),
    },
}));

// Mock child_process module
vi.mock(import("node:child_process"), () => ({
    default: {
        exec: vi.fn<(...args: unknown[]) => unknown>(),
        spawn: vi.fn<(...args: unknown[]) => unknown>(),
    },
}));

// Mock os module
vi.mock(import("node:os"), () => ({
    default: {
        platform: vi.fn<() => string>(() => "test"),
        homedir: vi.fn<() => string>(() => "/home/test"),
        tmpdir: vi.fn<() => string>(() => "/tmp"),
    },
}));

// Mock url module
vi.mock(import("node:url"), () => ({
    default: {
        parse: vi.fn<(...args: unknown[]) => unknown>(),
        format: vi.fn<(...args: unknown[]) => string>(),
    },
}));

// Mock util module
vi.mock(import("node:util"), () => ({
    default: {
        promisify: vi.fn<<T>(fn: T) => T>((fn) => fn),
    },
}));

// Mock mainProcessState
vi.mock(import("../../electron-app/utils/state/mainProcessState.js"), () => ({
    default: mockMainProcessState,
}));

// Mock fitParser
vi.mock(import("../../electron-app/fitParser.js"), () => ({
    default: mockFitParser,
}));

// Mock all utility modules
vi.mock(import("../../electron-app/utils/files/recentFiles.js"), () => ({
    default: {
        get: vi.fn<() => unknown[]>(() => []),
        add: vi.fn<(filePath: string) => void>(),
        remove: vi.fn<(filePath: string) => void>(),
        clear: vi.fn<() => void>(),
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
    const imported =
        (await import("../../electron-app/main.js")) as unknown as MainImport;
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
        const mainPath = require.resolve("../../electron-app/main.js");
        if (require.cache[mainPath]) {
            delete require.cache[mainPath];
        }
    });

    describe("module import and basic tests", () => {
        it("should import main.js without errors", async () => {
            expect.assertions(3);

            const mainModule = await importMainModule();

            expect(Object.keys(mainModule).sort()).toEqual(
                expectedMainExportKeys
            );
            expect(mainModule.CONSTANTS.DEFAULT_THEME).toBe("dark");
            expect(mainModule.initializeApplication).toBeTypeOf("function");
        });

        it("should handle test environment initialization", async () => {
            expect.assertions(3);

            const mainModule = await importMainModule();
            const loadHandler = mockWindow.webContents.on.mock.calls.find(
                ([eventName]) => eventName === "did-finish-load"
            );

            expect(mainModule.getAppState("mainWindow")).toBe(mockWindow);
            expect(loadHandler?.[0]).toBe("did-finish-load");
            expect(loadHandler?.[1]).toBeTypeOf("function");
        });

        it("should handle missing electron gracefully", async () => {
            expect.assertions(2);

            // Clear the hoisted mock to trigger error path
            delete testGlobals.__electronHoistedMock;

            const mainModule = await importMainModule();

            expect(mainModule.CONSTANTS.DEFAULT_THEME).toBe("dark");
            expect(mainModule.isWindowUsable(null)).toStrictEqual(false);
        });

        it("should handle state management during early sync path", async () => {
            expect.assertions(2);

            const mainModule = await importMainModule();

            mainModule.setAppState("loadedFitFilePath", "/activities/test.fit");

            expect(mainModule.getAppState("loadedFitFilePath")).toBe(
                "/activities/test.fit"
            );
            mainModule.setAppState("loadedFitFilePath", null);
            expect(mainModule.getAppState("loadedFitFilePath")).toBeNull();
        });

        it("should complete early sync path when window exists", async () => {
            expect.assertions(2);

            // Mock an existing window scenario
            mockElectron.BrowserWindow.getAllWindows.mockReturnValue([
                mockWindow,
            ]);

            const mainModule = await importMainModule();

            expect(mainModule.getAppState("mainWindow")).toBe(mockWindow);
            expect(
                mainModule.validateWindow(mockWindow, "unit test")
            ).toStrictEqual(true);
        });
    });

    describe("error handling", () => {
        it("should handle initialization errors gracefully", async () => {
            expect.assertions(2);

            // Mock an initialization error
            mockElectron.app.whenReady.mockImplementation(() => {
                throw new Error("Initialization failed");
            });

            const mainModule = await importMainModule();

            expect(mainModule.isWindowUsable(mockWindow)).toStrictEqual(true);
            expect(mainModule.getAppState("mainWindow")).toBe(mockWindow);
        });

        it("should handle window enumeration errors", async () => {
            expect.assertions(2);

            // Mock window enumeration error
            mockElectron.BrowserWindow.getAllWindows.mockImplementation(() => {
                throw new Error("Window enumeration failed");
            });

            const mainModule = await importMainModule();
            const fallbackWindow = mainModule.getAppState("mainWindow");

            expect(fallbackWindow).not.toBe(mockWindow);
            expect(mainModule.isWindowUsable(fallbackWindow)).toStrictEqual(
                true
            );
        });

        it("should handle auto-updater setup errors", async () => {
            expect.assertions(2);

            const mainModule = await importMainModule();
            const warnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const invalidUpdater = { autoDownload: false };

            mainModule.setupAutoUpdater(mockWindow, invalidUpdater);

            expect(invalidUpdater).toMatchObject({ autoDownload: false });
            expect(warnSpy).toHaveBeenCalledWith(
                "Cannot setup auto-updater: autoUpdater.on is not a function"
            );
        });

        it("should handle stopping when no Gyazo server exists", async () => {
            expect.assertions(2);

            const mainModule = await importMainModule();

            await expect(mainModule.stopGyazoOAuthServer()).resolves.toEqual({
                message: "No server was running",
                success: true,
            });
            expect(mainModule.getAppState("gyazoServer")).toBeNull();
        });
    });

    describe("development features", () => {
        it("should not expose development helpers in test environment", async () => {
            expect.assertions(2);

            const mainModule = await importMainModule();

            // Development helpers should not be available in test environment
            expect(testGlobals).not.toHaveProperty("devHelpers");
            expect(mainModule.getAppState("mainWindow")).toBe(mockWindow);
        });

        it("should handle development flag", async () => {
            expect.assertions(1);

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

    describe("platform compatibility", () => {
        it("should handle different platforms", async () => {
            expect.assertions(4);

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
            ).toStrictEqual(false);
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
            expect.assertions(2);

            await importMainModule();
            const fileReadHandler = getRegisteredIpcHandler("file:read");

            expect(fileReadHandler).toBeTypeOf("function");
            await expect(fileReadHandler({}, "")).rejects.toThrow(
                "Invalid file path provided"
            );
        });
    });

    describe("gyazo OAuth server", () => {
        it("should handle missing Gyazo environment variables", async () => {
            expect.assertions(4);

            // Ensure no Gyazo environment variables
            delete process.env.GYAZO_CLIENT_ID;
            delete process.env.GYAZO_CLIENT_SECRET;

            const mainModule = await importMainModule();

            expect(mainModule.startGyazoOAuthServer).toBeTypeOf("function");
            expect(mainModule.stopGyazoOAuthServer).toBeTypeOf("function");
            expect(testGlobals).not.toHaveProperty("__ffvGyazoStartupTimer");
            await expect(mainModule.stopGyazoOAuthServer()).resolves.toEqual({
                message: "No server was running",
                success: true,
            });
        });
    });

    describe("security features", () => {
        it("should handle web security setup", async () => {
            expect.assertions(3);

            await importMainModule();
            const requestHandler =
                mockElectron.session.defaultSession.webRequest.onBeforeRequest
                    .mock.calls[0]?.[0];
            const blockedCallback =
                vi.fn<(response: Record<string, unknown>) => void>();
            const allowedCallback =
                vi.fn<(response: Record<string, unknown>) => void>();

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
            expect.assertions(4);

            await importMainModule();
            const openExternalHandler =
                getRegisteredIpcHandler("shell:openExternal");

            expect(openExternalHandler).toBeTypeOf("function");
            await expect(openExternalHandler({}, "not-a-url")).rejects.toThrow(
                "Invalid URL provided"
            );
            await expect(
                openExternalHandler({}, "https://example.com")
            ).resolves.toStrictEqual(true);
            expect(mockElectron.shell.openExternal).toHaveBeenCalledWith(
                "https://example.com"
            );
        });
    });
});
