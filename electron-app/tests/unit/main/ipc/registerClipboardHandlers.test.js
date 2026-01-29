/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerClipboardHandlers } from "../../../../main/ipc/registerClipboardHandlers.js";

describe("registerClipboardHandlers", () => {
    /** @type {ReturnType<typeof vi.fn>} */
    let mockRegisterIpcHandle;
    /** @type {ReturnType<typeof vi.fn>} */
    let mockClipboardRef;
    /** @type {ReturnType<typeof vi.fn>} */
    let mockNativeImageRef;
    /** @type {ReturnType<typeof vi.fn>} */
    let mockLogWithContext;

    /** @type {{ writeText: ReturnType<typeof vi.fn>, writeImage: ReturnType<typeof vi.fn> }} */
    let mockClipboard;
    /** @type {{ createFromDataURL: ReturnType<typeof vi.fn> }} */
    let mockNativeImage;

    beforeEach(() => {
        mockClipboard = {
            writeText: vi.fn(),
            writeImage: vi.fn(),
        };
        mockNativeImage = {
            createFromDataURL: vi.fn((url) => ({ __img: true, url })),
        };

        mockRegisterIpcHandle = vi.fn();
        mockClipboardRef = vi.fn(() => mockClipboard);
        mockNativeImageRef = vi.fn(() => mockNativeImage);
        mockLogWithContext = vi.fn();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("registers clipboard handlers", () => {
        registerClipboardHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            clipboardRef: mockClipboardRef,
            nativeImageRef: mockNativeImageRef,
            logWithContext: mockLogWithContext,
        });

        expect(mockRegisterIpcHandle).toHaveBeenCalledTimes(2);
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("clipboard:writeText", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("clipboard:writePngDataUrl", expect.any(Function));
    });

    it("does nothing when registerIpcHandle is not a function", () => {
        registerClipboardHandlers({
            registerIpcHandle: null,
            clipboardRef: mockClipboardRef,
            nativeImageRef: mockNativeImageRef,
            logWithContext: mockLogWithContext,
        });

        expect(mockClipboardRef).not.toHaveBeenCalled();
        expect(mockRegisterIpcHandle).not.toHaveBeenCalled();
    });

    it("clipboard:writeText writes to clipboard", async () => {
        registerClipboardHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            clipboardRef: mockClipboardRef,
            nativeImageRef: mockNativeImageRef,
            logWithContext: mockLogWithContext,
        });

        const handler = mockRegisterIpcHandle.mock.calls.find((c) => c[0] === "clipboard:writeText")[1];
        const ok = await handler({}, "hello");

        expect(ok).toBe(true);
        expect(mockClipboard.writeText).toHaveBeenCalledWith("hello");
    });

    it("clipboard:writeText returns false when clipboard is unavailable", async () => {
        mockClipboardRef.mockReturnValue(null);

        registerClipboardHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            clipboardRef: mockClipboardRef,
            nativeImageRef: mockNativeImageRef,
            logWithContext: mockLogWithContext,
        });

        const handler = mockRegisterIpcHandle.mock.calls.find((c) => c[0] === "clipboard:writeText")[1];
        const ok = await handler({}, "hello");

        expect(ok).toBe(false);
        expect(mockClipboard.writeText).not.toHaveBeenCalled();
    });

    it("clipboard:writePngDataUrl writes image to clipboard", async () => {
        registerClipboardHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            clipboardRef: mockClipboardRef,
            nativeImageRef: mockNativeImageRef,
            logWithContext: mockLogWithContext,
        });

        const handler = mockRegisterIpcHandle.mock.calls.find((c) => c[0] === "clipboard:writePngDataUrl")[1];
        const pngDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";
        const ok = await handler({}, pngDataUrl);

        expect(ok).toBe(true);
        expect(mockNativeImage.createFromDataURL).toHaveBeenCalledWith(pngDataUrl);
        expect(mockClipboard.writeImage).toHaveBeenCalledWith({ __img: true, url: pngDataUrl });
    });

    it("clipboard:writePngDataUrl returns false for non-png data URLs", async () => {
        registerClipboardHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            clipboardRef: mockClipboardRef,
            nativeImageRef: mockNativeImageRef,
            logWithContext: mockLogWithContext,
        });

        const handler = mockRegisterIpcHandle.mock.calls.find((c) => c[0] === "clipboard:writePngDataUrl")[1];
        const ok = await handler({}, "data:image/jpeg;base64,abc");

        expect(ok).toBe(false);
        expect(mockClipboard.writeImage).not.toHaveBeenCalled();
    });
});
