// @vitest-environment node
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const fallbackSettingsPath = join(process.cwd(), "window-state.json");

type ExistsSyncMock = (path: string) => boolean;
type ReadFileSyncMock = (path: string, encoding: BufferEncoding) => string;
type WriteFileSyncMock = (path: string, data: string) => void;
type MkdirSyncMock = (path: string, options?: unknown) => void;
type UnlinkSyncMock = (path: string) => void;
type WindowEventCallback = () => void;
type WindowEventListenerMock = (
    event: string,
    callback: WindowEventCallback
) => void;
type VoidCallback = () => void;

interface MockFs {
    existsSync: ReturnType<typeof vi.fn<ExistsSyncMock>>;
    mkdirSync: ReturnType<typeof vi.fn<MkdirSyncMock>>;
    readFileSync: ReturnType<typeof vi.fn<ReadFileSyncMock>>;
    unlinkSync: ReturnType<typeof vi.fn<UnlinkSyncMock>>;
    writeFileSync: ReturnType<typeof vi.fn<WriteFileSyncMock>>;
}

interface MockApp {
    getPath: ReturnType<typeof vi.fn<() => string>>;
}

interface MockWindowInstance {
    getBounds: ReturnType<
        typeof vi.fn<
            () => { height: number; width: number; x: number; y: number }
        >
    >;
    isDestroyed: ReturnType<typeof vi.fn<() => boolean>>;
    isMaximized: ReturnType<typeof vi.fn<() => boolean>>;
    isMinimized: ReturnType<typeof vi.fn<() => boolean>>;
    loadFile: ReturnType<typeof vi.fn<() => Promise<void>>>;
    on: ReturnType<typeof vi.fn<WindowEventListenerMock>>;
    once: ReturnType<typeof vi.fn<WindowEventListenerMock>>;
    setMenuBarVisibility: ReturnType<typeof vi.fn<VoidCallback>>;
    show: ReturnType<typeof vi.fn<VoidCallback>>;
}

type BrowserWindowMock = new (options: unknown) => MockWindowInstance;

function removeFallbackWindowState() {
    if (existsSync(fallbackSettingsPath)) {
        unlinkSync(fallbackSettingsPath);
    }
}

describe("windowStateUtils persistence behavior", () => {
    const defaultState = {
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
    };
    let mockFs: MockFs;
    let mockApp: MockApp;
    let mockBrowserWindow: BrowserWindowMock;
    let mockedFileContent: string;
    let mockedFileExists: boolean;

    beforeEach(() => {
        vi.resetModules();
        removeFallbackWindowState();
        // Mock fs behaviors
        mockedFileExists = false;
        mockedFileContent = "";
        mockFs = {
            existsSync: vi.fn<ExistsSyncMock>((p: string) => {
                if (p.endsWith("window-state.json")) return mockedFileExists;
                // For dir checks during save
                return true;
            }),
            readFileSync: vi.fn<ReadFileSyncMock>(
                (_p: string, _enc: BufferEncoding) => mockedFileContent
            ),
            writeFileSync: vi.fn<WriteFileSyncMock>((_p, data: string) => {
                mockedFileExists = true;
                mockedFileContent = data;
            }),
            mkdirSync: vi.fn<MkdirSyncMock>(),
            unlinkSync: vi.fn<UnlinkSyncMock>(() => {
                mockedFileExists = false;
                mockedFileContent = "";
            }),
        };

        mockApp = {
            getPath: vi.fn<() => string>(() => "/tmp/fitfileviewer"),
        };

        const mockWinInstance = {
            isDestroyed: vi.fn<() => boolean>(() => false),
            isMinimized: vi.fn<() => boolean>(() => false),
            isMaximized: vi.fn<() => boolean>(() => false),
            getBounds: vi
                .fn<
                    () => {
                        height: number;
                        width: number;
                        x: number;
                        y: number;
                    }
                >()
                .mockReturnValue({ width: 1000, height: 700, x: 10, y: 20 }),
            on: vi.fn<WindowEventListenerMock>(),
            once: vi.fn<WindowEventListenerMock>((_ev, cb) => cb()),
            show: vi.fn<VoidCallback>(),
            loadFile: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
            setMenuBarVisibility: vi.fn<VoidCallback>(),
        };
        // Provide a constructable BrowserWindow mock
        function BrowserWindow(this: unknown, _opts: unknown) {
            return mockWinInstance;
        }
        mockBrowserWindow = BrowserWindow as unknown as BrowserWindowMock;

        vi.doMock(import("node:fs"), () => mockFs);
        vi.doMock(import("electron"), () => ({
            app: mockApp,
            BrowserWindow: mockBrowserWindow,
        }));

        // Silence logs
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "info").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        removeFallbackWindowState();
    });

    it("getWindowState returns defaults when file missing", async () => {
        expect.assertions(2);

        const mod = await import("../../electron-app/windowStateUtils.js");
        const state = mod.getWindowState();
        expect(state.width).toBe(defaultState.width);
        expect(state.height).toBe(defaultState.height);
    });

    it("getWindowState reads and sanitizes persisted state", async () => {
        expect.assertions(1);

        const fileData = JSON.stringify({
            width: 500,
            height: 400,
            x: 5,
            y: 6,
        });
        mockedFileExists = true;
        mockedFileContent = fileData;
        writeFileSync(fallbackSettingsPath, fileData);

        const mod = await import("../../electron-app/windowStateUtils.js");
        const state = mod.getWindowState();
        expect(state).toEqual({
            height: 600,
            width: 800,
            x: 5,
            y: 6,
        });
    });

    it("saveWindowState persists sanitized bounds", async () => {
        expect.assertions(2);

        const mod = await import("../../electron-app/windowStateUtils.js");
        // Pass a stub window directly to avoid constructor path
        const win = {
            isDestroyed: () => false,
            isMinimized: () => false,
            isMaximized: () => false,
            getBounds: () => ({ width: 1000, height: 700, x: 10, y: 20 }),
        } as unknown as Parameters<typeof mod.saveWindowState>[0];

        mod.saveWindowState(win);

        expect({
            fallbackSettingsFileExists: existsSync(fallbackSettingsPath),
        }).toStrictEqual({ fallbackSettingsFileExists: true });
        expect({
            savedState: JSON.parse(readFileSync(fallbackSettingsPath, "utf8")),
            settingsPath: mod.settingsPath,
        }).toEqual({
            savedState: {
                height: 700,
                width: 1000,
                x: 10,
                y: 20,
            },
            settingsPath: fallbackSettingsPath,
        });
    });

    it("createWindow attempts BrowserWindow construction (may throw in tests)", async () => {
        expect.assertions(1);

        const mod = await import("../../electron-app/windowStateUtils.js");
        expect(() => mod.createWindow()).toThrow(
            "BrowserWindow is not a constructor"
        );
    });

    it("devHelpers are exposed only in development", async () => {
        expect.assertions(10);

        process.env.NODE_ENV = "development";
        try {
            const mod = await import("../../electron-app/windowStateUtils.js");

            expect(Object.keys(mod.devHelpers).toSorted()).toStrictEqual([
                "getConfig",
                "resetState",
                "validateSettings",
            ]);
            expect(mod.devHelpers.getConfig).toBeTypeOf("function");
            expect(mod.devHelpers.resetState).toBeTypeOf("function");
            expect(mod.devHelpers.validateSettings).toBeTypeOf("function");

            const info = mod.devHelpers.getConfig();
            expect(info.constants.DEFAULTS.WINDOW).toEqual(defaultState);
            expect(info.settingsPath).toBe(mod.settingsPath);
            expect(info.settingsPath).toMatch(/[\\/]window-state\.json$/);
            expect(info.currentState).toEqual(defaultState);

            expect({
                fallbackFileExists: existsSync(fallbackSettingsPath),
                resetResult: mod.devHelpers.resetState(),
            }).toEqual({
                fallbackFileExists: false,
                resetResult: false,
            });

            expect(mod.devHelpers.validateSettings()).toEqual({
                exists: false,
                isValid: true,
                path: mod.settingsPath,
                state: defaultState,
            });
        } finally {
            process.env.NODE_ENV = "test";
        }
    });
});
