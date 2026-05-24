/**
 * Preload script exposes a typed, secure IPC API to the renderer via
 * contextBridge. Incremental typing is applied using JSDoc so strict TypeScript
 * checking over allowJs passes.
 */
/**
 * @typedef {import("./shared/ipc").GenericInvokeChannel} GenericInvokeChannel
 *
 * @typedef {import("./shared/ipc").GenericSendChannel} GenericSendChannel
 *
 * @typedef {import("./shared/ipc").IpcEventCallback} IpcEventCallback
 *
 * @typedef {import("./shared/ipc").IpcRequestPayload} IpcRequestPayload
 *
 * @typedef {import("./shared/ipc").IpcResponsePayload} IpcResponsePayload
 *
 * @typedef {import("./shared/ipc").MainStateChange} MainStateChange
 *
 * @typedef {import("./shared/ipc").RendererIpcEventChannel} PreloadRendererIpcEventChannel
 *
 * @typedef {import("./shared/ipc").UpdateEventName} UpdateEventName
 */
/**
 * @typedef {Object} GyazoServerStartResult
 *
 * @property {boolean} success
 * @property {number} port
 * @property {string} [message]
 */
/**
 * @typedef {Object} GyazoServerStopResult
 *
 * @property {boolean} success
 * @property {string} [message]
 */
/**
 * @typedef {Object} ChannelInfo
 *
 * @property {Record<string, string>} channels
 * @property {Record<string, string>} events
 * @property {number} totalChannels
 * @property {number} totalEvents
 */
/**
 * @typedef {Object} PlatformInfo
 *
 * @property {string} platform
 * @property {string} arch
 */
/**
 * Primitive/structured payload types that can safely traverse Electron IPC.
 *
 * Note: ArrayBuffer is intentionally excluded here because it is handled via
 * explicit wrappers (readFile/parseFitFile/decodeFitFile). Generic IPC helpers
 * should prefer JSON-like payloads.
 *
 * @typedef {null
 *     | boolean
 *     | number
 *     | string
 *     | IpcSerializable[]
 *     | { [key: string]: IpcSerializable }} IpcSerializable
 */
/**
 * Minimal Electron surface used by preload before the full Electron types are
 * available in this checked JavaScript file.
 *
 * @typedef {Object} PreloadContextBridge
 *
 * @property {(key: string, api: unknown) => void} [exposeInMainWorld]
 */
/**
 * @typedef {Object} PreloadIpcRenderer
 *
 * @property {(
 *     channel: string,
 *     ...args: IpcRequestPayload[]
 * ) => Promise<IpcResponsePayload>} [invoke]
 * @property {(channel: string, ...args: IpcRequestPayload[]) => void} [send]
 * @property {(
 *     channel: string,
 *     listener: (event: object, ...args: IpcResponsePayload[]) => void
 * ) => void} [on]
 * @property {(
 *     channel: string,
 *     listener: (event: object, ...args: IpcResponsePayload[]) => void
 * ) => void} [off]
 * @property {(
 *     channel: string,
 *     listener: (event: object, ...args: IpcResponsePayload[]) => void
 * ) => void} [removeListener]
 * @property {(channel: string) => void} [removeAllListeners]
 */
/**
 * @typedef {Object} PreloadElectronBridge
 *
 * @property {PreloadContextBridge | null | undefined} [contextBridge]
 * @property {PreloadIpcRenderer | null | undefined} [ipcRenderer]
 * @property {PreloadElectronBridge | null | undefined} [default]
 */
/**
 * @typedef {typeof globalThis & {
 *     __electronHoistedMock?: PreloadElectronBridge | null | undefined;
 * }} PreloadGlobal
 */
/**
 * @typedef {Object} IpcBridgeCatalog
 *
 * @property {Readonly<Record<string, GenericInvokeChannel>>} PRELOAD_CHANNELS
 * @property {Readonly<Record<string, PreloadRendererIpcEventChannel>>} PRELOAD_EVENTS
 * @property {(channel: unknown) => channel is GenericInvokeChannel} isAllowedGenericInvokeChannel
 * @property {(channel: unknown) => channel is GenericSendChannel} isAllowedGenericSendChannel
 * @property {(channel: unknown) => channel is PreloadRendererIpcEventChannel} isAllowedRendererIpcEventChannel
 * @property {(eventName: unknown) => eventName is UpdateEventName} isAllowedUpdateEventName
 */
/**
 * @typedef {import("./shared/preloadApi").ElectronAPI} ElectronAPI
 *
 * @typedef {Pick<ElectronAPI, "writeClipboardPngDataUrl" | "writeClipboardText">} ClipboardBridge
 *
 * @typedef {Pick<ElectronAPI, "invoke" | "notifyFitFileLoaded" | "onIpc" | "onUpdateEvent" | "send">} GenericIpcApi
 */
/**
 * @typedef {(...args: unknown[]) => unknown} UnknownCallback
 */

const preloadRequire = /** @type {(moduleId: string) => unknown} */ (require);
const { createApiDiagnostics } =
    /** @type {{ createApiDiagnostics: (options: Record<string, unknown>) => Pick<ElectronAPI, "getChannelInfo" | "validateAPI"> }} */ (
        preloadRequire("./preload/apiDiagnostics.js")
    );
const { registerPreloadBeforeExitHandler } =
    /** @type {{ registerPreloadBeforeExitHandler: (options: { globalScope?: typeof globalThis; isDevelopmentMode: () => boolean; preloadLog: (level: "error" | "info" | "warn", message: string, ...details: unknown[]) => void; processRef?: NodeJS.Process }) => void }} */ (
        preloadRequire("./preload/beforeExitHandler.js")
    );
const { createClipboardBridge } =
    /** @type {{ createClipboardBridge: (options: Record<string, unknown>) => ClipboardBridge }} */ (
        preloadRequire("./preload/clipboardBridge.js")
    );
const { createDevtoolsMenuApi } =
    /** @type {{ createDevtoolsMenuApi: (options: Record<string, unknown>) => Pick<ElectronAPI, "injectMenu"> }} */ (
        preloadRequire("./preload/devtoolsMenuApi.js")
    );
const { createPreloadValidators } =
    /** @type {{ createPreloadValidators: (preloadLog: (level: "error" | "info" | "warn", message: string, ...details: unknown[]) => void) => { validateCallback: (callback: unknown, methodName: string) => callback is UnknownCallback; validateChannelName: (value: unknown, paramName: string, methodName: string) => value is string; validateOptionalNonEmptyString: (value: unknown, paramName: string, methodName: string) => value is string | null | undefined; validateRequiredNonEmptyString: (value: unknown, paramName: string, methodName: string) => value is string } }} */ (
        preloadRequire("./preload/validators.js")
    );
const {
    isPreloadDevelopmentMode,
    shouldEnforceGenericIpcAllowlist,
} =
    /** @type {{ isPreloadDevelopmentMode: (processRef?: NodeJS.Process) => boolean; shouldEnforceGenericIpcAllowlist: (processRef?: NodeJS.Process) => boolean }} */ (
        preloadRequire("./preload/environment.js")
    );
const { createGenericIpcApi } =
    /** @type {{ createGenericIpcApi: (options: Record<string, unknown>) => GenericIpcApi }} */ (
        preloadRequire("./preload/genericIpcApi.js")
    );
const { resolvePreloadElectronBridge } =
    /** @type {{ resolvePreloadElectronBridge: (options: { globalScope?: object; requireModule: (moduleId: string) => unknown }) => { contextBridge: PreloadContextBridge | null | undefined; ipcRenderer: PreloadIpcRenderer | null | undefined } }} */ (
        preloadRequire("./preload/electronBridge.js")
    );
const { createMainStateBridge } =
    /** @type {{ createMainStateBridge: (options: { ipcRenderer: PreloadIpcRenderer; preloadLog: (level: "error" | "info" | "warn", message: string, ...details: unknown[]) => void; removeIpcListener: (channel: string, handler: (event: object, change: MainStateChange) => void) => void }) => { listenToMainState: (path: string, callback: (change: MainStateChange) => void) => Promise<boolean>; unlistenFromMainState: (path: string, callback: (change: MainStateChange) => void) => Promise<boolean> } }} */ (
        preloadRequire("./preload/mainStateBridge.js")
    );
const { createPreloadIpcHelpers } =
    /** @type {{ createPreloadIpcHelpers: (options: { ipcRenderer: PreloadIpcRenderer; preloadLog: (level: "error" | "info" | "warn", message: string, ...details: unknown[]) => void; validateCallback: (callback: unknown, methodName: string) => callback is UnknownCallback }) => { createNoopUnsubscribe: () => () => void; createSafeEventHandler: (channel: string, methodName: string, transform?: (...args: IpcResponsePayload[]) => IpcResponsePayload | null) => (callback: UnknownCallback) => () => void; createSafeInvokeHandler: (channel: string, methodName: string) => (...args: IpcRequestPayload[]) => Promise<IpcResponsePayload>; createSafeSendHandler: (channel: string, methodName: string) => (...args: IpcRequestPayload[]) => void; removeIpcListener: (channel: string, handler: (event: object, ...args: IpcResponsePayload[]) => void) => void } }} */ (
        preloadRequire("./preload/ipcHelpers.js")
    );
const { createPreloadLogger } =
    /** @type {{ createPreloadLogger: (consoleRef?: Console) => (level: "error" | "info" | "warn", message: string, ...details: unknown[]) => void }} */ (
        preloadRequire("./preload/logger.js")
    );
const { createMainStateApi } =
    /** @type {{ createMainStateApi: (options: Record<string, unknown>) => Pick<ElectronAPI, "getErrors" | "getMainState" | "getMetrics" | "getOperation" | "getOperations" | "listenToMainState" | "setMainState" | "subscribeToMainState" | "unlistenFromMainState"> }} */ (
        preloadRequire("./preload/mainStateApi.js")
    );
const ipcBridgeCatalog = /** @type {IpcBridgeCatalog} */ (
    preloadRequire("./preload/ipcBridgeCatalog.js")
);

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

/**
 * @returns {PreloadGlobal}
 */
function getPreloadGlobal() {
    return /** @type {PreloadGlobal} */ (globalThis);
}

/**
 * @returns {boolean}
 */
function isDevelopmentMode() {
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
    removeIpcListener: /** @type {(channel: string, handler: (event: object, change: MainStateChange) => void) => void} */ (
        removeIpcListener
    ),
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
    fitFileLoadedChannel: /** @type {GenericSendChannel} */ (
        CONSTANTS.EVENTS.FIT_FILE_LOADED
    ),
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
/** @type {ElectronAPI} */
const electronAPI = {
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
    ),

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
        (filePath) => filePath // Transform to extract just the filePath
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
        (theme) => theme // Transform to extract just the theme
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
        contextBridge.exposeInMainWorld("electronAPI", electronAPI);

        // Log API structure in development
        if (isDevelopmentMode()) {
            preloadLog(
                "info",
                "[preload.js] Successfully exposed electronAPI to main world"
            );
            const apiKeys = Object.keys(electronAPI),
                /** @type {Record<string, unknown>} */
                apiRecord = electronAPI,
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
