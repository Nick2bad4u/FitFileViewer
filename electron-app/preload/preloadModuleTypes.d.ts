export type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
export type GenericSendChannel = import("../shared/ipc").GenericSendChannel;
export type IpcRequestPayload = import("../shared/ipc").IpcRequestPayload;
export type IpcResponsePayload = import("../shared/ipc").IpcResponsePayload;
export type MainStateChange = import("../shared/ipc").MainStateChange;
export type RendererIpcEventChannel =
    import("../shared/ipc").RendererIpcEventChannel;
export type UpdateEventName = import("../shared/ipc").UpdateEventName;

export type PreloadLog = (
    level: "error" | "info" | "warn",
    message: string,
    ...details: unknown[]
) => void;
export type UnknownCallback = (...args: unknown[]) => unknown;
export type IpcEventListener = (
    event: object,
    ...args: IpcResponsePayload[]
) => void;
export type PreloadApiFactory<Keys extends keyof ElectronAPI> = (
    options: Record<string, unknown>
) => Pick<ElectronAPI, Keys>;
export type PreloadModuleRequire = (moduleId: string) => unknown;

export interface PreloadContextBridge {
    exposeInMainWorld?: (key: string, api: unknown) => void;
}

export interface PreloadIpcRenderer {
    invoke?: (
        channel: string,
        ...args: IpcRequestPayload[]
    ) => Promise<IpcResponsePayload>;
    off?: (channel: string, listener: IpcEventListener) => void;
    on?: (channel: string, listener: IpcEventListener) => void;
    removeAllListeners?: (channel: string) => void;
    removeListener?: (channel: string, listener: IpcEventListener) => void;
    send?: (channel: string, ...args: IpcRequestPayload[]) => void;
}

export interface PreloadElectronBridge {
    contextBridge?: null | PreloadContextBridge;
    default?: null | PreloadElectronBridge;
    ipcRenderer?: null | PreloadIpcRenderer;
}

export interface PreloadChannels {
    readonly APP_VERSION: "getAppVersion";
    readonly CHROME_VERSION: "getChromeVersion";
    readonly CLIPBOARD_WRITE_PNG_DATA_URL: "clipboard:writePngDataUrl";
    readonly CLIPBOARD_WRITE_TEXT: "clipboard:writeText";
    readonly DEVTOOLS_INJECT_MENU: "devtools-inject-menu";
    readonly DIALOG_OPEN_FILE: "dialog:openFile";
    readonly DIALOG_OPEN_FOLDER: "dialog:openFolder";
    readonly DIALOG_OPEN_OVERLAY_FILES: "dialog:openOverlayFiles";
    readonly ELECTRON_VERSION: "getElectronVersion";
    readonly FILE_READ: "file:read";
    readonly FIT_BROWSER_GET_FOLDER: "browser:getFolder";
    readonly FIT_BROWSER_IS_ENABLED: "browser:isEnabled";
    readonly FIT_BROWSER_LIST_FOLDER: "browser:listFolder";
    readonly FIT_BROWSER_SET_ENABLED: "browser:setEnabled";
    readonly FIT_BROWSER_SET_FOLDER: "browser:setFolder";
    readonly FIT_DECODE: "fit:decode";
    readonly FIT_PARSE: "fit:parse";
    readonly GYAZO_SERVER_START: "gyazo:server:start";
    readonly GYAZO_SERVER_STOP: "gyazo:server:stop";
    readonly LICENSE_INFO: "getLicenseInfo";
    readonly NODE_VERSION: "getNodeVersion";
    readonly PLATFORM_INFO: "getPlatformInfo";
    readonly RECENT_FILES_ADD: "recentFiles:add";
    readonly RECENT_FILES_APPROVE: "recentFiles:approve";
    readonly RECENT_FILES_GET: "recentFiles:get";
    readonly SHELL_OPEN_EXTERNAL: "shell:openExternal";
    readonly THEME_GET: "theme:get";
}

export interface PreloadEvents {
    readonly DECODER_OPTIONS_CHANGED: "decoder-options-changed";
    readonly EXPORT_FILE: "export-file";
    readonly FIT_BROWSER_ENABLED_CHANGED: "fit-browser-enabled-changed";
    readonly FIT_FILE_LOADED: "fit-file-loaded";
    readonly GYAZO_OAUTH_CALLBACK: "gyazo-oauth-callback";
    readonly INSTALL_UPDATE: "install-update";
    readonly MENU_ABOUT: "menu-about";
    readonly MENU_CHECK_FOR_UPDATES: "menu-check-for-updates";
    readonly MENU_EXPORT: "menu-export";
    readonly MENU_KEYBOARD_SHORTCUTS: "menu-keyboard-shortcuts";
    readonly MENU_OPEN_FILE: "menu-open-file";
    readonly MENU_OPEN_OVERLAY: "menu-open-overlay";
    readonly MENU_PRINT: "menu-print";
    readonly MENU_RESTART_UPDATE: "menu-restart-update";
    readonly MENU_SAVE_AS: "menu-save-as";
    readonly OPEN_ACCENT_COLOR_PICKER: "open-accent-color-picker";
    readonly OPEN_RECENT_FILE: "open-recent-file";
    readonly OPEN_SUMMARY_COLUMN_SELECTOR: "open-summary-column-selector";
    readonly SET_FONT_SIZE: "set-font-size";
    readonly SET_FULLSCREEN: "set-fullscreen";
    readonly SET_HIGH_CONTRAST: "set-high-contrast";
    readonly SET_THEME: "set-theme";
    readonly SHOW_NOTIFICATION: "show-notification";
    readonly THEME_CHANGED: "theme-changed";
    readonly UNLOAD_FIT_FILE: "unload-fit-file";
}

export interface IpcBridgeCatalog {
    PRELOAD_CHANNELS: PreloadChannels;
    PRELOAD_EVENTS: PreloadEvents;
    isAllowedGenericInvokeChannel: (
        channel: unknown
    ) => channel is import("../shared/ipc").GenericInvokeChannel;
    isAllowedGenericSendChannel: (
        channel: unknown
    ) => channel is GenericSendChannel;
    isAllowedRendererIpcEventChannel: (
        channel: unknown
    ) => channel is RendererIpcEventChannel;
    isAllowedUpdateEventName: (
        eventName: unknown
    ) => eventName is UpdateEventName;
}

export interface PreloadModuleRegistry {
    createApiDiagnostics: PreloadApiFactory<"getChannelInfo" | "validateAPI">;
    createAppInfoApi: PreloadApiFactory<
        | "getAppVersion"
        | "getChromeVersion"
        | "getElectronVersion"
        | "getLicenseInfo"
        | "getNodeVersion"
        | "getPlatformInfo"
    >;
    createClipboardBridge: PreloadApiFactory<
        "writeClipboardPngDataUrl" | "writeClipboardText"
    >;
    createDevtoolsMenuApi: PreloadApiFactory<"injectMenu">;
    createExternalApi: PreloadApiFactory<
        | "onGyazoOAuthCallback"
        | "openExternal"
        | "startGyazoServer"
        | "stopGyazoServer"
    >;
    createFileApi: PreloadApiFactory<
        | "addRecentFile"
        | "approveRecentFile"
        | "decodeFitFile"
        | "openFile"
        | "openFileDialog"
        | "openOverlayDialog"
        | "parseFitFile"
        | "readFile"
        | "recentFiles"
    >;
    createFitBrowserApi: PreloadApiFactory<
        | "getFitBrowserFolder"
        | "isFitBrowserEnabled"
        | "listFitBrowserFolder"
        | "onFitBrowserEnabledChanged"
        | "setFitBrowserEnabled"
        | "setFitBrowserFolder"
    >;
    createGenericIpcApi: PreloadApiFactory<
        "invoke" | "notifyFitFileLoaded" | "onIpc" | "onUpdateEvent" | "send"
    >;
    createMainStateApi: PreloadApiFactory<
        | "getErrors"
        | "getMainState"
        | "getMetrics"
        | "getOperation"
        | "getOperations"
        | "listenToMainState"
        | "setMainState"
        | "subscribeToMainState"
        | "unlistenFromMainState"
    >;
    createMainStateBridge: (options: Record<string, unknown>) => {
        listenToMainState: (
            path: string,
            callback: (change: MainStateChange) => void
        ) => Promise<boolean>;
        unlistenFromMainState: (
            path: string,
            callback: (change: MainStateChange) => void
        ) => Promise<boolean>;
    };
    createMenuEventApi: PreloadApiFactory<
        | "checkForUpdates"
        | "installUpdate"
        | "onDecoderOptionsChanged"
        | "onExportFile"
        | "onMenuAbout"
        | "onMenuCheckForUpdates"
        | "onMenuExport"
        | "onMenuKeyboardShortcuts"
        | "onMenuOpenFile"
        | "onMenuOpenOverlay"
        | "onMenuPrint"
        | "onMenuRestartUpdate"
        | "onMenuSaveAs"
        | "onOpenAccentColorPicker"
        | "onOpenRecentFile"
        | "onOpenSummaryColumnSelector"
        | "onSetFontSize"
        | "onSetHighContrast"
        | "onSetTheme"
        | "onShowNotification"
        | "onUnloadFitFile"
        | "requestExport"
        | "requestSaveAs"
        | "sendThemeChanged"
        | "setFullScreen"
    >;
    createPreloadIpcHelpers: (options: Record<string, unknown>) => {
        createSafeEventHandler: <Callback>(
            channel: string,
            methodName: string,
            transform?: (...args: IpcResponsePayload[]) => unknown
        ) => (callback: Callback) => () => void;
        createSafeInvokeHandler: (
            channel: string,
            methodName: string
        ) => (...args: unknown[]) => Promise<unknown>;
        createSafeSendHandler: (
            channel: GenericSendChannel,
            methodName: string
        ) => (...args: IpcRequestPayload[]) => void;
        removeIpcListener: (channel: string, handler: IpcEventListener) => void;
    };
    createPreloadLogger: (consoleRef?: Console) => PreloadLog;
    createPreloadValidators: (preloadLog: PreloadLog) => {
        validateCallback: (
            callback: unknown,
            methodName: string
        ) => callback is UnknownCallback;
        validateChannelName: (
            value: unknown,
            paramName: string,
            methodName: string
        ) => value is string;
        validateOptionalNonEmptyString: (
            value: unknown,
            paramName: string,
            methodName: string
        ) => null | string | undefined;
        validateRequiredNonEmptyString: (
            value: unknown,
            paramName: string,
            methodName: string
        ) => value is string;
    };
    createThemeApi: PreloadApiFactory<"getTheme">;
    exposeDevelopmentToolsGlobal: (options: Record<string, unknown>) => boolean;
    exposeElectronApi: (options: Record<string, unknown>) => boolean;
    ipcBridgeCatalog: IpcBridgeCatalog;
    isPreloadDevelopmentMode: (processRef?: NodeJS.Process) => boolean;
    registerPreloadBeforeExitHandler: (
        options: Record<string, unknown>
    ) => void;
    resolvePreloadElectronBridge: (options: {
        globalScope?: object;
        requireModule: PreloadModuleRequire;
    }) => {
        contextBridge: null | PreloadContextBridge | undefined;
        ipcRenderer: null | PreloadIpcRenderer | undefined;
    };
    shouldAllowGenericIpcBridge: (processRef?: NodeJS.Process) => boolean;
    shouldEnforceGenericIpcAllowlist: (
        processRef?: NodeJS.Process
    ) => boolean;
}
