/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerExternalHandlers } from "../../../../main/ipc/registerExternalHandlers.js";

describe("registerExternalHandlers", () => {
    let mockRegisterIpcHandle;
    let mockShellRef;
    let mockStartGyazoOAuthServer;
    let mockStopGyazoOAuthServer;
    let mockLogWithContext;
    let mockShell;

    beforeEach(() => {
        mockShell = {
            openExternal: vi.fn().mockResolvedValue(undefined),
        };
        mockShellRef = vi.fn().mockReturnValue(mockShell);
        mockRegisterIpcHandle = vi.fn();
        mockStartGyazoOAuthServer = vi.fn().mockResolvedValue({ port: 3000 });
        mockStopGyazoOAuthServer = vi.fn().mockResolvedValue({ stopped: true });
        mockLogWithContext = vi.fn();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("registration", () => {
        it("should register all three IPC handlers when given valid registerIpcHandle", () => {
            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            expect(mockRegisterIpcHandle).toHaveBeenCalledTimes(3);
            expect(mockRegisterIpcHandle).toHaveBeenCalledWith("shell:openExternal", expect.any(Function));
            expect(mockRegisterIpcHandle).toHaveBeenCalledWith("gyazo:server:start", expect.any(Function));
            expect(mockRegisterIpcHandle).toHaveBeenCalledWith("gyazo:server:stop", expect.any(Function));
        });

        it("should not register handlers when registerIpcHandle is not a function", () => {
            registerExternalHandlers({
                registerIpcHandle: null,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            // No calls should be made since registerIpcHandle is invalid
            expect(mockShellRef).not.toHaveBeenCalled();
        });

        it("should not register handlers when registerIpcHandle is undefined", () => {
            registerExternalHandlers({
                registerIpcHandle: undefined,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            // No calls should be made
            expect(mockShellRef).not.toHaveBeenCalled();
        });
    });

    describe("shell:openExternal handler", () => {
        let shellOpenExternalHandler;

        beforeEach(() => {
            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            // Extract the handler for shell:openExternal
            const calls = mockRegisterIpcHandle.mock.calls;
            const shellCall = calls.find((call) => call[0] === "shell:openExternal");
            shellOpenExternalHandler = shellCall[1];
        });

        it("should open a valid HTTP URL successfully", async () => {
            const result = await shellOpenExternalHandler({}, "http://example.com");

            expect(mockShellRef).toHaveBeenCalled();
            expect(mockShell.openExternal).toHaveBeenCalledWith("http://example.com");
            expect(result).toBe(true);
            expect(mockLogWithContext).not.toHaveBeenCalled();
        });

        it("should open a valid HTTPS URL successfully", async () => {
            const result = await shellOpenExternalHandler({}, "https://example.com");

            expect(mockShellRef).toHaveBeenCalled();
            expect(mockShell.openExternal).toHaveBeenCalledWith("https://example.com");
            expect(result).toBe(true);
            expect(mockLogWithContext).not.toHaveBeenCalled();
        });

        it("should throw error for invalid URL (null)", async () => {
            await expect(shellOpenExternalHandler({}, null)).rejects.toThrow("Invalid URL provided");

            expect(mockShell.openExternal).not.toHaveBeenCalled();
            expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in shell:openExternal:", {
                error: "Invalid URL provided",
            });
        });

        it("should throw error for invalid URL (undefined)", async () => {
            await expect(shellOpenExternalHandler({}, undefined)).rejects.toThrow("Invalid URL provided");

            expect(mockShell.openExternal).not.toHaveBeenCalled();
            expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in shell:openExternal:", {
                error: "Invalid URL provided",
            });
        });

        it("should throw error for invalid URL (not a string)", async () => {
            await expect(shellOpenExternalHandler({}, 123)).rejects.toThrow("Invalid URL provided");

            expect(mockShell.openExternal).not.toHaveBeenCalled();
        });

        it("should throw error for non-HTTP/HTTPS URL (ftp://)", async () => {
            await expect(shellOpenExternalHandler({}, "ftp://example.com")).rejects.toThrow(
                "Only HTTP and HTTPS URLs are allowed"
            );

            expect(mockShell.openExternal).not.toHaveBeenCalled();
            expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in shell:openExternal:", {
                error: "Only HTTP and HTTPS URLs are allowed",
            });
        });

        it("should throw error for non-HTTP/HTTPS URL (file://)", async () => {
            await expect(shellOpenExternalHandler({}, "file:///etc/passwd")).rejects.toThrow(
                "Only HTTP and HTTPS URLs are allowed"
            );

            expect(mockShell.openExternal).not.toHaveBeenCalled();
        });

        it("should throw error for non-HTTP/HTTPS URL (javascript://)", async () => {
            await expect(shellOpenExternalHandler({}, "javascript:alert('xss')")).rejects.toThrow(
                "Only HTTP and HTTPS URLs are allowed"
            );

            expect(mockShell.openExternal).not.toHaveBeenCalled();
        });

        it("should throw error for credentialed URL (https://user:pass@)", async () => {
            await expect(shellOpenExternalHandler({}, "https://user:pass@example.com")).rejects.toThrow(
                "Credentials in URLs are not allowed"
            );
            expect(mockShell.openExternal).not.toHaveBeenCalled();
        });

        it("should throw error when shellRef returns null", async () => {
            mockShellRef.mockReturnValue(null);

            await expect(shellOpenExternalHandler({}, "https://example.com")).rejects.toThrow(
                "shell.openExternal unavailable"
            );

            expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in shell:openExternal:", {
                error: "shell.openExternal unavailable",
            });
        });

        it("should throw error when shellRef returns undefined", async () => {
            mockShellRef.mockReturnValue(undefined);

            await expect(shellOpenExternalHandler({}, "https://example.com")).rejects.toThrow(
                "shell.openExternal unavailable"
            );
        });

        it("should throw error when shell object has no openExternal method", async () => {
            mockShellRef.mockReturnValue({});

            await expect(shellOpenExternalHandler({}, "https://example.com")).rejects.toThrow(
                "shell.openExternal unavailable"
            );
        });

        it("should throw error when shell.openExternal is not a function", async () => {
            mockShellRef.mockReturnValue({ openExternal: "not a function" });

            await expect(shellOpenExternalHandler({}, "https://example.com")).rejects.toThrow(
                "shell.openExternal unavailable"
            );
        });

        it("should propagate errors from shell.openExternal", async () => {
            const testError = new Error("Shell error");
            mockShell.openExternal.mockRejectedValue(testError);

            await expect(shellOpenExternalHandler({}, "https://example.com")).rejects.toThrow("Shell error");

            expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in shell:openExternal:", {
                error: "Shell error",
            });
        });

        it("should work without logWithContext being provided", async () => {
            // Re-register without logWithContext
            mockRegisterIpcHandle.mockClear();
            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: null,
            });

            const calls = mockRegisterIpcHandle.mock.calls;
            const shellCall = calls.find((call) => call[0] === "shell:openExternal");
            const handler = shellCall[1];

            const result = await handler({}, "https://example.com");
            expect(result).toBe(true);
        });
    });

    describe("gyazo:server:start handler", () => {
        let gyazoStartHandler;

        beforeEach(() => {
            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const calls = mockRegisterIpcHandle.mock.calls;
            const gyazoCall = calls.find((call) => call[0] === "gyazo:server:start");
            gyazoStartHandler = gyazoCall[1];
        });

        it("should start Gyazo server with default port 3000", async () => {
            const result = await gyazoStartHandler({});

            expect(mockStartGyazoOAuthServer).toHaveBeenCalledWith(3000);
            expect(result).toEqual({ port: 3000 });
            expect(mockLogWithContext).not.toHaveBeenCalled();
        });

        it("should start Gyazo server with custom port", async () => {
            const result = await gyazoStartHandler({}, 5000);

            expect(mockStartGyazoOAuthServer).toHaveBeenCalledWith(5000);
            expect(result).toEqual({ port: 3000 });
        });

        it("should reject invalid port values", async () => {
            await expect(gyazoStartHandler({}, "not-a-number")).rejects.toThrow("Invalid port provided");
            expect(mockStartGyazoOAuthServer).not.toHaveBeenCalled();
        });

        it("should reject privileged ports (<1024)", async () => {
            await expect(gyazoStartHandler({}, 80)).rejects.toThrow("Invalid port provided");
            expect(mockStartGyazoOAuthServer).not.toHaveBeenCalled();
        });

        it("should reject when startGyazoOAuthServer is unavailable", async () => {
            mockRegisterIpcHandle.mockClear();
            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: null,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const calls = mockRegisterIpcHandle.mock.calls;
            const gyazoCall = calls
                .slice()
                .reverse()
                .find((call) => call[0] === "gyazo:server:start");
            const handler = gyazoCall[1];

            await expect(handler({}, 3000)).rejects.toThrow("Gyazo OAuth server start unavailable");
        });

        it("should handle errors from startGyazoOAuthServer", async () => {
            const testError = new Error("Failed to start server");
            mockStartGyazoOAuthServer.mockRejectedValue(testError);

            await expect(gyazoStartHandler({}, 3000)).rejects.toThrow("Failed to start server");

            expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in gyazo:server:start:", {
                error: "Failed to start server",
            });
        });

        it("should work without logWithContext being provided", async () => {
            mockRegisterIpcHandle.mockClear();
            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: null,
            });

            const calls = mockRegisterIpcHandle.mock.calls;
            const gyazoCall = calls.find((call) => call[0] === "gyazo:server:start");
            const handler = gyazoCall[1];

            const result = await handler({});
            expect(result).toEqual({ port: 3000 });
        });
    });

    describe("gyazo:server:stop handler", () => {
        let gyazoStopHandler;

        beforeEach(() => {
            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const calls = mockRegisterIpcHandle.mock.calls;
            const gyazoCall = calls.find((call) => call[0] === "gyazo:server:stop");
            gyazoStopHandler = gyazoCall[1];
        });

        it("should stop Gyazo server successfully", async () => {
            const result = await gyazoStopHandler({});

            expect(mockStopGyazoOAuthServer).toHaveBeenCalled();
            expect(result).toEqual({ stopped: true });
            expect(mockLogWithContext).not.toHaveBeenCalled();
        });

        it("should handle errors from stopGyazoOAuthServer", async () => {
            const testError = new Error("Failed to stop server");
            mockStopGyazoOAuthServer.mockRejectedValue(testError);

            await expect(gyazoStopHandler({})).rejects.toThrow("Failed to stop server");

            expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in gyazo:server:stop:", {
                error: "Failed to stop server",
            });
        });

        it("should work without logWithContext being provided", async () => {
            mockRegisterIpcHandle.mockClear();
            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: null,
            });

            const calls = mockRegisterIpcHandle.mock.calls;
            const gyazoCall = calls.find((call) => call[0] === "gyazo:server:stop");
            const handler = gyazoCall[1];

            const result = await handler({});
            expect(result).toEqual({ stopped: true });
        });

        it("should reject when stopGyazoOAuthServer is unavailable", async () => {
            mockRegisterIpcHandle.mockClear();
            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: mockShellRef,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: null,
                logWithContext: mockLogWithContext,
            });

            const calls = mockRegisterIpcHandle.mock.calls;
            const gyazoCall = calls
                .slice()
                .reverse()
                .find((call) => call[0] === "gyazo:server:stop");
            const handler = gyazoCall[1];

            await expect(handler({})).rejects.toThrow("Gyazo OAuth server stop unavailable");
        });
    });

    describe("edge cases", () => {
        it("should handle missing shellRef gracefully in openExternal", async () => {
            registerExternalHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                shellRef: undefined,
                startGyazoOAuthServer: mockStartGyazoOAuthServer,
                stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                logWithContext: mockLogWithContext,
            });

            const calls = mockRegisterIpcHandle.mock.calls;
            const shellCall = calls.find((call) => call[0] === "shell:openExternal");
            const handler = shellCall[1];

            await expect(handler({}, "https://example.com")).rejects.toThrow("shell.openExternal unavailable");
        });

        it("should handle all dependencies being null/undefined", () => {
            // Should not throw during registration
            expect(() => {
                registerExternalHandlers({
                    registerIpcHandle: mockRegisterIpcHandle,
                    shellRef: null,
                    startGyazoOAuthServer: null,
                    stopGyazoOAuthServer: null,
                    logWithContext: null,
                });
            }).not.toThrow();

            expect(mockRegisterIpcHandle).toHaveBeenCalledTimes(3);
        });
    });
});
