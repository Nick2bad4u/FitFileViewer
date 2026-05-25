/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type MockFn = ReturnType<typeof vi.fn>;
type EventHandler = (...args: unknown[]) => Promise<void> | void;
type DidFinishLoadHandler = () => Promise<void> | void;

interface MockApplicationMenu {
    getMenuItemById: MockFn;
}

interface MockApp {
    getAppPath: MockFn;
    getPath: MockFn;
    getVersion: MockFn;
    on: MockFn;
    quit: MockFn;
    whenReady: MockFn;
}

interface MockBrowserWindowConstructor {
    fromWebContents: MockFn;
    getAllWindows: MockFn;
    getFocusedWindow: MockFn;
}

interface MockDialog {
    showMessageBox: MockFn;
    showOpenDialog: MockFn;
    showSaveDialog: MockFn;
}

interface MockElectronModule {
    app: MockApp;
    BrowserWindow: MockBrowserWindowConstructor;
    dialog: MockDialog;
    ipcMain: MockIpcMain;
    Menu: MockMenu;
    shell: MockShell;
}

interface MockIpcMain {
    handle: MockFn;
    on: MockFn;
}

interface MockMainWindow {
    isDestroyed: MockFn;
    setFullScreen: MockFn;
    webContents: MockWebContents;
}

interface MockMenu {
    getApplicationMenu: MockFn;
}

interface MockShell {
    openExternal: MockFn;
}

interface MockWebContents {
    executeJavaScript: MockFn;
    isDestroyed: MockFn;
    on: MockFn;
    send: MockFn;
}

interface RegisteredEventHandler {
    evt: string;
    handler: EventHandler;
    target: unknown;
}

interface StateData {
    eventHandlers: Map<string, RegisteredEventHandler>;
    store: Map<string, unknown>;
}

interface MainProcessStateMock {
    cleanupEventHandlers: MockFn;
    data: StateData;
    get: MockFn;
    registerEventHandler: MockFn;
    set: MockFn;
}

// Simple in-test EventEmitter for mocks
class Emitter {
    handlers: Record<string, EventHandler[]> = {};
    on(evt: string, fn: EventHandler) {
        (this.handlers[evt] ||= []).push(fn);
    }
    emit(evt: string, ...args: unknown[]) {
        for (const fn of this.handlers[evt] || []) fn(...args);
    }
}

// Shared emitter for autoUpdater mock (must be available to hoisted mocks)
const autoUpdaterEmitter = new Emitter();

// Declare placeholders that hoisted mocks will read via getters
let mockApp: MockApp;
let mockMenu: MockMenu;
let mockBrowserWindow: MockBrowserWindowConstructor;
let mockIpcMain: MockIpcMain;
let mockDialog: MockDialog;
let mockShell: MockShell;
let mockMainWindow: MockMainWindow;
let createWindowMock: MockFn;
let createAppMenu: MockFn;
let mainProcessState: MainProcessStateMock;

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
(globalThis as typeof globalThis & {
    __electronHoistedMock: MockElectronModule;
}).__electronHoistedMock = {
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
    on: vi.fn((evt: string, handler: EventHandler) =>
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
        store: Record<string, unknown>;
        constructor() {
            this.store = {};
        }
        get(key: string, def?: unknown) {
            return this.store[key] ?? def;
        }
        set(key: string, val: unknown) {
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
    let didFinishLoadHandler: DidFinishLoadHandler | null = null;

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
                on: vi.fn().mockImplementation(
                    (evt: string, handler: EventHandler) => {
                        if (evt === "did-finish-load")
                            didFinishLoadHandler =
                                handler as DidFinishLoadHandler;
                    }
                ),
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
        const stateData: StateData = {
            eventHandlers: new Map(),
            store: new Map(),
        };
        mainProcessState = {
            get: vi.fn((key: string) => stateData.store.get(key)),
            set: vi.fn((key: string, val: unknown) =>
                stateData.store.set(key, val)
            ),
            registerEventHandler: vi.fn(
                (
                    target: unknown,
                    evt: string,
                    handler: EventHandler,
                    id: string
                ) => {
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
        if (typeof didFinishLoadHandler !== "function")
            throw new TypeError("did-finish-load handler was not registered");
        await didFinishLoadHandler();

        // autoUpdater.check called
        const { autoUpdater } = await import("electron-updater");
        expect(autoUpdater.checkForUpdatesAndNotify).toHaveBeenCalled();

        // Simulate update-downloaded event and ensure menu item gets enabled and IPC send happens
        autoUpdaterEmitter.emit("update-downloaded", { version: "1.2.3" });
        // Menu should be queried
        expect(mockMenu.getApplicationMenu).toHaveBeenCalled();
        const appMenu = mockMenu.getApplicationMenu.mock.results[0]
            ?.value as MockApplicationMenu;
        expect(appMenu.getMenuItemById).toHaveBeenCalledWith("restart-update");

        // The renderer should get set-theme during did-finish-load
        expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
            "set-theme",
            expect.any(String)
        );
    });
});
