/**
 * Preload script exposes a typed, secure IPC API to the renderer via
 * contextBridge. Incremental typing is applied using JSDoc so strict TypeScript
 * checking over allowJs passes.
 */
const {
    PRELOAD_CHANNELS,
    PRELOAD_EVENTS,
    isAllowedGenericInvokeChannel,
    isAllowedGenericSendChannel,
    isAllowedRendererIpcEventChannel,
    isAllowedUpdateEventName,
} = require("./preload/ipcBridgeCatalog.js");

const // Constants for better maintainability
    CONSTANTS = {
        CHANNELS: PRELOAD_CHANNELS,
        DEFAULT_VALUES: {
            FIT_FILE_PATH: null,
            THEME: null,
        },
        EVENTS: PRELOAD_EVENTS,
    },
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
     * Note: ArrayBuffer is intentionally excluded here because it is handled
     * via explicit wrappers (readFile/parseFitFile/decodeFitFile). Generic IPC
     * helpers should prefer JSON-like payloads.
     *
     * @typedef {null
     *     | boolean
     *     | number
     *     | string
     *     | IpcSerializable[]
     *     | { [key: string]: IpcSerializable }} IpcSerializable
     */
    /**
     * @typedef {import("./shared/ipc").GenericInvokeChannel} GenericInvokeChannel
     *
     * @typedef {import("./shared/ipc").GenericSendChannel} GenericSendChannel
     *
     * @typedef {import("./shared/ipc").IpcRequestPayload} IpcRequestPayload
     *
     * @typedef {import("./shared/ipc").IpcResponsePayload} IpcResponsePayload
     *
     * @typedef {import("./shared/ipc").MainStateChange} MainStateChange
     */
    /**
     * Minimal Electron surface used by preload before the full Electron types
     * are available in this checked JavaScript file.
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
     * @typedef {import("./shared/preloadApi").ElectronAPI} ElectronAPI
     */

    // Robust Electron resolver to support Vitest mocks (CJS/ESM interop)
    __electronOverride = getPreloadGlobal().__electronHoistedMock ?? null,
    contextBridge = (() => {
        let lastErr;
        try {
            const overrideContextBridge = __electronOverride?.contextBridge;
            if (
                overrideContextBridge !== null &&
                overrideContextBridge !== undefined
            )
                return overrideContextBridge;
            const m = loadElectronBridge();
            return m?.contextBridge ?? undefined;
        } catch (error) {
            lastErr = error;
        }
        // If require failed and no override provided anything, surface error for robustness tests
        if (__electronOverride === null) throw getModuleLoadError(lastErr);
        return null;
    })(),
    ipcRenderer = (() => {
        let lastErr;
        try {
            const overrideIpcRenderer = __electronOverride?.ipcRenderer;
            if (
                overrideIpcRenderer !== null &&
                overrideIpcRenderer !== undefined
            )
                return overrideIpcRenderer;
            const m = loadElectronBridge();
            return m?.ipcRenderer ?? undefined;
        } catch (error) {
            lastErr = error;
        }
        if (__electronOverride === null) throw getModuleLoadError(lastErr);
        return null;
    })();

/**
 * @returns {PreloadGlobal}
 */
function getPreloadGlobal() {
    return /** @type {PreloadGlobal} */ (globalThis);
}

/**
 * @param {unknown} value
 *
 * @returns {value is Record<string, unknown>}
 */
function isObjectRecord(value) {
    return typeof value === "object" && value !== null;
}

/**
 * @param {unknown} error
 *
 * @returns {Error}
 */
function getModuleLoadError(error) {
    return error instanceof Error ? error : new Error("Module loading failed");
}

/**
 * @param {unknown} value
 *
 * @returns {PreloadElectronBridge | null}
 */
function unwrapElectronBridge(value) {
    if (!isObjectRecord(value)) {
        return null;
    }

    if ("contextBridge" in value || "ipcRenderer" in value) {
        return /** @type {PreloadElectronBridge} */ (value);
    }

    if ("default" in value) {
        return unwrapElectronBridge(value.default);
    }

    return /** @type {PreloadElectronBridge} */ (value);
}

/**
 * @returns {PreloadElectronBridge | null}
 */
function loadElectronBridge() {
    const electronModule = /** @type {unknown} */ (require("electron"));

    return unwrapElectronBridge(electronModule);
}

/**
 * Wrapper to create a safe event subscription handler.
 *
 * @param {string} channel
 * @param {string} methodName
 * @param {(...args: IpcResponsePayload[]) => IpcResponsePayload | null} [transform]
 *
 * @returns {(callback: Function) => () => void}
 */
function createSafeEventHandler(channel, methodName, transform) {
    return (callback) => {
        if (!validateCallback(callback, methodName)) {
            return () => {};
        }

        try {
            const handler = (_event, ...args) => {
                try {
                    if (transform) {
                        callback(transform(...args));
                    } else {
                        callback(...args);
                    }
                } catch (error) {
                    console.error(
                        `[preload.js] Error in ${methodName} callback:`,
                        error
                    );
                }
            };

            ipcRenderer.on(channel, handler);

            return () => {
                try {
                    removeIpcListener(channel, handler);
                } catch {
                    /* ignore */
                }
            };
        } catch (error) {
            console.error(
                `[preload.js] Error setting up ${methodName} event handler:`,
                error
            );
            return () => {};
        }
    };
}

/**
 * Safely remove an ipcRenderer listener, supporting alternative APIs when
 * removeListener is unavailable (e.g., Vitest mocks).
 *
 * @param {string} channel
 * @param {Function} handler
 */
function removeIpcListener(channel, handler) {
    if (!ipcRenderer) {
        return;
    }

    if (typeof ipcRenderer.removeListener === "function") {
        ipcRenderer.removeListener(channel, handler);
        return;
    }

    if (typeof ipcRenderer.off === "function") {
        ipcRenderer.off(channel, handler);
        return;
    }

    if (typeof ipcRenderer.removeAllListeners === "function") {
        ipcRenderer.removeAllListeners(channel);
    }
}

/**
 * Main-state subscription fanout. Keep a single ipcRenderer listener and
 * dispatch by change.path.
 *
 * @type {Map<string, Set<(change: MainStateChange) => void>>}
 */
const mainStateCallbacksByPath = new Map();

/** @type {((event: object, change: MainStateChange) => void) | null} */
let mainStateDispatcher = null;

/**
 * Wrapper to create a safe invoke handler.
 *
 * @param {string} channel
 * @param {string} methodName
 *
 * @returns {(...args: IpcRequestPayload[]) => Promise<IpcResponsePayload>}
 */
function createSafeInvokeHandler(channel, methodName) {
    return async (...args) => {
        try {
            return await ipcRenderer.invoke(channel, ...args);
        } catch (error) {
            console.error(`[preload.js] Error in ${methodName}:`, error);
            throw error;
        }
    };
}

/**
 * Wrapper to create a safe send handler.
 *
 * @param {string} channel
 * @param {string} methodName
 *
 * @returns {(...args: IpcRequestPayload[]) => void}
 */
function createSafeSendHandler(channel, methodName) {
    return (...args) => {
        try {
            ipcRenderer.send(channel, ...args);
        } catch (error) {
            console.error(`[preload.js] Error in ${methodName}:`, error);
        }
    };
}

/**
 * @returns {void}
 */
function ensureMainStateDispatcher() {
    if (mainStateDispatcher) return;
    mainStateDispatcher = (_event, change) => {
        const p =
            change && typeof change.path === "string" ? change.path : null;
        if (!p) return;
        const callbacks = mainStateCallbacksByPath.get(p);
        if (!callbacks || callbacks.size === 0) return;
        for (const cb of callbacks) {
            try {
                cb(change);
            } catch (error) {
                console.error(
                    "[preload.js] Error in main-state callback:",
                    error
                );
            }
        }
    };
    ipcRenderer.on("main-state-change", mainStateDispatcher);
}

// Enhanced error handling and validation
/**
 * @param {unknown} callback
 * @param {string} methodName
 *
 * @returns {callback is Function}
 */
function validateCallback(callback, methodName) {
    if (typeof callback !== "function") {
        console.error(
            `[preload.js] ${methodName}: callback must be a function`
        );
        return false;
    }
    return true;
}

/**
 * Validate a channel/event name. IPC channels must always be a non-empty
 * string.
 *
 * @param {unknown} value
 * @param {string} paramName
 * @param {string} methodName
 *
 * @returns {value is string}
 */
function validateChannelName(value, paramName, methodName) {
    if (typeof value !== "string") {
        console.error(
            `[preload.js] ${methodName}: ${paramName} must be a string`
        );
        return false;
    }
    if (value.trim().length === 0) {
        console.error(
            `[preload.js] ${methodName}: ${paramName} must be a non-empty string`
        );
        return false;
    }
    return true;
}

/**
 * Validate an optional string input.
 *
 * Accepts: undefined | null | non-empty string. Rejects: empty/whitespace-only
 * strings and non-strings.
 *
 * @param {unknown} value
 * @param {string} paramName
 * @param {string} methodName
 *
 * @returns {value is string | null | undefined}
 */
function validateOptionalNonEmptyString(value, paramName, methodName) {
    if (value === undefined || value === null) {
        return true;
    }
    if (typeof value !== "string") {
        console.error(
            `[preload.js] ${methodName}: ${paramName} must be a string or null`
        );
        return false;
    }
    if (value.trim().length === 0) {
        console.error(
            `[preload.js] ${methodName}: ${paramName} must be a non-empty string or null`
        );
        return false;
    }
    return true;
}

/**
 * Validate a required non-empty string input.
 *
 * @param {unknown} value
 * @param {string} paramName
 * @param {string} methodName
 *
 * @returns {value is string}
 */
function validateRequiredNonEmptyString(value, paramName, methodName) {
    if (typeof value !== "string") {
        console.error(
            `[preload.js] ${methodName}: ${paramName} must be a string`
        );
        return false;
    }
    if (value.trim().length === 0) {
        console.error(
            `[preload.js] ${methodName}: ${paramName} must be a non-empty string`
        );
        return false;
    }
    return true;
}

/**
 * True when running inside a real Electron runtime.
 *
 * Important: Several unit tests execute this preload file via `new
 * Function(...)` with a mocked `process` object. In that context, we should not
 * enforce production-grade IPC restrictions because those tests are not
 * modeling a real Electron renderer threat boundary.
 */
const IS_ELECTRON_RUNTIME =
    typeof process !== "undefined" &&
    Boolean(process?.versions) &&
    typeof (
        /** @type {Record<string, string | undefined>} */ (process.versions)
            .electron
    ) === "string";

/**
 * Enforce the generic send/invoke allowlist only when we are running in
 * Electron.
 *
 * Default: ON in Electron. Optional override for developers: set
 * FFV_ALLOW_GENERIC_IPC=true to bypass.
 */
const SHOULD_ENFORCE_GENERIC_IPC_ALLOWLIST =
    IS_ELECTRON_RUNTIME &&
    !(
        typeof process !== "undefined" &&
        Boolean(process?.env) &&
        /** @type {Record<string, string | undefined>} */ (process.env)
            .FFV_ALLOW_GENERIC_IPC === "true"
    );

// Main API object
/** @type {ElectronAPI} */
const electronAPI = {
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
    getChannelInfo: () => {
        const info = {
            channels: CONSTANTS.CHANNELS,
            events: CONSTANTS.EVENTS,
            totalChannels: Object.keys(CONSTANTS.CHANNELS).length,
            totalEvents: Object.keys(CONSTANTS.EVENTS).length,
        };
        return /** @type {ChannelInfo} */ (info);
    },

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
     * Gets the license info from the main process.
     *
     * @returns {Promise<string>}
     */
    getLicenseInfo: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.LICENSE_INFO,
        "getLicenseInfo"
    ),

    /**
     * Gets the Node.js version.
     *
     * @returns {Promise<string>}
     */
    getNodeVersion: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.NODE_VERSION,
        "getNodeVersion"
    ),
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
    writeClipboardText: async (text) => {
        try {
            const ok = await ipcRenderer.invoke(
                CONSTANTS.CHANNELS.CLIPBOARD_WRITE_TEXT,
                String(text)
            );
            return Boolean(ok);
        } catch (error) {
            console.error("[preload.js] writeClipboardText failed:", error);
            return false;
        }
    },

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
    writeClipboardPngDataUrl: async (pngDataUrl) => {
        try {
            const ok = await ipcRenderer.invoke(
                CONSTANTS.CHANNELS.CLIPBOARD_WRITE_PNG_DATA_URL,
                String(pngDataUrl)
            );
            return Boolean(ok);
        } catch (error) {
            console.error(
                "[preload.js] writeClipboardPngDataUrl failed:",
                error
            );
            return false;
        }
    },

    // Development Tools
    /**
     * Manually inject/reset the menu from the renderer (DevTools or app code).
     *
     * @param {string | null} theme - Current theme
     * @param {string | null} fitFilePath - Current FIT file path
     *
     * @returns {Promise<boolean>}
     */
    injectMenu: async (
        theme = CONSTANTS.DEFAULT_VALUES.THEME,
        fitFilePath = CONSTANTS.DEFAULT_VALUES.FIT_FILE_PATH
    ) => {
        if (!validateOptionalNonEmptyString(theme, "theme", "injectMenu")) {
            return false;
        }
        if (
            !validateOptionalNonEmptyString(
                fitFilePath,
                "fitFilePath",
                "injectMenu"
            )
        ) {
            return false;
        }

        try {
            return await ipcRenderer.invoke(
                CONSTANTS.CHANNELS.DEVTOOLS_INJECT_MENU,
                theme,
                fitFilePath
            );
        } catch (error) {
            console.error("[preload.js] Error in injectMenu:", error);
            return false;
        }
    },

    /**
     * Notify the main process that a file has been loaded (or unloaded).
     *
     * This is the preferred alternative to calling
     * electronAPI.send("fit-file-loaded", ...) because it is explicit and
     * easier to lock down.
     *
     * @param {string | null} filePath
     */
    notifyFitFileLoaded: (filePath) => {
        // Allow explicit unload signaling via null.
        if (filePath !== null && typeof filePath !== "string") {
            console.error(
                "[preload.js] notifyFitFileLoaded: filePath must be a string or null"
            );
            return;
        }

        const normalizedPath =
            typeof filePath === "string" && filePath.trim().length > 0
                ? filePath
                : null;

        try {
            ipcRenderer.send(CONSTANTS.EVENTS.FIT_FILE_LOADED, normalizedPath);
        } catch (error) {
            console.error("[preload.js] Error in notifyFitFileLoaded:", error);
        }
    },

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
    invoke: async (channel, ...args) => {
        if (!validateChannelName(channel, "channel", "invoke")) {
            throw new Error("Invalid channel for invoke");
        }

        // Do not allow arbitrary IPC access in Electron.
        // Use the explicit wrappers above instead.
        if (
            SHOULD_ENFORCE_GENERIC_IPC_ALLOWLIST &&
            !isAllowedGenericInvokeChannel(channel)
        ) {
            throw new Error("Channel not allowed for invoke");
        }

        try {
            return await ipcRenderer.invoke(channel, ...args);
        } catch (error) {
            console.error(`[preload.js] Error in invoke(${channel}):`, error);
            throw error;
        }
    },
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
    onIpc: (channel, callback) => {
        if (!validateChannelName(channel, "channel", "onIpc")) {
            return;
        }
        if (!validateCallback(callback, "onIpc")) {
            return;
        }

        if (
            SHOULD_ENFORCE_GENERIC_IPC_ALLOWLIST &&
            !isAllowedRendererIpcEventChannel(channel)
        ) {
            console.warn(
                `[preload.js] Blocked onIpc() subscription to non-allowlisted channel: ${channel}`
            );
            return;
        }

        try {
            const wrapped = (event, ...args) => {
                try {
                    callback(event, ...args);
                } catch (error) {
                    console.error(
                        `[preload.js] Error in onIpc(${channel}) callback:`,
                        error
                    );
                }
            };

            ipcRenderer.on(channel, wrapped);

            return () => {
                try {
                    removeIpcListener(channel, wrapped);
                } catch (error) {
                    console.error(
                        `[preload.js] Error removing onIpc(${channel}) listener:`,
                        error
                    );
                }
            };
        } catch (error) {
            console.error(
                `[preload.js] Error setting up onIpc(${channel}):`,
                error
            );
        }
    },

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
    onUpdateEvent: (eventName, callback) => {
        if (!validateCallback(callback, "onUpdateEvent")) {
            return;
        }
        if (!validateChannelName(eventName, "eventName", "onUpdateEvent")) {
            return;
        }

        if (
            SHOULD_ENFORCE_GENERIC_IPC_ALLOWLIST &&
            !isAllowedUpdateEventName(eventName)
        ) {
            console.warn(
                `[preload.js] Blocked onUpdateEvent() subscription to non-allowlisted event: ${eventName}`
            );
            return;
        }

        try {
            const handler = (_event, ...args) => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(
                        `[preload.js] Error in onUpdateEvent(${eventName}) callback:`,
                        error
                    );
                }
            };

            ipcRenderer.on(eventName, handler);

            return () => {
                try {
                    removeIpcListener(eventName, handler);
                } catch {
                    /* ignore */
                }
            };
        } catch (error) {
            console.error(
                `[preload.js] Error setting up onUpdateEvent(${eventName}):`,
                error
            );
        }
    },

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
     * Whether the experimental Browser tab is enabled.
     *
     * @returns {Promise<boolean>}
     */
    isFitBrowserEnabled: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.FIT_BROWSER_IS_ENABLED,
        "isFitBrowserEnabled"
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
    send: (channel, ...args) => {
        if (!validateChannelName(channel, "channel", "send")) {
            return;
        }

        if (
            SHOULD_ENFORCE_GENERIC_IPC_ALLOWLIST &&
            !isAllowedGenericSendChannel(channel)
        ) {
            console.warn(
                `[preload.js] Blocked send() to non-allowlisted channel: ${channel}`
            );
            return;
        }

        try {
            ipcRenderer.send(channel, ...args);
        } catch (error) {
            console.error(`[preload.js] Error in send(${channel}):`, error);
        }
    },

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
     * Sets the full screen mode.
     *
     * @param {boolean} flag - Whether to enable fullscreen
     */
    setFullScreen: createSafeSendHandler(
        CONSTANTS.EVENTS.SET_FULLSCREEN,
        "setFullScreen"
    ),

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
    getMainState: async (path) => {
        try {
            return await ipcRenderer.invoke("main-state:get", path);
        } catch (error) {
            console.error(
                `[preload.js] Error in getMainState(${path || "all"}):`,
                error
            );
            throw error;
        }
    },

    /**
     * Sets a value in the main process state (restricted to allowed paths).
     *
     * @param {string} path - Path to the state property to set (e.g.,
     *   'loadedFitFilePath')
     * @param {IpcSerializable} value - The value to set
     * @param {IpcSerializable} [options] - Optional metadata for the state
     *   change
     *
     * @returns {Promise<boolean>} True if successful, false if path is
     *   restricted
     */
    setMainState: async (path, value, options = {}) => {
        if (!validateRequiredNonEmptyString(path, "path", "setMainState")) {
            return false;
        }

        try {
            return await ipcRenderer.invoke(
                "main-state:set",
                path,
                value,
                options
            );
        } catch (error) {
            console.error(
                `[preload.js] Error in setMainState(${path}):`,
                error
            );
            throw error;
        }
    },

    /**
     * Listens for changes to a specific path in the main process state.
     *
     * @param {string} path - Path to listen to (e.g., 'loadedFitFilePath')
     * @param {Function} callback - Callback function to handle state changes
     *
     * @returns {Promise<boolean>} True if listener was registered successfully
     */
    listenToMainState: async (path, callback) => {
        if (
            !validateRequiredNonEmptyString(path, "path", "listenToMainState")
        ) {
            return false;
        }
        if (!validateCallback(callback, "listenToMainState")) {
            return false;
        }

        try {
            ensureMainStateDispatcher();

            const existing = mainStateCallbacksByPath.get(path);
            const callbacks = existing ?? new Set();
            callbacks.add(callback);
            if (!existing) {
                mainStateCallbacksByPath.set(path, callbacks);
                // Register the listener with the main process (idempotent in main)
                return await ipcRenderer.invoke("main-state:listen", path);
            }

            return true;
        } catch (error) {
            console.error(
                `[preload.js] Error in listenToMainState(${path}):`,
                error
            );
            throw error;
        }
    },

    /**
     * Removes a previously registered main state listener.
     *
     * @param {string} path
     * @param {Function} callback
     *
     * @returns {Promise<boolean>}
     */
    unlistenFromMainState: async (path, callback) => {
        if (
            !validateRequiredNonEmptyString(
                path,
                "path",
                "unlistenFromMainState"
            )
        ) {
            return false;
        }
        if (!validateCallback(callback, "unlistenFromMainState")) {
            return false;
        }

        try {
            const callbacks = mainStateCallbacksByPath.get(path);
            if (!callbacks) return false;

            callbacks.delete(callback);
            if (callbacks.size === 0) {
                mainStateCallbacksByPath.delete(path);
                await ipcRenderer.invoke("main-state:unlisten", path);
            }

            if (mainStateCallbacksByPath.size === 0 && mainStateDispatcher) {
                removeIpcListener("main-state-change", mainStateDispatcher);
                mainStateDispatcher = null;
            }

            return true;
        } catch (error) {
            console.error(
                `[preload.js] Error in unlistenFromMainState(${path}):`,
                error
            );
            throw error;
        }
    },

    /**
     * Subscribe to main state changes and get an unsubscribe function.
     *
     * @param {string} path
     * @param {Function} callback
     *
     * @returns {Promise<() => Promise<boolean>>}
     */
    subscribeToMainState: async (path, callback) => {
        const ok = await electronAPI.listenToMainState(path, callback);
        if (!ok) {
            return () => Promise.resolve(false);
        }
        return () => electronAPI.unlistenFromMainState(path, callback);
    },

    /**
     * Gets the status of a specific operation from the main process.
     *
     * @param {string} operationId - The unique identifier for the operation
     *
     * @returns {Promise<IpcSerializable | null>} The operation status object
     */
    getOperation: async (operationId) => {
        if (
            !validateRequiredNonEmptyString(
                operationId,
                "operationId",
                "getOperation"
            )
        ) {
            return null;
        }

        try {
            return await ipcRenderer.invoke(
                "main-state:operation",
                operationId
            );
        } catch (error) {
            console.error(
                `[preload.js] Error in getOperation(${operationId}):`,
                error
            );
            throw error;
        }
    },

    /**
     * Gets all operations from the main process.
     *
     * @returns {Promise<Object>} Object containing all operations
     */
    getOperations: async () => {
        try {
            return await ipcRenderer.invoke("main-state:operations");
        } catch (error) {
            console.error("[preload.js] Error in getOperations:", error);
            throw error;
        }
    },

    /**
     * Gets recent errors from the main process.
     *
     * @param {number} [limit=50] - Maximum number of errors to retrieve.
     *   Default is `50`
     *
     * @returns {Promise<Array>} Array of recent errors
     */
    getErrors: async (limit = 50) => {
        try {
            return await ipcRenderer.invoke("main-state:errors", limit);
        } catch (error) {
            console.error("[preload.js] Error in getErrors:", error);
            throw error;
        }
    },

    /**
     * Gets performance metrics from the main process.
     *
     * @returns {Promise<Object>} Object containing performance metrics
     */
    getMetrics: async () => {
        try {
            return await ipcRenderer.invoke("main-state:metrics");
        } catch (error) {
            console.error("[preload.js] Error in getMetrics:", error);
            throw error;
        }
    },

    /**
     * Validate the preload API is working correctly.
     *
     * @returns {boolean} True if API is functional
     */
    validateAPI: () => {
        try {
            // Test basic functionality
            const hasConstants = CONSTANTS !== undefined;
            const hasContextBridge =
                contextBridge &&
                typeof contextBridge.exposeInMainWorld === "function";
            const hasIpcRenderer =
                ipcRenderer &&
                typeof ipcRenderer.invoke === "function" &&
                typeof ipcRenderer.send === "function" &&
                typeof ipcRenderer.on === "function";

            if (process.env.NODE_ENV === "development") {
                console.log("[preload.js] API Validation:", {
                    channelCount: Object.keys(CONSTANTS.CHANNELS).length,
                    eventCount: Object.keys(CONSTANTS.EVENTS).length,
                    hasConstants,
                    hasContextBridge,
                    hasIpcRenderer,
                });
            }

            return Boolean(hasIpcRenderer && hasContextBridge && hasConstants);
        } catch (error) {
            console.error("[preload.js] API validation failed:", error);
            return false;
        }
    },
};

// Enhanced API exposure with error handling
try {
    // Validate API before exposing
    if (electronAPI.validateAPI()) {
        contextBridge.exposeInMainWorld("electronAPI", electronAPI);

        // Log API structure in development
        if (process.env.NODE_ENV === "development") {
            console.log(
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
            console.log("[preload.js] API Structure:", {
                methods,
                properties,
                total: apiKeys.length,
            });
        }
    } else {
        console.error(
            "[preload.js] API validation failed - not exposing to main world"
        );
    }
} catch (error) {
    console.error("[preload.js] Failed to expose electronAPI:", error);
}

// Development helpers - only available in development mode
if (process.env.NODE_ENV === "development") {
    try {
        if (
            contextBridge &&
            typeof contextBridge.exposeInMainWorld === "function"
        ) {
            contextBridge.exposeInMainWorld("devTools", {
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
                    console.log("[preload.js] Current API State:", {
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
                        console.log(
                            "[preload.js] IPC test successful, app version:",
                            version
                        );
                        return true;
                    } catch (error) {
                        console.error("[preload.js] IPC test failed:", error);
                        return false;
                    }
                },
            });

            console.log("[preload.js] Development tools exposed");
        } else {
            throw new Error("contextBridge unavailable");
        }
    } catch (error) {
        console.error(
            "[preload.js] Failed to expose development tools:",
            error
        );
    }
}

// Cleanup and final validation
/**
 * Ensure the process beforeExit handler is only registered once even if this
 * module is executed multiple times during tests.
 */
const BEFORE_EXIT_REGISTRY_KEY = "__ffv_preload_beforeExitRegistry__",
    BEFORE_EXIT_LISTENER_SYMBOL = Symbol.for("ffv.preload.beforeExitListener");

/**
 * @typedef {Object} PreloadGlobalRegistry
 *
 * @property {WeakMap<NodeJS.Process, Function> | null | undefined} __ffv_preload_beforeExitRegistry__
 */

/**
 * Retrieve (or initialize) the global registry that tracks beforeExit listener
 * wrappers per process.
 *
 * @returns {WeakMap<NodeJS.Process, Function> | null}
 */
function getProcessRegistry() {
    if (typeof globalThis === "undefined") {
        return null;
    }
    const scope = /** @type {PreloadGlobalRegistry} */ (globalThis);
    if (!scope[BEFORE_EXIT_REGISTRY_KEY]) {
        try {
            scope[BEFORE_EXIT_REGISTRY_KEY] = new WeakMap();
        } catch (error) {
            console.warn(
                "[preload.js] Unable to initialize beforeExit registry:",
                error
            );
            scope[BEFORE_EXIT_REGISTRY_KEY] = null;
        }
    }
    return scope[BEFORE_EXIT_REGISTRY_KEY];
}

function handleBeforeExit() {
    if (process.env.NODE_ENV === "development") {
        console.log("[preload.js] Process exiting, performing cleanup...");
    }
    const registry = getProcessRegistry();
    if (registry && typeof registry.delete === "function") {
        const existingWrapper = registry.get(process);
        registry.delete(process);
        if (existingWrapper && typeof process.removeListener === "function") {
            try {
                process.removeListener("beforeExit", existingWrapper);
            } catch (error) {
                console.warn(
                    "[preload.js] Unable to remove beforeExit listener during cleanup:",
                    error
                );
            }
        }
    }
}

function registerBeforeExitHandler() {
    const hasOnce = typeof process.once === "function";
    if (!hasOnce) {
        return;
    }

    const hasListeners = typeof process.listeners === "function";
    const hasRemove = typeof process.removeListener === "function";
    const registry = getProcessRegistry();

    if (registry && typeof registry.get === "function") {
        const existingWrapper = registry.get(process);
        if (existingWrapper) {
            if (hasRemove) {
                try {
                    process.removeListener("beforeExit", existingWrapper);
                } catch (error) {
                    console.warn(
                        "[preload.js] Unable to remove stale beforeExit listener:",
                        error
                    );
                }
            }

            registry.delete(process);
        }
    }

    if (hasListeners && hasRemove) {
        try {
            const currentListeners = process.listeners("beforeExit");
            if (Array.isArray(currentListeners)) {
                for (const listener of currentListeners) {
                    if (
                        listener &&
                        (listener === handleBeforeExit ||
                            listener.listener === handleBeforeExit ||
                            listener[BEFORE_EXIT_LISTENER_SYMBOL])
                    ) {
                        process.removeListener("beforeExit", listener);
                    }
                }
            }
        } catch (error) {
            console.warn(
                "[preload.js] Unable to prune stale beforeExit listeners:",
                error
            );
        }
    }

    process.once("beforeExit", handleBeforeExit);

    if (registry && typeof registry.set === "function") {
        let storedWrapper = handleBeforeExit;
        if (hasListeners) {
            try {
                const listeners = process.listeners("beforeExit");
                if (Array.isArray(listeners)) {
                    for (const listener of listeners) {
                        if (
                            listener === handleBeforeExit ||
                            listener.listener === handleBeforeExit
                        ) {
                            storedWrapper = listener;
                            break;
                        }
                    }
                }
            } catch (error) {
                console.warn(
                    "[preload.js] Unable to capture beforeExit listener wrapper:",
                    error
                );
            }
        }

        try {
            storedWrapper[BEFORE_EXIT_LISTENER_SYMBOL] = true;
        } catch {
            // Ignore if wrapper is not extensible
        }

        registry.set(process, storedWrapper);
    }
}

registerBeforeExitHandler();

// Report successful initialization
if (process.env.NODE_ENV === "development") {
    console.log("[preload.js] Preload script initialized successfully");
}
