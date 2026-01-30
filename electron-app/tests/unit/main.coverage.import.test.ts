/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Simple in-test EventEmitter for mocks
class Emitter {
    handlers: Record<string, Function[]> = {};
    on(evt: string, fn: Function) {
        (this.handlers[evt] ||= []).push(fn);
    }
    emit(evt: string, ...args: any[]) {
        for (const fn of this.handlers[evt] || []) fn(...args);
    }
}

// Shared emitter for autoUpdater mock (must be available to hoisted mocks)
const autoUpdaterEmitter = new Emitter();

// Declare placeholders that hoisted mocks will read via getters
let mockApp: any;
let mockMenu: any;
let mockBrowserWindow: any;
let mockIpcMain: any;
let mockDialog: any;
let mockShell: any;
let mockMainWindow: any;
let createWindowMock: any;
let createAppMenu: any;
let mainProcessState: any;

// Hoisted mocks to ensure CommonJS requires in main.js and electron-updater see them
vi.mock("electron", () => ({
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
// Also expose the mocked module for main.js to see synchronously at import time
// This avoids relying solely on require("electron") resolution which may not observe hoisted mocks in CJS
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

// electron-log hoisted mock
const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    transports: { file: { level: "info" } },
};
vi.mock("electron-log", () => mockLogger);

// electron-updater hoisted mock using the shared emitter
const autoUpdater = {
    on: vi.fn((evt: string, handler: Function) =>
        autoUpdaterEmitter.on(evt, handler)
    ),
    logger: mockLogger,
    checkForUpdatesAndNotify: vi.fn().mockResolvedValue(undefined),
};
vi.mock("electron-updater", () => ({ autoUpdater }));

// windowStateUtils.createWindow hoisted mock
vi.mock("../../windowStateUtils", () => ({
    get createWindow() {
        return createWindowMock;
    },
}));

// electron-conf hoisted mock to avoid accessing app.getPath at import-time
vi.mock("electron-conf", () => {
    class MockConf {
        store: Record<string, any>;
        constructor() {
            this.store = {};
        }
        get(key: string, def?: any) {
            return this.store[key] ?? def;
        }
        set(key: string, val: any) {
            this.store[key] = val;
        }
    }
    return { Conf: MockConf };
});

// App menu creator hoisted mock
vi.mock("../../utils/app/menu/createAppMenu", () => ({
    get createAppMenu() {
        return createAppMenu;
    },
}));

// Main process state manager hoisted mock
vi.mock("../../utils/state/integration/mainProcessStateManager", () => ({
    get mainProcessState() {
        return mainProcessState;
    },
}));

describe("main.js - import-based coverage", () => {
    // Capture did-finish-load handler
    let didFinishLoadHandler: (() => Promise<void> | void) | null = null;

    beforeEach(async () => {
        vi.resetModules();

        // Fresh mocks for Electron each test
        mockApp = {
            whenReady: vi.fn().mockResolvedValue(undefined),
            on: vi.fn(),
            getVersion: vi.fn().mockReturnValue("1.0.0"),
            getAppPath: vi.fn().mockReturnValue("/mock/app/path"),
            getPath: vi.fn().mockImplementation((name: string) => {
                // electron-conf requests userData/appData paths; return a stable mock path
                if (name === "userData" || name === "appData")
                    return "/mock/user/data";
                return "/mock/path";
            }),
            quit: vi.fn(),
        };

        mockMenu = {
            getApplicationMenu: vi.fn().mockReturnValue({
                getMenuItemById: vi.fn().mockReturnValue({ enabled: false }),
            }),
        };

        didFinishLoadHandler = null;
        mockMainWindow = {
            isDestroyed: vi.fn().mockReturnValue(false),
            webContents: {
                isDestroyed: vi.fn().mockReturnValue(false),
                send: vi.fn(),
                on: vi.fn().mockImplementation((evt: string, handler: any) => {
                    if (evt === "did-finish-load")
                        didFinishLoadHandler = handler;
                }),
                executeJavaScript: vi.fn().mockResolvedValue("dark"),
            },
            setFullScreen: vi.fn(),
        };

        mockBrowserWindow = {
            getAllWindows: vi.fn().mockReturnValue([mockMainWindow]),
            getFocusedWindow: vi.fn().mockReturnValue(mockMainWindow),
            fromWebContents: vi.fn().mockReturnValue(mockMainWindow),
        };

        mockIpcMain = { handle: vi.fn(), on: vi.fn() };
        mockDialog = {
            showOpenDialog: vi.fn(),
            showSaveDialog: vi.fn(),
            showMessageBox: vi.fn(),
        };
        mockShell = { openExternal: vi.fn().mockResolvedValue(undefined) };

        // Set per-test dynamic mocked implementations used by hoisted mocks
        createWindowMock = vi.fn(() => mockMainWindow);
        createAppMenu = vi.fn();

        // Minimal main process state manager (fresh per test)
        const stateData: any = { eventHandlers: new Map(), store: new Map() };
        mainProcessState = {
            get: vi.fn((key: string) => stateData.store.get(key)),
            set: vi.fn((key: string, val: any) =>
                stateData.store.set(key, val)
            ),
            registerEventHandler: vi.fn(
                (target: any, evt: string, handler: Function, id: string) => {
                    stateData.eventHandlers.set(id, { target, evt, handler });
                }
            ),
            cleanupEventHandlers: vi.fn(),
            data: stateData,
        };

        // Quiet logs
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "info").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});

        // Ensure environment
        process.env.NODE_ENV = "test";
    });

    afterEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it("imports main.js and initializes without throwing", async () => {
        await import("../../main.js");
        // whenReady should have been awaited and createWindow called via initializeApplication
        expect(mockApp.whenReady).toHaveBeenCalled();
        expect(mockBrowserWindow.getAllWindows).toHaveBeenCalled();
        // did-finish-load not yet triggered automatically
        expect(typeof didFinishLoadHandler === "function").toBe(true);
    });

    it("handles did-finish-load flow and auto-updater wiring", async () => {
        await import("../../main.js");
        expect(typeof didFinishLoadHandler === "function").toBe(true);

        // Trigger did-finish-load
        await (didFinishLoadHandler as any)();

        // autoUpdater.check called
        const { autoUpdater } = await import("electron-updater");
        expect(autoUpdater.checkForUpdatesAndNotify).toHaveBeenCalled();

        // Simulate update-downloaded event and ensure menu item gets enabled and IPC send happens
        autoUpdaterEmitter.emit("update-downloaded", { version: "1.2.3" });
        // Menu should be queried
        expect(mockMenu.getApplicationMenu).toHaveBeenCalled();
        const appMenu = mockMenu.getApplicationMenu.mock.results[0].value;
        expect(appMenu.getMenuItemById).toHaveBeenCalledWith("restart-update");

        // The renderer should get set-theme during did-finish-load
        expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
            "set-theme",
            expect.any(String)
        );
    });
});
