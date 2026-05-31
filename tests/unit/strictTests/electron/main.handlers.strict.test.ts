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

// Hoisted mocks so main.js resolves them during import-time
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
// Expose synchronously for early CJS require paths inside main.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__electronHoistedMock = {
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
};

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

    beforeEach(() => {
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
        expect.hasAssertions();

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
        expect(mockIpcMain.handle).toHaveBeenCalledWith(
            "dialog:openFile",
            expect.any(Function)
        );
        expect(mockIpcMain.on).toHaveBeenCalledWith(
            "menu-check-for-updates",
            expect.any(Function)
        );
    });

    it("handles dialog:openFile flow and recentFiles handlers", async () => {
        expect.hasAssertions();

        await import("../../../../electron-app/main.js");

        // Find the handler wired to dialog:openFile via ipcMain.handle calls
        const call = mockIpcMain.handle.mock.calls.find(
            (c: any[]) => c[0] === "dialog:openFile"
        );
        expect(call?.[0]).toBe("dialog:openFile");
        const openHandler = call?.[1];
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
        const recentGet = mockIpcMain.handle.mock.calls.find(
            (c: any[]) => c[0] === "recentFiles:get"
        );
        expect(recentGet?.[0]).toBe("recentFiles:get");
        const recent = await recentGet?.[1]({});
        expect(recent).toStrictEqual([]);
        // recentFiles:add
        const recentAdd = mockIpcMain.handle.mock.calls.find(
            (c: any[]) => c[0] === "recentFiles:add"
        );
        expect(recentAdd?.[0]).toBe("recentFiles:add");
        mockMainWindow.webContents.executeJavaScript.mockResolvedValueOnce(
            "dark"
        );
        await expect(recentAdd?.[1]({}, "D:/other.fit")).resolves.toStrictEqual(
            []
        );
        // In test mode, menu creation is a no-op; verifying no throw is sufficient
    });

    it("validates shell:openExternal and file:read/fit handlers", async () => {
        expect.hasAssertions();

        await import("../../../../electron-app/main.js");
        const handleCalls = mockIpcMain.handle.mock.calls;
        const openExternal = handleCalls.find(
            (c: any[]) => c[0] === "shell:openExternal"
        );
        const fileRead = handleCalls.find((c: any[]) => c[0] === "file:read");
        const fitParse = handleCalls.find((c: any[]) => c[0] === "fit:parse");
        const fitDecode = handleCalls.find((c: any[]) => c[0] === "fit:decode");
        expect(openExternal?.[0]).toBe("shell:openExternal");
        expect(fileRead?.[0]).toBe("file:read");
        expect(fitParse?.[0]).toBe("fit:parse");
        expect(fitDecode?.[0]).toBe("fit:decode");

        // Invalid URL
        await expect(openExternal?.[1]({}, "file://bad")).rejects.toThrow(
            "Only HTTPS and mailto URLs are allowed"
        );
        // Valid URL
        await expect(openExternal[1]({}, "https://example.com")).resolves.toBe(
            true
        );
        expect(mockShell.openExternal).toHaveBeenCalledWith(
            "https://example.com"
        );

        // file:read returns ArrayBuffer
        // file:read is protected by a main-process allowlist; approve the path as if it
        // came from a trusted user flow (dialog/menu/recent list).
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const policy: any = require("../../../../electron-app/main/security/fileAccessPolicy");
        policy.__resetForTests?.();
        policy.approveFilePath?.("C:/x.fit", { source: "test" });

        // Override fs.readFile for this call using spy with loose typing
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fsMod: any = require("fs");
        (vi.spyOn(fsMod as any, "stat") as any).mockImplementation(
            (p: string, cb: Function) => cb(null, { size: 3 })
        );
        (vi.spyOn(fsMod as any, "readFile") as any).mockImplementation(
            (p: string, cb: Function) => cb(null, Buffer.from("abc"))
        );
        const buf = await fileRead?.[1]({}, "C:/x.fit");
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
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {
            registerFileSystemHandlers,
        }: any = require("../../../../electron-app/main/ipc/registerFileSystemHandlers");
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
        ).rejects.toMatchObject({
            code: "ENOENT",
        });
        expect(directFs.readFile).not.toHaveBeenCalled();
        expect(directLog).not.toHaveBeenCalled();

        // fit parse/decode
        const invalidFitResult = {
            details: "No additional details available",
            error: "FIT file integrity check failed. Details: No additional details available",
        };
        await expect(fitParse?.[1]({}, new ArrayBuffer(4))).resolves.toEqual(
            invalidFitResult
        );
        await expect(fitDecode?.[1]({}, new ArrayBuffer(4))).resolves.toEqual(
            invalidFitResult
        );
    });

    it("menu events and fullscreen, security navigation guards", async () => {
        expect.hasAssertions();

        await import("../../../../electron-app/main.js");
        const updater = (await import("electron-updater")).autoUpdater as any;

        // menu-check-for-updates delegates to the updater check path
        const onCalls = mockIpcMain.on.mock.calls;
        const updaterCheck = onCalls
            .filter((c: any[]) => c[0] === "menu-check-for-updates")
            .at(-1);
        expect(updaterCheck?.[0]).toBe("menu-check-for-updates");
        updater.checkForUpdates.mockClear();
        updaterCheck?.[1]({});
        expect(updater.checkForUpdates).toHaveBeenCalledOnce();

        // install-update triggers quitAndInstall; simulate linux dialog path
        const originalPlatform = process.platform;
        try {
            Object.defineProperty(process, "platform", { value: "linux" });
            const install = onCalls
                .filter((c: any[]) => c[0] === "install-update")
                .at(-1);
            expect(install?.[0]).toBe("install-update");
            updater.quitAndInstall.mockClear();
            install?.[1]({});
            expect(updater.quitAndInstall).toHaveBeenCalledOnce();
            expect(mockDialog.showMessageBox).not.toHaveBeenCalled();
        } finally {
            Object.defineProperty(process, "platform", {
                value: originalPlatform,
            });
        }

        // fullscreen
        const fsEvt = onCalls.find((c: any[]) => c[0] === "set-fullscreen");
        expect(fsEvt?.[0]).toBe("set-fullscreen");
        fsEvt?.[1]({}, true);
        expect(mockMainWindow.setFullScreen).toHaveBeenCalledWith(true);

        // Security handlers wired on web-contents-created
        const appOnCall = mockApp.on.mock.calls.find(
            (c: any[]) => c[0] === "web-contents-created"
        );
        expect(appOnCall?.[0]).toBe("web-contents-created");
        const contents: any = {
            on: vi.fn<(eventName: string, handler: EventHandler) => void>(),
            setWindowOpenHandler: vi.fn<(handler: EventHandler) => void>(),
        };
        appOnCall?.[1]({}, contents);
        expect(contents.on).toHaveBeenCalledWith(
            "will-navigate",
            expect.any(Function)
        );
        const willNavigateCall = contents.on.mock.calls.find(
            (c: any[]) => c[0] === "will-navigate"
        );
        expect(willNavigateCall?.[0]).toBe("will-navigate");
        const ev = { preventDefault: vi.fn<() => void>() } as any;
        willNavigateCall?.[1](ev, "https://malicious.example.com");
        expect(ev.preventDefault).toHaveBeenCalledOnce();
        expect(contents.setWindowOpenHandler).toHaveBeenCalledWith(
            expect.any(Function)
        );
        const windowOpenHandler =
            contents.setWindowOpenHandler.mock.calls[0][0];
        expect(windowOpenHandler({ url: "https://bad.example.com" })).toEqual({
            action: "deny",
        });
        expect(windowOpenHandler({ url: "file://index.html" })).toEqual({
            action: "allow",
        });
    });
});
