import { describe, expect, it } from "vitest";
import * as ipcBridgeCatalog from "../../../electron-app/preload/ipcBridgeCatalog.js";

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
    DECODER_OPTIONS_CHANGED: "decoder-options-changed",
    EXPORT_FILE: "export-file",
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
    MENU_PRINT: "menu-print",
    MENU_RESTART_UPDATE: "menu-restart-update",
    MENU_SAVE_AS: "menu-save-as",
    OPEN_ACCENT_COLOR_PICKER: "open-accent-color-picker",
    OPEN_RECENT_FILE: "open-recent-file",
    OPEN_SUMMARY_COLUMN_SELECTOR: "open-summary-column-selector",
    SET_FONT_SIZE: "set-font-size",
    SET_FULLSCREEN: "set-fullscreen",
    SET_HIGH_CONTRAST: "set-high-contrast",
    SET_THEME: "set-theme",
    SHOW_NOTIFICATION: "show-notification",
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

    it("allows only updater event names through the update-event API", () => {
        expect.assertions(3);

        const updateEventResults = [
            ipcBridgeCatalog.isAllowedUpdateEventName("update-available"),
            ipcBridgeCatalog.isAllowedUpdateEventName("update-downloaded"),
            ipcBridgeCatalog.isAllowedUpdateEventName("update-error"),
            ipcBridgeCatalog.isAllowedUpdateEventName("menu-open-file"),
        ];
        const updateBoundaryResults = {
            fitParseEvent:
                ipcBridgeCatalog.isAllowedUpdateEventName("fit:parse"),
            updateErrorEvent:
                ipcBridgeCatalog.isAllowedUpdateEventName("update-error"),
        };

        expect(updateEventResults).toStrictEqual([
            true,
            true,
            true,
            false,
        ]);
        expect(updateBoundaryResults).toStrictEqual({
            fitParseEvent: false,
            updateErrorEvent: true,
        });
        expect(Object.values(updateBoundaryResults)).toContain(true);
    });

    it("rejects non-string update event names before consulting allowlists", () => {
        expect.assertions(1);

        const nonStringResults = [
            ipcBridgeCatalog.isAllowedUpdateEventName(undefined),
            ipcBridgeCatalog.isAllowedUpdateEventName(42),
            ipcBridgeCatalog.isAllowedUpdateEventName({}),
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
