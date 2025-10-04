/**
 * @fileoverview Tests for registerFitFileHandlers IPC registration with injectable fitParser loader
 */

import { Buffer } from "node:buffer";
import { createRequire } from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireModule = createRequire(import.meta.url);
const modulePath = "../../../../main/ipc/registerFitFileHandlers.js";

const loadModule = async () => {
    vi.resetModules();
    const resolved = requireModule.resolve(modulePath);
    if (requireModule.cache?.[resolved]) {
        delete requireModule.cache[resolved];
    }
    return requireModule(modulePath);
};

describe("registerFitFileHandlers", () => {
    let mockRegisterIpcHandle: ReturnType<typeof vi.fn>;
    let mockEnsureIntegration: ReturnType<typeof vi.fn>;
    let mockLogWithContext: ReturnType<typeof vi.fn>;
    let mockDecodeFitFile: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockRegisterIpcHandle = vi.fn();
        mockEnsureIntegration = vi.fn().mockResolvedValue(undefined);
        mockLogWithContext = vi.fn();
        mockDecodeFitFile = vi.fn().mockResolvedValue({ parsed: true });
    });

    const buildArgs = () => ({
        registerIpcHandle: mockRegisterIpcHandle,
        ensureFitParserStateIntegration: mockEnsureIntegration,
        logWithContext: mockLogWithContext,
        loadFitParser: () => ({ decodeFitFile: mockDecodeFitFile }),
    });

    it("registers handlers for fit:parse and fit:decode", async () => {
        const { registerFitFileHandlers } = await loadModule();

        registerFitFileHandlers(buildArgs());

        expect(mockRegisterIpcHandle).toHaveBeenCalledTimes(2);
        const channels = mockRegisterIpcHandle.mock.calls.map(([channel]) => channel);
        expect(channels).toContain("fit:parse");
        expect(channels).toContain("fit:decode");
    });

        it("should tolerate missing options in the public wrapper", async () => {
            const { registerFitFileHandlers } = await loadModule();

            expect(() => registerFitFileHandlers()).not.toThrow();
        });

    it("wires handlers through the helper for direct coverage", async () => {
        const { wireFitFileHandlers } = await loadModule();

        wireFitFileHandlers(buildArgs());

        expect(mockRegisterIpcHandle).toHaveBeenCalledTimes(2);
    });

    it("ensures parser integration, loads the parser, and decodes buffers", async () => {
        const { registerFitFileHandlers } = await loadModule();

        registerFitFileHandlers(buildArgs());

        const handler = mockRegisterIpcHandle.mock.calls.find(([channel]) => channel === "fit:parse")?.[1];
        expect(handler).toBeTypeOf("function");

        const payload = new Uint8Array([1, 2, 3, 4]).buffer;
        const result = await handler({}, payload);

        expect(mockEnsureIntegration).toHaveBeenCalledTimes(1);
        expect(mockDecodeFitFile).toHaveBeenCalledTimes(1);
        const bufferPassed = mockDecodeFitFile.mock.calls[0][0];
        expect(Buffer.isBuffer(bufferPassed)).toBe(true);
        expect(bufferPassed.equals(Buffer.from(payload))).toBe(true);
        expect(result).toEqual({ parsed: true });
    });

    it("invokes decode logic for the fit:decode channel", async () => {
        const { registerFitFileHandlers } = await loadModule();

        registerFitFileHandlers(buildArgs());

        const parseHandler = mockRegisterIpcHandle.mock.calls.find(([channel]) => channel === "fit:parse")?.[1];
        const decodeHandler = mockRegisterIpcHandle.mock.calls.find(([channel]) => channel === "fit:decode")?.[1];

        await parseHandler({}, new Uint8Array([1]).buffer);
        await decodeHandler({}, new Uint8Array([5, 6]).buffer);

        expect(mockEnsureIntegration).toHaveBeenCalledTimes(2);
        expect(mockDecodeFitFile).toHaveBeenCalledTimes(2);
    });

    it("logs and rethrows errors from decode", async () => {
        const { registerFitFileHandlers } = await loadModule();
        const failure = new Error("decode failed");
        mockDecodeFitFile.mockRejectedValueOnce(failure);

        registerFitFileHandlers(buildArgs());

        const handler = mockRegisterIpcHandle.mock.calls[0][1];

        await expect(handler({}, new Uint8Array([9]).buffer)).rejects.toThrow("decode failed");
        expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in fit:parse:", {
            error: "decode failed",
        });
    });

    it("logs and rethrows ensureFitParserStateIntegration errors", async () => {
        const { registerFitFileHandlers } = await loadModule();
        const failure = new Error("integration failed");
        mockEnsureIntegration.mockRejectedValueOnce(failure);

        registerFitFileHandlers(buildArgs());

        const handler = mockRegisterIpcHandle.mock.calls[1][1];

        await expect(handler({}, new ArrayBuffer(0))).rejects.toThrow("integration failed");
        expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in fit:decode:", {
            error: "integration failed",
        });
    });

    it("supports missing logWithContext without throwing", async () => {
        const { registerFitFileHandlers } = await loadModule();

        registerFitFileHandlers({
            ...buildArgs(),
            logWithContext: undefined as unknown as typeof mockLogWithContext,
        });

        const handler = mockRegisterIpcHandle.mock.calls[0][1];
        await handler({}, new Uint8Array([7, 8, 9]).buffer);

        expect(mockDecodeFitFile).toHaveBeenCalledTimes(1);
    });

    it("short-circuits when registerIpcHandle is not a function", async () => {
        const { registerFitFileHandlers } = await loadModule();

        registerFitFileHandlers({
            registerIpcHandle: undefined as any,
            ensureFitParserStateIntegration: mockEnsureIntegration,
            logWithContext: mockLogWithContext,
            loadFitParser: () => ({ decodeFitFile: mockDecodeFitFile }),
        });

        expect(mockRegisterIpcHandle).not.toHaveBeenCalled();
        expect(mockEnsureIntegration).not.toHaveBeenCalled();
    });

    it("falls back to requiring the fitParser when no loader is supplied", async () => {
        const { registerFitFileHandlers } = await loadModule();
        const nodeRequire = createRequire(import.meta.url);
        const fitParserPath = nodeRequire.resolve("../../../../fitParser");
        const originalModule = nodeRequire.cache[fitParserPath];

        nodeRequire.cache[fitParserPath] = {
            id: fitParserPath,
            filename: fitParserPath,
            loaded: true,
            exports: { decodeFitFile: mockDecodeFitFile },
        } as any;

        try {
            registerFitFileHandlers({
                registerIpcHandle: mockRegisterIpcHandle,
                ensureFitParserStateIntegration: mockEnsureIntegration,
                logWithContext: mockLogWithContext,
            });

            const handler = mockRegisterIpcHandle.mock.calls[0][1];
            await handler({}, new Uint8Array([3, 4]).buffer);

            expect(mockDecodeFitFile).toHaveBeenCalledTimes(1);
        } finally {
            if (originalModule) {
                nodeRequire.cache[fitParserPath] = originalModule;
            } else {
                delete nodeRequire.cache[fitParserPath];
            }
        }
    });
});
