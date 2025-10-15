/**
 * @fileoverview Tests for External Handlers IPC registration
 * Comprehensive test coverage for shell and Gyazo OAuth server IPC handlers
 */

import { createRequire } from "node:module";
import { describe, it, expect, vi, beforeEach } from "vitest";

const requireModule = createRequire(import.meta.url);
const modulePath = "../../../../main/ipc/registerExternalHandlers.js";

const loadModule = async () => {
    vi.resetModules();
    const resolved = requireModule.resolve(modulePath);
    if (requireModule.cache?.[resolved]) {
        delete requireModule.cache[resolved];
    }
    return requireModule(modulePath);
};

describe("registerExternalHandlers", () => {
    let mockRegisterIpcHandle: ReturnType<typeof vi.fn>;
    let mockShellRef: ReturnType<typeof vi.fn>;
    let mockStartGyazoOAuthServer: ReturnType<typeof vi.fn>;
    let mockStopGyazoOAuthServer: ReturnType<typeof vi.fn>;
    let mockExchangeGyazoToken: ReturnType<typeof vi.fn>;
    let mockLogWithContext: ReturnType<typeof vi.fn>;
    let mockShell: { openExternal: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        mockShell = { openExternal: vi.fn().mockResolvedValue(undefined) };
        mockRegisterIpcHandle = vi.fn();
        mockShellRef = vi.fn().mockReturnValue(mockShell);
        mockStartGyazoOAuthServer = vi.fn().mockResolvedValue({ port: 3000, url: "http://localhost:3000" });
        mockStopGyazoOAuthServer = vi.fn().mockResolvedValue({ stopped: true });
        mockExchangeGyazoToken = vi.fn().mockResolvedValue({ access_token: "token" });
        mockLogWithContext = vi.fn();
    });

    it("should register all IPC handlers", async () => {
        const { registerExternalHandlers } = await loadModule();

        registerExternalHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            shellRef: mockShellRef,
            startGyazoOAuthServer: mockStartGyazoOAuthServer,
            stopGyazoOAuthServer: mockStopGyazoOAuthServer,
            exchangeGyazoToken: mockExchangeGyazoToken,
            logWithContext: mockLogWithContext,
        });

        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("shell:openExternal", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("gyazo:server:start", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("gyazo:server:stop", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("gyazo:token:exchange", expect.any(Function));
    });

    it("should wire handlers via the helper to ensure internal coverage", async () => {
        const { wireExternalHandlers } = await loadModule();

        wireExternalHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            shellRef: mockShellRef,
            startGyazoOAuthServer: mockStartGyazoOAuthServer,
            stopGyazoOAuthServer: mockStopGyazoOAuthServer,
            exchangeGyazoToken: mockExchangeGyazoToken,
            logWithContext: mockLogWithContext,
        });

        expect(mockRegisterIpcHandle).toHaveBeenCalledTimes(4);
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("shell:openExternal", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("gyazo:server:start", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("gyazo:server:stop", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("gyazo:token:exchange", expect.any(Function));
    });

    it("should not register handlers if registerIpcHandle is not a function", async () => {
        const { registerExternalHandlers } = await loadModule();

        registerExternalHandlers({
            registerIpcHandle: null as any,
            shellRef: mockShellRef,
            startGyazoOAuthServer: mockStartGyazoOAuthServer,
            stopGyazoOAuthServer: mockStopGyazoOAuthServer,
            exchangeGyazoToken: mockExchangeGyazoToken,
            logWithContext: mockLogWithContext,
        });

        expect(mockRegisterIpcHandle).not.toHaveBeenCalled();
    });

    describe("shell:openExternal handler", () => {
        it("should open valid HTTP URL", async () => {
            const { registerExternalHandlers } = await loadModule();

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                exchangeGyazoToken: mockExchangeGyazoToken,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "shell:openExternal"
            )?.[1];

            expect(handler).toBeDefined();

            const result = await handler({}, "http://example.com");

            expect(mockShell.openExternal).toHaveBeenCalledWith("http://example.com");
            expect(result).toBe(true);
        });

        it("should open valid HTTPS URL", async () => {
            const { registerExternalHandlers } = await loadModule();

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "shell:openExternal"
            )?.[1];

            const result = await handler({}, "https://example.com");

            expect(mockShell.openExternal).toHaveBeenCalledWith("https://example.com");
            expect(result).toBe(true);
        });

        it("should reject invalid URL (not a string)", async () => {
            const { registerExternalHandlers } = await loadModule();

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "shell:openExternal"
            )?.[1];

            await expect(handler({}, null)).rejects.toThrow("Invalid URL provided");
            expect(mockShell.openExternal).not.toHaveBeenCalled();
            expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in shell:openExternal:", expect.any(Object));
        });

        it("should reject empty URL", async () => {
            const { registerExternalHandlers } = await loadModule();

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "shell:openExternal"
            )?.[1];

            await expect(handler({}, "")).rejects.toThrow("Invalid URL provided");
            expect(mockShell.openExternal).not.toHaveBeenCalled();
        });

        it("should reject non-HTTP/HTTPS URLs", async () => {
            const { registerExternalHandlers } = await loadModule();

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "shell:openExternal"
            )?.[1];

            await expect(handler({}, "file:///etc/passwd")).rejects.toThrow("Only HTTP and HTTPS URLs are allowed");
            await expect(handler({}, "ftp://example.com")).rejects.toThrow("Only HTTP and HTTPS URLs are allowed");
            expect(mockShell.openExternal).not.toHaveBeenCalled();
        });

        it("should handle missing shell reference", async () => {
            const { registerExternalHandlers } = await loadModule();

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: vi.fn().mockReturnValue(null),
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "shell:openExternal"
            )?.[1];

            await expect(handler({}, "https://example.com")).rejects.toThrow("shell.openExternal unavailable");
            expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in shell:openExternal:", expect.any(Object));
        });

        it("should handle shell without openExternal method", async () => {
            const { registerExternalHandlers } = await loadModule();

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: vi.fn().mockReturnValue({}),
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "shell:openExternal"
            )?.[1];

            await expect(handler({}, "https://example.com")).rejects.toThrow("shell.openExternal unavailable");
        });

        it("should handle undefined shellRef", async () => {
            const { registerExternalHandlers } = await loadModule();

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: undefined as any,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "shell:openExternal"
            )?.[1];

            await expect(handler({}, "https://example.com")).rejects.toThrow("shell.openExternal unavailable");
        });

        it("should log and rethrow shell.openExternal errors", async () => {
            const { registerExternalHandlers } = await loadModule();

            const error = new Error("Network error");
            mockShell.openExternal.mockRejectedValue(error);

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "shell:openExternal"
            )?.[1];

            await expect(handler({}, "https://example.com")).rejects.toThrow("Network error");
            expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in shell:openExternal:", {
                error: "Network error",
            });
        });

        it("should handle missing logWithContext gracefully", async () => {
            const { registerExternalHandlers } = await loadModule();

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: vi.fn().mockReturnValue(null),
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: undefined as any,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "shell:openExternal"
            )?.[1];

            await expect(handler({}, "https://example.com")).rejects.toThrow("shell.openExternal unavailable");
            // Should not throw error even without logWithContext
        });
    });

    describe("gyazo:server:start handler", () => {
        it("should start Gyazo OAuth server with default port", async () => {
            const { registerExternalHandlers } = await loadModule();

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "gyazo:server:start"
            )?.[1];

            const result = await handler({});

            expect(mockStartGyazoOAuthServer).toHaveBeenCalledWith(3000);
            expect(result).toEqual({ port: 3000, url: "http://localhost:3000" });
        });

        it("should start Gyazo OAuth server with custom port", async () => {
            const { registerExternalHandlers } = await loadModule();

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "gyazo:server:start"
            )?.[1];

            const result = await handler({}, 8080);

            expect(mockStartGyazoOAuthServer).toHaveBeenCalledWith(8080);
            expect(result).toEqual({ port: 3000, url: "http://localhost:3000" });
        });

        it("should log and rethrow server start errors", async () => {
            const { registerExternalHandlers } = await loadModule();

            const error = new Error("Port already in use");
            mockStartGyazoOAuthServer.mockRejectedValue(error);

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "gyazo:server:start"
            )?.[1];

            await expect(handler({}, 3000)).rejects.toThrow("Port already in use");
            expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in gyazo:server:start:", {
                error: "Port already in use",
            });
        });

        it("should handle missing logWithContext in server start", async () => {
            const { registerExternalHandlers } = await loadModule();

            const error = new Error("Server error");
            mockStartGyazoOAuthServer.mockRejectedValue(error);

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: undefined as any,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "gyazo:server:start"
            )?.[1];

            await expect(handler({}, 3000)).rejects.toThrow("Server error");
        });
    });

    describe("gyazo:server:stop handler", () => {
        it("should stop Gyazo OAuth server", async () => {
            const { registerExternalHandlers } = await loadModule();

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                exchangeGyazoToken: mockExchangeGyazoToken,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "gyazo:server:stop"
            )?.[1];

            const result = await handler({});

            expect(mockStopGyazoOAuthServer).toHaveBeenCalled();
            expect(result).toEqual({ stopped: true });
        });

        it("should log and rethrow server stop errors", async () => {
            const { registerExternalHandlers } = await loadModule();

            const error = new Error("Server not running");
            mockStopGyazoOAuthServer.mockRejectedValue(error);

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                exchangeGyazoToken: mockExchangeGyazoToken,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "gyazo:server:stop"
            )?.[1];

            await expect(handler({})).rejects.toThrow("Server not running");
            expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in gyazo:server:stop:", {
                error: "Server not running",
            });
        });

        it("should handle missing logWithContext in server stop", async () => {
            const { registerExternalHandlers } = await loadModule();

            const error = new Error("Stop error");
            mockStopGyazoOAuthServer.mockRejectedValue(error);

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                exchangeGyazoToken: mockExchangeGyazoToken,
                logWithContext: undefined as any,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "gyazo:server:stop"
            )?.[1];

            await expect(handler({})).rejects.toThrow("Stop error");
        });
    });

    describe("gyazo:token:exchange handler", () => {
        it("should exchange Gyazo token with provided payload", async () => {
            const { registerExternalHandlers } = await loadModule();

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                exchangeGyazoToken: mockExchangeGyazoToken,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "gyazo:token:exchange"
            )?.[1];

            const payload = {
                clientId: "client",
                clientSecret: "secret",
                code: "code",
                redirectUri: "http://localhost/callback",
                tokenUrl: "https://gyazo.com/oauth/token",
            };

            const result = await handler({}, payload);

            expect(mockExchangeGyazoToken).toHaveBeenCalledWith(payload);
            expect(result).toEqual({ access_token: "token" });
        });

        it("should log and rethrow token exchange errors", async () => {
            const { registerExternalHandlers } = await loadModule();

            const error = new Error("Token failure");
            mockExchangeGyazoToken.mockRejectedValue(error);

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                exchangeGyazoToken: mockExchangeGyazoToken,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "gyazo:token:exchange"
            )?.[1];

            await expect(handler({}, {})).rejects.toThrow("Token failure");
            expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in gyazo:token:exchange:", {
                error: "Token failure",
            });
        });
    });

    describe("edge cases", () => {
        it("should handle all optional parameters being undefined", async () => {
            const { registerExternalHandlers } = await loadModule();

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: undefined as any,
                startGyazoOAuthServer: undefined as any,
                stopGyazoOAuthServer: undefined as any,
                logWithContext: undefined as any,
            });

            expect(mockRegisterIpcHandle).toHaveBeenCalledTimes(3);
        });

        it("should handle non-function shellRef gracefully", async () => {
            const { registerExternalHandlers } = await loadModule();

            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: "not a function" as any,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls.find(
                (call: any) => call[0] === "shell:openExternal"
            )?.[1];

            await expect(handler({}, "https://example.com")).rejects.toThrow();
        });
    });
});
