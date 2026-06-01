// @vitest-environment node
import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerExternalHandlers } from "../../../../electron-app/main/ipc/registerExternalHandlers.js";

type ExternalInvokeChannel =
    | "gyazo:server:start"
    | "gyazo:server:stop"
    | "shell:openExternal";
type ExternalIpcHandler = (event: unknown, ...args: unknown[]) => unknown;
type RegisterIpcHandle = (
    channel: ExternalInvokeChannel,
    handler: ExternalIpcHandler
) => void;
type ExternalShell = {
    openExternal: Mock<(url: string) => Promise<void>>;
};
type GyazoServerStartResponse = { port: number };
type GyazoServerStopResponse = { stopped: boolean };
type StartGyazoOAuthServer = (
    port?: number
) => Promise<GyazoServerStartResponse>;
type StopGyazoOAuthServer = () => Promise<GyazoServerStopResponse>;
type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;
type RegisterExternalHandlersTestOptions = {
    logWithContext?: LogWithContext | null;
    registerIpcHandle?: RegisterIpcHandle | null;
    shellRef?: (() => ExternalShell | null | undefined) | null;
    startGyazoOAuthServer?: StartGyazoOAuthServer | null;
    stopGyazoOAuthServer?: StopGyazoOAuthServer | null;
};

describe("registerExternalHandlers", () => {
    let mockRegisterIpcHandle: Mock<RegisterIpcHandle>;
    let mockShellRef: Mock<() => ExternalShell | null | undefined>;
    let mockStartGyazoOAuthServer: Mock<StartGyazoOAuthServer>;
    let mockStopGyazoOAuthServer: Mock<StopGyazoOAuthServer>;
    let mockLogWithContext: Mock<LogWithContext>;
    let mockShell: ExternalShell;

    beforeEach(() => {
        mockShell = {
            openExternal: vi
                .fn<(url: string) => Promise<void>>()
                .mockResolvedValue(undefined),
        };
        mockShellRef = vi
            .fn<() => ExternalShell | null | undefined>()
            .mockReturnValue(mockShell);
        mockRegisterIpcHandle = vi.fn<RegisterIpcHandle>();
        mockStartGyazoOAuthServer = vi
            .fn<StartGyazoOAuthServer>()
            .mockResolvedValue({ port: 3000 });
        mockStopGyazoOAuthServer = vi
            .fn<StopGyazoOAuthServer>()
            .mockResolvedValue({ stopped: true });
        mockLogWithContext = vi.fn<LogWithContext>();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    function registerDefaultHandlers(
        overrides: RegisterExternalHandlersTestOptions = {}
    ): void {
        registerExternalHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            shellRef: mockShellRef,
            startGyazoOAuthServer: mockStartGyazoOAuthServer,
            stopGyazoOAuthServer: mockStopGyazoOAuthServer,
            logWithContext: mockLogWithContext,
            ...overrides,
        });
    }

    function getRegisteredHandler(
        channel: ExternalInvokeChannel
    ): ExternalIpcHandler {
        const handler = mockRegisterIpcHandle.mock.calls.find(
            ([registeredChannel]) => registeredChannel === channel
        )?.[1];

        if (typeof handler !== "function") {
            throw new TypeError(`${channel} handler was not registered`);
        }

        return handler;
    }

    function getShellOpenSnapshot(): {
        logCalls: unknown[][];
        openExternalCalls: unknown[][];
    } {
        return {
            logCalls: mockLogWithContext.mock.calls,
            openExternalCalls: mockShell.openExternal.mock.calls,
        };
    }

    describe("registration", () => {
        it("registers all three IPC handlers when given valid registerIpcHandle", () => {
            expect.assertions(6);

            registerDefaultHandlers();

            expect(mockRegisterIpcHandle).toHaveBeenCalledTimes(3);

            const registeredChannels = new Map(
                mockRegisterIpcHandle.mock.calls
            );
            expect(
                mockRegisterIpcHandle.mock.calls.map(([channel, handler]) => [
                    channel,
                    registeredChannels.get(channel) === handler,
                ])
            ).toStrictEqual([
                ["shell:openExternal", true],
                ["gyazo:server:start", true],
                ["gyazo:server:stop", true],
            ]);
            expect(registeredChannels.get("shell:openExternal")).toBeTypeOf(
                "function"
            );
            expect(registeredChannels.get("gyazo:server:start")).toBeTypeOf(
                "function"
            );
            expect(registeredChannels.get("gyazo:server:stop")).toBeTypeOf(
                "function"
            );
            expect([...registeredChannels.keys()].sort()).toStrictEqual([
                "gyazo:server:start",
                "gyazo:server:stop",
                "shell:openExternal",
            ]);
        });

        it("does not register handlers when registerIpcHandle is not a function", () => {
            expect.assertions(4);

            expect(
                registerExternalHandlers({
                    registerIpcHandle: null,
                    shellRef: mockShellRef,
                    startGyazoOAuthServer: mockStartGyazoOAuthServer,
                    stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                    logWithContext: mockLogWithContext,
                })
            ).toBeUndefined();

            expect(mockShellRef).not.toHaveBeenCalled();
            expect(mockStartGyazoOAuthServer).not.toHaveBeenCalled();
            expect(mockStopGyazoOAuthServer).not.toHaveBeenCalled();
        });

        it("does not register handlers when registerIpcHandle is undefined", () => {
            expect.assertions(4);

            expect(
                registerExternalHandlers({
                    registerIpcHandle: undefined,
                    shellRef: mockShellRef,
                    startGyazoOAuthServer: mockStartGyazoOAuthServer,
                    stopGyazoOAuthServer: mockStopGyazoOAuthServer,
                    logWithContext: mockLogWithContext,
                })
            ).toBeUndefined();

            expect(mockShellRef).not.toHaveBeenCalled();
            expect(mockStartGyazoOAuthServer).not.toHaveBeenCalled();
            expect(mockStopGyazoOAuthServer).not.toHaveBeenCalled();
        });
    });

    describe("shell:openExternal handler", () => {
        let shellOpenExternalHandler: ExternalIpcHandler;

        beforeEach(() => {
            registerDefaultHandlers();
            shellOpenExternalHandler =
                getRegisteredHandler("shell:openExternal");
        });

        it("opens a valid HTTPS URL successfully", async () => {
            expect.assertions(3);

            const result = await shellOpenExternalHandler(
                {},
                "https://example.com"
            );

            expect(mockShellRef).toHaveBeenCalledWith();
            expect(mockShell.openExternal).toHaveBeenCalledWith(
                "https://example.com"
            );
            expect({
                result,
                shell: getShellOpenSnapshot(),
            }).toStrictEqual({
                result: true,
                shell: {
                    logCalls: [],
                    openExternalCalls: [["https://example.com"]],
                },
            });
        });

        it("opens a valid mailto URL successfully", async () => {
            expect.assertions(3);

            const result = await shellOpenExternalHandler(
                {},
                "mailto:test@example.com"
            );

            expect(mockShellRef).toHaveBeenCalledWith();
            expect(mockShell.openExternal).toHaveBeenCalledWith(
                "mailto:test@example.com"
            );
            expect({
                result,
                shell: getShellOpenSnapshot(),
            }).toStrictEqual({
                result: true,
                shell: {
                    logCalls: [],
                    openExternalCalls: [["mailto:test@example.com"]],
                },
            });
        });

        it("throws error for invalid URL (null)", async () => {
            expect.assertions(3);

            await expect(shellOpenExternalHandler({}, null)).rejects.toThrow(
                "Invalid URL provided"
            );

            expect(mockShell.openExternal).not.toHaveBeenCalled();
            expect(mockLogWithContext).toHaveBeenCalledWith(
                "error",
                "Error in shell:openExternal:",
                {
                    error: "Invalid URL provided",
                }
            );
        });

        it("throws error for invalid URL (undefined)", async () => {
            expect.assertions(3);

            await expect(
                shellOpenExternalHandler({}, undefined)
            ).rejects.toThrow("Invalid URL provided");

            expect(mockShell.openExternal).not.toHaveBeenCalled();
            expect(mockLogWithContext).toHaveBeenCalledWith(
                "error",
                "Error in shell:openExternal:",
                {
                    error: "Invalid URL provided",
                }
            );
        });

        it("throws error for invalid URL (not a string)", async () => {
            expect.assertions(2);

            await expect(shellOpenExternalHandler({}, 123)).rejects.toThrow(
                "Invalid URL provided"
            );

            expect(mockShell.openExternal).not.toHaveBeenCalled();
        });

        it("throws error for disallowed HTTP URL", async () => {
            expect.assertions(3);

            const disallowedUrl = new URL("https://example.com");
            disallowedUrl.protocol = "http:";

            await expect(
                shellOpenExternalHandler({}, disallowedUrl.href)
            ).rejects.toThrow("Only HTTPS and mailto URLs are allowed");

            expect(mockShell.openExternal).not.toHaveBeenCalled();
            expect(mockLogWithContext).toHaveBeenCalledWith(
                "error",
                "Error in shell:openExternal:",
                {
                    error: "Only HTTPS and mailto URLs are allowed",
                }
            );
        });

        it("throws error for disallowed URL (ftp://)", async () => {
            expect.assertions(3);

            const disallowedUrl = new URL("https://example.com");
            disallowedUrl.protocol = "ftp:";

            await expect(
                shellOpenExternalHandler({}, disallowedUrl.href)
            ).rejects.toThrow("Only HTTPS and mailto URLs are allowed");

            expect(mockShell.openExternal).not.toHaveBeenCalled();
            expect(mockLogWithContext).toHaveBeenCalledWith(
                "error",
                "Error in shell:openExternal:",
                {
                    error: "Only HTTPS and mailto URLs are allowed",
                }
            );
        });

        it("throws error for disallowed URL (file://)", async () => {
            expect.assertions(2);

            await expect(
                shellOpenExternalHandler({}, "file:///etc/passwd")
            ).rejects.toThrow("Only HTTPS and mailto URLs are allowed");

            expect(mockShell.openExternal).not.toHaveBeenCalled();
        });

        it("throws error for disallowed URL (javascript://)", async () => {
            expect.assertions(2);

            await expect(
                shellOpenExternalHandler({}, "javascript:alert('xss')")
            ).rejects.toThrow("Only HTTPS and mailto URLs are allowed");

            expect(mockShell.openExternal).not.toHaveBeenCalled();
        });

        it("throws error for credentialed URL (https://user:pass@)", async () => {
            expect.assertions(2);

            await expect(
                shellOpenExternalHandler({}, "https://user:pass@example.com")
            ).rejects.toThrow("Credentials in URLs are not allowed");
            expect(mockShell.openExternal).not.toHaveBeenCalled();
        });

        it("throws error when shellRef returns null", async () => {
            expect.assertions(2);

            mockShellRef.mockReturnValue(null);

            await expect(
                shellOpenExternalHandler({}, "https://example.com")
            ).rejects.toThrow("shell.openExternal unavailable");

            expect(mockLogWithContext).toHaveBeenCalledWith(
                "error",
                "Error in shell:openExternal:",
                {
                    error: "shell.openExternal unavailable",
                }
            );
        });

        it("throws error when shellRef returns undefined", async () => {
            expect.assertions(1);

            mockShellRef.mockReturnValue(undefined);

            await expect(
                shellOpenExternalHandler({}, "https://example.com")
            ).rejects.toThrow("shell.openExternal unavailable");
        });

        it("throws error when shell object has no openExternal method", async () => {
            expect.assertions(1);

            mockShellRef.mockReturnValue({} as ExternalShell);

            await expect(
                shellOpenExternalHandler({}, "https://example.com")
            ).rejects.toThrow("shell.openExternal unavailable");
        });

        it("throws error when shell.openExternal is not a function", async () => {
            expect.assertions(1);

            mockShellRef.mockReturnValue({
                openExternal: "not a function",
            } as unknown as ExternalShell);

            await expect(
                shellOpenExternalHandler({}, "https://example.com")
            ).rejects.toThrow("shell.openExternal unavailable");
        });

        it("propagates errors from shell.openExternal", async () => {
            expect.assertions(2);

            const testError = new Error("Shell error");
            mockShell.openExternal.mockRejectedValue(testError);

            await expect(
                shellOpenExternalHandler({}, "https://example.com")
            ).rejects.toThrow("Shell error");

            expect(mockLogWithContext).toHaveBeenCalledWith(
                "error",
                "Error in shell:openExternal:",
                {
                    error: "Shell error",
                }
            );
        });

        it("works without logWithContext being provided", async () => {
            expect.assertions(1);

            mockRegisterIpcHandle.mockClear();
            registerDefaultHandlers({ logWithContext: null });

            const handler = getRegisteredHandler("shell:openExternal");
            const result = await handler({}, "https://example.com");

            expect({
                result,
                shell: getShellOpenSnapshot(),
            }).toStrictEqual({
                result: true,
                shell: {
                    logCalls: [],
                    openExternalCalls: [["https://example.com"]],
                },
            });
        });
    });

    describe("gyazo:server:start handler", () => {
        let gyazoStartHandler: ExternalIpcHandler;

        beforeEach(() => {
            registerDefaultHandlers();
            gyazoStartHandler = getRegisteredHandler("gyazo:server:start");
        });

        it("starts Gyazo server with default port 3000", async () => {
            expect.assertions(3);

            const result = await gyazoStartHandler({});

            expect(mockStartGyazoOAuthServer).toHaveBeenCalledWith(3000);
            expect(result).toEqual({ port: 3000 });
            expect(mockLogWithContext).not.toHaveBeenCalled();
        });

        it("starts Gyazo server with custom port", async () => {
            expect.assertions(2);

            const result = await gyazoStartHandler({}, 5000);

            expect(mockStartGyazoOAuthServer).toHaveBeenCalledWith(5000);
            expect(result).toEqual({ port: 3000 });
        });

        it("rejects invalid port values", async () => {
            expect.assertions(2);

            await expect(gyazoStartHandler({}, "not-a-number")).rejects.toThrow(
                "Invalid port provided"
            );
            expect(mockStartGyazoOAuthServer).not.toHaveBeenCalled();
        });

        it("rejects privileged ports (<1024)", async () => {
            expect.assertions(2);

            await expect(gyazoStartHandler({}, 80)).rejects.toThrow(
                "Invalid port provided"
            );
            expect(mockStartGyazoOAuthServer).not.toHaveBeenCalled();
        });

        it("rejects when startGyazoOAuthServer is unavailable", async () => {
            expect.assertions(1);

            mockRegisterIpcHandle.mockClear();
            registerDefaultHandlers({ startGyazoOAuthServer: null });

            const handler = getRegisteredHandler("gyazo:server:start");

            await expect(handler({}, 3000)).rejects.toThrow(
                "Gyazo OAuth server start unavailable"
            );
        });

        it("handles errors from startGyazoOAuthServer", async () => {
            expect.assertions(2);

            const testError = new Error("Failed to start server");
            mockStartGyazoOAuthServer.mockRejectedValue(testError);

            await expect(gyazoStartHandler({}, 3000)).rejects.toThrow(
                "Failed to start server"
            );

            expect(mockLogWithContext).toHaveBeenCalledWith(
                "error",
                "Error in gyazo:server:start:",
                {
                    error: "Failed to start server",
                }
            );
        });

        it("works without logWithContext being provided", async () => {
            expect.assertions(1);

            mockRegisterIpcHandle.mockClear();
            registerDefaultHandlers({ logWithContext: null });

            const handler = getRegisteredHandler("gyazo:server:start");
            const result = await handler({});

            expect(result).toEqual({ port: 3000 });
        });
    });

    describe("gyazo:server:stop handler", () => {
        let gyazoStopHandler: ExternalIpcHandler;

        beforeEach(() => {
            registerDefaultHandlers();
            gyazoStopHandler = getRegisteredHandler("gyazo:server:stop");
        });

        it("stops Gyazo server successfully", async () => {
            expect.assertions(3);

            const result = await gyazoStopHandler({});

            expect(mockStopGyazoOAuthServer).toHaveBeenCalledWith();
            expect(result).toEqual({ stopped: true });
            expect(mockLogWithContext).not.toHaveBeenCalled();
        });

        it("handles errors from stopGyazoOAuthServer", async () => {
            expect.assertions(2);

            const testError = new Error("Failed to stop server");
            mockStopGyazoOAuthServer.mockRejectedValue(testError);

            await expect(gyazoStopHandler({})).rejects.toThrow(
                "Failed to stop server"
            );

            expect(mockLogWithContext).toHaveBeenCalledWith(
                "error",
                "Error in gyazo:server:stop:",
                {
                    error: "Failed to stop server",
                }
            );
        });

        it("works without logWithContext being provided", async () => {
            expect.assertions(1);

            mockRegisterIpcHandle.mockClear();
            registerDefaultHandlers({ logWithContext: null });

            const handler = getRegisteredHandler("gyazo:server:stop");
            const result = await handler({});

            expect(result).toEqual({ stopped: true });
        });

        it("rejects when stopGyazoOAuthServer is unavailable", async () => {
            expect.assertions(1);

            mockRegisterIpcHandle.mockClear();
            registerDefaultHandlers({ stopGyazoOAuthServer: null });

            const handler = getRegisteredHandler("gyazo:server:stop");

            await expect(handler({})).rejects.toThrow(
                "Gyazo OAuth server stop unavailable"
            );
        });
    });

    describe("edge cases", () => {
        it("handles missing shellRef gracefully in openExternal", async () => {
            expect.assertions(1);

            registerDefaultHandlers({ shellRef: undefined });

            const handler = getRegisteredHandler("shell:openExternal");

            await expect(handler({}, "https://example.com")).rejects.toThrow(
                "shell.openExternal unavailable"
            );
        });

        it("handles all dependencies being null/undefined during registration", () => {
            expect.assertions(2);

            expect(
                registerDefaultHandlers({
                    shellRef: null,
                    startGyazoOAuthServer: null,
                    stopGyazoOAuthServer: null,
                    logWithContext: null,
                })
            ).toBeUndefined();

            expect(mockRegisterIpcHandle).toHaveBeenCalledTimes(3);
        });
    });
});
