/**
 * @fileoverview Tests for Info Handlers IPC registration
 * Comprehensive test coverage for platform and application metadata IPC handlers
 */

import { createRequire } from "node:module";
import { describe, it, expect, vi, beforeEach } from "vitest";

const requireModule = createRequire(import.meta.url);
const modulePath = "../../../../main/ipc/registerInfoHandlers.js";

const loadModule = async () => {
    const resolved = requireModule.resolve(modulePath);
    if (requireModule.cache?.[resolved]) {
        delete requireModule.cache[resolved];
    }
    return requireModule(modulePath);
};

// Mock electron-conf before any imports
vi.mock("electron-conf", () => {
    const mockConf = {
        get: vi.fn((key: string, defaultValue: any) => defaultValue),
        set: vi.fn(),
    };

    return {
        Conf: vi.fn(() => mockConf),
    };
});

describe("registerInfoHandlers", () => {
    let mockRegisterIpcHandle: ReturnType<typeof vi.fn>;
    let mockAppRef: ReturnType<typeof vi.fn>;
    let mockFs: { readFileSync: ReturnType<typeof vi.fn> };
    let mockPath: { join: ReturnType<typeof vi.fn> };
    let mockLogWithContext: ReturnType<typeof vi.fn>;
    let mockApp: any;
    let mockConf: any;
    let mockConfConstructor: ReturnType<typeof vi.fn>;
    let CONSTANTS: { DEFAULT_THEME: string; SETTINGS_CONFIG_NAME: string };

    beforeEach(async () => {
        vi.clearAllMocks();

        // Get the mocked Conf from electron-conf
        const electronConf = await import("electron-conf");
        mockConfConstructor = electronConf.Conf as any;
        mockConf = {
            get: vi.fn((key: string, defaultValue: any) => defaultValue),
            set: vi.fn(),
        };
        mockConfConstructor.mockImplementation(() => mockConf);

        // Mock app
        mockApp = {
            getVersion: vi.fn().mockReturnValue("1.0.0"),
            getAppPath: vi.fn().mockReturnValue("/app/path"),
        };

        mockRegisterIpcHandle = vi.fn();
        mockAppRef = vi.fn().mockReturnValue(mockApp);
        mockFs = {
            readFileSync: vi.fn().mockReturnValue(
                Buffer.from(JSON.stringify({ license: "MIT" }))
            ),
        };
        mockPath = {
            join: vi.fn((...args: string[]) => args.join("/")),
        };
        mockLogWithContext = vi.fn();

        CONSTANTS = {
            DEFAULT_THEME: "auto",
            SETTINGS_CONFIG_NAME: "settings",
        };

        // Mock process.versions (safely)
        Object.defineProperty(process.versions, "chrome", {
            value: "120.0.0",
            writable: true,
            configurable: true,
        });

        Object.defineProperty(process.versions, "electron", {
            value: "28.0.0",
            writable: true,
            configurable: true,
        });

        Object.defineProperty(process.versions, "node", {
            value: "20.0.0",
            writable: true,
            configurable: true,
        });

        // Mock process.arch and process.platform
        Object.defineProperty(process, "arch", {
            value: "x64",
            writable: true,
            configurable: true,
        });

        Object.defineProperty(process, "platform", {
            value: "linux",
            writable: true,
            configurable: true,
        });
    });

    const buildArgs = (overrides: Record<string, unknown> = {}) => ({
        registerIpcHandle: mockRegisterIpcHandle,
        appRef: mockAppRef,
        fs: mockFs,
        path: mockPath,
        CONSTANTS,
        logWithContext: mockLogWithContext,
        loadConf: () => ({ Conf: mockConfConstructor }),
        ...overrides,
    });

    it("should register all IPC handlers", async () => {
        const { registerInfoHandlers } = await loadModule();

        registerInfoHandlers(buildArgs());

        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("getAppVersion", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("getChromeVersion", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("getElectronVersion", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("getLicenseInfo", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("getNodeVersion", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("getPlatformInfo", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("map-tab:get", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("theme:get", expect.any(Function));
    });

    it("wires handlers directly through the helper for instrumentation", async () => {
        const { wireInfoHandlers } = await loadModule();

        wireInfoHandlers(buildArgs());

        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("getAppVersion", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("map-tab:get", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("theme:get", expect.any(Function));
    });

    it("should not register handlers if registerIpcHandle is not a function", async () => {
        const { registerInfoHandlers } = await loadModule();

        registerInfoHandlers(buildArgs({ registerIpcHandle: null as any }));

        expect(mockRegisterIpcHandle).not.toHaveBeenCalled();
    });

    describe("getAppVersion handler", () => {
        it("should return app version", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers(buildArgs());

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getAppVersion"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("1.0.0");
            expect(mockApp.getVersion).toHaveBeenCalled();
        });

        it("should return empty string if app is unavailable", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers(buildArgs({ appRef: vi.fn().mockReturnValue(null) }));

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getAppVersion"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("");
        });

        it("should return empty string if getVersion is not a function", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers(buildArgs({ appRef: vi.fn().mockReturnValue({}) }));

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getAppVersion"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("");
        });
    });

    describe("getChromeVersion handler", () => {
        it("should return Chrome version", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers(buildArgs());

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getChromeVersion"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("120.0.0");
        });
    });

    describe("getElectronVersion handler", () => {
        it("should return Electron version", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers(buildArgs());

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getElectronVersion"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("28.0.0");
        });
    });

    describe("getNodeVersion handler", () => {
        it("should return Node version", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers(buildArgs());

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getNodeVersion"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("20.0.0");
        });
    });

    describe("getPlatformInfo handler", () => {
        it("should return platform info", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers(buildArgs());

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getPlatformInfo"
            )?.[1];

            const result = await handler({});

            expect(result).toEqual({
                arch: "x64",
                platform: "linux",
            });
        });
    });

    describe("getLicenseInfo handler", () => {
        it("should read and return license from package.json", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers(buildArgs());

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getLicenseInfo"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("MIT");
            expect(mockPath.join).toHaveBeenCalledWith("/app/path", "package.json");
            expect(mockFs.readFileSync).toHaveBeenCalled();
        });

        it("should return Unknown if license field is missing", async () => {
            const { registerInfoHandlers } = await loadModule();

            mockFs.readFileSync.mockReturnValue(Buffer.from(JSON.stringify({})));

            registerInfoHandlers(buildArgs());

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getLicenseInfo"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("Unknown");
        });

        it("should use process.cwd() if getAppPath is unavailable", async () => {
            const { registerInfoHandlers } = await loadModule();

            const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/cwd/path");

            registerInfoHandlers(buildArgs({ appRef: vi.fn().mockReturnValue({}) }));

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getLicenseInfo"
            )?.[1];

            await handler({});

            expect(cwdSpy).toHaveBeenCalled();
            expect(mockPath.join).toHaveBeenCalledWith("/cwd/path", "package.json");

            cwdSpy.mockRestore();
        });

        it("should use process.cwd() if app is null", async () => {
            const { registerInfoHandlers } = await loadModule();

            const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/cwd/path");

            registerInfoHandlers(buildArgs({ appRef: vi.fn().mockReturnValue(null) }));

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getLicenseInfo"
            )?.[1];

            await handler({});

            expect(cwdSpy).toHaveBeenCalled();

            cwdSpy.mockRestore();
        });

        it("should return Unknown if fs is unavailable", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers(buildArgs({ fs: null as any }));

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getLicenseInfo"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("Unknown");
            expect(mockLogWithContext).toHaveBeenCalledWith(
                "error",
                "Failed to read license from package.json:",
                expect.any(Object)
            );
        });

        it("should return Unknown if readFileSync is not a function", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers(buildArgs({ fs: {} as any }));

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getLicenseInfo"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("Unknown");
        });

        it("should return Unknown and log error on file read failure", async () => {
            const { registerInfoHandlers } = await loadModule();

            mockFs.readFileSync.mockImplementation(() => {
                throw new Error("File not found");
            });

            registerInfoHandlers(buildArgs());

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getLicenseInfo"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("Unknown");
            expect(mockLogWithContext).toHaveBeenCalledWith(
                "error",
                "Failed to read license from package.json:",
                {
                    error: "File not found",
                }
            );
        });

        it("should return Unknown and handle JSON parse errors", async () => {
            const { registerInfoHandlers } = await loadModule();

            mockFs.readFileSync.mockReturnValue(Buffer.from("invalid json"));

            registerInfoHandlers(buildArgs());

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getLicenseInfo"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("Unknown");
            expect(mockLogWithContext).toHaveBeenCalledWith(
                "error",
                "Failed to read license from package.json:",
                expect.any(Object)
            );
        });

        it("should handle missing logWithContext gracefully", async () => {
            const { registerInfoHandlers } = await loadModule();

            mockFs.readFileSync.mockImplementation(() => {
                throw new Error("Error");
            });

            registerInfoHandlers(buildArgs({ logWithContext: undefined as any }));

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getLicenseInfo"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("Unknown");
        });
    });

    describe("map-tab:get handler", () => {
        it("returns the selected map tab from persisted configuration", async () => {
            const { registerInfoHandlers } = await loadModule();

            mockConf.get.mockImplementation((key: string, defaultValue: any) =>
                key === "selectedMapTab" ? "satellite" : defaultValue
            );

            registerInfoHandlers(buildArgs());

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "map-tab:get"
            )?.[1];

            const result = await handler({}, {});

            expect(mockConfConstructor).toHaveBeenCalledWith({ name: CONSTANTS.SETTINGS_CONFIG_NAME });
            expect(mockConf.get).toHaveBeenCalledWith("selectedMapTab", "map");
            expect(result).toBe("satellite");
        });
    });

    describe("theme:get handler", () => {
        it("returns the stored theme preference with a default fallback", async () => {
            const { registerInfoHandlers } = await loadModule();

            mockConf.get.mockImplementation((key: string, defaultValue: any) =>
                key === "theme" ? "light" : defaultValue
            );

            registerInfoHandlers(buildArgs());

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "theme:get"
            )?.[1];

            const result = await handler({}, {});

            expect(mockConfConstructor).toHaveBeenCalledWith({ name: CONSTANTS.SETTINGS_CONFIG_NAME });
            expect(mockConf.get).toHaveBeenCalledWith("theme", CONSTANTS.DEFAULT_THEME);
            expect(result).toBe("light");
        });
    });

    describe("error handling in wrapper", () => {
        it("should log and rethrow errors from handlers", async () => {
            const { registerInfoHandlers } = await loadModule();

            const error = new Error("Handler error");
            mockApp.getVersion.mockImplementation(() => {
                throw error;
            });

            registerInfoHandlers(buildArgs());

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getAppVersion"
            )?.[1];

            await expect(handler({})).rejects.toThrow("Handler error");
            expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in getAppVersion:", {
                error: "Handler error",
            });
        });

        it("should handle missing logWithContext in error wrapper", async () => {
            const { registerInfoHandlers } = await loadModule();

            mockApp.getVersion.mockImplementation(() => {
                throw new Error("Error");
            });

            registerInfoHandlers(buildArgs({ logWithContext: undefined as any }));

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getAppVersion"
            )?.[1];

            await expect(handler({})).rejects.toThrow();
        });
    });

    describe("createInfoHandlers helper", () => {
        it("exposes runtime metadata accessors", async () => {
            const { createInfoHandlers } = await loadModule();

            const handlers = createInfoHandlers(buildArgs());

            await expect(handlers.getAppVersion()).resolves.toBe("1.0.0");
            await expect(handlers.getChromeVersion()).resolves.toBe(process.versions.chrome);
            await expect(handlers.getElectronVersion()).resolves.toBe(process.versions.electron);
            await expect(handlers.getNodeVersion()).resolves.toBe(process.versions.node);
            await expect(handlers.getPlatformInfo()).resolves.toEqual({
                arch: process.arch,
                platform: process.platform,
            });
        });

        it("returns license information when package.json is readable", async () => {
            const { createInfoHandlers } = await loadModule();

            const handlers = createInfoHandlers(buildArgs());

            await expect(handlers.getLicenseInfo()).resolves.toBe("MIT");
            expect(mockFs.readFileSync).toHaveBeenCalled();
            expect(mockPath.join).toHaveBeenCalledWith("/app/path", "package.json");
        });

        it("logs and returns Unknown when filesystem access fails", async () => {
            const { createInfoHandlers } = await loadModule();

            const handlers = createInfoHandlers(buildArgs({ fs: null as any }));

            await expect(handlers.getLicenseInfo()).resolves.toBe("Unknown");
            expect(mockLogWithContext).toHaveBeenCalledWith(
                "error",
                "Failed to read license from package.json:",
                expect.objectContaining({ error: "Filesystem module unavailable" })
            );
        });

        it("reads persisted configuration for map tab and theme", async () => {
            const { createInfoHandlers } = await loadModule();

            mockConf.get.mockImplementation((key: string, defaultValue: any) => {
                if (key === "selectedMapTab") {
                    return "satellite";
                }

                if (key === "theme") {
                    return "dark";
                }

                return defaultValue;
            });

            const handlers = createInfoHandlers(buildArgs());

            await expect(handlers["map-tab:get"]()).resolves.toBe("satellite");
            await expect(handlers["theme:get"]()).resolves.toBe("dark");
            expect(mockConfConstructor).toHaveBeenCalledWith({ name: CONSTANTS.SETTINGS_CONFIG_NAME });
        });
    });
});
