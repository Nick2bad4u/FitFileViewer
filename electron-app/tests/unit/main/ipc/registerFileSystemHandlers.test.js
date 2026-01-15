/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

import { registerFileSystemHandlers } from "../../../../main/ipc/registerFileSystemHandlers.js";
import { approveFilePath, __resetForTests } from "../../../../main/security/fileAccessPolicy.js";

describe("registerFileSystemHandlers", () => {
    let registerIpcHandle;
    let fs;
    let logWithContext;

    beforeEach(() => {
        __resetForTests?.();
        registerIpcHandle = vi.fn();
        logWithContext = vi.fn();
        fs = {
            readFile: vi.fn(),
        };
    });

    it("no-ops when registerIpcHandle is not a function", () => {
        registerFileSystemHandlers({ registerIpcHandle: null, fs, logWithContext });

        expect(registerIpcHandle).not.toHaveBeenCalled();
    });

    it("registers file:read handler and resolves buffer slice on success", async () => {
        registerFileSystemHandlers({ registerIpcHandle, fs, logWithContext });

        expect(registerIpcHandle).toHaveBeenCalledWith("file:read", expect.any(Function));

        const handler = registerIpcHandle.mock.calls[0][1];
        const mockBuffer = Buffer.from("hello-world");
        fs.readFile.mockImplementation((_path, cb) => cb(null, mockBuffer));

        const approvedPath = approveFilePath("C:/test.fit", { source: "test" });
        const result = await handler({}, approvedPath);

        expect(fs.readFile).toHaveBeenCalledWith(approvedPath, expect.any(Function));
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(Buffer.from(result).toString()).toBe("hello-world");
        expect(logWithContext).not.toHaveBeenCalled();
    });

    it("rejects and logs when fs.readFile is unavailable", async () => {
        const handlerRegister = vi.fn();
        registerFileSystemHandlers({ registerIpcHandle: handlerRegister, fs: {}, logWithContext });

        const handler = handlerRegister.mock.calls[0][1];

        const approvedPath = approveFilePath("C:/missing.fit", { source: "test" });

        await expect(handler({}, approvedPath)).rejects.toThrow("Filesystem module unavailable");

        expect(logWithContext).toHaveBeenCalledWith("error", "Error in file:read:", {
            error: "Filesystem module unavailable",
        });
    });

    it("rejects and logs when readFile errors", async () => {
        const error = new Error("boom");
        fs.readFile.mockImplementation((_path, cb) => cb(error));

        registerFileSystemHandlers({ registerIpcHandle, fs, logWithContext });
        const handler = registerIpcHandle.mock.calls[0][1];

        const approvedPath = approveFilePath("C:/bad.fit", { source: "test" });

        await expect(handler({}, approvedPath)).rejects.toThrow("boom");

        expect(logWithContext).toHaveBeenCalledWith("error", "Error reading file:", {
            error: "boom",
            filePath: approvedPath,
        });
    });

    it("rejects unapproved paths", async () => {
        registerFileSystemHandlers({ registerIpcHandle, fs, logWithContext });
        const handler = registerIpcHandle.mock.calls[0][1];

        await expect(handler({}, "C:/unapproved.fit")).rejects.toThrow("File access denied");
    });
});
