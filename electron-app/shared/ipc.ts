import type { FitDecodeResult } from "./fit";

/** JSON-like values plus arrays and objects that are safe to move over IPC. */
export type IpcSerializable =
    | boolean
    | null
    | number
    | string
    | readonly IpcSerializable[]
    | { readonly [key: string]: IpcSerializable };

/** Payload shape accepted by generic invoke wrappers. */
export type IpcRequestPayload = IpcSerializable | ArrayBuffer;

/** Payload shape returned by generic invoke wrappers. */
export type IpcResponsePayload = IpcSerializable | ArrayBuffer;

/** Request payloads for invoke channels with explicit contracts. */
export interface InvokeRequestPayloadByChannel {
    "fit:decode": ArrayBuffer;
    "fit:parse": ArrayBuffer;
}

/** Response payloads for invoke channels with explicit contracts. */
export interface InvokeResponsePayloadByChannel {
    "fit:decode": FitDecodeResult;
    "fit:parse": FitDecodeResult;
}

/** FIT decode/parse invoke channels handled by the main process parser bridge. */
export type FitFileInvokeChannel = Extract<
    GenericInvokeChannel,
    "fit:decode" | "fit:parse"
>;

/** Request payload accepted by FIT file invoke handlers. */
export type FitFileRequestPayload =
    InvokeRequestPayloadByChannel[FitFileInvokeChannel];

/** Response payload returned by FIT file invoke handlers. */
export type FitFileResponsePayload =
    InvokeResponsePayloadByChannel[FitFileInvokeChannel];

/** Result returned when the Gyazo OAuth helper server starts. */
export interface GyazoServerStartResult {
    message?: string;
    port: number;
    success: boolean;
}

/** Result returned when the Gyazo OAuth helper server stops. */
export interface GyazoServerStopResult {
    message?: string;
    success: boolean;
}

/** Platform details exposed to the renderer. */
export interface PlatformInfo {
    arch: string;
    platform: string;
}

/** Summary of preload-exposed channels and events. */
export interface ChannelInfo {
    channels: Record<string, string>;
    events: Record<string, string>;
    totalChannels: number;
    totalEvents: number;
}

/** State change payload emitted by the main-process state bridge. */
export interface MainStateChange {
    path: string;
    source?: string;
    timestamp?: number;
    value: IpcSerializable;
}

/** Callback used for main-process state change subscriptions. */
export type MainStateListener = (change: MainStateChange) => void;

/** Auto-update event names sent from the main process to the renderer. */
export type UpdateEventName =
    | "update-available"
    | "update-checking"
    | "update-download-progress"
    | "update-downloaded"
    | "update-error"
    | "update-not-available";

/** Fire-and-forget channels the renderer can send through preload. */
export type GenericSendChannel =
    | "fit-file-loaded"
    | "install-update"
    | "menu-check-for-updates"
    | "menu-export"
    | "menu-save-as"
    | "set-fullscreen"
    | "theme-changed";

/** Invoke channels the renderer can call through preload. */
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

/** Event channels the renderer can subscribe to through preload. */
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

/** Callback signature for raw IPC event subscriptions exposed by preload. */
export type IpcEventCallback = (
    event: object,
    ...args: IpcResponsePayload[]
) => void;
