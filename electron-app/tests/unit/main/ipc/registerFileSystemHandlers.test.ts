/**
 * @fileoverview Tests for registerFileSystemHandlers IPC registration.
 */

import { createRequire } from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireModule = createRequire(import.meta.url);
const modulePath = "../../../../main/ipc/registerFileSystemHandlers.js";

const loadModule = async () => {
    vi.resetModules();
    const resolved = requireModule.resolve(modulePath);
    if (requireModule.cache?.[resolved]) {
        delete requireModule.cache[resolved];
    }
    return requireModule(modulePath);
};

describe("registerFileSystemHandlers", () => {
    let mockRegisterIpcHandle: ReturnType<typeof vi.fn>;
    let mockFs: { readFile: ReturnType<typeof vi.fn> };
    let mockLogWithContext: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockRegisterIpcHandle = vi.fn();
        mockFs = { readFile: vi.fn() };
        mockLogWithContext = vi.fn();
    });

    it("registers the file:read handler when a valid register function is provided", async () => {
        const { wireFileSystemHandlers } = await loadModule();

        wireFileSystemHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            fs: mockFs,
            logWithContext: mockLogWithContext,
        });

        expect(mockRegisterIpcHandle).toHaveBeenCalledTimes(1);
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("file:read", expect.any(Function));
    });

    it("should tolerate missing options in the public wrapper", async () => {
        const { registerFileSystemHandlers } = await loadModule();

        expect(() => registerFileSystemHandlers()).not.toThrow();
    });

    it("does nothing when registerIpcHandle is not a function", async () => {
        const { wireFileSystemHandlers } = await loadModule();

        wireFileSystemHandlers({
            registerIpcHandle: undefined as any,
            fs: mockFs,
            logWithContext: mockLogWithContext,
        });

        expect(mockRegisterIpcHandle).not.toHaveBeenCalled();
    });

    it("reads files and returns an ArrayBuffer slice", async () => {
        const { wireFileSystemHandlers } = await loadModule();
        const fileContents = Buffer.from("test-content");

        mockFs.readFile.mockImplementation((_path: string, callback: (err: unknown, data: Buffer) => void) => {
            callback(null, fileContents);
        });

        wireFileSystemHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            fs: mockFs,
            logWithContext: mockLogWithContext,
        });

        const handler = mockRegisterIpcHandle.mock.calls[0][1];
        const result = await handler({}, "sample.fit");

        expect(result).toBeTruthy();
        expect(new Uint8Array(result)).toEqual(new Uint8Array(fileContents));
        expect(mockFs.readFile).toHaveBeenCalledWith("sample.fit", expect.any(Function));
    });

    it("rejects when filesystem module is unavailable", async () => {
        const { wireFileSystemHandlers } = await loadModule();

        wireFileSystemHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            fs: undefined as unknown as { readFile?: Function },
            logWithContext: mockLogWithContext,
        });

        const handler = mockRegisterIpcHandle.mock.calls[0][1];

        await expect(handler({}, "missing.fit")).rejects.toThrow("Filesystem module unavailable");
        expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in file:read:", {
            error: "Filesystem module unavailable",
        });
    });

    it("logs and rethrows errors from fs.readFile callback", async () => {
        const { wireFileSystemHandlers } = await loadModule();
        const failure = new Error("Read failure");

        mockFs.readFile.mockImplementation((_path: string, callback: (err: unknown, data: Buffer | undefined) => void) => {
            callback(failure, undefined as any);
        });

        wireFileSystemHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            fs: mockFs,
            logWithContext: mockLogWithContext,
        });

        const handler = mockRegisterIpcHandle.mock.calls[0][1];

        await expect(handler({}, "broken.fit")).rejects.toThrow("Read failure");
        expect(mockLogWithContext).toHaveBeenNthCalledWith(1, "error", "Error reading file:", {
            error: "Read failure",
            filePath: "broken.fit",
        });
        expect(mockLogWithContext).toHaveBeenNthCalledWith(2, "error", "Error in file:read:", {
            error: "Read failure",
        });
    });

    it("handles synchronous errors thrown by fs.readFile", async () => {
        const { wireFileSystemHandlers } = await loadModule();
        const panic = new Error("Sync failure");

        mockFs.readFile.mockImplementation(() => {
            throw panic;
        });

        wireFileSystemHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            fs: mockFs,
            logWithContext: mockLogWithContext,
        });

        const handler = mockRegisterIpcHandle.mock.calls[0][1];

        await expect(handler({}, "panic.fit")).rejects.toThrow("Sync failure");
        expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in file:read:", { error: "Sync failure" });
    });

    it("operates without logWithContext provided", async () => {
        const { wireFileSystemHandlers } = await loadModule();

        mockFs.readFile.mockImplementation((_path: string, callback: (err: unknown, data: Buffer) => void) => {
            callback(null, Buffer.from("ok"));
        });

        wireFileSystemHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            fs: mockFs,
            logWithContext: undefined as unknown as typeof mockLogWithContext,
        });

        const handler = mockRegisterIpcHandle.mock.calls[0][1];
        const result = await handler({}, "no-log.fit");

        expect(result).toBeTruthy();
    });

    it("delegates through the exported wrapper", async () => {
        const { registerFileSystemHandlers } = await loadModule();

        registerFileSystemHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            fs: mockFs,
            logWithContext: mockLogWithContext,
        });

        expect(mockRegisterIpcHandle).toHaveBeenCalledTimes(1);
    });
});
