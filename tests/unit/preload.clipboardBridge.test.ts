import { describe, expect, it, vi } from "vitest";

import type {
    ClipboardInvokeChannel,
    ClipboardRequestPayload,
    ClipboardResponsePayload,
} from "../../electron-app/shared/ipc";
import { createClipboardBridge } from "../../electron-app/preload/clipboardBridge.js";

function createBridge() {
    const invoke =
        vi.fn<
            (
                channel: ClipboardInvokeChannel,
                payload: ClipboardRequestPayload
            ) => Promise<unknown>
        >();
    const preloadLog =
        vi.fn<
            (
                level: "error" | "info" | "warn",
                message: string,
                ...details: unknown[]
            ) => void
        >();

    return {
        bridge: createClipboardBridge({
            channels: {
                CLIPBOARD_WRITE_PNG_DATA_URL: "clipboard:writePngDataUrl",
                CLIPBOARD_WRITE_TEXT: "clipboard:writeText",
            },
            ipcRenderer: { invoke },
            preloadLog,
        }),
        invoke,
        preloadLog,
    };
}

function getBridgeCallState({
    invoke,
    preloadLog,
    result,
}: {
    invoke: ReturnType<typeof vi.fn>;
    preloadLog: ReturnType<typeof vi.fn>;
    result: ClipboardResponsePayload;
}): {
    invokeCalls: unknown[][];
    preloadLogCalls: unknown[][];
    result: ClipboardResponsePayload;
} {
    return {
        invokeCalls: invoke.mock.calls,
        preloadLogCalls: preloadLog.mock.calls,
        result,
    };
}

describe("preload clipboard bridge", () => {
    it("writes text through the clipboard IPC channel", async () => {
        expect.assertions(2);

        const { bridge, invoke, preloadLog } = createBridge();
        invoke.mockResolvedValueOnce(1);

        const result = await bridge.writeClipboardText("hello");

        expect(
            getBridgeCallState({ invoke, preloadLog, result })
        ).toStrictEqual({
            invokeCalls: [["clipboard:writeText", "hello"]],
            preloadLogCalls: [],
            result: true,
        });
        expect(preloadLog).not.toHaveBeenCalled();
    });

    it("writes PNG data URLs and coerces falsy IPC results to false", async () => {
        expect.assertions(2);

        const { bridge, invoke, preloadLog } = createBridge();
        const dataUrl = "data:image/png;base64,abc";
        invoke.mockResolvedValueOnce("");

        const result = await bridge.writeClipboardPngDataUrl(dataUrl);

        expect(
            getBridgeCallState({ invoke, preloadLog, result })
        ).toStrictEqual({
            invokeCalls: [["clipboard:writePngDataUrl", dataUrl]],
            preloadLogCalls: [],
            result: false,
        });
        expect(preloadLog).not.toHaveBeenCalled();
    });

    it("logs text clipboard failures and resolves false", async () => {
        expect.assertions(1);

        const { bridge, invoke, preloadLog } = createBridge();
        const clipboardError = new Error("clipboard failed");
        invoke.mockRejectedValueOnce(clipboardError);

        const result = await bridge.writeClipboardText("hello");

        expect(
            getBridgeCallState({ invoke, preloadLog, result })
        ).toStrictEqual({
            invokeCalls: [["clipboard:writeText", "hello"]],
            preloadLogCalls: [
                [
                    "error",
                    "[preload.js] writeClipboardText failed:",
                    clipboardError,
                ],
            ],
            result: false,
        });
    });

    it("logs PNG clipboard failures and resolves false", async () => {
        expect.assertions(1);

        const { bridge, invoke, preloadLog } = createBridge();
        const dataUrl = "data:image/png;base64,abc";
        const clipboardError = new Error("clipboard failed");
        invoke.mockRejectedValueOnce(clipboardError);

        const result = await bridge.writeClipboardPngDataUrl(dataUrl);

        expect(
            getBridgeCallState({ invoke, preloadLog, result })
        ).toStrictEqual({
            invokeCalls: [["clipboard:writePngDataUrl", dataUrl]],
            preloadLogCalls: [
                [
                    "error",
                    "[preload.js] writeClipboardPngDataUrl failed:",
                    clipboardError,
                ],
            ],
            result: false,
        });
    });
});
