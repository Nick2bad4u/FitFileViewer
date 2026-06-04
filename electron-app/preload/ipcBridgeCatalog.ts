{
    type GenericInvokeChannel = import("../shared/ipc").GenericInvokeChannel;
    type GenericSendChannel = import("../shared/ipc").GenericSendChannel;
    type RendererIpcEventChannel =
        import("../shared/ipc").RendererIpcEventChannel;
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
        | "FIT_BROWSER_ENABLED_CHANGED"
        | "FIT_FILE_LOADED"
        | "GYAZO_OAUTH_CALLBACK"
        | "INSTALL_UPDATE"
        | "MENU_CHECK_FOR_UPDATES"
        | "MENU_OPEN_FILE"
        | "MENU_OPEN_OVERLAY"
        | "OPEN_RECENT_FILE"
        | "OPEN_SUMMARY_COLUMN_SELECTOR"
        | "SET_FULLSCREEN"
        | "SET_THEME"
        | "THEME_CHANGED"
        | "UNLOAD_FIT_FILE";

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
    } as const satisfies Record<PreloadChannelName, GenericInvokeChannel>;

    const PRELOAD_EVENTS = {
        FIT_BROWSER_ENABLED_CHANGED: "fit-browser-enabled-changed",
        FIT_FILE_LOADED: "fit-file-loaded",
        GYAZO_OAUTH_CALLBACK: "gyazo-oauth-callback",
        INSTALL_UPDATE: "install-update",
        MENU_CHECK_FOR_UPDATES: "menu-check-for-updates",
        MENU_OPEN_FILE: "menu-open-file",
        MENU_OPEN_OVERLAY: "menu-open-overlay",
        OPEN_RECENT_FILE: "open-recent-file",
        OPEN_SUMMARY_COLUMN_SELECTOR: "open-summary-column-selector",
        SET_FULLSCREEN: "set-fullscreen",
        SET_THEME: "set-theme",
        THEME_CHANGED: "theme-changed",
        UNLOAD_FIT_FILE: "unload-fit-file",
    } as const satisfies Record<PreloadEventName, RendererIpcEventChannel>;

    const ADDITIONAL_GENERIC_INVOKE_CHANNELS = [
        "main-state:errors",
        "main-state:get",
        "main-state:listen",
        "main-state:metrics",
        "main-state:operation",
        "main-state:operations",
        "main-state:set",
        "main-state:unlisten",
    ] as const satisfies readonly GenericInvokeChannel[];

    const GENERIC_SEND_CHANNELS = [
        PRELOAD_EVENTS.FIT_FILE_LOADED,
        PRELOAD_EVENTS.INSTALL_UPDATE,
        PRELOAD_EVENTS.MENU_CHECK_FOR_UPDATES,
        PRELOAD_EVENTS.SET_FULLSCREEN,
        PRELOAD_EVENTS.THEME_CHANGED,
        "menu-export",
        "menu-save-as",
    ] as const satisfies readonly GenericSendChannel[];

    const EXTRA_RENDERER_ON_IPC_CHANNELS = [
        "decoder-options-changed",
        "export-file",
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
    ] as const satisfies readonly RendererIpcEventChannel[];

    const UPDATE_EVENT_NAMES = [
        "update-available",
        "update-checking",
        "update-download-progress",
        "update-downloaded",
        "update-error",
        "update-not-available",
    ] as const satisfies readonly UpdateEventName[];

    const ALLOWED_GENERIC_INVOKE_CHANNELS: ReadonlySet<string> = new Set([
        ...ADDITIONAL_GENERIC_INVOKE_CHANNELS,
        ...Object.values(PRELOAD_CHANNELS),
    ]);
    const ALLOWED_GENERIC_SEND_CHANNELS: ReadonlySet<string> = new Set(
        GENERIC_SEND_CHANNELS
    );
    const ALLOWED_GENERIC_ON_IPC_CHANNELS: ReadonlySet<string> = new Set([
        ...EXTRA_RENDERER_ON_IPC_CHANNELS,
        ...Object.values(PRELOAD_EVENTS),
        ...UPDATE_EVENT_NAMES,
    ]);
    const ALLOWED_UPDATE_EVENT_NAMES: ReadonlySet<string> = new Set(
        UPDATE_EVENT_NAMES
    );

    function isStringSetMember(
        allowedValues: ReadonlySet<string>,
        value: unknown
    ): value is string {
        return typeof value === "string" && allowedValues.has(value);
    }

    function isAllowedGenericInvokeChannel(
        channel: unknown
    ): channel is GenericInvokeChannel {
        return isStringSetMember(ALLOWED_GENERIC_INVOKE_CHANNELS, channel);
    }

    function isAllowedGenericSendChannel(
        channel: unknown
    ): channel is GenericSendChannel {
        return isStringSetMember(ALLOWED_GENERIC_SEND_CHANNELS, channel);
    }

    function isAllowedRendererIpcEventChannel(
        channel: unknown
    ): channel is RendererIpcEventChannel {
        return isStringSetMember(ALLOWED_GENERIC_ON_IPC_CHANNELS, channel);
    }

    function isAllowedUpdateEventName(
        eventName: unknown
    ): eventName is UpdateEventName {
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
