export type IpcSerializable =
    | boolean
    | null
    | number
    | string
    | readonly IpcSerializable[]
    | { readonly [key: string]: IpcSerializable };

export type IpcRequestPayload = IpcSerializable | ArrayBuffer;

export type IpcResponsePayload = IpcSerializable | ArrayBuffer;

export interface GyazoServerStartResult {
    message?: string;
    port: number;
    success: boolean;
}

export interface GyazoServerStopResult {
    message?: string;
    success: boolean;
}

export interface PlatformInfo {
    arch: string;
    platform: string;
}

export interface ChannelInfo {
    channels: Record<string, string>;
    events: Record<string, string>;
    totalChannels: number;
    totalEvents: number;
}

export interface MainStateChange {
    path: string;
    source?: string;
    timestamp?: number;
    value: IpcSerializable;
}

export type MainStateListener = (change: MainStateChange) => void;

export type UpdateEventName =
    | "update-available"
    | "update-checking"
    | "update-download-progress"
    | "update-downloaded"
    | "update-error"
    | "update-not-available";

export type GenericSendChannel =
    | "fit-file-loaded"
    | "install-update"
    | "menu-check-for-updates"
    | "menu-export"
    | "menu-save-as"
    | "set-fullscreen"
    | "theme-changed";

export type GenericInvokeChannel =
    | "browser:getFolder"
    | "browser:isEnabled"
    | "browser:listFolder"
    | "browser:setEnabled"
    | "browser:setFolder"
    | "clipboard:writePngDataUrl"
    | "clipboard:writeText"
    | "devtools-inject-menu"
    | "dialog:openFile"
    | "dialog:openFolder"
    | "dialog:openOverlayFiles"
    | "file:read"
    | "fit:decode"
    | "fit:parse"
    | "getAppVersion"
    | "getChromeVersion"
    | "getElectronVersion"
    | "getLicenseInfo"
    | "getNodeVersion"
    | "getPlatformInfo"
    | "gyazo:server:start"
    | "gyazo:server:stop"
    | "main-state:errors"
    | "main-state:get"
    | "main-state:listen"
    | "main-state:metrics"
    | "main-state:operation"
    | "main-state:operations"
    | "main-state:set"
    | "main-state:unlisten"
    | "recentFiles:add"
    | "recentFiles:approve"
    | "recentFiles:get"
    | "shell:openExternal"
    | "theme:get";

export type RendererIpcEventChannel =
    | GenericSendChannel
    | UpdateEventName
    | "decoder-options-changed"
    | "export-file"
    | "fit-browser-enabled-changed"
    | "gyazo-oauth-callback"
    | "menu-about"
    | "menu-keyboard-shortcuts"
    | "menu-print"
    | "menu-restart-update"
    | "open-accent-color-picker"
    | "open-recent-file"
    | "open-summary-column-selector"
    | "set-font-size"
    | "set-high-contrast"
    | "set-theme"
    | "show-notification"
    | "unload-fit-file";

export type IpcEventCallback = (
    event: object,
    ...args: IpcResponsePayload[]
) => void;
