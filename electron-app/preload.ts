/**
 * Preload script exposes a typed, secure IPC API to the renderer via
 * contextBridge. The source remains script-style TypeScript so the runtime
 * compiler emits CommonJS-compatible preload.js for Electron.
 */
type ElectronAPI = import("./shared/preloadApi").ElectronAPI;
type GenericInvokeChannel = import("./shared/ipc").GenericInvokeChannel;
type GenericSendChannel = import("./shared/ipc").GenericSendChannel;
type IpcRequestPayload = import("./shared/ipc").IpcRequestPayload;
type IpcResponsePayload = import("./shared/ipc").IpcResponsePayload;
type MainStateChange = import("./shared/ipc").MainStateChange;
type PreloadRendererIpcEventChannel =
    import("./shared/ipc").RendererIpcEventChannel;
type UpdateEventName = import("./shared/ipc").UpdateEventName;

type PreloadLog = (
    level: "error" | "info" | "warn",
    message: string,
    ...details: unknown[]
) => void;
type UnknownCallback = (...args: unknown[]) => unknown;
type IpcEventListener = (event: object, ...args: IpcResponsePayload[]) => void;
type PreloadApiFactory<Keys extends keyof ElectronAPI> = (
    options: Record<string, unknown>
) => Pick<ElectronAPI, Keys>;
type PreloadModuleRequire = (moduleId: string) => unknown;

interface PreloadContextBridge {
    exposeInMainWorld?: (key: string, api: unknown) => void;
}

interface PreloadIpcRenderer {
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

interface PreloadElectronBridge {
    contextBridge?: null | PreloadContextBridge;
    default?: null | PreloadElectronBridge;
    ipcRenderer?: null | PreloadIpcRenderer;
}

type PreloadGlobal = typeof globalThis & {
    __electronHoistedMock?: null | PreloadElectronBridge;
};

interface PreloadChannels {
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

interface PreloadEvents {
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

interface IpcBridgeCatalog {
    PRELOAD_CHANNELS: PreloadChannels;
    PRELOAD_EVENTS: PreloadEvents;
    isAllowedGenericInvokeChannel: (
        channel: unknown
    ) => channel is GenericInvokeChannel;
    isAllowedGenericSendChannel: (
        channel: unknown
    ) => channel is GenericSendChannel;
    isAllowedRendererIpcEventChannel: (
        channel: unknown
    ) => channel is PreloadRendererIpcEventChannel;
    isAllowedUpdateEventName: (
        eventName: unknown
    ) => eventName is UpdateEventName;
}

interface PreloadModuleRegistry {
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
    shouldEnforceGenericIpcAllowlist: (processRef?: NodeJS.Process) => boolean;
}

const preloadRequire = require as PreloadModuleRequire;
const { loadPreloadModules } = require("./preload/preloadModuleLoader.js") as {
    loadPreloadModules: () => PreloadModuleRegistry;
};
const { createElectronApi } = require("./preload/electronApiFactory.js") as {
    createElectronApi: (options: Record<string, unknown>) => ElectronAPI;
};
const {
    createApiDiagnostics,
    createAppInfoApi,
    createClipboardBridge,
    createDevtoolsMenuApi,
    createExternalApi,
    createFileApi,
    createFitBrowserApi,
    createGenericIpcApi,
    createMainStateApi,
    createMainStateBridge,
    createMenuEventApi,
    createPreloadIpcHelpers,
    createPreloadLogger,
    createPreloadValidators,
    createThemeApi,
    exposeDevelopmentToolsGlobal,
    exposeElectronApi,
    ipcBridgeCatalog,
    isPreloadDevelopmentMode,
    registerPreloadBeforeExitHandler,
    resolvePreloadElectronBridge,
    shouldAllowGenericIpcBridge,
    shouldEnforceGenericIpcAllowlist,
} = loadPreloadModules();

const {
    isAllowedGenericInvokeChannel,
    isAllowedGenericSendChannel,
    isAllowedRendererIpcEventChannel,
    isAllowedUpdateEventName,
    PRELOAD_CHANNELS,
    PRELOAD_EVENTS,
} = ipcBridgeCatalog;

// Constants for better maintainability
const CONSTANTS = {
    CHANNELS: PRELOAD_CHANNELS,
    DEFAULT_VALUES: {
        FIT_FILE_PATH: null,
        THEME: null,
    },
    EVENTS: PRELOAD_EVENTS,
};

const { contextBridge, ipcRenderer } = resolvePreloadElectronBridge({
    globalScope: getPreloadGlobal(),
    requireModule: preloadRequire,
});
const preloadLog = createPreloadLogger(console);

const {
    validateCallback,
    validateChannelName,
    validateOptionalNonEmptyString,
    validateRequiredNonEmptyString,
} = createPreloadValidators(preloadLog);

function getPreloadGlobal(): PreloadGlobal {
    return globalThis;
}

function isDevelopmentMode(): boolean {
    return isPreloadDevelopmentMode(process);
}

const {
    createSafeEventHandler,
    createSafeInvokeHandler,
    createSafeSendHandler,
    removeIpcListener,
} = createPreloadIpcHelpers({
    ipcRenderer,
    preloadLog,
    validateCallback,
});

/**
 * Enforce the generic send/invoke allowlist only when we are running in
 * Electron.
 *
 * Important: Several unit tests execute this preload file via `new
 * Function(...)` with a mocked `process` object. In that context, we should not
 * enforce production-grade IPC restrictions because those tests are not
 * modeling a real Electron renderer threat boundary.
 *
 * Default: ON in Electron. Non-Electron unit harnesses can opt out by omitting
 * process.versions.electron from their mocked process object.
 */
const SHOULD_ENFORCE_GENERIC_IPC_ALLOWLIST =
    typeof process !== "undefined" && shouldEnforceGenericIpcAllowlist(process);
const SHOULD_ALLOW_GENERIC_IPC_BRIDGE =
    typeof process === "undefined" || shouldAllowGenericIpcBridge(process);

const mainStateBridge = createMainStateBridge({
    ipcRenderer,
    preloadLog,
    removeIpcListener,
});
const clipboardBridge = createClipboardBridge({
    channels: CONSTANTS.CHANNELS,
    ipcRenderer,
    preloadLog,
});
const devtoolsMenuApi = createDevtoolsMenuApi({
    defaultFitFilePath: CONSTANTS.DEFAULT_VALUES.FIT_FILE_PATH,
    defaultTheme: CONSTANTS.DEFAULT_VALUES.THEME,
    devtoolsInjectMenuChannel: CONSTANTS.CHANNELS.DEVTOOLS_INJECT_MENU,
    ipcRenderer,
    preloadLog,
    validateOptionalNonEmptyString,
});
const apiDiagnostics = createApiDiagnostics({
    channels: CONSTANTS.CHANNELS,
    contextBridge,
    events: CONSTANTS.EVENTS,
    ipcRenderer,
    isDevelopmentMode,
    preloadLog,
});
const mainStateApi = createMainStateApi({
    ipcRenderer,
    mainStateBridge,
    preloadLog,
    validateCallback,
    validateRequiredNonEmptyString,
});
const genericIpcApi = createGenericIpcApi({
    fitFileLoadedChannel: CONSTANTS.EVENTS.FIT_FILE_LOADED,
    ipcRenderer,
    isAllowedGenericInvokeChannel,
    isAllowedGenericSendChannel,
    isAllowedRendererIpcEventChannel,
    isAllowedUpdateEventName,
    preloadLog,
    removeIpcListener,
    shouldAllowGenericIpcBridge: SHOULD_ALLOW_GENERIC_IPC_BRIDGE,
    shouldEnforceGenericIpcAllowlist: SHOULD_ENFORCE_GENERIC_IPC_ALLOWLIST,
    validateCallback,
    validateChannelName,
});
const fitBrowserApi = createFitBrowserApi({
    channels: {
        FIT_BROWSER_ENABLED_CHANGED:
            CONSTANTS.EVENTS.FIT_BROWSER_ENABLED_CHANGED,
        FIT_BROWSER_GET_FOLDER: CONSTANTS.CHANNELS.FIT_BROWSER_GET_FOLDER,
        FIT_BROWSER_IS_ENABLED: CONSTANTS.CHANNELS.FIT_BROWSER_IS_ENABLED,
        FIT_BROWSER_LIST_FOLDER: CONSTANTS.CHANNELS.FIT_BROWSER_LIST_FOLDER,
        FIT_BROWSER_SET_ENABLED: CONSTANTS.CHANNELS.FIT_BROWSER_SET_ENABLED,
        FIT_BROWSER_SET_FOLDER: CONSTANTS.CHANNELS.FIT_BROWSER_SET_FOLDER,
    },
    createSafeEventHandler,
    createSafeInvokeHandler,
});
const fileApi = createFileApi({
    channels: {
        DIALOG_OPEN_FILE: CONSTANTS.CHANNELS.DIALOG_OPEN_FILE,
        DIALOG_OPEN_OVERLAY_FILES: CONSTANTS.CHANNELS.DIALOG_OPEN_OVERLAY_FILES,
        FILE_READ: CONSTANTS.CHANNELS.FILE_READ,
        FIT_DECODE: CONSTANTS.CHANNELS.FIT_DECODE,
        FIT_PARSE: CONSTANTS.CHANNELS.FIT_PARSE,
        RECENT_FILES_ADD: CONSTANTS.CHANNELS.RECENT_FILES_ADD,
        RECENT_FILES_APPROVE: CONSTANTS.CHANNELS.RECENT_FILES_APPROVE,
        RECENT_FILES_GET: CONSTANTS.CHANNELS.RECENT_FILES_GET,
    },
    createSafeInvokeHandler,
});
const appInfoApi = createAppInfoApi({
    channels: {
        APP_VERSION: CONSTANTS.CHANNELS.APP_VERSION,
        CHROME_VERSION: CONSTANTS.CHANNELS.CHROME_VERSION,
        ELECTRON_VERSION: CONSTANTS.CHANNELS.ELECTRON_VERSION,
        LICENSE_INFO: CONSTANTS.CHANNELS.LICENSE_INFO,
        NODE_VERSION: CONSTANTS.CHANNELS.NODE_VERSION,
        PLATFORM_INFO: CONSTANTS.CHANNELS.PLATFORM_INFO,
    },
    createSafeInvokeHandler,
});
const externalApi = createExternalApi({
    channels: {
        GYAZO_OAUTH_CALLBACK: CONSTANTS.EVENTS.GYAZO_OAUTH_CALLBACK,
        GYAZO_SERVER_START: CONSTANTS.CHANNELS.GYAZO_SERVER_START,
        GYAZO_SERVER_STOP: CONSTANTS.CHANNELS.GYAZO_SERVER_STOP,
        SHELL_OPEN_EXTERNAL: CONSTANTS.CHANNELS.SHELL_OPEN_EXTERNAL,
    },
    createSafeEventHandler,
    createSafeInvokeHandler,
});
const menuEventApi = createMenuEventApi({
    channels: {
        DECODER_OPTIONS_CHANGED: CONSTANTS.EVENTS.DECODER_OPTIONS_CHANGED,
        EXPORT_FILE: CONSTANTS.EVENTS.EXPORT_FILE,
        INSTALL_UPDATE: CONSTANTS.EVENTS.INSTALL_UPDATE,
        MENU_ABOUT: CONSTANTS.EVENTS.MENU_ABOUT,
        MENU_CHECK_FOR_UPDATES: CONSTANTS.EVENTS.MENU_CHECK_FOR_UPDATES,
        MENU_EXPORT: CONSTANTS.EVENTS.MENU_EXPORT,
        MENU_KEYBOARD_SHORTCUTS: CONSTANTS.EVENTS.MENU_KEYBOARD_SHORTCUTS,
        MENU_OPEN_FILE: CONSTANTS.EVENTS.MENU_OPEN_FILE,
        MENU_OPEN_OVERLAY: CONSTANTS.EVENTS.MENU_OPEN_OVERLAY,
        MENU_PRINT: CONSTANTS.EVENTS.MENU_PRINT,
        MENU_RESTART_UPDATE: CONSTANTS.EVENTS.MENU_RESTART_UPDATE,
        MENU_SAVE_AS: CONSTANTS.EVENTS.MENU_SAVE_AS,
        OPEN_ACCENT_COLOR_PICKER: CONSTANTS.EVENTS.OPEN_ACCENT_COLOR_PICKER,
        OPEN_RECENT_FILE: CONSTANTS.EVENTS.OPEN_RECENT_FILE,
        OPEN_SUMMARY_COLUMN_SELECTOR:
            CONSTANTS.EVENTS.OPEN_SUMMARY_COLUMN_SELECTOR,
        SET_FONT_SIZE: CONSTANTS.EVENTS.SET_FONT_SIZE,
        SET_FULLSCREEN: CONSTANTS.EVENTS.SET_FULLSCREEN,
        SET_HIGH_CONTRAST: CONSTANTS.EVENTS.SET_HIGH_CONTRAST,
        SET_THEME: CONSTANTS.EVENTS.SET_THEME,
        SHOW_NOTIFICATION: CONSTANTS.EVENTS.SHOW_NOTIFICATION,
        THEME_CHANGED: CONSTANTS.EVENTS.THEME_CHANGED,
        UNLOAD_FIT_FILE: CONSTANTS.EVENTS.UNLOAD_FIT_FILE,
    },
    createSafeEventHandler,
    createSafeSendHandler,
});
const themeApi = createThemeApi({
    channels: {
        THEME_GET: CONSTANTS.CHANNELS.THEME_GET,
    },
    createSafeInvokeHandler,
});

// Main API object
const electronAPI = createElectronApi({
    apiDiagnostics,
    appInfoApi,
    clipboardBridge,
    devtoolsMenuApi,
    externalApi,
    fileApi,
    fitBrowserApi,
    genericIpcApi,
    mainStateApi,
    menuEventApi,
    openFolderDialog: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.DIALOG_OPEN_FOLDER,
        "openFolderDialog"
    ),
    themeApi,
});
exposeElectronApi({
    api: electronAPI,
    contextBridge,
    isDevelopmentMode,
    preloadLog,
});

exposeDevelopmentToolsGlobal({
    api: electronAPI,
    constants: CONSTANTS,
    contextBridge,
    isDevelopmentMode,
    preloadLog,
});

// Cleanup and final validation
registerPreloadBeforeExitHandler({
    globalScope: globalThis,
    isDevelopmentMode,
    preloadLog,
    processRef: process,
});

// Report successful initialization
if (isDevelopmentMode()) {
    preloadLog("info", "[preload.js] Preload script initialized successfully");
}
