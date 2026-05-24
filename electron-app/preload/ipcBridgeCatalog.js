"use strict";
{
    const PRELOAD_CHANNELS = {
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
    };
    const PRELOAD_EVENTS = {
        FIT_FILE_LOADED: "fit-file-loaded",
        INSTALL_UPDATE: "install-update",
        MENU_CHECK_FOR_UPDATES: "menu-check-for-updates",
        MENU_OPEN_FILE: "menu-open-file",
        MENU_OPEN_OVERLAY: "menu-open-overlay",
        OPEN_RECENT_FILE: "open-recent-file",
        OPEN_SUMMARY_COLUMN_SELECTOR: "open-summary-column-selector",
        SET_FULLSCREEN: "set-fullscreen",
        SET_THEME: "set-theme",
        THEME_CHANGED: "theme-changed",
    };
    const ADDITIONAL_GENERIC_INVOKE_CHANNELS = [
        "main-state:errors",
        "main-state:get",
        "main-state:listen",
        "main-state:metrics",
        "main-state:operation",
        "main-state:operations",
        "main-state:set",
        "main-state:unlisten",
    ];
    const GENERIC_SEND_CHANNELS = [
        PRELOAD_EVENTS.FIT_FILE_LOADED,
        PRELOAD_EVENTS.INSTALL_UPDATE,
        PRELOAD_EVENTS.MENU_CHECK_FOR_UPDATES,
        PRELOAD_EVENTS.SET_FULLSCREEN,
        PRELOAD_EVENTS.THEME_CHANGED,
        "menu-export",
        "menu-save-as",
    ];
    const EXTRA_RENDERER_ON_IPC_CHANNELS = [
        "decoder-options-changed",
        "export-file",
        "fit-browser-enabled-changed",
        "gyazo-oauth-callback",
        "menu-about",
        "menu-export",
        "menu-keyboard-shortcuts",
        "menu-print",
        "menu-restart-update",
        "menu-save-as",
        "open-accent-color-picker",
        "set-font-size",
        "set-high-contrast",
        "show-notification",
        "unload-fit-file",
    ];
    const UPDATE_EVENT_NAMES = [
        "update-available",
        "update-checking",
        "update-download-progress",
        "update-downloaded",
        "update-error",
        "update-not-available",
    ];
    const ALLOWED_GENERIC_INVOKE_CHANNELS = new Set([
        ...ADDITIONAL_GENERIC_INVOKE_CHANNELS,
        ...Object.values(PRELOAD_CHANNELS),
    ]);
    const ALLOWED_GENERIC_SEND_CHANNELS = new Set(GENERIC_SEND_CHANNELS);
    const ALLOWED_GENERIC_ON_IPC_CHANNELS = new Set([
        ...EXTRA_RENDERER_ON_IPC_CHANNELS,
        ...Object.values(PRELOAD_EVENTS),
        ...UPDATE_EVENT_NAMES,
    ]);
    const ALLOWED_UPDATE_EVENT_NAMES = new Set(UPDATE_EVENT_NAMES);
    function isStringSetMember(allowedValues, value) {
        return typeof value === "string" && allowedValues.has(value);
    }
    function isAllowedGenericInvokeChannel(channel) {
        return isStringSetMember(ALLOWED_GENERIC_INVOKE_CHANNELS, channel);
    }
    function isAllowedGenericSendChannel(channel) {
        return isStringSetMember(ALLOWED_GENERIC_SEND_CHANNELS, channel);
    }
    function isAllowedRendererIpcEventChannel(channel) {
        return isStringSetMember(ALLOWED_GENERIC_ON_IPC_CHANNELS, channel);
    }
    function isAllowedUpdateEventName(eventName) {
        return isStringSetMember(ALLOWED_UPDATE_EVENT_NAMES, eventName);
    }
    module.exports = {
        PRELOAD_CHANNELS,
        PRELOAD_EVENTS,
        isAllowedGenericInvokeChannel,
        isAllowedGenericSendChannel,
        isAllowedRendererIpcEventChannel,
        isAllowedUpdateEventName,
    };
}
