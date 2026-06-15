type GenericInvokeChannel = import("../shared/ipc").GenericInvokeChannel;
type RendererIpcEventChannel = import("../shared/ipc").RendererIpcEventChannel;
type UpdateEventName = import("../shared/ipc").UpdateEventName;

type PreloadChannelName =
    | "APP_VERSION"
    | "CHROME_VERSION"
    | "CLIPBOARD_WRITE_PNG_DATA_URL"
    | "CLIPBOARD_WRITE_TEXT"
    | "DEVTOOLS_INJECT_MENU"
    | "DIALOG_OPEN_FILE"
    | "DIALOG_OPEN_FOLDER"
    | "DIALOG_OPEN_OVERLAY_FILES"
    | "ELECTRON_VERSION"
    | "FILE_READ"
    | "FIT_BROWSER_GET_FOLDER"
    | "FIT_BROWSER_IS_ENABLED"
    | "FIT_BROWSER_LIST_FOLDER"
    | "FIT_BROWSER_SET_ENABLED"
    | "FIT_BROWSER_SET_FOLDER"
    | "FIT_DECODE"
    | "FIT_PARSE"
    | "GYAZO_SERVER_START"
    | "GYAZO_SERVER_STOP"
    | "LICENSE_INFO"
    | "NODE_VERSION"
    | "PLATFORM_INFO"
    | "RECENT_FILES_ADD"
    | "RECENT_FILES_APPROVE"
    | "RECENT_FILES_GET"
    | "SHELL_OPEN_EXTERNAL"
    | "THEME_GET";

type PreloadEventName =
    | "DECODER_OPTIONS_CHANGED"
    | "EXPORT_FILE"
    | "FIT_BROWSER_ENABLED_CHANGED"
    | "FIT_FILE_LOADED"
    | "GYAZO_OAUTH_CALLBACK"
    | "INSTALL_UPDATE"
    | "MENU_ABOUT"
    | "MENU_CHECK_FOR_UPDATES"
    | "MENU_EXPORT"
    | "MENU_KEYBOARD_SHORTCUTS"
    | "MENU_OPEN_FILE"
    | "MENU_OPEN_OVERLAY"
    | "MENU_PRINT"
    | "MENU_RESTART_UPDATE"
    | "MENU_SAVE_AS"
    | "OPEN_RECENT_FILE"
    | "OPEN_ACCENT_COLOR_PICKER"
    | "OPEN_SUMMARY_COLUMN_SELECTOR"
    | "SET_FONT_SIZE"
    | "SET_FULLSCREEN"
    | "SET_HIGH_CONTRAST"
    | "SET_THEME"
    | "SHOW_NOTIFICATION"
    | "THEME_CHANGED"
    | "UNLOAD_FIT_FILE";

export const PRELOAD_CHANNELS = {
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
} as const satisfies Record<PreloadChannelName, GenericInvokeChannel>;

export const PRELOAD_EVENTS = {
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
} as const satisfies Record<PreloadEventName, RendererIpcEventChannel>;

const UPDATE_EVENT_NAMES = [
    "update-available",
    "update-checking",
    "update-download-progress",
    "update-downloaded",
    "update-error",
    "update-not-available",
] as const satisfies readonly UpdateEventName[];

const ALLOWED_UPDATE_EVENT_NAMES: ReadonlySet<string> = new Set(
    UPDATE_EVENT_NAMES
);

function isStringSetMember(
    allowedValues: ReadonlySet<string>,
    value: unknown
): value is string {
    return typeof value === "string" && allowedValues.has(value);
}

export function isAllowedUpdateEventName(
    eventName: unknown
): eventName is UpdateEventName {
    return isStringSetMember(ALLOWED_UPDATE_EVENT_NAMES, eventName);
}
