// @vitest-environment node
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerFileSystemHandlers } from "../../../../electron-app/main/ipc/registerFileSystemHandlers.js";
import {
    approveFilePath,
    __resetForTests,
} from "../../../../electron-app/main/security/fileAccessPolicy.js";

type FileSystemInvokeChannel = "file:read";
type FileSystemIpcHandler = (event: unknown, ...args: unknown[]) => unknown;
type RegisterIpcHandle = (
    channel: FileSystemInvokeChannel,
    handler: FileSystemIpcHandler
) => void;
type ReadFileCallback = (error: Error | null, data?: unknown) => void;
type FileSystemModule = {
    readFile: Mock<(filePath: string, callback: ReadFileCallback) => void>;
};
type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;

describe("registerFileSystemHandlers", () => {
    let registerIpcHandle: Mock<RegisterIpcHandle>;
    let fileSystem: FileSystemModule;
    let logWithContext: Mock<LogWithContext>;

    beforeEach(() => {
        __resetForTests?.();
        registerIpcHandle = vi.fn<RegisterIpcHandle>();
        logWithContext = vi.fn<LogWithContext>();
        fileSystem = {
            readFile:
                vi.fn<(filePath: string, callback: ReadFileCallback) => void>(),
        };
    });

    function registerDefaultHandlers(
        fsOverride: FileSystemModule | Record<string, never> = fileSystem
    ): void {
        registerFileSystemHandlers({
            registerIpcHandle,
            fs: fsOverride,
            logWithContext,
        });
    }

    function getFileReadHandler(): FileSystemIpcHandler {
        const handler = registerIpcHandle.mock.calls.find(
            ([channel]) => channel === "file:read"
        )?.[1];

        expect(handler).toBeTypeOf("function");

        if (typeof handler !== "function") {
            throw new TypeError("file:read handler was not registered");
        }

        return handler;
    }

    it("no-ops when registerIpcHandle is not a function", () => {
        expect.hasAssertions();

        const result = registerFileSystemHandlers({
            registerIpcHandle: null,
            fs: fileSystem,
            logWithContext,
        });

        expect(result).toBeUndefined();
        expect(registerIpcHandle).not.toHaveBeenCalled();
    });

    it("registers file:read handler and resolves buffer slice on success", async () => {
        expect.hasAssertions();

        registerDefaultHandlers();

        expect(registerIpcHandle).toHaveBeenCalledWith(
            "file:read",
            expect.any(Function)
        );

        const handler = getFileReadHandler();
        const mockBuffer = Buffer.from("hello-world");
        fileSystem.readFile.mockImplementation((_path, callback) =>
            callback(null, mockBuffer)
        );

        const approvedPath = approveFilePath("C:/test.fit", { source: "test" });
        const result = await handler({}, approvedPath);

        expect(fileSystem.readFile).toHaveBeenCalledWith(
            approvedPath,
            expect.any(Function)
        );
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(Buffer.from(result as ArrayBuffer).toString()).toBe(
            "hello-world"
        );
        expect(logWithContext).not.toHaveBeenCalled();
    });

    it("rejects and logs when fs.readFile is unavailable", async () => {
        expect.hasAssertions();

        const handlerRegister = vi.fn<RegisterIpcHandle>();
        registerFileSystemHandlers({
            registerIpcHandle: handlerRegister,
            fs: {},
            logWithContext,
        });

        const handler = handlerRegister.mock.calls[0]?.[1];
        expect(handler).toBeTypeOf("function");

        const approvedPath = approveFilePath("C:/missing.fit", {
            source: "test",
        });

        await expect(handler?.({}, approvedPath)).rejects.toThrow(
            "Filesystem module unavailable"
        );

        expect(logWithContext).toHaveBeenCalledWith(
            "error",
            "Error in file:read:",
            expect.objectContaining({
                error: "Filesystem module unavailable",
                filePath: approvedPath,
                authorizedPath: approvedPath,
            })
        );
    });

    it("rejects and logs when readFile errors", async () => {
        expect.hasAssertions();

        const error = new Error("boom");
        fileSystem.readFile.mockImplementation((_path, callback) =>
            callback(error)
        );

        registerDefaultHandlers();
        const handler = getFileReadHandler();

        const approvedPath = approveFilePath("C:/bad.fit", { source: "test" });

        await expect(handler({}, approvedPath)).rejects.toThrow("boom");

        expect(logWithContext).toHaveBeenCalledWith(
            "error",
            "Error in file:read:",
            expect.objectContaining({
                error: "boom",
                filePath: approvedPath,
                authorizedPath: approvedPath,
            })
        );
    });

    it("rejects unapproved paths", async () => {
        expect.hasAssertions();

        registerDefaultHandlers();
        const handler = getFileReadHandler();

        await expect(handler({}, "C:/unapproved.fit")).rejects.toThrow(
            "File access denied"
        );
    });

    it("rejects invalid filePath inputs early", async () => {
        expect.hasAssertions();

        registerDefaultHandlers();
        const handler = getFileReadHandler();

        await expect(handler({}, "   ")).rejects.toThrow(
            "Invalid file path provided"
        );
        await expect(handler({}, null)).rejects.toThrow(
            "Invalid file path provided"
        );

        expect(fileSystem.readFile).not.toHaveBeenCalled();
        expect(logWithContext).toHaveBeenCalledWith(
            "error",
            "Error in file:read:",
            expect.objectContaining({
                error: "Invalid file path provided",
            })
        );
    });

    it("rejects unexpected fs.readFile result types", async () => {
        expect.hasAssertions();

        registerDefaultHandlers();
        const handler = getFileReadHandler();

        fileSystem.readFile.mockImplementation((_path, callback) =>
            callback(null, "hello")
        );

        const approvedPath = approveFilePath("C:/weird.fit", {
            source: "test",
        });
        await expect(handler({}, approvedPath)).rejects.toThrow(
            "Unexpected file read result"
        );
    });
});
