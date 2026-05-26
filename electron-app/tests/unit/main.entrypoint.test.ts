import { describe, expect, it, vi } from "vitest";

type Listener = (...args: unknown[]) => void;

type EventMap = Map<string, Set<Listener>>;

type WebContentsMock = {
    emit: (eventName: string, ...args: unknown[]) => boolean;
    executeJavaScript: ReturnType<
        typeof vi.fn<(script: string) => Promise<unknown>>
    >;
    isDestroyed: ReturnType<typeof vi.fn<() => boolean>>;
    on: ReturnType<
        typeof vi.fn<(eventName: string, listener: Listener) => void>
    >;
    removeAllListeners: ReturnType<typeof vi.fn<(eventName?: string) => void>>;
    send: ReturnType<
        typeof vi.fn<(channel: string, ...args: unknown[]) => void>
    >;
    session: {
        setPermissionCheckHandler: ReturnType<
            typeof vi.fn<(handler: Listener) => void>
        >;
        setPermissionRequestHandler: ReturnType<
            typeof vi.fn<(handler: Listener) => void>
        >;
    };
    setWindowOpenHandler: ReturnType<typeof vi.fn<(handler: Listener) => void>>;
};

type WindowMock = {
    close: ReturnType<typeof vi.fn<() => void>>;
    focus: ReturnType<typeof vi.fn<() => void>>;
    hide: ReturnType<typeof vi.fn<() => void>>;
    isDestroyed: ReturnType<typeof vi.fn<() => boolean>>;
    loadFile: ReturnType<typeof vi.fn<(filePath: string) => Promise<void>>>;
    on: ReturnType<
        typeof vi.fn<(eventName: string, listener: Listener) => void>
    >;
    setFullScreen: ReturnType<typeof vi.fn<(isFullScreen: boolean) => void>>;
    setMenuBarVisibility: ReturnType<
        typeof vi.fn<(isVisible: boolean) => void>
    >;
    show: ReturnType<typeof vi.fn<() => void>>;
    webContents: WebContentsMock;
};

type BrowserWindowMock = WindowMock & {
    fromWebContents: ReturnType<
        typeof vi.fn<(webContents: unknown) => WindowMock | null>
    >;
    getAllWindows: ReturnType<typeof vi.fn<() => WindowMock[]>>;
    getFocusedWindow: ReturnType<typeof vi.fn<() => WindowMock | null>>;
};

type AppMock = {
    emit: ReturnType<
        typeof vi.fn<(eventName: string, ...args: unknown[]) => boolean>
    >;
    getAppPath: ReturnType<typeof vi.fn<() => string>>;
    getVersion: ReturnType<typeof vi.fn<() => string>>;
    isPackaged: boolean;
    listenerCount: ReturnType<typeof vi.fn<(eventName: string) => number>>;
    on: ReturnType<
        typeof vi.fn<(eventName: string, listener: Listener) => void>
    >;
    quit: ReturnType<typeof vi.fn<() => void>>;
    removeAllListeners: ReturnType<typeof vi.fn<(eventName?: string) => void>>;
    removeListener: ReturnType<
        typeof vi.fn<(eventName: string, listener: Listener) => void>
    >;
    whenReady: ReturnType<typeof vi.fn<() => Promise<void>>>;
};

type IpcMainMock = {
    handle: ReturnType<
        typeof vi.fn<(channel: string, handler: Listener) => void>
    >;
    on: ReturnType<typeof vi.fn<(channel: string, listener: Listener) => void>>;
    removeAllListeners: ReturnType<typeof vi.fn<(eventName?: string) => void>>;
    removeHandler: ReturnType<typeof vi.fn<(channel: string) => void>>;
};

type AutoUpdaterMock = {
    autoDownload: boolean;
    checkForUpdates: ReturnType<typeof vi.fn<() => Promise<void>>>;
    checkForUpdatesAndNotify: ReturnType<typeof vi.fn<() => Promise<void>>>;
    emit: (eventName: string, ...args: unknown[]) => boolean;
    feedURL: undefined;
    logger: {
        error: ReturnType<typeof vi.fn<(message?: unknown) => void>>;
        info: ReturnType<typeof vi.fn<(message?: unknown) => void>>;
        transports: { file: { level: string } };
        warn: ReturnType<typeof vi.fn<(message?: unknown) => void>>;
    };
    on: ReturnType<
        typeof vi.fn<(eventName: string, listener: Listener) => void>
    >;
    quitAndInstall: ReturnType<typeof vi.fn<() => void>>;
    removeAllListeners: ReturnType<typeof vi.fn<(eventName?: string) => void>>;
};

type MainExports = {
    initializeApplication: () => Promise<unknown>;
    setupMainLifecycle: (dependencies: Record<string, unknown>) => void;
    validateWindow: (windowCandidate?: unknown, context?: string) => boolean;
};

type PlatformDescriptor = PropertyDescriptor | undefined;

const harness = vi.hoisted(() => {
    class MockEmitter {
        readonly handlers: EventMap = new Map();

        emit(eventName: string, ...args: unknown[]): boolean {
            const listeners = this.handlers.get(eventName);
            if (!listeners) {
                return false;
            }

            for (const listener of listeners) {
                listener(...args);
            }

            return listeners.size > 0;
        }

        listenerCount(eventName: string): number {
            return this.handlers.get(eventName)?.size ?? 0;
        }

        on(eventName: string, listener: Listener): void {
            const listeners = this.handlers.get(eventName) ?? new Set();
            listeners.add(listener);
            this.handlers.set(eventName, listeners);
        }

        removeAllListeners(eventName?: string): void {
            if (eventName) {
                this.handlers.delete(eventName);
                return;
            }

            this.handlers.clear();
        }

        removeListener(eventName: string, listener: Listener): void {
            this.handlers.get(eventName)?.delete(listener);
        }
    }

    const appEmitter = new MockEmitter();
    const autoUpdaterEmitter = new MockEmitter();
    const ipcMainEmitter = new MockEmitter();
    const windowEmitter = new MockEmitter();
    const webContentsEmitter = new MockEmitter();

    const webContents: WebContentsMock = {
        emit: (eventName, ...args) =>
            webContentsEmitter.emit(eventName, ...args),
        executeJavaScript: vi
            .fn<(script: string) => Promise<unknown>>()
            .mockResolvedValue("dark"),
        isDestroyed: vi.fn<() => boolean>(() => false),
        on: vi.fn<(eventName: string, listener: Listener) => void>(
            (eventName, listener) => {
                webContentsEmitter.on(eventName, listener);
            }
        ),
        removeAllListeners: vi.fn<(eventName?: string) => void>((eventName) => {
            webContentsEmitter.removeAllListeners(eventName);
        }),
        send: vi.fn<(channel: string, ...args: unknown[]) => void>(),
        session: {
            setPermissionCheckHandler: vi.fn<(handler: Listener) => void>(),
            setPermissionRequestHandler: vi.fn<(handler: Listener) => void>(),
        },
        setWindowOpenHandler: vi.fn<(handler: Listener) => void>(),
    };

    const mainWindow: WindowMock = {
        close: vi.fn<() => void>(),
        focus: vi.fn<() => void>(),
        hide: vi.fn<() => void>(),
        isDestroyed: vi.fn<() => boolean>(() => false),
        loadFile: vi
            .fn<(filePath: string) => Promise<void>>()
            .mockResolvedValue(undefined),
        on: vi.fn<(eventName: string, listener: Listener) => void>(
            (eventName, listener) => {
                windowEmitter.on(eventName, listener);
            }
        ),
        setFullScreen: vi.fn<(isFullScreen: boolean) => void>(),
        setMenuBarVisibility: vi.fn<(isVisible: boolean) => void>(),
        show: vi.fn<() => void>(),
        webContents,
    };

    const browserWindow = Object.assign(mainWindow, {
        fromWebContents: vi.fn<(candidate: unknown) => WindowMock | null>(
            () => mainWindow
        ),
        getAllWindows: vi.fn<() => WindowMock[]>(() => [mainWindow]),
        getFocusedWindow: vi.fn<() => WindowMock | null>(() => mainWindow),
    }) as BrowserWindowMock;
    Object.setPrototypeOf(browserWindow, Function.prototype);

    const app: AppMock = {
        emit: vi.fn<(eventName: string, ...args: unknown[]) => boolean>(
            (eventName, ...args) => appEmitter.emit(eventName, ...args)
        ),
        getAppPath: vi.fn<() => string>(() => "/test/app"),
        getVersion: vi.fn<() => string>(() => "1.0.0"),
        isPackaged: false,
        listenerCount: vi.fn<(eventName: string) => number>((eventName) =>
            appEmitter.listenerCount(eventName)
        ),
        on: vi.fn<(eventName: string, listener: Listener) => void>(
            (eventName, listener) => {
                appEmitter.on(eventName, listener);
            }
        ),
        quit: vi.fn<() => void>(),
        removeAllListeners: vi.fn<(eventName?: string) => void>((eventName) => {
            appEmitter.removeAllListeners(eventName);
        }),
        removeListener: vi.fn<(eventName: string, listener: Listener) => void>(
            (eventName, listener) => {
                appEmitter.removeListener(eventName, listener);
            }
        ),
        whenReady: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };

    const ipcMain: IpcMainMock = {
        handle: vi.fn<(channel: string, handler: Listener) => void>(
            (channel, handler) => {
                ipcMainEmitter.on(`handle:${channel}`, handler);
            }
        ),
        on: vi.fn<(channel: string, listener: Listener) => void>(
            (channel, listener) => {
                ipcMainEmitter.on(`on:${channel}`, listener);
            }
        ),
        removeAllListeners: vi.fn<(eventName?: string) => void>((eventName) => {
            ipcMainEmitter.removeAllListeners(eventName);
        }),
        removeHandler: vi.fn<(channel: string) => void>(),
    };

    const autoUpdater: AutoUpdaterMock = {
        autoDownload: true,
        checkForUpdates: vi
            .fn<() => Promise<void>>()
            .mockResolvedValue(undefined),
        checkForUpdatesAndNotify: vi
            .fn<() => Promise<void>>()
            .mockResolvedValue(undefined),
        emit: (eventName, ...args) =>
            autoUpdaterEmitter.emit(eventName, ...args),
        feedURL: undefined,
        logger: {
            error: vi.fn<(message?: unknown) => void>(),
            info: vi.fn<(message?: unknown) => void>(),
            transports: { file: { level: "info" } },
            warn: vi.fn<(message?: unknown) => void>(),
        },
        on: vi.fn<(eventName: string, listener: Listener) => void>(
            (eventName, listener) => {
                autoUpdaterEmitter.on(eventName, listener);
            }
        ),
        quitAndInstall: vi.fn<() => void>(),
        removeAllListeners: vi.fn<(eventName?: string) => void>((eventName) => {
            autoUpdaterEmitter.removeAllListeners(eventName);
        }),
    };

    const dialog = {
        showMessageBox: vi.fn<() => Promise<{ response: number }>>(
            async () => ({ response: 0 })
        ),
        showOpenDialog: vi.fn<
            () => Promise<{ canceled: boolean; filePaths: string[] }>
        >(async () => ({ canceled: false, filePaths: ["/test/file.fit"] })),
        showSaveDialog: vi.fn<
            () => Promise<{ canceled: boolean; filePath: string }>
        >(async () => ({ canceled: false, filePath: "/test/export.csv" })),
    };

    const menu = {
        buildFromTemplate: vi.fn<
            (template: unknown[]) => Record<string, never>
        >(() => ({})),
        getApplicationMenu: vi.fn<
            () => { getMenuItemById: (id: string) => { enabled: boolean } }
        >(() => ({
            getMenuItemById: () => ({ enabled: true }),
        })),
        setApplicationMenu: vi.fn<(menuValue: unknown) => void>(),
    };

    const session = {
        defaultSession: {
            webRequest: {
                onBeforeRequest:
                    vi.fn<
                        (
                            listener: (
                                details: { url?: unknown },
                                callback: (response: {
                                    cancel?: boolean;
                                }) => void
                            ) => void
                        ) => void
                    >(),
            },
        },
    };

    const shell = {
        openExternal: vi
            .fn<(url: string) => Promise<void>>()
            .mockResolvedValue(undefined),
    };

    const confConstructor = vi.fn<
        (options: { name: string }) => {
            get: (key: string, fallback?: unknown) => unknown;
            set: (key: string, value: unknown) => void;
        }
    >(() => ({
        get: (key, fallback) => (key === "theme" ? "dark" : fallback),
        set: () => undefined,
    }));

    const electronModule = {
        app,
        BrowserWindow: browserWindow,
        dialog,
        ipcMain,
        Menu: menu,
        session,
        shell,
    };

    const reset = (): void => {
        appEmitter.removeAllListeners();
        autoUpdaterEmitter.removeAllListeners();
        ipcMainEmitter.removeAllListeners();
        webContentsEmitter.removeAllListeners();
        windowEmitter.removeAllListeners();

        app.whenReady.mockResolvedValue(undefined);
        browserWindow.fromWebContents.mockReturnValue(mainWindow);
        browserWindow.getAllWindows.mockReturnValue([mainWindow]);
        browserWindow.getFocusedWindow.mockReturnValue(mainWindow);
        mainWindow.isDestroyed.mockReturnValue(false);
        webContents.executeJavaScript.mockResolvedValue("dark");
        webContents.isDestroyed.mockReturnValue(false);
    };

    return {
        app,
        autoUpdater,
        browserWindow,
        electronModule,
        ipcMain,
        mainWindow,
        menu,
        reset,
        session,
        webContents,
    };
});

vi.mock(import("electron"), () => harness.electronModule);

vi.mock(import("electron-updater"), () => ({
    autoUpdater: harness.autoUpdater,
}));

vi.mock(import("electron-conf"), () => ({
    Conf: harness.confConstructor,
}));

const originalPlatformDescriptor: PlatformDescriptor =
    Object.getOwnPropertyDescriptor(process, "platform");

function clearRuntimeTimers(): void {
    const keepalive = Reflect.get(globalThis, "__ffvTestKeepalive");
    if (keepalive) {
        clearInterval(keepalive as ReturnType<typeof setInterval>);
        Reflect.deleteProperty(globalThis, "__ffvTestKeepalive");
    }

    const retryTimers = Reflect.get(globalThis, "__ffvTestRetryTimers");
    if (Array.isArray(retryTimers)) {
        for (const timer of retryTimers as ReturnType<typeof setTimeout>[]) {
            clearTimeout(timer);
        }
        Reflect.deleteProperty(globalThis, "__ffvTestRetryTimers");
    }
}

function restorePlatform(): void {
    if (originalPlatformDescriptor) {
        Object.defineProperty(process, "platform", originalPlatformDescriptor);
    }
}

function resetHarness(): void {
    clearRuntimeTimers();
    vi.useFakeTimers();
    vi.clearAllMocks();
    harness.reset();
    process.env.NODE_ENV = "test";
    delete process.env.GYAZO_CLIENT_ID;
    delete process.env.GYAZO_CLIENT_SECRET;
    restorePlatform();
    Reflect.set(globalThis, "__electronHoistedMock", harness.electronModule);
}

function cleanupHarness(): void {
    clearRuntimeTimers();
    vi.clearAllTimers();
    vi.useRealTimers();
    process.env.NODE_ENV = "test";
    delete process.env.GYAZO_CLIENT_ID;
    delete process.env.GYAZO_CLIENT_SECRET;
    restorePlatform();
}

async function settleStartup(): Promise<void> {
    await vi.dynamicImportSettled();
    await vi.runOnlyPendingTimersAsync();
    await vi.dynamicImportSettled();
}

async function importMainWithEnvironment(
    nodeEnvironment: "development" | "production" | "test"
): Promise<MainExports> {
    vi.resetModules();
    process.env.NODE_ENV = nodeEnvironment;
    Reflect.set(globalThis, "__electronHoistedMock", harness.electronModule);

    const mainModule = (await import("../../main.js")) as MainExports;
    await settleStartup();

    return mainModule;
}

function setPlatform(platform: NodeJS.Platform): void {
    Object.defineProperty(process, "platform", {
        configurable: true,
        value: platform,
    });
}

describe("main.js entrypoint behavior", () => {
    it("wires startup, IPC, updater, and renderer events through the real entry point", async () => {
        expect.hasAssertions();

        resetHarness();

        try {
            const mainModule = await importMainWithEnvironment("test");
            harness.webContents.emit("did-finish-load");
            await settleStartup();

            harness.autoUpdater.emit("checking-for-update");
            harness.autoUpdater.emit("download-progress", { percent: 50 });
            harness.autoUpdater.emit("update-downloaded");
            harness.app.emit("before-quit", {
                preventDefault: vi.fn<() => void>(),
            });
            harness.app.emit("window-all-closed");
            harness.app.emit("activate");

            expect(mainModule.initializeApplication).toBeTypeOf("function");
            expect(mainModule.setupMainLifecycle).toBeTypeOf("function");
            expect(harness.app.whenReady).toHaveBeenCalledWith();
            expect(harness.browserWindow.getAllWindows).toHaveBeenCalledWith();
            expect(harness.ipcMain.handle.mock.calls.length).toBeGreaterThan(0);
            expect(harness.webContents.on).toHaveBeenCalledWith(
                "did-finish-load",
                expect.any(Function)
            );
            expect(harness.autoUpdater.on).toHaveBeenCalledWith(
                "checking-for-update",
                expect.any(Function)
            );
            expect(
                harness.autoUpdater.checkForUpdatesAndNotify.mock.calls.length
            ).toBeGreaterThan(0);
            expect(harness.webContents.send.mock.calls.length).toBeGreaterThan(
                0
            );
            expect(
                harness.session.defaultSession.webRequest.onBeforeRequest
            ).toHaveBeenCalledWith(expect.any(Function));
        } finally {
            cleanupHarness();
        }
    });

    it("covers platform startup and rejects unusable windows without throwing", async () => {
        expect.hasAssertions();

        resetHarness();

        try {
            for (const platform of [
                "linux",
                "darwin",
                "win32",
            ] as const) {
                setPlatform(platform);
                await importMainWithEnvironment("test");
            }

            harness.mainWindow.isDestroyed.mockReturnValue(true);
            harness.webContents.isDestroyed.mockReturnValue(true);
            harness.browserWindow.getAllWindows.mockReturnValue([
                harness.mainWindow,
            ]);

            const mainModule = await importMainWithEnvironment("test");

            expect(harness.app.whenReady.mock.calls.length).toBeGreaterThan(0);
            expect([
                mainModule.validateWindow(harness.mainWindow, "broken-window"),
            ]).toStrictEqual([false]);
            expect(harness.mainWindow.isDestroyed).toHaveBeenCalledWith();
            expect(harness.webContents.send).not.toHaveBeenCalledWith(
                "unexpected-channel"
            );
        } finally {
            cleanupHarness();
        }
    });
});
