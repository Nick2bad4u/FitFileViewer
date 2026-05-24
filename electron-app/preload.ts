/**
 * Preload script exposes a typed, secure IPC API to the renderer via
 * contextBridge. The source remains script-style TypeScript so the runtime
 * compiler emits CommonJS-compatible preload.js for Electron.
 */
type ElectronAPI = import("./shared/preloadApi").ElectronAPI;
type GenericInvokeChannel = import("./shared/ipc").GenericInvokeChannel;
type GenericSendChannel = import("./shared/ipc").GenericSendChannel;
type InvokeRequestArgs<Channel extends GenericInvokeChannel> =
    import("./shared/ipc").InvokeRequestArgs<Channel>;
type InvokeResponsePayloadForChannel<Channel extends GenericInvokeChannel> =
    import("./shared/ipc").InvokeResponsePayloadForChannel<Channel>;
type IpcRequestPayload = import("./shared/ipc").IpcRequestPayload;
type IpcResponsePayload = import("./shared/ipc").IpcResponsePayload;
type MainStateChange = import("./shared/ipc").MainStateChange;
type PreloadRendererIpcEventChannel =
    import("./shared/ipc").RendererIpcEventChannel;
type UpdateEventName = import("./shared/ipc").UpdateEventName;

type ClipboardBridge = Pick<
    ElectronAPI,
    "writeClipboardPngDataUrl" | "writeClipboardText"
>;
type GenericIpcApi = Pick<
    ElectronAPI,
    "invoke" | "notifyFitFileLoaded" | "onIpc" | "onUpdateEvent" | "send"
>;
type PreloadLog = (
    level: "error" | "info" | "warn",
    message: string,
    ...details: unknown[]
) => void;
type UnknownCallback = (...args: unknown[]) => unknown;
type IpcEventListener = (
    event: object,
    ...args: IpcResponsePayload[]
) => void;
type MainStateEventListener = (
    event: object,
    change: MainStateChange
) => void;

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
    readonly FIT_FILE_LOADED: "fit-file-loaded";
    readonly INSTALL_UPDATE: "install-update";
    readonly MENU_CHECK_FOR_UPDATES: "menu-check-for-updates";
    readonly MENU_OPEN_FILE: "menu-open-file";
    readonly MENU_OPEN_OVERLAY: "menu-open-overlay";
    readonly OPEN_RECENT_FILE: "open-recent-file";
    readonly OPEN_SUMMARY_COLUMN_SELECTOR: "open-summary-column-selector";
    readonly SET_FULLSCREEN: "set-fullscreen";
    readonly SET_THEME: "set-theme";
    readonly THEME_CHANGED: "theme-changed";
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

interface PreloadRequire {
    (moduleId: "./preload/apiDiagnostics.js"): {
        createApiDiagnostics: (options: {
            channels: PreloadChannels;
            contextBridge: null | PreloadContextBridge | undefined;
            events: PreloadEvents;
            ipcRenderer: null | PreloadIpcRenderer | undefined;
            isDevelopmentMode: () => boolean;
            preloadLog: PreloadLog;
        }) => Pick<ElectronAPI, "getChannelInfo" | "validateAPI">;
    };
    (moduleId: "./preload/beforeExitHandler.js"): {
        registerPreloadBeforeExitHandler: (options: {
            globalScope?: typeof globalThis;
            isDevelopmentMode: () => boolean;
            preloadLog: PreloadLog;
            processRef?: NodeJS.Process;
        }) => void;
    };
    (moduleId: "./preload/clipboardBridge.js"): {
        createClipboardBridge: (options: {
            channels: PreloadChannels;
            ipcRenderer: null | PreloadIpcRenderer | undefined;
            preloadLog: PreloadLog;
        }) => ClipboardBridge;
    };
    (moduleId: "./preload/devtoolsMenuApi.js"): {
        createDevtoolsMenuApi: (options: {
            defaultFitFilePath: null | string;
            defaultTheme: null | string;
            devtoolsInjectMenuChannel: "devtools-inject-menu";
            ipcRenderer: null | PreloadIpcRenderer | undefined;
            preloadLog: PreloadLog;
            validateOptionalNonEmptyString: (
                value: unknown,
                paramName: string,
                methodName: string
            ) => null | string | undefined;
        }) => Pick<ElectronAPI, "injectMenu">;
    };
    (moduleId: "./preload/validators.js"): {
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
    };
    (moduleId: "./preload/environment.js"): {
        isPreloadDevelopmentMode: (processRef?: NodeJS.Process) => boolean;
        shouldEnforceGenericIpcAllowlist: (
            processRef?: NodeJS.Process
        ) => boolean;
    };
    (moduleId: "./preload/genericIpcApi.js"): {
        createGenericIpcApi: (options: {
            fitFileLoadedChannel: "fit-file-loaded";
            ipcRenderer: null | PreloadIpcRenderer | undefined;
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
            preloadLog: PreloadLog;
            removeIpcListener: (
                channel: string,
                handler: IpcEventListener
            ) => void;
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
        }) => GenericIpcApi;
    };
    (moduleId: "./preload/electronBridge.js"): {
        resolvePreloadElectronBridge: (options: {
            globalScope?: object;
            requireModule: (moduleId: string) => unknown;
        }) => {
            contextBridge: null | PreloadContextBridge | undefined;
            ipcRenderer: null | PreloadIpcRenderer | undefined;
        };
    };
    (moduleId: "./preload/mainStateBridge.js"): {
        createMainStateBridge: (options: {
            ipcRenderer: null | PreloadIpcRenderer | undefined;
            preloadLog: PreloadLog;
            removeIpcListener: (
                channel: string,
                handler: MainStateEventListener
            ) => void;
        }) => {
            listenToMainState: (
                path: string,
                callback: (change: MainStateChange) => void
            ) => Promise<boolean>;
            unlistenFromMainState: (
                path: string,
                callback: (change: MainStateChange) => void
            ) => Promise<boolean>;
        };
    };
    (moduleId: "./preload/ipcHelpers.js"): {
        createPreloadIpcHelpers: (options: {
            ipcRenderer: null | PreloadIpcRenderer | undefined;
            preloadLog: PreloadLog;
            validateCallback: (
                callback: unknown,
                methodName: string
            ) => callback is UnknownCallback;
        }) => {
            createNoopUnsubscribe: () => () => void;
            createSafeEventHandler: <Callback>(
                channel: string,
                methodName: string,
                transform?: (
                    ...args: IpcResponsePayload[]
                ) => IpcResponsePayload | null
            ) => (callback: Callback) => () => void;
            createSafeInvokeHandler: <Channel extends GenericInvokeChannel>(
                channel: Channel,
                methodName: string
            ) => (
                ...args: InvokeRequestArgs<Channel>
            ) => Promise<InvokeResponsePayloadForChannel<Channel>>;
            createSafeSendHandler: (
                channel: GenericSendChannel,
                methodName: string
            ) => (...args: IpcRequestPayload[]) => void;
            removeIpcListener: (
                channel: string,
                handler: IpcEventListener
            ) => void;
        };
    };
    (moduleId: "./preload/logger.js"): {
        createPreloadLogger: (consoleRef?: Console) => PreloadLog;
    };
    (moduleId: "./preload/mainStateApi.js"): {
        createMainStateApi: (options: {
            ipcRenderer: null | PreloadIpcRenderer | undefined;
            mainStateBridge: {
                listenToMainState: (
                    path: string,
                    callback: (change: MainStateChange) => void
                ) => Promise<boolean>;
                unlistenFromMainState: (
                    path: string,
                    callback: (change: MainStateChange) => void
                ) => Promise<boolean>;
            };
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
        }) => Pick<
            ElectronAPI,
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
    };
    (moduleId: "./preload/ipcBridgeCatalog.js"): IpcBridgeCatalog;
    (moduleId: string): unknown;
}

const preloadRequire = require as PreloadRequire;
const { createApiDiagnostics } = preloadRequire(
    "./preload/apiDiagnostics.js"
);
const { registerPreloadBeforeExitHandler } = preloadRequire(
    "./preload/beforeExitHandler.js"
);
const { createClipboardBridge } = preloadRequire(
    "./preload/clipboardBridge.js"
);
const { createDevtoolsMenuApi } = preloadRequire(
    "./preload/devtoolsMenuApi.js"
);
const { createPreloadValidators } = preloadRequire("./preload/validators.js");
const {
    isPreloadDevelopmentMode,
    shouldEnforceGenericIpcAllowlist,
} = preloadRequire("./preload/environment.js");
const { createGenericIpcApi } = preloadRequire("./preload/genericIpcApi.js");
const { resolvePreloadElectronBridge } = preloadRequire(
    "./preload/electronBridge.js"
);
const { createMainStateBridge } = preloadRequire(
    "./preload/mainStateBridge.js"
);
const { createPreloadIpcHelpers } = preloadRequire(
    "./preload/ipcHelpers.js"
);
const { createPreloadLogger } = preloadRequire("./preload/logger.js");
const { createMainStateApi } = preloadRequire("./preload/mainStateApi.js");
const ipcBridgeCatalog = preloadRequire("./preload/ipcBridgeCatalog.js");

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
const DEVELOPMENT_TOOLS_GLOBAL_NAME = ["dev", "Tools"].join("");

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
 * Default: ON in Electron. Optional override for developers: set
 * FFV_ALLOW_GENERIC_IPC=true to bypass.
 */
const SHOULD_ENFORCE_GENERIC_IPC_ALLOWLIST =
    typeof process !== "undefined" && shouldEnforceGenericIpcAllowlist(process);

const mainStateBridge = createMainStateBridge({
    ipcRenderer,
    preloadLog,
    removeIpcListener: removeIpcListener as unknown as (
        channel: string,
        handler: MainStateEventListener
    ) => void,
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
    shouldEnforceGenericIpcAllowlist: SHOULD_ENFORCE_GENERIC_IPC_ALLOWLIST,
    validateCallback,
    validateChannelName,
});

// Main API object
const electronAPI: ElectronAPI = {
    /**
     * Adds a file to the recent files list.
     *
     * @param {string} filePath
     *
     * @returns {Promise<string[]>}
     */
    addRecentFile: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.RECENT_FILES_ADD,
        "addRecentFile"
    ),

    /**
     * Approve a recent file path for subsequent readFile() calls.
     *
     * Security model:
     *
     * - The main process will only approve paths that already exist in its
     *   persisted recent-files list.
     * - This avoids granting broad file read access as a side effect of
     *   recentFiles().
     *
     * @param {string} filePath
     *
     * @returns {Promise<boolean>}
     */
    approveRecentFile: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.RECENT_FILES_APPROVE,
        "approveRecentFile"
    ),

    /**
     * Trigger a check for updates (menu or manual).
     */
    checkForUpdates: createSafeSendHandler(
        CONSTANTS.EVENTS.MENU_CHECK_FOR_UPDATES,
        "checkForUpdates"
    ),

    /**
     * Decodes a FIT file from an ArrayBuffer and returns the parsed data.
     *
     * @param {ArrayBuffer} arrayBuffer
     *
     * @returns {Promise<import("./shared/fit").FitDecodeResult>}
     */
    decodeFitFile: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.FIT_DECODE,
        "decodeFitFile"
    ),

    // Application Information
    /**
     * Gets the app version from the main process.
     *
     * @returns {Promise<string>}
     */
    getAppVersion: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.APP_VERSION,
        "getAppVersion"
    ),

    // Development and Debugging Helpers
    /**
     * Get information about available IPC channels for debugging.
     *
     * @returns {Object} Object containing channel information
     */
    /** @returns {ChannelInfo} */
    getChannelInfo: apiDiagnostics.getChannelInfo,

    /**
     * Gets the Chrome version.
     *
     * @returns {Promise<string>}
     */
    getChromeVersion: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.CHROME_VERSION,
        "getChromeVersion"
    ),

    /**
     * Gets the Electron version.
     *
     * @returns {Promise<string>}
     */
    getElectronVersion: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.ELECTRON_VERSION,
        "getElectronVersion"
    ),

    /**
     * Gets recent errors from the main process.
     *
     * @param {number} [limit=50] - Maximum number of errors to retrieve.
     *   Default is `50`
     *
     * @returns {Promise<Array>} Array of recent errors
     */
    getErrors: mainStateApi.getErrors,

    /**
     * Gets the persisted FIT browser folder (main process setting).
     *
     * @returns {Promise<string | null>}
     */
    getFitBrowserFolder: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.FIT_BROWSER_GET_FOLDER,
        "getFitBrowserFolder"
    ),
    /**
     * Gets the license info from the main process.
     *
     * @returns {Promise<string>}
     */
    getLicenseInfo: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.LICENSE_INFO,
        "getLicenseInfo"
    ),

    // Main Process State Management Functions
    /**
     * Gets a value from the main process state.
     *
     * @param {string} [path] - Optional path to a specific state property
     *   (e.g., 'loadedFitFilePath')
     *
     * @returns {Promise<IpcSerializable>} The requested state value or entire
     *   state if no path provided
     */
    getMainState: mainStateApi.getMainState,

    /**
     * Gets performance metrics from the main process.
     *
     * @returns {Promise<Object>} Object containing performance metrics
     */
    getMetrics: mainStateApi.getMetrics,

    /**
     * Gets the Node.js version.
     *
     * @returns {Promise<string>}
     */
    getNodeVersion: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.NODE_VERSION,
        "getNodeVersion"
    ),

    /**
     * Gets the status of a specific operation from the main process.
     *
     * @param {string} operationId - The unique identifier for the operation
     *
     * @returns {Promise<IpcSerializable | null>} The operation status object
     */
    getOperation: mainStateApi.getOperation,

    /**
     * Gets all operations from the main process.
     *
     * @returns {Promise<Object>} Object containing all operations
     */
    getOperations: mainStateApi.getOperations,

    getPlatformInfo: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.PLATFORM_INFO,
        "getPlatformInfo"
    ),

    // Theme Management
    /**
     * Gets the current theme from the main process.
     *
     * @returns {Promise<string>}
     */
    getTheme: createSafeInvokeHandler(CONSTANTS.CHANNELS.THEME_GET, "getTheme"),
    // Development Tools
    /**
     * Manually inject/reset the menu from the renderer (DevTools or app code).
     *
     * @param {string | null} theme - Current theme
     * @param {string | null} fitFilePath - Current FIT file path
     *
     * @returns {Promise<boolean>}
     */
    injectMenu: devtoolsMenuApi.injectMenu,

    /**
     * Trigger install of a downloaded update.
     */
    installUpdate: createSafeSendHandler(
        CONSTANTS.EVENTS.INSTALL_UPDATE,
        "installUpdate"
    ),

    /**
     * Expose ipcRenderer.invoke for direct use with error handling.
     *
     * @param {GenericInvokeChannel} channel - The IPC channel to invoke
     * @param {...IpcRequestPayload} args - Arguments to send
     *
     * @returns {Promise<IpcResponsePayload>}
     */
    invoke: genericIpcApi.invoke,

    /**
     * Whether the experimental Browser tab is enabled.
     *
     * @returns {Promise<boolean>}
     */
    isFitBrowserEnabled: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.FIT_BROWSER_IS_ENABLED,
        "isFitBrowserEnabled"
    ),

    /**
     * Listens for changes to a specific path in the main process state.
     *
     * @param {string} path - Path to listen to (e.g., 'loadedFitFilePath')
     * @param {Function} callback - Callback function to handle state changes
     *
     * @returns {Promise<boolean>} True if listener was registered successfully
     */
    listenToMainState: mainStateApi.listenToMainState,

    /**
     * Lists the current directory under the persisted FIT browser folder.
     *
     * @param {string} [relPath]
     *
     * @returns {Promise<IpcSerializable>}
     */
    listFitBrowserFolder: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.FIT_BROWSER_LIST_FOLDER,
        "listFitBrowserFolder"
    ) as ElectronAPI["listFitBrowserFolder"],

    /**
     * Notify the main process that a file has been loaded (or unloaded).
     *
     * This is the preferred alternative to calling
     * electronAPI.send("fit-file-loaded", ...) because it is explicit and
     * easier to lock down.
     *
     * @param {string | null} filePath
     */
    notifyFitFileLoaded: genericIpcApi.notifyFitFileLoaded,

    // Generic IPC Functions with enhanced validation
    /**
     * Registers a generic handler for any IPC event (for internal use).
     *
     * @param {string} channel - The IPC channel to listen on
     * @param {Function} callback - Callback function to handle the event
     *
     * @returns {(() => void) | undefined} Unsubscribe function when
     *   registration succeeds
     */
    onIpc: genericIpcApi.onIpc,

    // Event Handlers with enhanced error handling
    /**
     * Registers a handler for the 'menu-open-file' event.
     *
     * @param {Function} callback
     */
    onMenuOpenFile: createSafeEventHandler(
        CONSTANTS.EVENTS.MENU_OPEN_FILE,
        "onMenuOpenFile"
    ),

    /**
     * Registers a handler for the 'menu-open-overlay' event.
     *
     * @param {Function} callback
     */
    onMenuOpenOverlay: createSafeEventHandler(
        CONSTANTS.EVENTS.MENU_OPEN_OVERLAY,
        "onMenuOpenOverlay"
    ),

    /**
     * Registers a handler for the 'open-recent-file' event.
     *
     * @param {Function} callback
     */
    onOpenRecentFile: createSafeEventHandler(
        CONSTANTS.EVENTS.OPEN_RECENT_FILE,
        "onOpenRecentFile",
        (filePath: IpcResponsePayload) => filePath // Transform to extract just the filePath
    ),

    /**
     * Registers a handler for the 'open-summary-column-selector' event.
     *
     * @param {Function} callback
     */
    onOpenSummaryColumnSelector: createSafeEventHandler(
        CONSTANTS.EVENTS.OPEN_SUMMARY_COLUMN_SELECTOR,
        "onOpenSummaryColumnSelector"
    ),

    /**
     * Registers a handler for the 'set-theme' event.
     *
     * @param {Function} callback
     */
    onSetTheme: createSafeEventHandler(
        CONSTANTS.EVENTS.SET_THEME,
        "onSetTheme",
        (theme: IpcResponsePayload) => theme // Transform to extract just the theme
    ),

    // Auto-Updater Functions with enhanced error handling
    /**
     * Listen for update events from the main process (auto-updater).
     *
     * @param {string} eventName - The update event name to listen for
     * @param {Function} callback - Callback function to handle the event
     */
    onUpdateEvent: genericIpcApi.onUpdateEvent,

    /**
     * Opens a URL in the user's default external browser.
     *
     * @param {string} url - The URL to open (must be HTTP or HTTPS)
     *
     * @returns {Promise<boolean>}
     */
    openExternal: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.SHELL_OPEN_EXTERNAL,
        "openExternal"
    ),

    // File Operations
    /**
     * Opens a file dialog and returns the selected file path. Returns null when
     * the user cancels.
     *
     * @returns {Promise<string | null>}
     */
    openFile: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.DIALOG_OPEN_FILE,
        "openFile"
    ),

    /**
     * Alias for openFile. Returns null when the user cancels.
     *
     * @returns {Promise<string | null>}
     */
    openFileDialog: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.DIALOG_OPEN_FILE,
        "openFileDialog"
    ),

    /**
     * Opens a folder picker dialog and returns the selected folder path.
     * Returns null when the user cancels.
     *
     * @returns {Promise<string | null>}
     */
    openFolderDialog: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.DIALOG_OPEN_FOLDER,
        "openFolderDialog"
    ),

    /**
     * Opens the overlay file dialog with multi-selection support.
     *
     * @returns {Promise<string[]>}
     */
    openOverlayDialog: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.DIALOG_OPEN_OVERLAY_FILES,
        "openOverlayDialog"
    ),

    // FIT File Operations
    /**
     * Parses a FIT file from an ArrayBuffer and returns the decoded data.
     *
     * @param {ArrayBuffer} arrayBuffer
     *
     * @returns {Promise<import("./shared/fit").FitDecodeResult>}
     */
    parseFitFile: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.FIT_PARSE,
        "parseFitFile"
    ),

    /**
     * Reads a file from the given file path and returns its contents as an
     * ArrayBuffer.
     *
     * @param {string} filePath
     *
     * @returns {Promise<ArrayBuffer>}
     */
    readFile: createSafeInvokeHandler(CONSTANTS.CHANNELS.FILE_READ, "readFile"),

    // Recent Files Management
    /**
     * Gets the list of recent files.
     *
     * @returns {Promise<string[]>}
     */
    recentFiles: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.RECENT_FILES_GET,
        "recentFiles"
    ),

    /**
     * Send an IPC message to the main process.
     *
     * @param {GenericSendChannel} channel - The IPC channel to send on
     * @param {...IpcRequestPayload} args - Arguments to send
     */
    send: genericIpcApi.send,

    /**
     * Sends a 'theme-changed' event to the main process.
     *
     * @param {string} theme
     */
    sendThemeChanged: createSafeSendHandler(
        CONSTANTS.EVENTS.THEME_CHANGED,
        "sendThemeChanged"
    ),

    /**
     * Enable/disable the experimental Browser tab.
     *
     * @param {boolean} enabled
     *
     * @returns {Promise<boolean>}
     */
    setFitBrowserEnabled: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.FIT_BROWSER_SET_ENABLED,
        "setFitBrowserEnabled"
    ),

    /**
     * Persist the Browser root folder.
     *
     * @param {string} folderPath
     *
     * @returns {Promise<boolean>}
     */
    setFitBrowserFolder: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.FIT_BROWSER_SET_FOLDER,
        "setFitBrowserFolder"
    ),

    /**
     * Sets the full screen mode.
     *
     * @param {boolean} flag - Whether to enable fullscreen
     */
    setFullScreen: createSafeSendHandler(
        CONSTANTS.EVENTS.SET_FULLSCREEN,
        "setFullScreen"
    ),

    /**
     * Sets a value in the main process state (restricted to allowed paths).
     *
     * @param {string} path - Path to the state property to set (e.g.,
     *   'loadedFitFilePath')
     * @param {import("./shared/ipc").MainStateSetValue} value - The value to
     *   set
     * @param {import("./shared/ipc").MainStateSetOptions} [options] - Optional
     *   metadata for the state change
     *
     * @returns {Promise<boolean>} True if successful, false if path is
     *   restricted
     */
    setMainState: mainStateApi.setMainState,

    // Gyazo OAuth Server Functions
    /**
     * Starts a temporary local server for Gyazo OAuth callback handling.
     *
     * @param {number} port - The port to start the server on (default: 3000)
     *
     * @returns {Promise<{
     *     success: boolean;
     *     port: number;
     *     message?: string;
     * }>}
     */
    startGyazoServer: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.GYAZO_SERVER_START,
        "startGyazoServer"
    ),

    /**
     * Stops the temporary Gyazo OAuth callback server.
     *
     * @returns {Promise<{ success: boolean; message?: string }>}
     */
    stopGyazoServer: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.GYAZO_SERVER_STOP,
        "stopGyazoServer"
    ),

    /**
     * Subscribe to main state changes and get an unsubscribe function.
     *
     * @param {string} path
     * @param {Function} callback
     *
     * @returns {Promise<() => Promise<boolean>>}
     */
    subscribeToMainState: mainStateApi.subscribeToMainState,

    /**
     * Removes a previously registered main state listener.
     *
     * @param {string} path
     * @param {Function} callback
     *
     * @returns {Promise<boolean>}
     */
    unlistenFromMainState: mainStateApi.unlistenFromMainState,

    /**
     * Validate the preload API is working correctly.
     *
     * @returns {boolean} True if API is functional
     */
    validateAPI: apiDiagnostics.validateAPI,

    /**
     * Write a PNG image to the system clipboard.
     *
     * The renderer commonly produces chart images as data URLs. Using
     * Electron's clipboard avoids Chromium permission issues for
     * navigator.clipboard.
     *
     * @param {string} pngDataUrl
     *
     * @returns {Promise<boolean>} True if the write succeeded
     */
    writeClipboardPngDataUrl: clipboardBridge.writeClipboardPngDataUrl,

    /**
     * Write text to the system clipboard using Electron's clipboard module.
     * This avoids browser Clipboard API permission issues in file:// contexts.
     *
     * Important: the renderer is sandboxed (sandbox: true). Clipboard writes
     * are executed in the main process via IPC.
     *
     * @param {string} text
     *
     * @returns {Promise<boolean>} True if the write succeeded
     */
    writeClipboardText: clipboardBridge.writeClipboardText,
};

// Enhanced API exposure with error handling
try {
    // Validate API before exposing
    if (electronAPI.validateAPI()) {
        const exposeInMainWorld = contextBridge?.exposeInMainWorld;
        if (typeof exposeInMainWorld !== "function") {
            throw new TypeError("contextBridge unavailable");
        }
        exposeInMainWorld("electronAPI", electronAPI);

        // Log API structure in development
        if (isDevelopmentMode()) {
            preloadLog(
                "info",
                "[preload.js] Successfully exposed electronAPI to main world"
            );
            const apiKeys = Object.keys(electronAPI),
                apiRecord = electronAPI as unknown as Record<string, unknown>,
                /** @type {string[]} */
                methods = apiKeys.filter(
                    (key) => typeof apiRecord[key] === "function"
                ),
                /** @type {string[]} */
                properties = apiKeys.filter(
                    (key) => typeof apiRecord[key] !== "function"
                );
            preloadLog("info", "[preload.js] API Structure:", {
                methods,
                properties,
                total: apiKeys.length,
            });
        }
    } else {
        preloadLog(
            "error",
            "[preload.js] API validation failed - not exposing to main world"
        );
    }
} catch (error) {
    preloadLog("error", "[preload.js] Failed to expose electronAPI:", error);
}

// Development helpers - only available in development mode
if (isDevelopmentMode()) {
    try {
        if (
            contextBridge &&
            typeof contextBridge.exposeInMainWorld === "function"
        ) {
            contextBridge.exposeInMainWorld(DEVELOPMENT_TOOLS_GLOBAL_NAME, {
                /**
                 * Get preload script information for debugging
                 */
                getPreloadInfo: () => ({
                    apiMethods: Object.keys(electronAPI),
                    constants: CONSTANTS,
                    timestamp: new Date().toISOString(),
                    version: "1.0.0",
                }),

                /**
                 * Log current API state
                 */
                logAPIState: () => {
                    preloadLog("info", "[preload.js] Current API State:", {
                        constants: CONSTANTS,
                        electronAPI: typeof electronAPI,
                        methodCount: Object.keys(electronAPI).length,
                        timestamp: new Date().toISOString(),
                    });
                },

                /**
                 * Test IPC communication
                 */
                testIPC: async () => {
                    try {
                        const version = await electronAPI.getAppVersion();
                        preloadLog(
                            "info",
                            "[preload.js] IPC test successful, app version:",
                            version
                        );
                        return true;
                    } catch (error) {
                        preloadLog(
                            "error",
                            "[preload.js] IPC test failed:",
                            error
                        );
                        return false;
                    }
                },
            });

            preloadLog("info", "[preload.js] Development tools exposed");
        } else {
            throw new Error("contextBridge unavailable");
        }
    } catch (error) {
        preloadLog(
            "error",
            "[preload.js] Failed to expose development tools:",
            error
        );
    }
}

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
