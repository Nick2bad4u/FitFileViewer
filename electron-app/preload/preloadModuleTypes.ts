export type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
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
export type GenericSendChannel = import("../shared/ipc").GenericSendChannel;
export type IpcRequestPayload = import("../shared/ipc").IpcRequestPayload;
export type IpcResponsePayload = import("../shared/ipc").IpcResponsePayload;
export type MainStateChange = import("../shared/ipc").MainStateChange;
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
export type IpcEventListener = (
    event: object,
    ...args: IpcResponsePayload[]
) => void;
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
    options: Record<string, unknown>
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
    isAllowedUpdateEventName: (
        eventName: unknown
    ) => eventName is UpdateEventName;
}

export interface PreloadModuleRegistry {
    createApiDiagnostics: PreloadApiFactory<ElectronApiDiagnosticsApi>;
    createAppInfoApi: PreloadApiFactory<ElectronAppInfoApi>;
    createClipboardBridge: PreloadApiFactory<ElectronClipboardApi>;
    createDevtoolsMenuApi: PreloadApiFactory<ElectronDevtoolsMenuApi>;
    createFileApi: PreloadApiFactory<ElectronFileApi>;
    createFitBrowserApi: PreloadApiFactory<ElectronFitBrowserApi>;
    createGyazoExternalApi: PreloadApiFactory<ElectronGyazoExternalApi>;
    createPreloadEventApi: PreloadApiFactory<ElectronPreloadEventApi>;
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
    createMainStateApi: PreloadApiFactory<ElectronMainStateApi>;
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
    createMenuEventApi: PreloadApiFactory<ElectronMenuEventApi>;
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
    createShellExternalApi: PreloadApiFactory<ElectronShellExternalApi>;
    createThemeApi: PreloadApiFactory<ElectronThemeApi>;
    exposeDevelopmentToolsGlobal: (options: Record<string, unknown>) => boolean;
    exposeElectronApi: (options: Record<string, unknown>) => boolean;
    ipcBridgeCatalog: IpcBridgeCatalog;
    isPreloadDevelopmentMode: (processRef?: NodeJS.Process) => boolean;
    registerPreloadBeforeExitHandler: (
        options: Record<string, unknown>
    ) => void;
    resolvePreloadElectronBridge: (options: {
        electronBridgeOverride?: null | PreloadElectronBridge;
    }) => {
        contextBridge: null | PreloadContextBridge | undefined;
        ipcRenderer: null | PreloadIpcRenderer | undefined;
    };
    shouldEnforceGenericIpcAllowlist: (processRef?: NodeJS.Process) => boolean;
    validateDevtoolsInjectMenuPayload: ValidateDevtoolsInjectMenuPayload;
    validateExternalUrl: ValidateExternalUrl;
    validateFitBrowserRelativePath: ValidateFitBrowserRelativePath;
    validateFitBrowserRootFolderPath: ValidateFitBrowserRootFolderPath;
    validateFitFilePathInput: ValidateFitFilePathInput;
    validateMainStateOperationIdInput: ValidateMainStateOperationIdInput;
    validateMainStatePathInput: ValidateMainStatePathInput;
}

export type PreloadIpcHelpers = ReturnType<
    PreloadModuleRegistry["createPreloadIpcHelpers"]
>;
export type PreloadValidators = ReturnType<
    PreloadModuleRegistry["createPreloadValidators"]
>;

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
    openFolderDialog: ElectronDialogApi["openFolderDialog"];
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
