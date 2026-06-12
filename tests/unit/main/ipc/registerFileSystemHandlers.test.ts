// @vitest-environment node
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_FIT_FILE_BYTES } from "../../../../electron-app/main/ipc/fileReadPayload.js";
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
type StatCallback = (error: Error | null, stats?: { size: number }) => void;
type FileSystemModule = {
    readFile: Mock<(filePath: string, callback: ReadFileCallback) => void>;
    stat?: Mock<(filePath: string, callback: StatCallback) => void>;
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
            stat: vi
                .fn<(filePath: string, callback: StatCallback) => void>()
                .mockImplementation((_path, callback) =>
                    callback(null, { size: 0 })
                ),
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

    function getRequiredMockCall<T extends unknown[]>(
        calls: T[],
        label: string
    ): T {
        const call = calls.at(0);

        if (!call) {
            throw new TypeError(`Expected ${label} call`);
        }

        return call;
    }

    function getRequiredStatMock(): NonNullable<FileSystemModule["stat"]> {
        const stat = fileSystem.stat;

        if (!stat) {
            throw new TypeError("Expected fs.stat mock");
        }

        return stat;
    }

    function getFileReadHandler(
        handleMock: Mock<RegisterIpcHandle> = registerIpcHandle
    ): FileSystemIpcHandler {
        const registration = handleMock.mock.calls.find(
            ([channel]) => channel === "file:read"
        );

        if (!registration) {
            throw new TypeError("file:read handler was not registered");
        }

        const handler = registration[1];

        if (typeof handler !== "function") {
            throw new TypeError("file:read handler was not registered");
        }

        return handler;
    }

    it("no-ops when registerIpcHandle is not a function", () => {
        expect.assertions(3);

        expect(
            registerFileSystemHandlers({
                registerIpcHandle: null,
                fs: fileSystem,
                logWithContext,
            })
        ).toBeUndefined();

        expect(registerIpcHandle).not.toHaveBeenCalled();
        expect(fileSystem.readFile).not.toHaveBeenCalled();
    });

    it("registers file:read handler and resolves buffer slice on success", async () => {
        expect.assertions(5);

        registerDefaultHandlers();

        const handler = getFileReadHandler();
        expect(registerIpcHandle.mock.calls).toStrictEqual([
            ["file:read", handler],
        ]);
        const mockBuffer = Buffer.from("hello-world");
        fileSystem.readFile.mockImplementation((_path, callback) =>
            callback(null, mockBuffer)
        );

        const approvedPath = approveFilePath("C:/test.fit", { source: "test" });
        const result = await handler({}, approvedPath);

        expect(
            getRequiredMockCall(
                fileSystem.readFile.mock.calls,
                "fs.readFile"
            )[0]
        ).toBe(approvedPath);
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(Buffer.from(result as ArrayBuffer).toString()).toBe(
            "hello-world"
        );
        expect(logWithContext).not.toHaveBeenCalled();
    });

    it("rejects and logs when fs.readFile is unavailable", async () => {
        expect.assertions(2);

        const handlerRegister = vi.fn<RegisterIpcHandle>();
        registerFileSystemHandlers({
            registerIpcHandle: handlerRegister,
            fs: {},
            logWithContext,
        });

        const handler = getFileReadHandler(handlerRegister);

        const approvedPath = approveFilePath("C:/missing.fit", {
            source: "test",
        });

        await expect(handler({}, approvedPath)).rejects.toThrow(
            "Filesystem module unavailable"
        );

        expect(logWithContext.mock.calls).toStrictEqual([
            [
                "error",
                "Error in file:read:",
                {
                    authorizedPath: approvedPath,
                    error: "Filesystem module unavailable",
                    filePath: approvedPath,
                },
            ],
        ]);
    });

    it("rejects and logs when readFile errors", async () => {
        expect.assertions(2);

        const error = new Error("boom");
        fileSystem.readFile.mockImplementation((_path, callback) =>
            callback(error)
        );

        registerDefaultHandlers();
        const handler = getFileReadHandler();

        const approvedPath = approveFilePath("C:/bad.fit", { source: "test" });

        await expect(handler({}, approvedPath)).rejects.toThrow("boom");

        expect(logWithContext.mock.calls).toStrictEqual([
            [
                "error",
                "Error in file:read:",
                {
                    authorizedPath: approvedPath,
                    error: "boom",
                    filePath: approvedPath,
                },
            ],
        ]);
    });

    it("rejects unapproved paths", async () => {
        expect.assertions(1);

        registerDefaultHandlers();
        const handler = getFileReadHandler();

        await expect(handler({}, "C:/unapproved.fit")).rejects.toThrow(
            "File access denied"
        );
    });

    it("rejects missing files without logging expected ENOENT failures", async () => {
        expect.assertions(4);

        registerDefaultHandlers();
        const handler = getFileReadHandler();
        const missingFileError = Object.assign(
            new Error("ENOENT: no such file or directory"),
            { code: "ENOENT" }
        );
        const stat = getRequiredStatMock();
        stat.mockImplementation((_path, callback) =>
            callback(missingFileError)
        );

        const approvedPath = approveFilePath("C:/missing.fit", {
            source: "test",
        });

        await expect(handler({}, approvedPath)).rejects.toThrow("ENOENT");
        expect(getRequiredMockCall(stat.mock.calls, "fs.stat")[0]).toBe(
            approvedPath
        );
        expect(fileSystem.readFile).not.toHaveBeenCalled();
        expect(logWithContext).not.toHaveBeenCalled();
    });

    it("rejects oversized files before reading file contents", async () => {
        expect.assertions(3);

        registerDefaultHandlers();
        const handler = getFileReadHandler();
        getRequiredStatMock().mockImplementation((_path, callback) =>
            callback(null, { size: MAX_FIT_FILE_BYTES + 1 })
        );

        const approvedPath = approveFilePath("C:/too-large.fit", {
            source: "test",
        });

        await expect(handler({}, approvedPath)).rejects.toThrow(
            "File size exceeds 100MB limit"
        );
        expect(fileSystem.readFile).not.toHaveBeenCalled();
        expect(logWithContext.mock.calls).toStrictEqual([
            [
                "error",
                "Error in file:read:",
                {
                    authorizedPath: approvedPath,
                    error: "File size exceeds 100MB limit",
                    filePath: approvedPath,
                },
            ],
        ]);
    });

    it("falls back to readFile when stat fails for a non-missing file reason", async () => {
        expect.assertions(4);

        registerDefaultHandlers();
        const handler = getFileReadHandler();
        const stat = getRequiredStatMock();
        const mockBuffer = Buffer.from("stat-fallback");

        stat.mockImplementation((_path, callback) =>
            callback(
                Object.assign(new Error("permission probe failed"), {
                    code: "EACCES",
                })
            )
        );
        fileSystem.readFile.mockImplementation((_path, callback) =>
            callback(null, mockBuffer)
        );

        const approvedPath = approveFilePath("C:/fallback.fit", {
            source: "test",
        });
        const result = await handler({}, approvedPath);

        expect(getRequiredMockCall(stat.mock.calls, "fs.stat")[0]).toBe(
            approvedPath
        );
        expect(
            getRequiredMockCall(
                fileSystem.readFile.mock.calls,
                "fs.readFile"
            )[0]
        ).toBe(approvedPath);
        expect(Buffer.from(result as ArrayBuffer).toString()).toBe(
            "stat-fallback"
        );
        expect(logWithContext).not.toHaveBeenCalled();
    });

    it("rejects invalid filePath inputs early", async () => {
        expect.assertions(4);

        registerDefaultHandlers();
        const handler = getFileReadHandler();

        await expect(handler({}, "   ")).rejects.toThrow(
            "Invalid file path provided"
        );
        await expect(handler({}, null)).rejects.toThrow(
            "Invalid file path provided"
        );

        expect(fileSystem.readFile).not.toHaveBeenCalled();
        expect(logWithContext.mock.calls).toStrictEqual([
            [
                "error",
                "Error in file:read:",
                {
                    authorizedPath: undefined,
                    error: "Invalid file path provided",
                    filePath: "   ",
                },
            ],
            [
                "error",
                "Error in file:read:",
                {
                    authorizedPath: undefined,
                    error: "Invalid file path provided",
                    filePath: "null",
                },
            ],
        ]);
    });

    it("rejects unexpected fs.readFile result types", async () => {
        expect.assertions(1);

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
