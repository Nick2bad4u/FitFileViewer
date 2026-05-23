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
    "clipboard:writePngDataUrl": string;
    "clipboard:writeText": string;
    "dialog:openFile": never;
    "dialog:openFolder": never;
    "dialog:openOverlayFiles": never;
    "fit:decode": ArrayBuffer;
    "fit:parse": ArrayBuffer;
    "file:read": string;
    "recentFiles:add": string;
    "recentFiles:approve": string;
    "recentFiles:get": never;
}

/** Response payloads for invoke channels with explicit contracts. */
export interface InvokeResponsePayloadByChannel {
    "clipboard:writePngDataUrl": boolean;
    "clipboard:writeText": boolean;
    "dialog:openFile": null | string;
    "dialog:openFolder": null | string;
    "dialog:openOverlayFiles": string[];
    "fit:decode": FitDecodeResult;
    "fit:parse": FitDecodeResult;
    "file:read": ArrayBuffer;
    "recentFiles:add": string[];
    "recentFiles:approve": boolean;
    "recentFiles:get": string[];
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

/** App and preference metadata invoke channels handled by info IPC handlers. */
export type InfoInvokeChannel = Extract<
    GenericInvokeChannel,
    | "getAppVersion"
    | "getChromeVersion"
    | "getElectronVersion"
    | "getLicenseInfo"
    | "getNodeVersion"
    | "getPlatformInfo"
    | "map-tab:get"
    | "theme:get"
>;

/** External integration invoke channels handled by shell and Gyazo IPC. */
export type ExternalInvokeChannel = Extract<
    GenericInvokeChannel,
    "gyazo:server:start" | "gyazo:server:stop" | "shell:openExternal"
>;

/** Clipboard invoke channels handled by main-process clipboard IPC. */
export type ClipboardInvokeChannel = Extract<
    GenericInvokeChannel,
    "clipboard:writePngDataUrl" | "clipboard:writeText"
>;

/** Request payload accepted by clipboard invoke handlers. */
export type ClipboardRequestPayload =
    InvokeRequestPayloadByChannel[ClipboardInvokeChannel];

/** Response payload returned by clipboard invoke handlers. */
export type ClipboardResponsePayload =
    InvokeResponsePayloadByChannel[ClipboardInvokeChannel];

/** Native dialog invoke channels handled by main-process dialog IPC. */
export type DialogInvokeChannel = Extract<
    GenericInvokeChannel,
    "dialog:openFile" | "dialog:openFolder" | "dialog:openOverlayFiles"
>;

/** Response payload returned by native dialog invoke handlers. */
export type DialogResponsePayload =
    InvokeResponsePayloadByChannel[DialogInvokeChannel];

/** Selected FIT file path returned by dialog:openFile, or null on cancel. */
export type DialogOpenFileResponse =
    InvokeResponsePayloadByChannel["dialog:openFile"];

/** Selected folder path returned by dialog:openFolder, or null on cancel. */
export type DialogOpenFolderResponse =
    InvokeResponsePayloadByChannel["dialog:openFolder"];

/** Selected overlay FIT file paths returned by dialog:openOverlayFiles. */
export type DialogOpenOverlayFilesResponse =
    InvokeResponsePayloadByChannel["dialog:openOverlayFiles"];

/** Filesystem invoke channels handled by main-process file access IPC. */
export type FileSystemInvokeChannel = Extract<
    GenericInvokeChannel,
    "file:read"
>;

/** Request payload accepted by filesystem invoke handlers. */
export type FileSystemRequestPayload =
    InvokeRequestPayloadByChannel[FileSystemInvokeChannel];

/** Response payload returned by filesystem invoke handlers. */
export type FileSystemResponsePayload =
    InvokeResponsePayloadByChannel[FileSystemInvokeChannel];

/** Recent-file invoke channels handled by main-process recent-file IPC. */
export type RecentFilesInvokeChannel = Extract<
    GenericInvokeChannel,
    "recentFiles:add" | "recentFiles:approve" | "recentFiles:get"
>;

/** Request payload accepted by recent-file mutation invoke handlers. */
export type RecentFileRequestPayload = InvokeRequestPayloadByChannel[
    | "recentFiles:add"
    | "recentFiles:approve"];

/** Response payload returned by recent-file invoke handlers. */
export type RecentFilesResponsePayload =
    InvokeResponsePayloadByChannel[RecentFilesInvokeChannel];

/** Recent-file list returned by recentFiles:get and recentFiles:add. */
export type RecentFilesListResponse = InvokeResponsePayloadByChannel[
    | "recentFiles:add"
    | "recentFiles:get"];

/** Approval result returned by recentFiles:approve. */
export type RecentFilesApprovalResponse =
    InvokeResponsePayloadByChannel["recentFiles:approve"];

/** FIT browser invoke channels used by the folder-browser bridge. */
export type FitBrowserInvokeChannel = Extract<
    GenericInvokeChannel,
    | "browser:getFolder"
    | "browser:isEnabled"
    | "browser:listFolder"
    | "browser:setEnabled"
    | "browser:setFolder"
    | "dialog:openFolder"
>;

/** A single entry returned from the FIT browser directory listing. */
export interface FitBrowserEntry {
    fullPath: string;
    kind: "dir" | "file";
    name: string;
    relPath: string;
}

/** Directory listing payload returned by browser:listFolder. */
export interface FitBrowserListFolderResult {
    entries: FitBrowserEntry[];
    relPath: string;
    root: null | string;
}

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
    | "map-tab:get"
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
