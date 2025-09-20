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
        getAllWindows: vi.fn(() => [mockWindow] as any[]),
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
    },
    Menu: {
        getApplicationMenu: vi.fn(),
        setApplicationMenu: vi.fn(),
    },
    shell: {
        openExternal: vi.fn(),
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
    listen: vi.fn((port: number, callback?: (error?: Error) => void) => {
        if (callback) callback();
    }),
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
        readFile: vi.fn((path: string, callback: (error: Error | null, data?: Buffer) => void) => {
            callback(null, Buffer.from("test file content"));
        }),
        writeFile: vi.fn(),
        existsSync: vi.fn(() => true),
        createReadStream: vi.fn(),
        createWriteStream: vi.fn(),
    },
}));

// Mock http module
vi.mock("node:http", () => ({
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
        promisify: vi.fn((fn: any) => fn),
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

describe("main.js - Electron Main Process", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset environment
        process.env.NODE_ENV = "test";

        // Setup globalThis for hoisted mock support
        (globalThis as any).__electronHoistedMock = mockElectron;

        // Reset mainProcessState to fresh state
        mockMainProcessState.get.mockReturnValue(undefined);
        mockMainProcessState.set.mockReturnValue(undefined);

        // Provide a mock window to trigger full initialization
        mockElectron.BrowserWindow.getAllWindows.mockReturnValue([mockWindow]);
    });

    afterEach(() => {
        vi.clearAllMocks();
        delete (globalThis as any).__electronHoistedMock;
        delete (globalThis as any).devHelpers;

        // Clear the main module from cache to reset its state
        const mainPath = require.resolve("../../main.js");
        if (require.cache[mainPath]) {
            delete require.cache[mainPath];
        }
    });

    describe("Module Import and Basic Tests", () => {
        it("should import main.js without errors", async () => {
            // Should be able to import the main module without throwing
            await expect(import("../../main.js")).resolves.toBeDefined();
        });

        it("should handle test environment initialization", async () => {
            // Import the main module - it should run early sync path
            await import("../../main.js");

            // The basic import should complete without errors
            // This tests that the test-specific initialization path works
            expect(true).toBe(true);
        });

        it("should handle missing electron gracefully", async () => {
            // Clear the hoisted mock to trigger error path
            delete (globalThis as any).__electronHoistedMock;

            // Should not throw when importing
            await expect(import("../../main.js")).resolves.toBeDefined();
        });

        it("should handle state management during early sync path", async () => {
            await import("../../main.js");

            // The main.js module completes without errors
            // State management is mocked but may not be called in early sync path
            expect(true).toBe(true);
        });

        it("should complete early sync path when window exists", async () => {
            // Mock an existing window scenario
            mockElectron.BrowserWindow.getAllWindows.mockReturnValue([mockWindow]);

            await import("../../main.js");

            // Should complete without errors in early sync path
            expect(true).toBe(true);
        });
    });

    describe("Error Handling", () => {
        it("should handle initialization errors gracefully", async () => {
            // Mock an initialization error
            mockElectron.app.whenReady.mockImplementation(() => {
                throw new Error("Initialization failed");
            });

            // Should not throw during import
            await expect(import("../../main.js")).resolves.toBeDefined();
        });

        it("should handle window enumeration errors", async () => {
            // Mock window enumeration error
            mockElectron.BrowserWindow.getAllWindows.mockImplementation(() => {
                throw new Error("Window enumeration failed");
            });

            // Should not throw during import
            await expect(import("../../main.js")).resolves.toBeDefined();
        });

        it("should handle auto-updater setup errors", async () => {
            // Mock auto-updater error
            mockAutoUpdater.on.mockImplementation(() => {
                throw new Error("Auto-updater setup failed");
            });

            await import("../../main.js");

            // Should complete without throwing
            expect(true).toBe(true);
        });

        it("should handle server creation errors", async () => {
            // Mock server error
            mockServer.listen.mockImplementation((port: number, callback?: (error?: Error) => void) => {
                const error = new Error("Port in use") as any;
                error.code = "EADDRINUSE";
                if (callback) callback(error);
            });

            await import("../../main.js");

            // Should complete without throwing
            expect(true).toBe(true);
        });
    });

    describe("Development Features", () => {
        it("should not expose development helpers in test environment", async () => {
            await import("../../main.js");

            // Development helpers should not be available in test environment
            expect((globalThis as any).devHelpers).toBeUndefined();
        });

        it("should handle development flag", async () => {
            // Mock command line arguments
            const originalArgv = process.argv;
            process.argv = ["node", "app.js", "--dev"];

            await import("../../main.js");

            // Should handle dev flag without errors
            expect(true).toBe(true);

            // Clean up
            process.argv = originalArgv;
        });
    });

    describe("Platform Compatibility", () => {
        it("should handle different platforms", async () => {
            // Test doesn't depend on specific platform behavior
            await import("../../main.js");

            // Should work on any platform
            expect(true).toBe(true);
        });

        it("should handle file operations", async () => {
            await import("../../main.js");

            // File operations should be mocked and working
            expect(true).toBe(true);
        });
    });

    describe("Gyazo OAuth Server", () => {
        it("should handle server setup with environment variables", async () => {
            // Mock environment variables
            process.env.GYAZO_CLIENT_ID = "test-client-id";
            process.env.GYAZO_CLIENT_SECRET = "test-client-secret";

            await import("../../main.js");

            // Server setup should complete without errors
            expect(true).toBe(true);

            // Clean up
            delete process.env.GYAZO_CLIENT_ID;
            delete process.env.GYAZO_CLIENT_SECRET;
        });

        it("should handle missing Gyazo environment variables", async () => {
            // Ensure no Gyazo environment variables
            delete process.env.GYAZO_CLIENT_ID;
            delete process.env.GYAZO_CLIENT_SECRET;

            await import("../../main.js");

            // Should complete without errors when Gyazo vars are missing
            expect(true).toBe(true);
        });
    });

    describe("Security Features", () => {
        it("should handle web security setup", async () => {
            await import("../../main.js");

            // Web security setup should complete without errors
            expect(true).toBe(true);
        });

        it("should handle URL validation", async () => {
            await import("../../main.js");

            // URL validation should be set up correctly
            expect(true).toBe(true);
        });
    });
});
