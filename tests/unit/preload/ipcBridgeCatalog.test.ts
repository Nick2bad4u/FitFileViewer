import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const requireFromTest = createRequire(import.meta.url);
const ipcBridgeCatalog = requireFromTest(
    "../../../electron-app/preload/ipcBridgeCatalog.js"
) as {
    isAllowedGenericInvokeChannel: (channel: unknown) => boolean;
    isAllowedGenericSendChannel: (channel: unknown) => boolean;
    isAllowedRendererIpcEventChannel: (channel: unknown) => boolean;
    isAllowedUpdateEventName: (eventName: unknown) => boolean;
    PRELOAD_CHANNELS: Record<string, string>;
    PRELOAD_EVENTS: Record<string, string>;
};

const expectedPreloadChannels = {
    APP_VERSION: "getAppVersion",
    CHROME_VERSION: "getChromeVersion",
    CLIPBOARD_WRITE_PNG_DATA_URL: "clipboard:writePngDataUrl",
    CLIPBOARD_WRITE_TEXT: "clipboard:writeText",
    DEVTOOLS_INJECT_MENU: "devtools-inject-menu",
    DIALOG_OPEN_FILE: "dialog:openFile",
    DIALOG_OPEN_FOLDER: "dialog:openFolder",
    DIALOG_OPEN_OVERLAY_FILES: "dialog:openOverlayFiles",
    ELECTRON_VERSION: "getElectronVersion",
    FILE_READ: "file:read",
    FIT_BROWSER_GET_FOLDER: "browser:getFolder",
    FIT_BROWSER_IS_ENABLED: "browser:isEnabled",
    FIT_BROWSER_LIST_FOLDER: "browser:listFolder",
    FIT_BROWSER_SET_ENABLED: "browser:setEnabled",
    FIT_BROWSER_SET_FOLDER: "browser:setFolder",
    FIT_DECODE: "fit:decode",
    FIT_PARSE: "fit:parse",
    GYAZO_SERVER_START: "gyazo:server:start",
    GYAZO_SERVER_STOP: "gyazo:server:stop",
    LICENSE_INFO: "getLicenseInfo",
    NODE_VERSION: "getNodeVersion",
    PLATFORM_INFO: "getPlatformInfo",
    RECENT_FILES_ADD: "recentFiles:add",
    RECENT_FILES_APPROVE: "recentFiles:approve",
    RECENT_FILES_GET: "recentFiles:get",
    SHELL_OPEN_EXTERNAL: "shell:openExternal",
    THEME_GET: "theme:get",
} as const;

const expectedPreloadEvents = {
    FIT_BROWSER_ENABLED_CHANGED: "fit-browser-enabled-changed",
    FIT_FILE_LOADED: "fit-file-loaded",
    GYAZO_OAUTH_CALLBACK: "gyazo-oauth-callback",
    INSTALL_UPDATE: "install-update",
    MENU_ABOUT: "menu-about",
    MENU_CHECK_FOR_UPDATES: "menu-check-for-updates",
    MENU_EXPORT: "menu-export",
    MENU_KEYBOARD_SHORTCUTS: "menu-keyboard-shortcuts",
    MENU_OPEN_FILE: "menu-open-file",
    MENU_OPEN_OVERLAY: "menu-open-overlay",
    MENU_RESTART_UPDATE: "menu-restart-update",
    MENU_SAVE_AS: "menu-save-as",
    OPEN_ACCENT_COLOR_PICKER: "open-accent-color-picker",
    OPEN_RECENT_FILE: "open-recent-file",
    OPEN_SUMMARY_COLUMN_SELECTOR: "open-summary-column-selector",
    SET_FULLSCREEN: "set-fullscreen",
    SET_THEME: "set-theme",
    THEME_CHANGED: "theme-changed",
    UNLOAD_FIT_FILE: "unload-fit-file",
} as const;

describe("preload ipcBridgeCatalog", () => {
    it("exposes the preload channel and event metadata used by getChannelInfo", () => {
        expect.assertions(4);

        expect(ipcBridgeCatalog.PRELOAD_CHANNELS).toStrictEqual(
            expectedPreloadChannels
        );
        expect(ipcBridgeCatalog.PRELOAD_EVENTS).toStrictEqual(
            expectedPreloadEvents
        );
        expect(
            new Set(Object.values(ipcBridgeCatalog.PRELOAD_CHANNELS)).size
        ).toBe(Object.values(ipcBridgeCatalog.PRELOAD_CHANNELS).length);
        expect(
            new Set(Object.values(ipcBridgeCatalog.PRELOAD_EVENTS)).size
        ).toBe(Object.values(ipcBridgeCatalog.PRELOAD_EVENTS).length);
    });

    it("keeps generic IPC allowlists narrow", () => {
        expect.assertions(4);

        const invokeChannelResults = [
            ...Object.values(expectedPreloadChannels).map((channel) =>
                ipcBridgeCatalog.isAllowedGenericInvokeChannel(channel)
            ),
            ipcBridgeCatalog.isAllowedGenericInvokeChannel("fit:parse"),
            ipcBridgeCatalog.isAllowedGenericInvokeChannel("main-state:get"),
            ipcBridgeCatalog.isAllowedGenericInvokeChannel("unknown:channel"),
        ];
        const sendChannelResults = [
            ipcBridgeCatalog.isAllowedGenericSendChannel("theme-changed"),
            ipcBridgeCatalog.isAllowedGenericSendChannel("menu-open-file"),
            ipcBridgeCatalog.isAllowedGenericSendChannel("menu-save-as"),
        ];
        const blockedChannelResults = {
            fitParseSend:
                ipcBridgeCatalog.isAllowedGenericSendChannel("fit:parse"),
            menuSaveAsSend:
                ipcBridgeCatalog.isAllowedGenericSendChannel("menu-save-as"),
            menuOpenFileInvoke:
                ipcBridgeCatalog.isAllowedGenericInvokeChannel(
                    "menu-open-file"
                ),
        };

        expect(invokeChannelResults).toStrictEqual([
            ...Object.values(expectedPreloadChannels).map(() => true),
            true,
            true,
            false,
        ]);
        expect(sendChannelResults).toStrictEqual([true, false, false]);
        expect(blockedChannelResults).toStrictEqual({
            fitParseSend: false,
            menuSaveAsSend: false,
            menuOpenFileInvoke: false,
        });
        expect(Object.values(blockedChannelResults)).not.toContain(true);
    });

    it("allows only explicit renderer subscription and update event names", () => {
        expect.assertions(4);

        const rendererEventResults = [
            ...Object.values(expectedPreloadEvents).map((channel) =>
                ipcBridgeCatalog.isAllowedRendererIpcEventChannel(channel)
            ),
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
        const rendererBoundaryResults = {
            fitParseSubscription:
                ipcBridgeCatalog.isAllowedRendererIpcEventChannel("fit:parse"),
            updateErrorEvent:
                ipcBridgeCatalog.isAllowedUpdateEventName("update-error"),
        };

        expect(rendererEventResults).toStrictEqual([
            ...Object.values(expectedPreloadEvents).map(() => true),
            true,
            true,
            false,
        ]);
        expect(updateEventResults).toStrictEqual([true, false]);
        expect(rendererBoundaryResults).toStrictEqual({
            fitParseSubscription: false,
            updateErrorEvent: true,
        });
        expect(Object.values(rendererBoundaryResults)).toContain(true);
    });

    it("rejects non-string channel values before consulting allowlists", () => {
        expect.assertions(1);

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
