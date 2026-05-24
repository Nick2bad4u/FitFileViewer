import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const requireFromTest = createRequire(import.meta.url);
const ipcBridgeCatalog = requireFromTest(
    "../../../preload/ipcBridgeCatalog.js"
) as {
    PRELOAD_CHANNELS: Record<string, string>;
    PRELOAD_EVENTS: Record<string, string>;
    isAllowedGenericInvokeChannel: (channel: unknown) => boolean;
    isAllowedGenericSendChannel: (channel: unknown) => boolean;
    isAllowedRendererIpcEventChannel: (channel: unknown) => boolean;
    isAllowedUpdateEventName: (eventName: unknown) => boolean;
};

describe("preload ipcBridgeCatalog", () => {
    it("exposes the preload channel and event metadata used by getChannelInfo", () => {
        expect.hasAssertions();

        expect(ipcBridgeCatalog.PRELOAD_CHANNELS.FIT_PARSE).toBe("fit:parse");
        expect(ipcBridgeCatalog.PRELOAD_CHANNELS.FILE_READ).toBe("file:read");
        expect(ipcBridgeCatalog.PRELOAD_CHANNELS).not.toHaveProperty("UNKNOWN");
        expect(ipcBridgeCatalog.PRELOAD_EVENTS.MENU_OPEN_FILE).toBe(
            "menu-open-file"
        );
        expect(ipcBridgeCatalog.PRELOAD_EVENTS.MENU_OPEN_OVERLAY).toBe(
            "menu-open-overlay"
        );
    });

    it("keeps generic IPC allowlists narrow", () => {
        expect.hasAssertions();

        const invokeChannelResults = [
            ipcBridgeCatalog.isAllowedGenericInvokeChannel("fit:parse"),
            ipcBridgeCatalog.isAllowedGenericInvokeChannel("main-state:get"),
            ipcBridgeCatalog.isAllowedGenericInvokeChannel("unknown:channel"),
        ];
        const sendChannelResults = [
            ipcBridgeCatalog.isAllowedGenericSendChannel("menu-save-as"),
            ipcBridgeCatalog.isAllowedGenericSendChannel("menu-open-file"),
        ];

        expect(invokeChannelResults).toStrictEqual([
            true,
            true,
            false,
        ]);
        expect(sendChannelResults).toStrictEqual([true, false]);
    });

    it("allows only explicit renderer subscription and update event names", () => {
        expect.hasAssertions();

        const rendererEventResults = [
            ipcBridgeCatalog.isAllowedRendererIpcEventChannel("menu-open-file"),
            ipcBridgeCatalog.isAllowedRendererIpcEventChannel(
                "update-downloaded"
            ),
            ipcBridgeCatalog.isAllowedRendererIpcEventChannel("secret-channel"),
        ];
        const updateEventResults = [
            ipcBridgeCatalog.isAllowedUpdateEventName("update-downloaded"),
            ipcBridgeCatalog.isAllowedUpdateEventName("menu-open-file"),
        ];

        expect(rendererEventResults).toStrictEqual([
            true,
            true,
            false,
        ]);
        expect(updateEventResults).toStrictEqual([true, false]);
    });

    it("rejects non-string channel values before consulting allowlists", () => {
        expect.hasAssertions();

        const nonStringResults = [
            ipcBridgeCatalog.isAllowedGenericInvokeChannel(undefined),
            ipcBridgeCatalog.isAllowedGenericSendChannel(42),
            ipcBridgeCatalog.isAllowedRendererIpcEventChannel({}),
            ipcBridgeCatalog.isAllowedUpdateEventName(null),
        ];

        expect(nonStringResults).toStrictEqual([
            false,
            false,
            false,
            false,
        ]);
    });
});
