// @vitest-environment node
import type { Mock } from "vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerClipboardHandlers } from "../../../../electron-app/main/ipc/registerClipboardHandlers.js";

type ClipboardInvokeChannel =
    | "clipboard:writePngDataUrl"
    | "clipboard:writeText";
type ClipboardIpcHandler = (event: unknown, ...args: unknown[]) => unknown;
type RegisterIpcHandle = (
    channel: ClipboardInvokeChannel,
    handler: ClipboardIpcHandler
) => void;
type ClipboardWriter = {
    writeImage: Mock<(image: unknown) => void>;
    writeText: Mock<(text: string) => void>;
};
type NativeImageValue = { __img: true; url: string };
type NativeImageFactory = {
    createFromDataURL: Mock<(url: string) => NativeImageValue>;
};
type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;

describe("registerClipboardHandlers", () => {
    let mockRegisterIpcHandle: Mock<RegisterIpcHandle>;
    let mockClipboardRef: Mock<() => ClipboardWriter | null>;
    let mockNativeImageRef: Mock<() => NativeImageFactory | null>;
    let mockLogWithContext: Mock<LogWithContext>;
    let mockClipboard: ClipboardWriter;
    let mockNativeImage: NativeImageFactory;

    beforeEach(() => {
        mockClipboard = {
            writeImage: vi.fn<(image: unknown) => void>(),
            writeText: vi.fn<(text: string) => void>(),
        };
        mockNativeImage = {
            createFromDataURL: vi.fn<(url: string) => NativeImageValue>(
                (url) => ({ __img: true, url })
            ),
        };

        mockRegisterIpcHandle = vi.fn<RegisterIpcHandle>();
        mockClipboardRef = vi.fn<() => ClipboardWriter | null>(
            () => mockClipboard
        );
        mockNativeImageRef = vi.fn<() => NativeImageFactory | null>(
            () => mockNativeImage
        );
        mockLogWithContext = vi.fn<LogWithContext>();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    function captureClipboardHandlers(): Partial<
        Record<ClipboardInvokeChannel, ClipboardIpcHandler>
    > {
        const handlers: Partial<
            Record<ClipboardInvokeChannel, ClipboardIpcHandler>
        > = {};

        mockRegisterIpcHandle.mockImplementation((channel, handler) => {
            handlers[channel] = handler;
        });

        return handlers;
    }

    function getRegisteredHandler(
        channel: ClipboardInvokeChannel
    ): ClipboardIpcHandler {
        const handler = mockRegisterIpcHandle.mock.calls.find(
            ([registeredChannel]) => registeredChannel === channel
        )?.[1];

        expect(handler).toBeTypeOf("function");

        if (typeof handler !== "function") {
            throw new TypeError(`${channel} handler was not registered`);
        }

        return handler;
    }

    function getClipboardWriteSnapshot(): {
        imageWrites: unknown[][];
        textWrites: unknown[][];
    } {
        return {
            imageWrites: mockClipboard.writeImage.mock.calls,
            textWrites: mockClipboard.writeText.mock.calls,
        };
    }

    it("registers clipboard handlers", () => {
        expect.hasAssertions();

        const handlers = captureClipboardHandlers();

        registerClipboardHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            clipboardRef: mockClipboardRef,
            nativeImageRef: mockNativeImageRef,
            logWithContext: mockLogWithContext,
        });

        expect(mockRegisterIpcHandle).toHaveBeenCalledTimes(2);
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith(
            "clipboard:writeText",
            expect.any(Function)
        );
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith(
            "clipboard:writePngDataUrl",
            expect.any(Function)
        );
        expect(handlers["clipboard:writeText"]).toBeTypeOf("function");
        expect(handlers["clipboard:writePngDataUrl"]).toBeTypeOf("function");
        expect(Object.keys(handlers).sort()).toStrictEqual([
            "clipboard:writePngDataUrl",
            "clipboard:writeText",
        ]);
    });

    it("does nothing when registerIpcHandle is not a function", () => {
        expect.hasAssertions();

        const result = registerClipboardHandlers({
            registerIpcHandle: null,
            clipboardRef: mockClipboardRef,
            nativeImageRef: mockNativeImageRef,
            logWithContext: mockLogWithContext,
        });

        expect(result).toBeUndefined();
        expect(mockClipboardRef).not.toHaveBeenCalled();
        expect(mockRegisterIpcHandle).not.toHaveBeenCalled();
    });

    it("clipboard:writeText writes to clipboard", async () => {
        expect.hasAssertions();

        registerClipboardHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            clipboardRef: mockClipboardRef,
            nativeImageRef: mockNativeImageRef,
            logWithContext: mockLogWithContext,
        });

        const handler = getRegisteredHandler("clipboard:writeText");
        const ok = await handler({}, "hello");

        expect({
            ok,
            writes: getClipboardWriteSnapshot(),
        }).toStrictEqual({
            ok: true,
            writes: {
                imageWrites: [],
                textWrites: [["hello"]],
            },
        });
    });

    it("clipboard:writeText returns false when clipboard is unavailable", async () => {
        expect.hasAssertions();

        mockClipboardRef.mockReturnValue(null);

        registerClipboardHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            clipboardRef: mockClipboardRef,
            nativeImageRef: mockNativeImageRef,
            logWithContext: mockLogWithContext,
        });

        const handler = getRegisteredHandler("clipboard:writeText");
        const ok = await handler({}, "hello");

        expect({
            ok,
            writes: getClipboardWriteSnapshot(),
        }).toStrictEqual({
            ok: false,
            writes: {
                imageWrites: [],
                textWrites: [],
            },
        });
    });

    it("clipboard:writePngDataUrl writes image to clipboard", async () => {
        expect.hasAssertions();

        registerClipboardHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            clipboardRef: mockClipboardRef,
            nativeImageRef: mockNativeImageRef,
            logWithContext: mockLogWithContext,
        });

        const handler = getRegisteredHandler("clipboard:writePngDataUrl");
        const pngDataUrl =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";
        const ok = await handler({}, pngDataUrl);

        expect(mockNativeImage.createFromDataURL).toHaveBeenCalledWith(
            pngDataUrl
        );
        expect({
            ok,
            writes: getClipboardWriteSnapshot(),
        }).toStrictEqual({
            ok: true,
            writes: {
                imageWrites: [[{ __img: true, url: pngDataUrl }]],
                textWrites: [],
            },
        });
    });

    it("clipboard:writePngDataUrl returns false for non-png data URLs", async () => {
        expect.hasAssertions();

        registerClipboardHandlers({
            registerIpcHandle: mockRegisterIpcHandle,
            clipboardRef: mockClipboardRef,
            nativeImageRef: mockNativeImageRef,
            logWithContext: mockLogWithContext,
        });

        const handler = getRegisteredHandler("clipboard:writePngDataUrl");
        const ok = await handler({}, "data:image/jpeg;base64,abc");

        expect({
            ok,
            writes: getClipboardWriteSnapshot(),
        }).toStrictEqual({
            ok: false,
            writes: {
                imageWrites: [],
                textWrites: [],
            },
        });
    });
});
