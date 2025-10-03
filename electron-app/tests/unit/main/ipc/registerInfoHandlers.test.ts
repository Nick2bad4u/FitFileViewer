/**
 * @fileoverview Tests for Info Handlers IPC registration
 * Comprehensive test coverage for platform and application metadata IPC handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

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
        mockConf = mockConfConstructor.mock.results[0]?.value || {
            get: vi.fn((key: string, defaultValue: any) => defaultValue),
            set: vi.fn(),
        };

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

    const loadModule = async () => {
        const mod = await import("../../../../main/ipc/registerInfoHandlers.js");
        return mod;
    };

    it("should register all IPC handlers", async () => {
        const { registerInfoHandlers } = await loadModule();

        registerInfoHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            appRef: mockAppRef,
            fs: mockFs,
            path: mockPath,
            CONSTANTS,
            logWithContext: mockLogWithContext,
        });

        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("getAppVersion", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("getChromeVersion", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("getElectronVersion", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("getLicenseInfo", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("getNodeVersion", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("getPlatformInfo", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("map-tab:get", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("theme:get", expect.any(Function));
    });

    it("should not register handlers if registerIpcHandle is not a function", async () => {
        const { registerInfoHandlers } = await loadModule();

        registerInfoHandlers({
            registerIpcHandle: null as any,
            appRef: mockAppRef,
            fs: mockFs,
            path: mockPath,
            CONSTANTS,
            logWithContext: mockLogWithContext,
        });

        expect(mockRegisterIpcHandle).not.toHaveBeenCalled();
    });

    describe("getAppVersion handler", () => {
        it("should return app version", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getAppVersion"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("1.0.0");
            expect(mockApp.getVersion).toHaveBeenCalled();
        });

        it("should return empty string if app is unavailable", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: vi.fn().mockReturnValue(null),
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getAppVersion"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("");
        });

        it("should return empty string if getVersion is not a function", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: vi.fn().mockReturnValue({}),
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

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

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

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

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

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

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

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

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

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

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

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

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getLicenseInfo"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("Unknown");
        });

        it("should use process.cwd() if getAppPath is unavailable", async () => {
            const { registerInfoHandlers } = await loadModule();

            const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/cwd/path");

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: vi.fn().mockReturnValue({}),
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

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

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: vi.fn().mockReturnValue(null),
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getLicenseInfo"
            )?.[1];

            await handler({});

            expect(cwdSpy).toHaveBeenCalled();

            cwdSpy.mockRestore();
        });

        it("should return Unknown if fs is unavailable", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: null as any,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

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

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: {} as any,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

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

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

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

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

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

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: undefined as any,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getLicenseInfo"
            )?.[1];

            const result = await handler({});

            expect(result).toBe("Unknown");
        });
    });

    describe("map-tab:get handler", () => {
        it("should register the handler", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "map-tab:get"
            )?.[1];

            expect(handler).toBeDefined();
            expect(typeof handler).toBe("function");
        });

        // Note: Full testing of map-tab:get requires Electron integration tests
        // as it dynamically requires electron-conf which needs app.getPath()
    });

    describe("theme:get handler", () => {
        it("should register the handler", async () => {
            const { registerInfoHandlers } = await loadModule();

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "theme:get"
            )?.[1];

            expect(handler).toBeDefined();
            expect(typeof handler).toBe("function");
        });

        // Note: Full testing of theme:get requires Electron integration tests
        // as it dynamically requires electron-conf which needs app.getPath()
    });

    describe("error handling in wrapper", () => {
        it("should log and rethrow errors from handlers", async () => {
            const { registerInfoHandlers } = await loadModule();

            const error = new Error("Handler error");
            mockApp.getVersion.mockImplementation(() => {
                throw error;
            });

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: mockLogWithContext,
            });

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

            registerInfoHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                appRef: mockAppRef,
                fs: mockFs,
                path: mockPath,
                CONSTANTS,
                logWithContext: undefined as any,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "getAppVersion"
            )?.[1];

            await expect(handler({})).rejects.toThrow();
        });
    });
});
