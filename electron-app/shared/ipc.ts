import type { FitDecodeResult } from "./fit";

/** Recursive object value allowed across IPC serialization. */
export type IpcSerializableObject = {
    readonly [key in string]: IpcSerializable;
};

/** Recursive object value allowed in main-state IPC serialization. */
export type MainStateIpcObject = {
    readonly [key in string]: MainStateIpcValue;
};

/** JSON-like values plus arrays and objects that are safe to move over IPC. */
export type IpcSerializable =
    | boolean
    | null
    | number
    | string
    | readonly IpcSerializable[]
    | IpcSerializableObject;

/** Payload shape accepted by generic invoke wrappers. */
export type IpcRequestPayload = IpcSerializable | ArrayBuffer;

/** Payload shape returned by generic invoke wrappers. */
export type IpcResponsePayload = IpcSerializable | ArrayBuffer;

/** Main-state values after IPC serialization. */
export type MainStateIpcValue =
    | boolean
    | null
    | number
    | string
    | undefined
    | readonly MainStateIpcValue[]
    | MainStateIpcObject;

/** App-owned main-process state paths exposed through typed facades. */
export const MAIN_APP_STATE_KNOWN_PATHS = [
    "appIsQuitting",
    "autoUpdater.status",
    "autoUpdater.updateDownloaded",
    "autoUpdaterInitialized",
    "gyazoServer",
    "gyazoServerPort",
    "loadedFitFilePath",
    "mainWindow",
    "permissions.geolocation.allowed",
] as const;

/** Typed app-owned main-process state path. */
export type MainAppStateKnownPath = (typeof MAIN_APP_STATE_KNOWN_PATHS)[number];

/** Renderer-readable main-process state paths. */
export type MainProcessStateReadablePath =
    | MainAppStateKnownPath
    | `operations.${string}`;

/** Renderer-listenable main-process state paths. */
export type MainProcessStateListenPath = "*" | MainProcessStateReadablePath;

/** Renderer-writable main-process state paths. */
export type MainProcessStateWritablePath =
    | "loadedFitFilePath"
    | `operations.${string}`;

/** Dot-path accepted by the low-level main-process state bridge. */
export type MainStatePath = string;

/** Metadata accepted when renderer-owned main-state values are updated. */
export type MainStateSetOptions = Readonly<Record<string, MainStateIpcValue>>;

/** Renderer-provided main-state value. */
export type MainStateSetValue = MainStateIpcValue;

/** Request payloads for invoke channels with explicit contracts. */
export interface InvokeRequestPayloadByChannel {
    "browser:getFolder": never;
    "browser:isEnabled": never;
    "browser:listFolder": string;
    "browser:setEnabled": boolean;
    "browser:setFolder": string;
    "clipboard:writePngDataUrl": string;
    "clipboard:writeText": string;
    "devtools-inject-menu": [
        theme?: null | string,
        fitFilePath?: null | string,
    ];
    "dialog:openFile": never;
    "dialog:openFolder": never;
    "dialog:openOverlayFiles": never;
    "fit:decode": ArrayBuffer;
    "fit:parse": ArrayBuffer;
    "file:read": string;
    getAppVersion: never;
    getChromeVersion: never;
    getElectronVersion: never;
    getLicenseInfo: never;
    getNodeVersion: never;
    getPlatformInfo: never;
    "gyazo:server:start": number;
    "gyazo:server:stop": never;
    "main-state:errors": number | undefined;
    "main-state:get": MainStatePath | undefined;
    "main-state:listen": MainStatePath;
    "main-state:metrics": never;
    "main-state:operation": string;
    "main-state:operations": never;
    "main-state:set": [
        path: MainStatePath,
        value: MainStateSetValue,
        options?: MainStateSetOptions,
    ];
    "main-state:unlisten": MainStatePath;
    "map-tab:get": never;
    "recentFiles:add": string;
    "recentFiles:approve": string;
    "recentFiles:get": never;
    "shell:openExternal": string;
    "theme:get": never;
}

/** Response payloads for invoke channels with explicit contracts. */
export interface InvokeResponsePayloadByChannel {
    "browser:getFolder": null | string;
    "browser:isEnabled": boolean;
    "browser:listFolder": FitBrowserListFolderResult;
    "browser:setEnabled": boolean;
    "browser:setFolder": boolean;
    "clipboard:writePngDataUrl": boolean;
    "clipboard:writeText": boolean;
    "devtools-inject-menu": boolean;
    "dialog:openFile": null | string;
    "dialog:openFolder": null | string;
    "dialog:openOverlayFiles": string[];
    "fit:decode": FitDecodeResult;
    "fit:parse": FitDecodeResult;
    "file:read": ArrayBuffer;
    getAppVersion: string;
    getChromeVersion: string;
    getElectronVersion: string;
    getLicenseInfo: string;
    getNodeVersion: string;
    getPlatformInfo: PlatformInfo;
    "gyazo:server:start": GyazoServerStartResult;
    "gyazo:server:stop": GyazoServerStopResult;
    "main-state:errors": MainStateIpcValue[];
    "main-state:get": MainStateIpcValue;
    "main-state:listen": boolean;
    "main-state:metrics": MainStateIpcValue;
    "main-state:operation": MainStateIpcValue;
    "main-state:operations": MainStateIpcValue;
    "main-state:set": boolean;
    "main-state:unlisten": boolean;
    "map-tab:get": string;
    "recentFiles:add": string[];
    "recentFiles:approve": boolean;
    "recentFiles:get": string[];
    "shell:openExternal": boolean;
    "theme:get": string;
}

type InvokeRequestArgsFromPayload<Payload> = [Payload] extends [never]
    ? []
    : Payload extends readonly unknown[]
      ? [...Payload]
      : [Payload];

/** Request payload for a specific invoke channel. */
export type InvokeRequestPayloadForChannel<
    Channel extends GenericInvokeChannel,
> = InvokeRequestPayloadByChannel[Channel];

/** Argument tuple accepted by a specific invoke channel. */
export type InvokeRequestArgs<Channel extends GenericInvokeChannel> =
    InvokeRequestArgsFromPayload<InvokeRequestPayloadByChannel[Channel]>;

/** Response payload returned by a specific invoke channel. */
export type InvokeResponsePayloadForChannel<
    Channel extends GenericInvokeChannel,
> = InvokeResponsePayloadByChannel[Channel];

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

/** Request payload accepted by app and preference metadata handlers. */
export type InfoRequestPayload =
    InvokeRequestPayloadByChannel[InfoInvokeChannel];

/** Response payload returned by app and preference metadata handlers. */
export type InfoResponsePayload =
    InvokeResponsePayloadByChannel[InfoInvokeChannel];

/** String metadata returned by version, license, theme, and map-tab channels. */
export type InfoStringResponse = InvokeResponsePayloadByChannel[
    | "getAppVersion"
    | "getChromeVersion"
    | "getElectronVersion"
    | "getLicenseInfo"
    | "getNodeVersion"
    | "map-tab:get"
    | "theme:get"];

/** Platform details returned by getPlatformInfo. */
export type InfoPlatformResponse =
    InvokeResponsePayloadByChannel["getPlatformInfo"];

/** Theme preference returned by theme:get. */
export type ThemePreferenceResponse =
    InvokeResponsePayloadByChannel["theme:get"];

/** Selected map tab identifier returned by map-tab:get. */
export type MapTabSelectionResponse =
    InvokeResponsePayloadByChannel["map-tab:get"];

/** External integration invoke channels handled by shell and Gyazo IPC. */
export type ExternalInvokeChannel = Extract<
    GenericInvokeChannel,
    "gyazo:server:start" | "gyazo:server:stop" | "shell:openExternal"
>;

/** Request payload accepted by external integration invoke handlers. */
export type ExternalRequestPayload =
    InvokeRequestPayloadByChannel[ExternalInvokeChannel];

/** Response payload returned by external integration invoke handlers. */
export type ExternalResponsePayload =
    InvokeResponsePayloadByChannel[ExternalInvokeChannel];

/** URL string accepted by shell:openExternal before policy validation. */
export type ShellOpenExternalRequest =
    InvokeRequestPayloadByChannel["shell:openExternal"];

/** Success flag returned after shell:openExternal completes. */
export type ShellOpenExternalResponse =
    InvokeResponsePayloadByChannel["shell:openExternal"];

/** Port requested by gyazo:server:start. */
export type GyazoServerStartRequest =
    InvokeRequestPayloadByChannel["gyazo:server:start"];

/** Result returned when gyazo:server:start completes. */
export type GyazoServerStartResponse =
    InvokeResponsePayloadByChannel["gyazo:server:start"];

/** Result returned when gyazo:server:stop completes. */
export type GyazoServerStopResponse =
    InvokeResponsePayloadByChannel["gyazo:server:stop"];

/** Development helper invoke channels handled by menu/devtools IPC. */
export type DevtoolsInvokeChannel = Extract<
    GenericInvokeChannel,
    "devtools-inject-menu"
>;

/** Request arguments accepted by devtools menu injection. */
export type DevtoolsInjectMenuRequest =
    InvokeRequestPayloadByChannel["devtools-inject-menu"];

/** Theme argument accepted by devtools menu injection. */
export type DevtoolsInjectMenuTheme = null | string;

/** FIT file path argument accepted by devtools menu injection. */
export type DevtoolsInjectMenuFitFilePath = null | string;

/** Success flag returned after devtools menu injection. */
export type DevtoolsInjectMenuResponse =
    InvokeResponsePayloadByChannel["devtools-inject-menu"];

/** Main-process state invoke channels handled by the state bridge. */
export type MainStateInvokeChannel = Extract<
    GenericInvokeChannel,
    | "main-state:errors"
    | "main-state:get"
    | "main-state:listen"
    | "main-state:metrics"
    | "main-state:operation"
    | "main-state:operations"
    | "main-state:set"
    | "main-state:unlisten"
>;

/** Request payload accepted by main-state invoke handlers. */
export type MainStateRequestPayload =
    InvokeRequestPayloadByChannel[MainStateInvokeChannel];

/** Response payload returned by main-state invoke handlers. */
export type MainStateResponsePayload =
    InvokeResponsePayloadByChannel[MainStateInvokeChannel];

/** Optional path accepted by main-state:get. */
export type MainStateGetRequest =
    InvokeRequestPayloadByChannel["main-state:get"];

/** Value returned by main-state:get. */
export type MainStateGetResponse =
    InvokeResponsePayloadByChannel["main-state:get"];

/** Request tuple accepted by main-state:set. */
export type MainStateSetRequest =
    InvokeRequestPayloadByChannel["main-state:set"];

/** Success flag returned by main-state:set. */
export type MainStateSetResponse =
    InvokeResponsePayloadByChannel["main-state:set"];

/** Path accepted by main-state:listen. */
export type MainStateListenRequest =
    InvokeRequestPayloadByChannel["main-state:listen"];

/** Success flag returned by main-state:listen. */
export type MainStateListenResponse =
    InvokeResponsePayloadByChannel["main-state:listen"];

/** Path accepted by main-state:unlisten. */
export type MainStateUnlistenRequest =
    InvokeRequestPayloadByChannel["main-state:unlisten"];

/** Success flag returned by main-state:unlisten. */
export type MainStateUnlistenResponse =
    InvokeResponsePayloadByChannel["main-state:unlisten"];

/** Operation id accepted by main-state:operation. */
export type MainStateOperationRequest =
    InvokeRequestPayloadByChannel["main-state:operation"];

/** Single operation status returned by main-state:operation. */
export type MainStateOperationResponse = MainStateIpcValue;

/** All operation statuses returned by main-state:operations. */
export type MainStateOperationsResponse = MainStateIpcValue;

/** Optional limit accepted by main-state:errors. */
export type MainStateErrorsRequest =
    InvokeRequestPayloadByChannel["main-state:errors"];

/** Recent errors returned by main-state:errors. */
export type MainStateErrorsResponse = MainStateIpcValue[];

/** Metrics snapshot returned by main-state:metrics. */
export type MainStateMetricsResponse = MainStateIpcValue;

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

/** Request payload accepted by FIT browser invoke handlers. */
export type FitBrowserRequestPayload =
    InvokeRequestPayloadByChannel[FitBrowserInvokeChannel];

/** Response payload returned by FIT browser invoke handlers. */
export type FitBrowserResponsePayload =
    InvokeResponsePayloadByChannel[FitBrowserInvokeChannel];

/** Persisted FIT browser root folder, or null when unavailable. */
export type FitBrowserGetFolderResponse =
    InvokeResponsePayloadByChannel["browser:getFolder"];

/** Relative directory path accepted by browser:listFolder. */
export type FitBrowserListFolderRequest =
    InvokeRequestPayloadByChannel["browser:listFolder"];

/** Directory listing payload returned by browser:listFolder. */
export type FitBrowserListFolderResponse =
    InvokeResponsePayloadByChannel["browser:listFolder"];

/** Enabled flag accepted by browser:setEnabled. */
export type FitBrowserSetEnabledRequest =
    InvokeRequestPayloadByChannel["browser:setEnabled"];

/** Enabled flag returned by browser:isEnabled and browser:setEnabled. */
export type FitBrowserEnabledResponse = InvokeResponsePayloadByChannel[
    | "browser:isEnabled"
    | "browser:setEnabled"];

/** Root folder path accepted by browser:setFolder. */
export type FitBrowserSetFolderRequest =
    InvokeRequestPayloadByChannel["browser:setFolder"];

/** Result returned after browser:setFolder validation and persistence. */
export type FitBrowserSetFolderResponse =
    InvokeResponsePayloadByChannel["browser:setFolder"];

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
    value: MainStateIpcValue;
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

/** Event channels the main process accepts through ipcMain.on. */
export type MainProcessIpcEventChannel =
    | GenericSendChannel
    | "menu-restart-update";

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
    | "menu-open-file"
    | "menu-open-overlay"
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
export type IpcEventCallback = (...args: IpcResponsePayload[]) => void;
