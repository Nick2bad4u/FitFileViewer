import { createRequire } from "node:module";

import { describe, expect, it, vi } from "vitest";

import type {
    ClipboardInvokeChannel,
    ClipboardRequestPayload,
    ClipboardResponsePayload,
} from "../../electron-app/shared/ipc";

interface ClipboardBridgeModule {
    createClipboardBridge: (options: {
        channels: {
            CLIPBOARD_WRITE_PNG_DATA_URL: Extract<
                ClipboardInvokeChannel,
                "clipboard:writePngDataUrl"
            >;
            CLIPBOARD_WRITE_TEXT: Extract<
                ClipboardInvokeChannel,
                "clipboard:writeText"
            >;
        };
        ipcRenderer: {
            invoke: (
                channel: ClipboardInvokeChannel,
                payload: ClipboardRequestPayload
            ) => Promise<unknown>;
        };
        preloadLog: (
            level: "error" | "info" | "warn",
            message: string,
            ...details: unknown[]
        ) => void;
    }) => {
        writeClipboardPngDataUrl: (
            pngDataUrl: ClipboardRequestPayload
        ) => Promise<ClipboardResponsePayload>;
        writeClipboardText: (
            text: ClipboardRequestPayload
        ) => Promise<ClipboardResponsePayload>;
    };
}

const requireFromTest = createRequire(import.meta.url);
const { createClipboardBridge } = requireFromTest(
    "../../electron-app/preload/clipboardBridge.js"
) as ClipboardBridgeModule;

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

describe("preload clipboard bridge", () => {
    it("writes text through the clipboard IPC channel", async () => {
        expect.assertions(3);

        const { bridge, invoke, preloadLog } = createBridge();
        invoke.mockResolvedValueOnce(1);

        const result = await bridge.writeClipboardText("hello");

        expect(result ? "success" : "failure").toBe("success");
        expect(invoke).toHaveBeenCalledWith("clipboard:writeText", "hello");
        expect(preloadLog).not.toHaveBeenCalled();
    });

    it("writes PNG data URLs and coerces falsey IPC results to false", async () => {
        expect.assertions(2);

        const { bridge, invoke } = createBridge();
        const dataUrl = "data:image/png;base64,abc";
        invoke.mockResolvedValueOnce("");

        const result = await bridge.writeClipboardPngDataUrl(dataUrl);

        expect(result ? "success" : "failure").toBe("failure");
        expect(invoke).toHaveBeenCalledWith(
            "clipboard:writePngDataUrl",
            dataUrl
        );
    });

    it("logs text clipboard failures and resolves false", async () => {
        expect.assertions(3);

        const { bridge, invoke, preloadLog } = createBridge();
        invoke.mockRejectedValueOnce(new Error("clipboard failed"));

        const result = await bridge.writeClipboardText("hello");

        expect(result ? "success" : "failure").toBe("failure");
        expect(preloadLog).toHaveBeenCalledWith(
            "error",
            "[preload.js] writeClipboardText failed:",
            expect.any(Error)
        );
        expect(invoke).toHaveBeenCalledWith("clipboard:writeText", "hello");
    });

    it("logs PNG clipboard failures and resolves false", async () => {
        expect.assertions(3);

        const { bridge, invoke, preloadLog } = createBridge();
        const dataUrl = "data:image/png;base64,abc";
        invoke.mockRejectedValueOnce(new Error("clipboard failed"));

        const result = await bridge.writeClipboardPngDataUrl(dataUrl);

        expect(result ? "success" : "failure").toBe("failure");
        expect(preloadLog).toHaveBeenCalledWith(
            "error",
            "[preload.js] writeClipboardPngDataUrl failed:",
            expect.any(Error)
        );
        expect(invoke).toHaveBeenCalledWith(
            "clipboard:writePngDataUrl",
            dataUrl
        );
    });
});
