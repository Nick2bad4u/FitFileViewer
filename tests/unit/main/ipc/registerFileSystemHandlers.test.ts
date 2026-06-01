// @vitest-environment node
import { createRequire } from "node:module";
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

const require = createRequire(import.meta.url);
const { MAX_FIT_FILE_BYTES } =
    require("../../../../electron-app/main/ipc/fileReadPayload.js") as {
        MAX_FIT_FILE_BYTES: number;
    };

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
        expect.assertions(6);

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

        expect(fileSystem.readFile.mock.calls[0]?.[0]).toBe(approvedPath);
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(Buffer.from(result as ArrayBuffer).toString()).toBe(
            "hello-world"
        );
        expect(logWithContext).not.toHaveBeenCalled();
    });

    it("rejects and logs when fs.readFile is unavailable", async () => {
        expect.assertions(3);

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
        expect.assertions(3);

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
        expect.assertions(2);

        registerDefaultHandlers();
        const handler = getFileReadHandler();

        await expect(handler({}, "C:/unapproved.fit")).rejects.toThrow(
            "File access denied"
        );
    });

    it("rejects missing files without logging expected ENOENT failures", async () => {
        expect.assertions(5);

        registerDefaultHandlers();
        const handler = getFileReadHandler();
        const missingFileError = Object.assign(
            new Error("ENOENT: no such file or directory"),
            { code: "ENOENT" }
        );
        fileSystem.stat?.mockImplementation((_path, callback) =>
            callback(missingFileError)
        );

        const approvedPath = approveFilePath("C:/missing.fit", {
            source: "test",
        });

        await expect(handler({}, approvedPath)).rejects.toThrow("ENOENT");
        expect(fileSystem.stat?.mock.calls[0]?.[0]).toBe(approvedPath);
        expect(fileSystem.readFile).not.toHaveBeenCalled();
        expect(logWithContext).not.toHaveBeenCalled();
    });

    it("rejects oversized files before reading file contents", async () => {
        expect.assertions(4);

        registerDefaultHandlers();
        const handler = getFileReadHandler();
        fileSystem.stat?.mockImplementation((_path, callback) =>
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

    it("rejects invalid filePath inputs early", async () => {
        expect.assertions(5);

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
        expect.assertions(2);

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
