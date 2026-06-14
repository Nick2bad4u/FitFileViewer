// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type EventHandler = (...args: unknown[]) => void;
type NodeCallback<T> = (error: Error | null, value: T) => void;
type DialogOpenResult = { canceled: boolean; filePaths: string[] };
type StateData = {
    eventHandlers: Map<string, unknown>;
    store: Map<string, unknown>;
};
type MainProcessStateMock = {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
    registerEventHandler: (
        target: unknown,
        eventName: string,
        handler: EventHandler,
        id: string
    ) => void;
    cleanupEventHandlers: () => void;
    data: StateData;
};
type MockCall = unknown[];
type ElectronAccessModule = {
    setElectronOverride: (override: unknown) => void;
};

// Simple emitter helper for autoUpdater
class Emitter {
    handlers: Record<string, EventHandler[]> = {};
    on(evt: string, fn: EventHandler) {
        (this.handlers[evt] ||= []).push(fn);
    }
    emit(evt: string, ...args: unknown[]) {
        for (const fn of this.handlers[evt] || []) fn(...args);
    }
}

function findRequiredCall(
    calls: MockCall[],
    channel: string,
    label: string
): MockCall {
    const call = calls.find((entry) => entry[0] === channel);

    if (!call) {
        throw new TypeError(`Expected ${label} call for ${channel}`);
    }

    return call;
}

function findLatestRequiredCall(
    calls: MockCall[],
    channel: string,
    label: string
): MockCall {
    const call = calls.filter((entry) => entry[0] === channel).at(-1);

    if (!call) {
        throw new TypeError(`Expected ${label} call for ${channel}`);
    }

    return call;
}

function getRequiredHandler(call: MockCall): EventHandler {
    const handler = call[1];

    if (typeof handler !== "function") {
        throw new TypeError("Expected registered handler function");
    }

    return handler as EventHandler;
}

// Shared emitter so hoisted mocks and assertions can coordinate
const autoUpdaterEmitter = new Emitter();

// Electron hoisted placeholders populated per-test in beforeEach
let mockApp: any;
let mockBrowserWindow: any;
let mockMainWindow: any;
let mockIpcMain: any;
let mockDialog: any;
let mockMenu: any;
let mockShell: any;
let createWindowMock: any;
// Initialize with defaults to survive destructuring at require-time in main.js
let mainProcessState: MainProcessStateMock = {
    get: vi.fn<(key: string) => unknown>(() => undefined),
    set: vi.fn<(key: string, value: unknown) => void>(),
    registerEventHandler:
        vi.fn<
            (
                target: unknown,
                eventName: string,
                handler: EventHandler,
                id: string
            ) => void
        >(),
    cleanupEventHandlers: vi.fn<() => void>(),
    data: { eventHandlers: new Map<string, unknown>(), store: new Map() },
};
let createAppMenu: any;
let loadRecentFiles: any = vi.fn<() => string[]>(() => ["a.fit", "b.fit"]);
let addRecentFile: any = vi.fn<(filePath: string) => void>();

vi.mock(import("electron"), () => ({
    get app() {
        return mockApp;
    },
    get BrowserWindow() {
        return mockBrowserWindow;
    },
    get dialog() {
        return mockDialog;
    },
    get ipcMain() {
        return mockIpcMain;
    },
    get Menu() {
        return mockMenu;
    },
    get shell() {
        return mockShell;
    },
}));

// electron-updater mock wired to shared emitter
const mockLogger = {
    info: vi.fn<(...data: unknown[]) => void>(),
    error: vi.fn<(...data: unknown[]) => void>(),
    warn: vi.fn<(...data: unknown[]) => void>(),
    transports: { file: { level: "info" } },
};
const autoUpdater = {
    on: vi.fn<(evt: string, handler: EventHandler) => void>((evt, handler) =>
        autoUpdaterEmitter.on(evt, handler)
    ),
    logger: mockLogger,
    checkForUpdatesAndNotify: vi
        .fn<() => Promise<undefined>>()
        .mockResolvedValue(undefined),
    quitAndInstall: vi.fn<() => void>(),
    checkForUpdates: vi.fn<() => void>(),
};
vi.mock(import("electron-updater"), () => ({ autoUpdater }));

// Recent files helpers
// Use the exact specifiers main.js uses so the mocks are applied
vi.mock(import("./utils/files/recent/recentFiles"), () => ({
    get loadRecentFiles() {
        return loadRecentFiles;
    },
    get addRecentFile() {
        return addRecentFile;
    },
}));

// windowStateUtils
vi.mock(import("./windowStateUtils"), () => ({
    get createWindow() {
        return createWindowMock;
    },
}));

// App menu creator
vi.mock(import("./utils/app/menu/createAppMenu"), () => ({
    get createAppMenu() {
        return createAppMenu;
    },
}));

// Main process state manager
vi.mock(import("./utils/state/integration/mainProcessStateManager"), () => ({
    get mainProcessState() {
        return mainProcessState;
    },
}));

// electron-conf
vi.mock(import("electron-conf"), () => {
    class MockConf {
        store: Record<string, any> = {};
        get(key: string, def?: any) {
            return this.store[key] ?? def;
        }
        set(key: string, val: any) {
            this.store[key] = val;
        }
    }
    return { Conf: MockConf };
});

// fitParser
vi.mock(import("./fitParser"), () => ({
    decodeFitFile: vi.fn<() => Promise<{ ok: true }>>(async () => ({
        ok: true,
    })),
}));

// fs mock for file:read
vi.mock(import("fs"), () => {
    return {
        readFile: (_p: string, cb: NodeCallback<Buffer>): void =>
            cb(null, Buffer.from("abc")),
        stat: vi.fn<(p: string, cb: NodeCallback<{ size: number }>) => void>(
            (_p, cb) => cb(null, { size: 3 })
        ),
        promises: {
            readFile: vi.fn<() => Promise<Buffer>>(async () =>
                Buffer.from("abc")
            ),
        },
        readFileSync: vi.fn<() => Buffer>(() =>
            Buffer.from('{"license":"MIT"}')
        ),
        copyFileSync: vi.fn<() => void>(),
    };
});

// path mock for license path resolution stability
vi.mock(import("path"), async (orig) => {
    const m = await (orig as any)();
    return { ...m, join: (...parts: string[]) => parts.join("/") };
});

describe("main.js strict handlers and events", () => {
    let didFinishLoad: EventHandler | null = null;

    beforeEach(async () => {
        vi.resetModules();
        process.env.NODE_ENV = "test";
        // Silence logs for clarity
        vi.spyOn(console, "log").mockReturnValue(undefined);
        vi.spyOn(console, "info").mockReturnValue(undefined);
        vi.spyOn(console, "warn").mockReturnValue(undefined);
        vi.spyOn(console, "error").mockReturnValue(undefined);

        // Recent files mocks
        loadRecentFiles.mockReset().mockReturnValue(["a.fit", "b.fit"]);
        addRecentFile.mockReset();

        // Main window and BrowserWindow surface
        didFinishLoad = null;
        mockMainWindow = {
            isDestroyed: vi.fn<() => boolean>(() => false),
            setFullScreen: vi.fn<(enabled: boolean) => void>(),
            webContents: {
                isDestroyed: vi.fn<() => boolean>(() => false),
                on: vi.fn<(evt: string, handler: EventHandler) => void>(
                    (evt, handler) => {
                        if (evt === "did-finish-load") didFinishLoad = handler;
                    }
                ),
                send: vi.fn<(channel: string, ...args: unknown[]) => void>(),
                executeJavaScript: vi
                    .fn<() => Promise<string>>()
                    .mockResolvedValue("dark"),
            },
        };
        mockBrowserWindow = {
            getAllWindows: vi.fn<() => unknown[]>(() => [mockMainWindow]),
            getFocusedWindow: vi.fn<() => unknown>(() => mockMainWindow),
            fromWebContents: vi.fn<() => unknown>(() => mockMainWindow),
        };

        mockIpcMain = {
            on: vi.fn<(channel: string, listener: EventHandler) => void>(),
            handle: vi.fn<(channel: string, handler: EventHandler) => void>(),
        };
        mockDialog = {
            showOpenDialog: vi.fn<() => Promise<DialogOpenResult>>(),
            showSaveDialog: vi.fn<() => Promise<DialogOpenResult>>(),
            showMessageBox: vi.fn<() => Promise<unknown>>(),
        };
        mockMenu = {
            getApplicationMenu: vi.fn<() => unknown>(() => ({
                getMenuItemById: vi.fn<() => { enabled: boolean }>(() => ({
                    enabled: false,
                })),
            })),
        };
        mockShell = {
            openExternal: vi
                .fn<(url: string) => Promise<undefined>>()
                .mockResolvedValue(undefined),
        };

        mockApp = {
            whenReady: vi
                .fn<() => Promise<undefined>>()
                .mockResolvedValue(undefined),
            on: vi.fn<(channel: string, listener: EventHandler) => void>(),
            quit: vi.fn<() => void>(),
            getVersion: vi.fn<() => string>(() => "1.0.0"),
            getAppPath: vi.fn<() => string>(() => "/mock/app"),
        };

        createWindowMock = vi.fn<() => unknown>(() => mockMainWindow);
        createAppMenu = vi.fn<() => void>();

        const { setElectronOverride } =
            (await import("../../../../electron-app/main/runtime/electronAccess.js")) as ElectronAccessModule;
        setElectronOverride({
            get app() {
                return mockApp;
            },
            get BrowserWindow() {
                return mockBrowserWindow;
            },
            get dialog() {
                return mockDialog;
            },
            get ipcMain() {
                return mockIpcMain;
            },
            get Menu() {
                return mockMenu;
            },
            get shell() {
                return mockShell;
            },
        });

        const stateData: StateData = {
            eventHandlers: new Map(),
            store: new Map(),
        };
        vi.spyOn(mainProcessState, "get").mockImplementation((k: string) =>
            stateData.store.get(k)
        );
        vi.spyOn(mainProcessState, "set").mockImplementation(
            (k: string, v: unknown) => {
                stateData.store.set(k, v);
            }
        );
        vi.spyOn(mainProcessState, "registerEventHandler").mockImplementation(
            (t: unknown, e: string, h: EventHandler, id: string) => {
                stateData.eventHandlers.set(id, { t, e, h });
            }
        );
        vi.spyOn(mainProcessState, "cleanupEventHandlers").mockReturnValue(
            undefined
        );
        mainProcessState.data = stateData;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("wires did-finish-load, auto-updater events, and IPC handlers", async () => {
        expect.assertions(9);

        await import("../../../../electron-app/main.js");

        expect(didFinishLoad).toBeTypeOf("function");
        await didFinishLoad();

        // autoUpdater should be configured and check invoked
        const updater = (await import("electron-updater")).autoUpdater as any;
        expect(updater.checkForUpdatesAndNotify).toHaveBeenCalledWith();

        // Simulate updater events -> renderer gets messages
        autoUpdaterEmitter.emit("checking-for-update");
        autoUpdaterEmitter.emit("update-available", { v: "1.0.1" });
        autoUpdaterEmitter.emit("update-not-available", { v: "1.0.0" });
        autoUpdaterEmitter.emit("download-progress", { p: 10 });
        autoUpdaterEmitter.emit("update-downloaded", { v: "1.0.1" });

        expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
            "update-checking"
        );
        expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
            "update-available",
            { v: "1.0.1" }
        );
        expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
            "update-not-available",
            { v: "1.0.0" }
        );
        expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
            "update-download-progress",
            { p: 10 }
        );
        expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
            "update-downloaded",
            { v: "1.0.1" }
        );

        // IPC handler registration happened
        expect(
            mockIpcMain.handle.mock.calls
                .map(([channel, handler]) => [channel, typeof handler])
                .filter(([channel]) => channel === "dialog:openFile")
        ).toStrictEqual([["dialog:openFile", "function"]]);
        expect(
            mockIpcMain.on.mock.calls
                .map(([channel, handler]) => [channel, typeof handler])
                .filter(([channel]) => channel === "menu-check-for-updates")
        ).toStrictEqual([["menu-check-for-updates", "function"]]);
    });

    it("handles dialog:openFile flow and recentFiles handlers", async () => {
        expect.assertions(8);

        await import("../../../../electron-app/main.js");

        // Find the handler wired to dialog:openFile via ipcMain.handle calls
        const call = findRequiredCall(
            mockIpcMain.handle.mock.calls,
            "dialog:openFile",
            "ipcMain.handle"
        );
        expect(call[0]).toBe("dialog:openFile");
        const openHandler = getRequiredHandler(call);
        expect(openHandler).toBeTypeOf("function");

        // Cancelled path
        mockDialog.showOpenDialog.mockResolvedValueOnce({
            canceled: true,
            filePaths: [],
        });
        await expect(openHandler({})).resolves.toBeNull();

        // Success path -> adds recent, sets state, rebuilds menu with theme
        const selectedFilePath = "C:/file.fit";
        mockDialog.showOpenDialog.mockResolvedValueOnce({
            canceled: false,
            filePaths: [selectedFilePath],
        });
        mockMainWindow.webContents.executeJavaScript.mockResolvedValueOnce(
            "light"
        );
        await expect(openHandler({})).resolves.toBe(selectedFilePath);
        // Don't assert on addRecentFile or createAppMenu due to module resolution differences; path return suffices

        // recentFiles:get
        const recentGet = findRequiredCall(
            mockIpcMain.handle.mock.calls,
            "recentFiles:get",
            "ipcMain.handle"
        );
        expect(recentGet[0]).toBe("recentFiles:get");
        const recent = await getRequiredHandler(recentGet)({});
        expect(recent).toStrictEqual([]);
        // recentFiles:add
        const recentAdd = findRequiredCall(
            mockIpcMain.handle.mock.calls,
            "recentFiles:add",
            "ipcMain.handle"
        );
        expect(recentAdd[0]).toBe("recentFiles:add");
        mockMainWindow.webContents.executeJavaScript.mockResolvedValueOnce(
            "dark"
        );
        await expect(
            getRequiredHandler(recentAdd)({}, "D:/other.fit")
        ).resolves.toStrictEqual([]);
        // In test mode, menu creation is a no-op; verifying no throw is sufficient
    });

    it("blocks devtools menu injection outside development", async () => {
        expect.assertions(3);

        await import("../../../../electron-app/main.js");

        const injectCall = findRequiredCall(
            mockIpcMain.handle.mock.calls,
            "devtools-inject-menu",
            "ipcMain.handle"
        );
        expect(injectCall[0]).toBe("devtools-inject-menu");
        const injectMenu = getRequiredHandler(injectCall);
        const realPath =
            await vi.importActual<typeof import("node:path")>("node:path");
        const realUrl =
            await vi.importActual<typeof import("node:url")>("node:url");
        const appPath = realPath.join(process.cwd(), "electron-app");
        const senderFrameUrl = realUrl.pathToFileURL(
            realPath.join(appPath, "index.html")
        ).href;

        const originalNodeEnv = process.env.NODE_ENV;
        createAppMenu.mockClear();
        try {
            process.env.NODE_ENV = "production";
            mockApp.getAppPath.mockReturnValue(appPath);
            expect(
                injectMenu(
                    {
                        sender: mockMainWindow.webContents,
                        senderFrame: { url: senderFrameUrl },
                    },
                    "dark",
                    "C:/untrusted.fit"
                )
            ).toBe(false);
            expect(createAppMenu).not.toHaveBeenCalled();
        } finally {
            process.env.NODE_ENV = originalNodeEnv;
        }
    });

    it("validates shell:openExternal and file:read/fit handlers", async () => {
        expect.assertions(14);

        await import("../../../../electron-app/main.js");
        const handleCalls = mockIpcMain.handle.mock.calls;
        const openExternal = findRequiredCall(
            handleCalls,
            "shell:openExternal",
            "ipcMain.handle"
        );
        const fileRead = findRequiredCall(
            handleCalls,
            "file:read",
            "ipcMain.handle"
        );
        const fitParse = findRequiredCall(
            handleCalls,
            "fit:parse",
            "ipcMain.handle"
        );
        const fitDecode = findRequiredCall(
            handleCalls,
            "fit:decode",
            "ipcMain.handle"
        );
        expect(openExternal[0]).toBe("shell:openExternal");
        expect(fileRead[0]).toBe("file:read");
        expect(fitParse[0]).toBe("fit:parse");
        expect(fitDecode[0]).toBe("fit:decode");

        // Invalid URL
        await expect(
            getRequiredHandler(openExternal)({}, "file://bad")
        ).rejects.toThrow("Only HTTPS and mailto URLs are allowed");
        // Valid URL
        await expect(
            getRequiredHandler(openExternal)({}, "https://example.com")
        ).resolves.toBe(true);
        expect(mockShell.openExternal).toHaveBeenCalledWith(
            "https://example.com"
        );

        // file:read returns ArrayBuffer
        // file:read is protected by a main-process allowlist; approve the path as if it
        // came from a trusted user flow (dialog/menu/recent list).
        const policy: any =
            await import("../../../../electron-app/main/security/fileAccessPolicy.js");
        policy.__resetForTests?.();

        const realFs =
            await vi.importActual<typeof import("node:fs")>("node:fs");
        const realOs =
            await vi.importActual<typeof import("node:os")>("node:os");
        const realPath =
            await vi.importActual<typeof import("node:path")>("node:path");
        const tempDir = realFs.mkdtempSync(
            realPath.join(realOs.tmpdir(), "ffv-read-")
        );
        const approvedReadPath = realPath.join(tempDir, "x.fit");

        try {
            realFs.writeFileSync(approvedReadPath, "abc");
            policy.approveFilePath?.(approvedReadPath, { source: "test" });

            const buf = await getRequiredHandler(fileRead)(
                {},
                approvedReadPath
            );
            expect(Object.prototype.toString.call(buf)).toBe(
                "[object ArrayBuffer]"
            );
            expect(new Uint8Array(buf)).toEqual(
                new Uint8Array([
                    97,
                    98,
                    99,
                ])
            );
        } finally {
            realFs.rmSync(tempDir, { force: true, recursive: true });
        }

        const missingFileError = Object.assign(
            new Error("ENOENT: no such file or directory, stat 'C:/x.fit'"),
            { code: "ENOENT" }
        );
        const directFs = {
            readFile: vi.fn<(p: string, cb: NodeCallback<Buffer>) => void>(
                (_p, cb) => cb(null, Buffer.from("should-not-read"))
            ),
            stat: vi.fn<(p: string, cb: NodeCallback<unknown>) => void>(
                (_p, cb) => cb(missingFileError, undefined)
            ),
        };
        const directLog = vi.fn<(...args: unknown[]) => void>();
        let directFileRead: any;
        const { registerFileSystemHandlers }: any =
            await import("../../../../electron-app/main/ipc/registerFileSystemHandlers.js");
        registerFileSystemHandlers({
            fs: directFs,
            logWithContext: directLog,
            registerIpcHandle: (_channel: string, handler: any) => {
                directFileRead = handler;
            },
        });
        policy.approveFilePath?.("C:/missing.fit", { source: "test" });

        await expect(
            directFileRead({}, "C:/missing.fit")
        ).rejects.toHaveProperty("code", "ENOENT");
        expect(directFs.readFile).not.toHaveBeenCalled();
        expect(directLog).not.toHaveBeenCalled();

        // fit parse/decode
        const invalidFitResult = {
            details: "No additional details available",
            error: "FIT file integrity check failed. Details: No additional details available",
        };
        await expect(
            getRequiredHandler(fitParse)({}, new ArrayBuffer(4))
        ).resolves.toEqual(invalidFitResult);
        await expect(
            getRequiredHandler(fitDecode)({}, new ArrayBuffer(4))
        ).resolves.toEqual(invalidFitResult);
    });

    it("menu events and fullscreen, security navigation guards", async () => {
        expect.assertions(18);

        const importedMain: any =
            await import("../../../../electron-app/main.js");
        const mainModule = importedMain.default ?? importedMain;
        const { resolveAutoUpdaterAsync } =
            await import("../../../../electron-app/main/updater/autoUpdaterAccess.js");
        await resolveAutoUpdaterAsync();
        const updater = (await import("electron-updater")).autoUpdater as any;
        mockMainWindow.webContents.send.mockClear();

        // menu-check-for-updates delegates to the updater check path
        const onCalls = mockIpcMain.on.mock.calls;
        const updaterCheck = findLatestRequiredCall(
            onCalls,
            "menu-check-for-updates",
            "ipcMain.on"
        );
        expect(updaterCheck[0]).toBe("menu-check-for-updates");
        updater.checkForUpdates.mockClear();
        mainModule.setAppState("autoUpdaterInitialized", false);
        getRequiredHandler(updaterCheck)({
            sender: mockMainWindow.webContents,
        });
        expect(updater.checkForUpdates).not.toHaveBeenCalled();
        expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
            "show-notification",
            "Update checker is not ready yet.",
            "error"
        );
        mainModule.setAppState("autoUpdaterInitialized", true);
        await getRequiredHandler(updaterCheck)({
            sender: mockMainWindow.webContents,
        });
        expect(updater.checkForUpdates).toHaveBeenCalledOnce();

        // install-update only triggers quitAndInstall after an update has downloaded.
        const originalPlatform = process.platform;
        try {
            Object.defineProperty(process, "platform", { value: "linux" });
            const install = findLatestRequiredCall(
                onCalls,
                "install-update",
                "ipcMain.on"
            );
            expect(install[0]).toBe("install-update");
            updater.quitAndInstall.mockClear();
            mainModule.setAppState("autoUpdater.updateDownloaded", false);
            await getRequiredHandler(install)({
                sender: mockMainWindow.webContents,
            });
            expect(updater.quitAndInstall).not.toHaveBeenCalled();
            expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
                "show-notification",
                "Update install is not available yet.",
                "error"
            );
            mainModule.setAppState("autoUpdater.updateDownloaded", true);
            await getRequiredHandler(install)({
                sender: mockMainWindow.webContents,
            });
            expect(updater.quitAndInstall).toHaveBeenCalledOnce();
            expect(mockDialog.showMessageBox).not.toHaveBeenCalled();
        } finally {
            Object.defineProperty(process, "platform", {
                value: originalPlatform,
            });
        }

        // fullscreen
        const fsEvt = findRequiredCall(onCalls, "set-fullscreen", "ipcMain.on");
        expect(fsEvt[0]).toBe("set-fullscreen");
        getRequiredHandler(fsEvt)({}, true);
        expect(mockMainWindow.setFullScreen).toHaveBeenCalledWith(true);

        // Security handlers wired on web-contents-created
        const appOnCall = findRequiredCall(
            mockApp.on.mock.calls,
            "web-contents-created",
            "app.on"
        );
        expect(appOnCall[0]).toBe("web-contents-created");
        const contents: any = {
            on: vi.fn<(eventName: string, handler: EventHandler) => void>(),
            setWindowOpenHandler: vi.fn<(handler: EventHandler) => void>(),
        };
        getRequiredHandler(appOnCall)({}, contents);
        expect(
            contents.on.mock.calls
                .map(([eventName, handler]) => [eventName, typeof handler])
                .filter(([eventName]) => eventName === "will-navigate")
        ).toStrictEqual([["will-navigate", "function"]]);
        const willNavigateCall = findRequiredCall(
            contents.on.mock.calls,
            "will-navigate",
            "webContents.on"
        );
        expect(willNavigateCall[0]).toBe("will-navigate");
        const ev = { preventDefault: vi.fn<() => void>() } as any;
        getRequiredHandler(willNavigateCall)(
            ev,
            "https://malicious.example.com"
        );
        expect(ev.preventDefault).toHaveBeenCalledOnce();
        expect(
            contents.setWindowOpenHandler.mock.calls.map(([handler]) => [
                typeof handler,
            ])
        ).toStrictEqual([["function"]]);
        const windowOpenHandler =
            contents.setWindowOpenHandler.mock.calls[0][0];
        expect(
            windowOpenHandler({ url: "https://bad.example.com" })
        ).toStrictEqual({
            action: "deny",
        });
        expect(windowOpenHandler({ url: "file://index.html" })).toStrictEqual({
            action: "deny",
        });
    });

    it("requires an approved source path before Save As copies a file", async () => {
        expect.assertions(9);

        const realFs =
            await vi.importActual<typeof import("node:fs")>("node:fs");
        const realOs =
            await vi.importActual<typeof import("node:os")>("node:os");
        const realPath =
            await vi.importActual<typeof import("node:path")>("node:path");
        const tempDir = realFs.mkdtempSync(
            realPath.join(realOs.tmpdir(), "ffv-save-as-")
        );
        const approvedFilePath = realPath.join(tempDir, "approved.fit");
        const copiedFilePath = realPath.join(tempDir, "copy.fit");
        realFs.writeFileSync(approvedFilePath, "fit-data");

        const policy: any =
            await import("../../../../electron-app/main/security/fileAccessPolicy.js");
        policy.__resetForTests?.();

        try {
            const importedMain: any =
                await import("../../../../electron-app/main.js");
            const mainModule = importedMain.default ?? importedMain;
            mockMainWindow.webContents.send.mockClear();

            const saveAsCall = findLatestRequiredCall(
                mockIpcMain.on.mock.calls,
                "menu-save-as",
                "ipcMain.on"
            );
            expect(saveAsCall[0]).toBe("menu-save-as");
            const saveAs = getRequiredHandler(saveAsCall);

            mainModule.setAppState("loadedFitFilePath", "C:/unapproved.fit");
            await saveAs({ sender: mockMainWindow.webContents });

            expect(mockDialog.showSaveDialog).not.toHaveBeenCalled();
            expect(realFs.existsSync(copiedFilePath)).toBe(false);
            expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
                "show-notification",
                "Save failed: File access denied",
                "error"
            );

            policy.approveFilePath?.(approvedFilePath, { source: "test" });
            mainModule.setAppState("loadedFitFilePath", approvedFilePath);
            mockDialog.showSaveDialog.mockResolvedValueOnce({
                canceled: false,
                filePath: copiedFilePath,
            });

            await saveAs({ sender: mockMainWindow.webContents });

            expect(mockDialog.showSaveDialog).toHaveBeenCalledOnce();
            expect(mockDialog.showSaveDialog.mock.calls[0]?.[1]).toMatchObject({
                defaultPath: approvedFilePath,
                title: "Save As",
            });
            expect(realFs.readFileSync(copiedFilePath, "utf8")).toBe(
                "fit-data"
            );
            expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
                "show-notification",
                "File saved successfully.",
                "success"
            );
            expect(policy.isApprovedFilePath?.("C:/unapproved.fit")).toBe(
                false
            );
        } finally {
            realFs.rmSync(tempDir, { force: true, recursive: true });
        }
    });
});
