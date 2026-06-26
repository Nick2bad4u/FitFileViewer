export type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
export type ElectronApiFactoryOptions =
    import("./electronApiFactoryOptions").ElectronApiFactoryOptions;
export type ElectronApiDiagnosticsApi =
    import("../shared/preloadApi").ElectronApiDiagnosticsApi;
export type ElectronAppInfoApi =
    import("../shared/preloadApi").ElectronAppInfoApi;
export type ElectronClipboardApi =
    import("../shared/preloadApi").ElectronClipboardApi;
export type ElectronDevtoolsMenuApi =
    import("../shared/preloadApi").ElectronDevtoolsMenuApi;
export type ElectronDialogApi =
    import("../shared/preloadApi").ElectronDialogApi;
export type ElectronFileApi = import("../shared/preloadApi").ElectronFileApi;
export type ElectronFitBrowserApi =
    import("../shared/preloadApi").ElectronFitBrowserApi;
export type ElectronGyazoExternalApi =
    import("../shared/preloadApi").ElectronGyazoExternalApi;
export type ElectronMainStateApi =
    import("../shared/preloadApi").ElectronMainStateApi;
export type ElectronMenuEventApi =
    import("../shared/preloadApi").ElectronMenuEventApi;
export type ElectronPreloadEventApi =
    import("../shared/preloadApi").ElectronPreloadEventApi;
export type ElectronShellExternalApi =
    import("../shared/preloadApi").ElectronShellExternalApi;
export type ElectronThemeApi = import("../shared/preloadApi").ElectronThemeApi;
export type ChannelInfo = import("../shared/ipc").ChannelInfo;
export type ClipboardInvokeChannel =
    import("../shared/ipc").ClipboardInvokeChannel;
export type ClipboardRequestPayload =
    import("../shared/ipc").ClipboardRequestPayload;
export type ExternalInvokeChannel =
    import("../shared/ipc").ExternalInvokeChannel;
export type GenericInvokeChannel = import("../shared/ipc").GenericInvokeChannel;
export type GenericSendChannel = import("../shared/ipc").GenericSendChannel;
export type FitBrowserInvokeChannel =
    import("../shared/ipc").FitBrowserInvokeChannel;
export type DevtoolsInvokeChannel =
    import("../shared/ipc").DevtoolsInvokeChannel;
export type IpcRequestPayload = import("../shared/ipc").IpcRequestPayload;
export type IpcResponsePayload = import("../shared/ipc").IpcResponsePayload;
export type RendererIpcEventChannel =
    import("../shared/ipc").RendererIpcEventChannel;
export type InvokeRequestArgs<Channel extends GenericInvokeChannel> =
    import("../shared/ipc").InvokeRequestArgs<Channel>;
export type InvokeResponsePayloadForChannel<
    Channel extends GenericInvokeChannel,
> = import("../shared/ipc").InvokeResponsePayloadForChannel<Channel>;
export type MainStateChange = import("../shared/ipc").MainStateChange;
export type MainStateInvokeChannel =
    import("../shared/ipc").MainStateInvokeChannel;
export type MainStateListenRequest =
    import("../shared/ipc").MainStateListenRequest;
export type MainStateListenResponse =
    import("../shared/ipc").MainStateListenResponse;
export type MainStateListener = import("../shared/ipc").MainStateListener;
export type MainStateUnlistenRequest =
    import("../shared/ipc").MainStateUnlistenRequest;
export type MainStateUnlistenResponse =
    import("../shared/ipc").MainStateUnlistenResponse;
export type UpdateEventName = import("../shared/ipc").UpdateEventName;
export type DevtoolsInjectMenuFitFilePath =
    import("../shared/ipc").DevtoolsInjectMenuFitFilePath;
export type DevtoolsInjectMenuTheme =
    import("../shared/ipc").DevtoolsInjectMenuTheme;

export type PreloadLog = (
    level: "error" | "info" | "warn",
    message: string,
    ...details: unknown[]
) => void;
export type UnknownCallback = (...args: unknown[]) => unknown;
export type CreateSafeInvokeHandler = <Channel extends GenericInvokeChannel>(
    channel: Channel,
    methodName: string
) => (
    ...args: InvokeRequestArgs<Channel>
) => Promise<InvokeResponsePayloadForChannel<Channel>>;
export type CreateSafeEventHandler = <Callback>(
    channel: string,
    methodName: string,
    transform?: (...args: IpcResponsePayload[]) => unknown
) => (callback: Callback) => () => void;
export type CreateMainStateInvokeHandler = <
    Channel extends MainStateInvokeChannel,
>(
    channel: Channel,
    methodName: string
) => (
    ...args: InvokeRequestArgs<Channel>
) => Promise<InvokeResponsePayloadForChannel<Channel>>;
export type IpcEventListener = (event: object, ...args: unknown[]) => void;
export type ValidateDevtoolsInjectMenuPayload = (
    theme: unknown,
    fitFilePath: unknown
) => {
    fitFilePath: DevtoolsInjectMenuFitFilePath;
    theme: DevtoolsInjectMenuTheme;
};
export type ValidateExternalUrl = (url: unknown) => string;
export type ValidateFitBrowserRelativePath = (value: unknown) => string;
export type ValidateFitBrowserRootFolderPath = (value: unknown) => string;
export type ValidateFitFilePathInput = (filePath: unknown) => string;
export type ValidateMainStateOperationIdInput = (value: unknown) => string;
export type ValidateMainStatePathInput = (
    value: unknown,
    options?: { allowUndefined?: boolean }
) => string | undefined;
export type PreloadApiFactory<Api> = (options: Record<string, unknown>) => Api;
export type CreateElectronApi = (
    options: ElectronApiFactoryOptions
) => ElectronAPI;
export type CreatePreloadApiAssemblyContext = (options: {
    constants: PreloadConstants;
    contextBridge: null | PreloadContextBridge | undefined;
    ipcRenderer: null | PreloadIpcRenderer | undefined;
    modules: PreloadModuleRegistry;
    preloadLog: PreloadLog;
    processRef?: NodeJS.Process;
}) => PreloadApiAssemblyContext;
export type CreatePreloadClipboardApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadClipboardApiDomain;
export type CreatePreloadDeveloperApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadDeveloperApiDomain;
export type CreatePreloadDiagnosticsApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadDiagnosticsApiDomain;
export type CreatePreloadDialogApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadDialogApiDomain;
export type CreatePreloadExternalApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadExternalApiDomain;
export type CreatePreloadFileApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadFileApiDomain;
export type CreatePreloadIpcEventApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadIpcEventApiDomain;
export type CreatePreloadStateApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadStateApiDomain;
export type CreatePreloadSystemApiDomain = (
    context: PreloadApiAssemblyContext
) => PreloadSystemApiDomain;
export type CreateMainStateApi = (
    options: CreateMainStateApiOptions
) => ElectronMainStateApi;
export type CreateMainStateBridge = (
    options: CreateMainStateBridgeOptions
) => PreloadMainStateBridge;
export type CreateAppInfoApi = (
    options: CreateAppInfoApiOptions
) => ElectronAppInfoApi;
export type CreateThemeApi = (
    options: CreateThemeApiOptions
) => ElectronThemeApi;
export type CreateApiDiagnostics = (
    options: CreateApiDiagnosticsOptions
) => ElectronApiDiagnosticsApi;
export type CreateClipboardBridge = (
    options: CreateClipboardBridgeOptions
) => ElectronClipboardApi;
export type CreateDevtoolsMenuApi = (
    options: CreateDevtoolsMenuApiOptions
) => ElectronDevtoolsMenuApi;
export type CreateFileApi = (options: CreateFileApiOptions) => ElectronFileApi;
export type CreateFitBrowserApi = (
    options: CreateFitBrowserApiOptions
) => ElectronFitBrowserApi;
export type CreateGyazoExternalApi = (
    options: CreateGyazoExternalApiOptions
) => ElectronGyazoExternalApi;
export type CreateShellExternalApi = (
    options: CreateShellExternalApiOptions
) => ElectronShellExternalApi;
export type ExposeDevelopmentToolsGlobal = (
    options: ExposeDevelopmentToolsGlobalOptions
) => boolean;
export type RegisterPreloadBeforeExitHandler = (
    options: RegisterPreloadBeforeExitHandlerOptions
) => void;
export type CreateMenuEventApi = (
    options: CreateMenuEventApiOptions
) => ElectronMenuEventApi;
export type CreatePreloadEventApi = (
    options: CreatePreloadEventApiOptions
) => ElectronPreloadEventApi;
export type CreatePreloadIpcHelpers = (
    options: CreatePreloadIpcHelpersOptions
) => PreloadIpcHelpers;
export type CreatePreloadLogger = (consoleRef?: PreloadConsole) => PreloadLog;
export type CreatePreloadValidators = (
    preloadLog: PreloadLog
) => PreloadValidators;
export type ExposeElectronApi = (options: ExposeElectronApiOptions) => boolean;
export type ResolvePreloadElectronBridge = (
    options: ResolvePreloadElectronBridgeOptions
) => PreloadElectronBridgeResolution;
export type ShouldEnforceGenericIpcAllowlist = (
    processRef?: NodeJS.Process
) => boolean;
export type AssemblePreloadApi = (options: {
    constants: PreloadConstants;
    contextBridge: null | PreloadContextBridge | undefined;
    createElectronApi: CreateElectronApi;
    ipcRenderer: null | PreloadIpcRenderer | undefined;
    modules: PreloadModuleRegistry;
    preloadLog: PreloadLog;
    processRef?: NodeJS.Process;
}) => ElectronAPI;

export interface PreloadConstants {
    CHANNELS: PreloadChannels;
    DEFAULT_VALUES: {
        FIT_FILE_PATH: null;
        THEME: null;
    };
    EVENTS: PreloadEvents;
}

export interface PreloadRuntime {
    assemblePreloadApi: AssemblePreloadApi;
    constants: PreloadConstants;
    createElectronApi: CreateElectronApi;
    modules: PreloadModuleRegistry;
}

export interface PreloadContextBridge {
    exposeInMainWorld?: (key: string, api: unknown) => void;
}

export interface PreloadIpcRenderer {
    invoke?: (
        channel: string,
        ...args: unknown[]
    ) => Promise<IpcResponsePayload>;
    off?: (channel: string, listener: IpcEventListener) => void;
    on?: (channel: string, listener: IpcEventListener) => void;
    removeAllListeners?: (channel: string) => void;
    removeListener?: (channel: string, listener: IpcEventListener) => void;
    send?: (channel: string, ...args: unknown[]) => void;
}

export interface PreloadElectronBridge {
    contextBridge?: null | PreloadContextBridge;
    default?: null | PreloadElectronBridge;
    ipcRenderer?: null | PreloadIpcRenderer;
}

export interface PreloadElectronBridgeResolution {
    contextBridge: null | PreloadContextBridge | undefined;
    ipcRenderer: null | PreloadIpcRenderer | undefined;
}

export interface ResolvePreloadElectronBridgeOptions {
    electronBridgeOverride?: null | PreloadElectronBridge;
}

export interface PreloadConsole {
    error?: (...args: unknown[]) => void;
    log?: (...args: unknown[]) => void;
    warn?: (...args: unknown[]) => void;
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
    isAllowedUpdateEventName: (
        eventName: unknown
    ) => eventName is UpdateEventName;
}

export interface PreloadMainStateBridge {
    listenToMainState: (
        path: MainStateListenRequest,
        callback: MainStateListener
    ) => Promise<MainStateListenResponse>;
    unlistenFromMainState: (
        path: MainStateUnlistenRequest,
        callback: MainStateListener
    ) => Promise<MainStateUnlistenResponse>;
}

export type MainStateBridgeIpcRenderer = Pick<
    PreloadIpcRenderer,
    "invoke" | "on"
>;

export interface CreateMainStateApiOptions {
    createSafeInvokeHandler: CreateMainStateInvokeHandler;
    mainStateBridge: PreloadMainStateBridge;
    preloadLog: PreloadLog;
    validateCallback: (
        callback: unknown,
        methodName: string
    ) => callback is UnknownCallback;
    validateRequiredNonEmptyString: (
        value: unknown,
        paramName: string,
        methodName: string
    ) => value is string;
}

export interface CreateMainStateBridgeOptions {
    ipcRenderer: MainStateBridgeIpcRenderer | null | undefined;
    preloadLog: PreloadLog;
    removeIpcListener: (
        channel: "main-state-change",
        handler: IpcEventListener
    ) => void;
}

export interface AppInfoApiChannels {
    APP_VERSION: Extract<GenericInvokeChannel, "getAppVersion">;
    CHROME_VERSION: Extract<GenericInvokeChannel, "getChromeVersion">;
    ELECTRON_VERSION: Extract<GenericInvokeChannel, "getElectronVersion">;
    LICENSE_INFO: Extract<GenericInvokeChannel, "getLicenseInfo">;
    NODE_VERSION: Extract<GenericInvokeChannel, "getNodeVersion">;
    PLATFORM_INFO: Extract<GenericInvokeChannel, "getPlatformInfo">;
}

export interface CreateAppInfoApiOptions {
    channels: AppInfoApiChannels;
    createSafeInvokeHandler: CreateSafeInvokeHandler;
}

export interface ThemeApiChannels {
    THEME_GET: Extract<GenericInvokeChannel, "theme:get">;
}

export interface CreateThemeApiOptions {
    channels: ThemeApiChannels;
    createSafeInvokeHandler: CreateSafeInvokeHandler;
}

export interface CreateApiDiagnosticsOptions {
    channels: Partial<PreloadChannels>;
    contextBridge: null | PreloadContextBridge | undefined;
    events: Partial<PreloadEvents>;
    ipcRenderer: null | PreloadIpcRenderer | undefined;
    isDevelopmentMode: () => boolean;
    preloadLog: PreloadLog;
}

export interface ClipboardBridgeChannels {
    CLIPBOARD_WRITE_PNG_DATA_URL: Extract<
        ClipboardInvokeChannel,
        "clipboard:writePngDataUrl"
    >;
    CLIPBOARD_WRITE_TEXT: Extract<
        ClipboardInvokeChannel,
        "clipboard:writeText"
    >;
}

export interface ClipboardBridgeIpcRenderer {
    invoke?: (
        channel: ClipboardInvokeChannel,
        payload: ClipboardRequestPayload
    ) => Promise<unknown>;
}

export interface CreateClipboardBridgeOptions {
    channels: ClipboardBridgeChannels;
    ipcRenderer: ClipboardBridgeIpcRenderer | null | undefined;
    preloadLog: PreloadLog;
}

export interface DevtoolsMenuIpcRenderer {
    invoke?: (
        channel: DevtoolsInvokeChannel,
        theme: DevtoolsInjectMenuTheme,
        fitFilePath: DevtoolsInjectMenuFitFilePath
    ) => Promise<unknown>;
}

export interface CreateDevtoolsMenuApiOptions {
    defaultFitFilePath: DevtoolsInjectMenuFitFilePath;
    defaultTheme: DevtoolsInjectMenuTheme;
    devtoolsInjectMenuChannel: DevtoolsInvokeChannel;
    ipcRenderer: DevtoolsMenuIpcRenderer | null | undefined;
    preloadLog: PreloadLog;
    validateDevtoolsInjectMenuPayload: ValidateDevtoolsInjectMenuPayload;
    validateOptionalNonEmptyString?: (
        value: unknown,
        paramName: string,
        methodName: string
    ) => value is null | string | undefined;
}

export interface FileApiChannels {
    FILE_READ: Extract<GenericInvokeChannel, "file:read">;
    FIT_DECODE: Extract<GenericInvokeChannel, "fit:decode">;
    FIT_PARSE: Extract<GenericInvokeChannel, "fit:parse">;
    RECENT_FILES_ADD: Extract<GenericInvokeChannel, "recentFiles:add">;
    RECENT_FILES_APPROVE: Extract<GenericInvokeChannel, "recentFiles:approve">;
    RECENT_FILES_GET: Extract<GenericInvokeChannel, "recentFiles:get">;
}

export interface CreateFileApiOptions {
    channels: FileApiChannels;
    createSafeInvokeHandler: CreateSafeInvokeHandler;
}

export interface FitBrowserApiChannels {
    FIT_BROWSER_ENABLED_CHANGED: PreloadEvents["FIT_BROWSER_ENABLED_CHANGED"];
    FIT_BROWSER_GET_FOLDER: Extract<
        FitBrowserInvokeChannel,
        "browser:getFolder"
    >;
    FIT_BROWSER_IS_ENABLED: Extract<
        FitBrowserInvokeChannel,
        "browser:isEnabled"
    >;
    FIT_BROWSER_LIST_FOLDER: Extract<
        FitBrowserInvokeChannel,
        "browser:listFolder"
    >;
    FIT_BROWSER_SET_ENABLED: Extract<
        FitBrowserInvokeChannel,
        "browser:setEnabled"
    >;
    FIT_BROWSER_SET_FOLDER: Extract<
        FitBrowserInvokeChannel,
        "browser:setFolder"
    >;
}

export interface CreateFitBrowserApiOptions {
    channels: FitBrowserApiChannels;
    createSafeEventHandler: CreateSafeEventHandler;
    createSafeInvokeHandler: CreateSafeInvokeHandler;
}

export interface GyazoExternalApiChannels {
    GYAZO_OAUTH_CALLBACK: PreloadEvents["GYAZO_OAUTH_CALLBACK"];
    GYAZO_SERVER_START: Extract<ExternalInvokeChannel, "gyazo:server:start">;
    GYAZO_SERVER_STOP: Extract<ExternalInvokeChannel, "gyazo:server:stop">;
}

export interface CreateGyazoExternalApiOptions {
    channels: GyazoExternalApiChannels;
    createSafeEventHandler: CreateSafeEventHandler;
    createSafeInvokeHandler: CreateSafeInvokeHandler;
}

export interface ShellExternalApiChannels {
    SHELL_OPEN_EXTERNAL: Extract<ExternalInvokeChannel, "shell:openExternal">;
}

export interface CreateShellExternalApiOptions {
    channels: ShellExternalApiChannels;
    createSafeInvokeHandler: CreateSafeInvokeHandler;
}

export interface ExposeDevelopmentToolsGlobalOptions {
    api: ElectronAPI;
    constants: unknown;
    contextBridge: null | PreloadContextBridge | undefined;
    isDevelopmentMode: () => boolean;
    preloadLog: PreloadLog;
}

export interface RegisterPreloadBeforeExitHandlerOptions {
    isDevelopmentMode: () => boolean;
    preloadLog: PreloadLog;
    processRef?: NodeJS.Process;
}

export interface MenuEventApiChannels {
    DECODER_OPTIONS_CHANGED: PreloadEvents["DECODER_OPTIONS_CHANGED"];
    EXPORT_FILE: PreloadEvents["EXPORT_FILE"];
    INSTALL_UPDATE: Extract<GenericSendChannel, "install-update">;
    MENU_ABOUT: PreloadEvents["MENU_ABOUT"];
    MENU_CHECK_FOR_UPDATES: Extract<
        GenericSendChannel,
        "menu-check-for-updates"
    >;
    MENU_EXPORT: Extract<GenericSendChannel, "menu-export">;
    MENU_KEYBOARD_SHORTCUTS: PreloadEvents["MENU_KEYBOARD_SHORTCUTS"];
    MENU_OPEN_FILE: PreloadEvents["MENU_OPEN_FILE"];
    MENU_OPEN_OVERLAY: PreloadEvents["MENU_OPEN_OVERLAY"];
    MENU_PRINT: PreloadEvents["MENU_PRINT"];
    MENU_RESTART_UPDATE: PreloadEvents["MENU_RESTART_UPDATE"];
    MENU_SAVE_AS: Extract<GenericSendChannel, "menu-save-as">;
    OPEN_ACCENT_COLOR_PICKER: PreloadEvents["OPEN_ACCENT_COLOR_PICKER"];
    OPEN_RECENT_FILE: PreloadEvents["OPEN_RECENT_FILE"];
    OPEN_SUMMARY_COLUMN_SELECTOR: PreloadEvents["OPEN_SUMMARY_COLUMN_SELECTOR"];
    SET_FONT_SIZE: PreloadEvents["SET_FONT_SIZE"];
    SET_FULLSCREEN: Extract<GenericSendChannel, "set-fullscreen">;
    SET_HIGH_CONTRAST: PreloadEvents["SET_HIGH_CONTRAST"];
    SET_THEME: PreloadEvents["SET_THEME"];
    SHOW_NOTIFICATION: PreloadEvents["SHOW_NOTIFICATION"];
    THEME_CHANGED: Extract<GenericSendChannel, "theme-changed">;
    UNLOAD_FIT_FILE: PreloadEvents["UNLOAD_FIT_FILE"];
}

export interface CreateMenuEventApiOptions {
    channels: MenuEventApiChannels;
    createSafeEventHandler: CreateSafeEventHandler;
    createSafeSendHandler: CreateSafeSendHandler;
}

export interface CreatePreloadEventApiOptions {
    fitFileLoadedChannel: PreloadEvents["FIT_FILE_LOADED"];
    ipcRenderer: null | PreloadIpcRenderer | undefined;
    isAllowedUpdateEventName: (
        eventName: unknown
    ) => eventName is UpdateEventName;
    preloadLog: PreloadLog;
    removeIpcListener: (channel: string, handler: IpcEventListener) => void;
    shouldEnforceGenericIpcAllowlist: boolean;
    validateCallback: (
        callback: unknown,
        methodName: string
    ) => callback is UnknownCallback;
    validateChannelName: (
        value: unknown,
        paramName: string,
        methodName: string
    ) => value is string;
}

export interface CreatePreloadIpcHelpersOptions {
    ipcRenderer: null | PreloadIpcRenderer | undefined;
    preloadLog: PreloadLog;
    validateCallback: (
        callback: unknown,
        methodName: string
    ) => callback is UnknownCallback;
    validateDevtoolsInjectMenuPayload: ValidateDevtoolsInjectMenuPayload;
    validateExternalUrl: ValidateExternalUrl;
    validateFitBrowserRelativePath: ValidateFitBrowserRelativePath;
    validateFitBrowserRootFolderPath: ValidateFitBrowserRootFolderPath;
    validateFitFilePathInput: ValidateFitFilePathInput;
    validateMainStateOperationIdInput: ValidateMainStateOperationIdInput;
    validateMainStatePathInput: ValidateMainStatePathInput;
}

export type CreateSafeSendHandler = (
    channel: GenericSendChannel,
    methodName: string
) => (...args: IpcRequestPayload[]) => void;

export interface PreloadIpcHelpers {
    createNoopUnsubscribe: () => () => void;
    createSafeEventHandler: CreateSafeEventHandler;
    createSafeInvokeHandler: CreateSafeInvokeHandler;
    createSafeSendHandler: CreateSafeSendHandler;
    removeIpcListener: (channel: string, handler: IpcEventListener) => void;
}

export interface PreloadValidators {
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
    ) => value is null | string | undefined;
    validateRequiredNonEmptyString: (
        value: unknown,
        paramName: string,
        methodName: string
    ) => value is string;
}

export interface ExposeElectronApiOptions {
    api: ElectronAPI;
    contextBridge: null | PreloadContextBridge | undefined;
    isDevelopmentMode: () => boolean;
    preloadLog: PreloadLog;
}

export interface PreloadApiAssemblyModules {
    createPreloadApiAssemblyContext: CreatePreloadApiAssemblyContext;
    createPreloadClipboardApiDomain: CreatePreloadClipboardApiDomain;
    createPreloadDeveloperApiDomain: CreatePreloadDeveloperApiDomain;
    createPreloadDiagnosticsApiDomain: CreatePreloadDiagnosticsApiDomain;
    createPreloadDialogApiDomain: CreatePreloadDialogApiDomain;
    createPreloadExternalApiDomain: CreatePreloadExternalApiDomain;
    createPreloadFileApiDomain: CreatePreloadFileApiDomain;
    createPreloadIpcEventApiDomain: CreatePreloadIpcEventApiDomain;
    createPreloadStateApiDomain: CreatePreloadStateApiDomain;
    createPreloadSystemApiDomain: CreatePreloadSystemApiDomain;
}

export interface PreloadAppModules {
    createApiDiagnostics: CreateApiDiagnostics;
    createAppInfoApi: CreateAppInfoApi;
    createClipboardBridge: CreateClipboardBridge;
    createDevtoolsMenuApi: CreateDevtoolsMenuApi;
    createGyazoExternalApi: CreateGyazoExternalApi;
    createShellExternalApi: CreateShellExternalApi;
    createThemeApi: CreateThemeApi;
    exposeDevelopmentToolsGlobal: ExposeDevelopmentToolsGlobal;
    isPreloadDevelopmentMode: (processRef?: NodeJS.Process) => boolean;
    registerPreloadBeforeExitHandler: RegisterPreloadBeforeExitHandler;
}

export interface PreloadFileModules {
    createFileApi: CreateFileApi;
    createFitBrowserApi: CreateFitBrowserApi;
}

export interface PreloadIpcModules {
    createMenuEventApi: CreateMenuEventApi;
    createPreloadEventApi: CreatePreloadEventApi;
    createPreloadIpcHelpers: CreatePreloadIpcHelpers;
    createPreloadLogger: CreatePreloadLogger;
    createPreloadValidators: CreatePreloadValidators;
    exposeElectronApi: ExposeElectronApi;
    ipcBridgeCatalog: IpcBridgeCatalog;
    resolvePreloadElectronBridge: ResolvePreloadElectronBridge;
    shouldEnforceGenericIpcAllowlist: ShouldEnforceGenericIpcAllowlist;
}

export interface PreloadPolicyModules {
    validateDevtoolsInjectMenuPayload: ValidateDevtoolsInjectMenuPayload;
    validateExternalUrl: ValidateExternalUrl;
    validateFitBrowserRelativePath: ValidateFitBrowserRelativePath;
    validateFitBrowserRootFolderPath: ValidateFitBrowserRootFolderPath;
    validateFitFilePathInput: ValidateFitFilePathInput;
    validateMainStateOperationIdInput: ValidateMainStateOperationIdInput;
    validateMainStatePathInput: ValidateMainStatePathInput;
}

export interface PreloadStateModules {
    createMainStateApi: CreateMainStateApi;
    createMainStateBridge: CreateMainStateBridge;
}

export interface PreloadModuleRegistry
    extends
        PreloadApiAssemblyModules,
        PreloadAppModules,
        PreloadFileModules,
        PreloadIpcModules,
        PreloadPolicyModules,
        PreloadStateModules {}

export interface PreloadApiAssemblyContext {
    constants: PreloadConstants;
    contextBridge: null | PreloadContextBridge | undefined;
    createSafeEventHandler: PreloadIpcHelpers["createSafeEventHandler"];
    createSafeInvokeHandler: PreloadIpcHelpers["createSafeInvokeHandler"];
    createSafeSendHandler: PreloadIpcHelpers["createSafeSendHandler"];
    ipcRenderer: null | PreloadIpcRenderer | undefined;
    modules: PreloadModuleRegistry;
    preloadLog: PreloadLog;
    processRef?: NodeJS.Process;
    removeIpcListener: PreloadIpcHelpers["removeIpcListener"];
    shouldEnforceGenericIpcAllowlist: boolean;
    validateCallback: PreloadValidators["validateCallback"];
    validateChannelName: PreloadValidators["validateChannelName"];
    validateOptionalNonEmptyString: PreloadValidators["validateOptionalNonEmptyString"];
    validateRequiredNonEmptyString: PreloadValidators["validateRequiredNonEmptyString"];
}

export interface PreloadClipboardApiDomain {
    clipboardBridge: ElectronClipboardApi;
}

export interface PreloadDeveloperApiDomain {
    devtoolsMenuApi: ElectronDevtoolsMenuApi;
}

export interface PreloadDiagnosticsApiDomain {
    apiDiagnostics: ElectronApiDiagnosticsApi;
}

export interface PreloadDialogApiDomain {
    openFile: ElectronDialogApi["openFile"];
    openFileDialog: ElectronDialogApi["openFileDialog"];
    openFolderDialog: ElectronDialogApi["openFolderDialog"];
    openOverlayDialog: ElectronDialogApi["openOverlayDialog"];
}

export interface PreloadExternalApiDomain {
    gyazoExternalApi: ElectronGyazoExternalApi;
    shellExternalApi: ElectronShellExternalApi;
}

export interface PreloadSystemApiDomain {
    appInfoApi: ElectronAppInfoApi;
    themeApi: ElectronThemeApi;
}

export interface PreloadFileApiDomain {
    fileApi: ElectronFileApi;
    fitBrowserApi: ElectronFitBrowserApi;
}

export interface PreloadIpcEventApiDomain {
    preloadEventApi: ElectronPreloadEventApi;
    menuEventApi: ElectronMenuEventApi;
}

export interface PreloadStateApiDomain {
    mainStateApi: ElectronMainStateApi;
}
