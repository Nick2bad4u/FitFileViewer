/**
 * Preload script exposes a typed, secure IPC API to the renderer via contextBridge.
 * Incremental typing is applied using JSDoc so strict TypeScript checking over allowJs passes.
 */
const // Constants for better maintainability
    CONSTANTS = {
        CHANNELS: {
            APP_VERSION: "getAppVersion",
            CHROME_VERSION: "getChromeVersion",
            DEVTOOLS_INJECT_MENU: "devtools-inject-menu",
            DIALOG_OPEN_FILE: "dialog:openFile",
            DIALOG_OPEN_OVERLAY_FILES: "dialog:openOverlayFiles",
            ELECTRON_VERSION: "getElectronVersion",
            FILE_READ: "file:read",
            FIT_DECODE: "fit:decode",
            FIT_PARSE: "fit:parse",
            // Gyazo OAuth server channels
            GYAZO_SERVER_START: "gyazo:server:start",
            GYAZO_SERVER_STOP: "gyazo:server:stop",
            LICENSE_INFO: "getLicenseInfo",
            NODE_VERSION: "getNodeVersion",
            PLATFORM_INFO: "getPlatformInfo",
            RECENT_FILES_ADD: "recentFiles:add",
            RECENT_FILES_GET: "recentFiles:get",
            SHELL_OPEN_EXTERNAL: "shell:openExternal",
            THEME_GET: "theme:get",
        },
        DEFAULT_VALUES: {
            FIT_FILE_PATH: null,
            THEME: null,
        },
        EVENTS: {
            INSTALL_UPDATE: "install-update",
            MENU_CHECK_FOR_UPDATES: "menu-check-for-updates",
            MENU_OPEN_FILE: "menu-open-file",
            MENU_OPEN_OVERLAY: "menu-open-overlay",
            OPEN_RECENT_FILE: "open-recent-file",
            OPEN_SUMMARY_COLUMN_SELECTOR: "open-summary-column-selector",
            SET_FULLSCREEN: "set-fullscreen",
            SET_THEME: "set-theme",
            THEME_CHANGED: "theme-changed",
        },
    },
    /**
     * @typedef {Object} GyazoServerStartResult
     * @property {boolean} success
     * @property {number} port
     * @property {string} [message]
     */
    /**
     * @typedef {Object} GyazoServerStopResult
     * @property {boolean} success
     * @property {string} [message]
     */
    /**
     * @typedef {Object} ChannelInfo
     * @property {Record<string,string>} channels
     * @property {Record<string,string>} events
     * @property {number} totalChannels
     * @property {number} totalEvents
     */
    /**
     * @typedef {Object} PlatformInfo
     * @property {string} platform
     * @property {string} arch
     */
    /**
     * @typedef {Object} ElectronAPI
     * @property {() => Promise<string[]>} openFile
     * @property {() => Promise<string[]>} openFileDialog
     * @property {() => Promise<string[]>} openOverlayDialog
     * @property {(filePath: string) => Promise<ArrayBuffer>} readFile
     * @property {(arrayBuffer: ArrayBuffer) => Promise<any>} parseFitFile
     * @property {(arrayBuffer: ArrayBuffer) => Promise<any>} decodeFitFile
     * @property {() => Promise<string[]>} recentFiles
     * @property {(filePath: string) => Promise<string[]>} addRecentFile
     * @property {() => Promise<string>} getTheme
     * @property {(theme: string) => void} sendThemeChanged
     * @property {() => Promise<string>} getAppVersion
     * @property {() => Promise<string>} getElectronVersion
     * @property {() => Promise<string>} getNodeVersion
     * @property {() => Promise<string>} getChromeVersion
     * @property {() => Promise<string>} getLicenseInfo
     * @property {() => Promise<PlatformInfo>} getPlatformInfo
     * @property {(url: string) => Promise<boolean>} openExternal
     * @property {(port: number) => Promise<GyazoServerStartResult>} startGyazoServer
     * @property {() => Promise<GyazoServerStopResult>} stopGyazoServer
     * @property {(callback: Function) => void} onMenuOpenFile
     * @property {(callback: Function) => void} onMenuOpenOverlay
     * @property {(callback: (filePath: string) => void) => void} onOpenRecentFile
     * @property {(callback: (theme: string) => void) => void} onSetTheme
     * @property {(callback: Function) => void} onOpenSummaryColumnSelector
     * @property {(eventName: string, callback: Function) => void} onUpdateEvent
     * @property {() => void} checkForUpdates
     * @property {() => void} installUpdate
     * @property {(flag: boolean) => void} setFullScreen
     * @property {(channel: string, callback: Function) => void} onIpc
     * @property {(channel: string, ...args: any[]) => void} send
     * @property {(channel: string, ...args: any[]) => Promise<any>} invoke
     * @property {(theme?: string|null, fitFilePath?: string|null) => Promise<boolean>} injectMenu
     * @property {() => ChannelInfo} getChannelInfo
     * @property {() => boolean} validateAPI
     */

    // Robust Electron resolver to support Vitest mocks (CJS/ESM interop)
    __electronOverride =
        (typeof globalThis !== "undefined" && /** @type {any} */ (globalThis).__electronHoistedMock) || null,
    contextBridge = (() => {
        let lastErr;
        try {
            if (__electronOverride && __electronOverride.contextBridge) return __electronOverride.contextBridge;
            const mod = /** @type {any} */ (require("electron"));
            const m = mod && (mod.contextBridge || mod.ipcRenderer) ? mod : mod && mod.default ? mod.default : mod;
            return m && m.contextBridge ? m.contextBridge : undefined;
        } catch (error) {
            lastErr = error;
        }
        // If require failed and no override provided anything, surface error for robustness tests
        if (!__electronOverride) throw lastErr || new Error("Module loading failed");
        return null;
    })(),
    ipcRenderer = (() => {
        let lastErr;
        try {
            if (__electronOverride && __electronOverride.ipcRenderer) return __electronOverride.ipcRenderer;
            const mod = /** @type {any} */ (require("electron"));
            const m = mod && (mod.contextBridge || mod.ipcRenderer) ? mod : mod && mod.default ? mod.default : mod;
            return m && m.ipcRenderer ? m.ipcRenderer : undefined;
        } catch (error) {
            lastErr = error;
        }
        if (!__electronOverride) throw lastErr || new Error("Module loading failed");
        return null;
    })();

/**
 * Wrapper to create a safe event subscription handler.
 * @param {string} channel
 * @param {string} methodName
 * @param {( ...args: any[]) => any | null} [transform]
 * @returns {(callback: Function) => void}
 */
function createSafeEventHandler(channel, methodName, transform) {
    return (callback) => {
        if (!validateCallback(callback, methodName)) {
            return;
        }

        try {
            if (transform) {
                ipcRenderer.on(channel, (_event, ...args) => {
                    try {
                        callback(transform(...args));
                    } catch (error) {
                        console.error(`[preload.js] Error in ${methodName} callback:`, error);
                    }
                });
            } else {
                ipcRenderer.on(channel, (_event, ...args) => {
                    try {
                        callback(...args);
                    } catch (error) {
                        console.error(`[preload.js] Error in ${methodName} callback:`, error);
                    }
                });
            }
        } catch (error) {
            console.error(`[preload.js] Error setting up ${methodName} event handler:`, error);
        }
    };
}

/**
 * Wrapper to create a safe invoke handler.
 * @param {string} channel
 * @param {string} methodName
 * @returns {(...args: any[]) => Promise<any>}
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
 * @param {string} channel
 * @param {string} methodName
 * @returns {(...args: any[]) => void}
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

// Enhanced error handling and validation
/**
 * @param {unknown} callback
 * @param {string} methodName
 * @returns {callback is Function}
 */
function validateCallback(callback, methodName) {
    if (typeof callback !== "function") {
        console.error(`[preload.js] ${methodName}: callback must be a function`);
        return false;
    }
    return true;
}

/**
 * @param {unknown} value
 * @param {string} paramName
 * @param {string} methodName
 * @returns {value is string|null}
 */
function validateString(value, paramName, methodName) {
    if (value !== null && typeof value !== "string") {
        console.error(`[preload.js] ${methodName}: ${paramName} must be a string or null`);
        return false;
    }
    return true;
}

// Main API object
/** @type {ElectronAPI} */
const electronAPI = {
    /**
     * Adds a file to the recent files list.
     * @param {string} filePath
     * @returns {Promise<string[]>}
     */
    addRecentFile: createSafeInvokeHandler(CONSTANTS.CHANNELS.RECENT_FILES_ADD, "addRecentFile"),

    /**
     * Trigger a check for updates (menu or manual).
     */
    checkForUpdates: createSafeSendHandler(CONSTANTS.EVENTS.MENU_CHECK_FOR_UPDATES, "checkForUpdates"),

    /**
     * Decodes a FIT file from an ArrayBuffer and returns the parsed data.
     * @param {ArrayBuffer} arrayBuffer
     * @returns {Promise<any>}
     */
    decodeFitFile: createSafeInvokeHandler(CONSTANTS.CHANNELS.FIT_DECODE, "decodeFitFile"),

    // Application Information
    /**
     * Gets the app version from the main process.
     * @returns {Promise<string>}
     */
    getAppVersion: createSafeInvokeHandler(CONSTANTS.CHANNELS.APP_VERSION, "getAppVersion"),

    // Development and Debugging Helpers
    /**
     * Get information about available IPC channels for debugging.
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
        return /** @type {ChannelInfo} */ (/** @type {any} */ (info));
    },

    /**
     * Gets the Chrome version.
     * @returns {Promise<string>}
     */
    getChromeVersion: createSafeInvokeHandler(CONSTANTS.CHANNELS.CHROME_VERSION, "getChromeVersion"),

    /**
     * Gets the Electron version.
     * @returns {Promise<string>}
     */
    getElectronVersion: createSafeInvokeHandler(CONSTANTS.CHANNELS.ELECTRON_VERSION, "getElectronVersion"),

    /**
     * Gets the license info from the main process.
     * @returns {Promise<string>}
     */
    getLicenseInfo: createSafeInvokeHandler(CONSTANTS.CHANNELS.LICENSE_INFO, "getLicenseInfo"),

    /**
     * Gets the Node.js version.
     * @returns {Promise<string>}
     */
    getNodeVersion: createSafeInvokeHandler(CONSTANTS.CHANNELS.NODE_VERSION, "getNodeVersion"),
    getPlatformInfo: createSafeInvokeHandler(CONSTANTS.CHANNELS.PLATFORM_INFO, "getPlatformInfo"),

    // Theme Management
    /**
     * Gets the current theme from the main process.
     * @returns {Promise<string>}
     */
    getTheme: createSafeInvokeHandler(CONSTANTS.CHANNELS.THEME_GET, "getTheme"),

    // Development Tools
    /**
     * Manually inject/reset the menu from the renderer (DevTools or app code).
     * @param {string|null} theme - Current theme
     * @param {string|null} fitFilePath - Current FIT file path
     * @returns {Promise<boolean>}
     */
    injectMenu: async (
        theme = CONSTANTS.DEFAULT_VALUES.THEME,
        fitFilePath = CONSTANTS.DEFAULT_VALUES.FIT_FILE_PATH
    ) => {
        if (!validateString(theme, "theme", "injectMenu")) {
            return false;
        }
        if (!validateString(fitFilePath, "fitFilePath", "injectMenu")) {
            return false;
        }

        try {
            return await ipcRenderer.invoke(CONSTANTS.CHANNELS.DEVTOOLS_INJECT_MENU, theme, fitFilePath);
        } catch (error) {
            console.error("[preload.js] Error in injectMenu:", error);
            return false;
        }
    },

    /**
     * Trigger install of a downloaded update.
     */
    installUpdate: createSafeSendHandler(CONSTANTS.EVENTS.INSTALL_UPDATE, "installUpdate"),

    /**
     * Expose ipcRenderer.invoke for direct use with error handling.
     * @param {string} channel - The IPC channel to invoke
     * @param {...any} args - Arguments to send
     * @returns {Promise<any>}
     */
    invoke: async (channel, ...args) => {
        if (!validateString(channel, "channel", "invoke")) {
            throw new Error("Invalid channel for invoke");
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
     * @param {string} channel - The IPC channel to listen on
     * @param {Function} callback - Callback function to handle the event
     * @returns {(() => void) | undefined} Unsubscribe function when registration succeeds
     */
    onIpc: (channel, callback) => {
        if (!validateString(channel, "channel", "onIpc")) {
            return;
        }
        if (!validateCallback(callback, "onIpc")) {
            return;
        }

        try {
            const wrapped = (event, ...args) => {
                try {
                    callback(event, ...args);
                } catch (error) {
                    console.error(`[preload.js] Error in onIpc(${channel}) callback:`, error);
                }
            };

            ipcRenderer.on(channel, wrapped);

            return () => {
                try {
                    ipcRenderer.removeListener(channel, wrapped);
                } catch (error) {
                    console.error(`[preload.js] Error removing onIpc(${channel}) listener:`, error);
                }
            };
        } catch (error) {
            console.error(`[preload.js] Error setting up onIpc(${channel}):`, error);
        }
    },

    // Event Handlers with enhanced error handling
    /**
     * Registers a handler for the 'menu-open-file' event.
     * @param {Function} callback
     */
    onMenuOpenFile: createSafeEventHandler(CONSTANTS.EVENTS.MENU_OPEN_FILE, "onMenuOpenFile"),

    /**
     * Registers a handler for the 'menu-open-overlay' event.
     * @param {Function} callback
     */
    onMenuOpenOverlay: createSafeEventHandler(CONSTANTS.EVENTS.MENU_OPEN_OVERLAY, "onMenuOpenOverlay"),

    /**
     * Registers a handler for the 'open-recent-file' event.
     * @param {Function} callback
     */
    onOpenRecentFile: createSafeEventHandler(
        CONSTANTS.EVENTS.OPEN_RECENT_FILE,
        "onOpenRecentFile",
        (filePath) => filePath // Transform to extract just the filePath
    ),

    /**
     * Registers a handler for the 'open-summary-column-selector' event.
     * @param {Function} callback
     */
    onOpenSummaryColumnSelector: createSafeEventHandler(
        CONSTANTS.EVENTS.OPEN_SUMMARY_COLUMN_SELECTOR,
        "onOpenSummaryColumnSelector"
    ),

    /**
     * Registers a handler for the 'set-theme' event.
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
     * @param {string} eventName - The update event name to listen for
     * @param {Function} callback - Callback function to handle the event
     */
    onUpdateEvent: (eventName, callback) => {
        if (!validateCallback(callback, "onUpdateEvent")) {
            return;
        }
        if (!validateString(eventName, "eventName", "onUpdateEvent")) {
            return;
        }

        try {
            ipcRenderer.on(eventName, (_event, ...args) => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`[preload.js] Error in onUpdateEvent(${eventName}) callback:`, error);
                }
            });
        } catch (error) {
            console.error(`[preload.js] Error setting up onUpdateEvent(${eventName}):`, error);
        }
    },

    /**
     * Opens a URL in the user's default external browser.
     * @param {string} url - The URL to open (must be HTTP or HTTPS)
     * @returns {Promise<boolean>}
     */
    openExternal: createSafeInvokeHandler(CONSTANTS.CHANNELS.SHELL_OPEN_EXTERNAL, "openExternal"),

    // File Operations
    /**
     * Opens a file dialog and returns the selected file path(s).
     * @returns {Promise<string[]>}
     */
    openFile: createSafeInvokeHandler(CONSTANTS.CHANNELS.DIALOG_OPEN_FILE, "openFile"),

    /**
     * Opens a file dialog and returns the selected file path(s).
     * Alias for openFile for compatibility.
     * @returns {Promise<string[]>}
     */
    openFileDialog: createSafeInvokeHandler(CONSTANTS.CHANNELS.DIALOG_OPEN_FILE, "openFileDialog"),

    /**
     * Opens the overlay file dialog with multi-selection support.
     * @returns {Promise<string[]>}
     */
    openOverlayDialog: createSafeInvokeHandler(CONSTANTS.CHANNELS.DIALOG_OPEN_OVERLAY_FILES, "openOverlayDialog"),

    // FIT File Operations
    /**
     * Parses a FIT file from an ArrayBuffer and returns the decoded data.
     * @param {ArrayBuffer} arrayBuffer
     * @returns {Promise<any>}
     */
    parseFitFile: createSafeInvokeHandler(CONSTANTS.CHANNELS.FIT_PARSE, "parseFitFile"),

    /**
     * Reads a file from the given file path and returns its contents as an ArrayBuffer.
     * @param {string} filePath
     * @returns {Promise<ArrayBuffer>}
     */
    readFile: createSafeInvokeHandler(CONSTANTS.CHANNELS.FILE_READ, "readFile"),

    // Recent Files Management
    /**
     * Gets the list of recent files.
     * @returns {Promise<string[]>}
     */
    recentFiles: createSafeInvokeHandler(CONSTANTS.CHANNELS.RECENT_FILES_GET, "recentFiles"),

    /**
     * Send an IPC message to the main process.
     * @param {string} channel - The IPC channel to send on
     * @param {...any} args - Arguments to send
     */
    send: (channel, ...args) => {
        if (!validateString(channel, "channel", "send")) {
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
     * @param {string} theme
     */
    sendThemeChanged: createSafeSendHandler(CONSTANTS.EVENTS.THEME_CHANGED, "sendThemeChanged"),

    /**
     * Sets the full screen mode.
     * @param {boolean} flag - Whether to enable fullscreen
     */
    setFullScreen: createSafeSendHandler(CONSTANTS.EVENTS.SET_FULLSCREEN, "setFullScreen"),

    // Gyazo OAuth Server Functions
    /**
     * Starts a temporary local server for Gyazo OAuth callback handling.
     * @param {number} port - The port to start the server on (default: 3000)
     * @returns {Promise<{success: boolean, port: number, message?: string}>}
     */
    startGyazoServer: createSafeInvokeHandler(CONSTANTS.CHANNELS.GYAZO_SERVER_START, "startGyazoServer"),

    /**
     * Stops the temporary Gyazo OAuth callback server.
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    stopGyazoServer: createSafeInvokeHandler(CONSTANTS.CHANNELS.GYAZO_SERVER_STOP, "stopGyazoServer"),

    // Main Process State Management Functions
    /**
     * Gets a value from the main process state.
     * @param {string} [path] - Optional path to a specific state property (e.g., 'loadedFitFilePath')
     * @returns {Promise<any>} The requested state value or entire state if no path provided
     */
    getMainState: async (path) => {
        try {
            return await ipcRenderer.invoke("main-state:get", path);
        } catch (error) {
            console.error(`[preload.js] Error in getMainState(${path || "all"}):`, error);
            throw error;
        }
    },

    /**
     * Sets a value in the main process state (restricted to allowed paths).
     * @param {string} path - Path to the state property to set (e.g., 'loadedFitFilePath')
     * @param {any} value - The value to set
     * @param {Object} [options] - Optional metadata for the state change
     * @returns {Promise<boolean>} True if successful, false if path is restricted
     */
    setMainState: async (path, value, options = {}) => {
        if (!validateString(path, "path", "setMainState")) {
            return false;
        }

        try {
            return await ipcRenderer.invoke("main-state:set", path, value, options);
        } catch (error) {
            console.error(`[preload.js] Error in setMainState(${path}):`, error);
            throw error;
        }
    },

    /**
     * Listens for changes to a specific path in the main process state.
     * @param {string} path - Path to listen to (e.g., 'loadedFitFilePath')
     * @param {Function} callback - Callback function to handle state changes
     * @returns {Promise<boolean>} True if listener was registered successfully
     */
    listenToMainState: async (path, callback) => {
        if (!validateString(path, "path", "listenToMainState")) {
            return false;
        }
        if (!validateCallback(callback, "listenToMainState")) {
            return false;
        }

        try {
            // Set up listener for state change events
            ipcRenderer.on("main-state-change", (_event, change) => {
                try {
                    if (change && change.path === path) {
                        callback(change);
                    }
                } catch (error) {
                    console.error(`[preload.js] Error in listenToMainState callback for ${path}:`, error);
                }
            });

            // Register the listener with the main process
            return await ipcRenderer.invoke("main-state:listen", path);
        } catch (error) {
            console.error(`[preload.js] Error in listenToMainState(${path}):`, error);
            throw error;
        }
    },

    /**
     * Gets the status of a specific operation from the main process.
     * @param {string} operationId - The unique identifier for the operation
     * @returns {Promise<any>} The operation status object
     */
    getOperation: async (operationId) => {
        if (!validateString(operationId, "operationId", "getOperation")) {
            return null;
        }

        try {
            return await ipcRenderer.invoke("main-state:operation", operationId);
        } catch (error) {
            console.error(`[preload.js] Error in getOperation(${operationId}):`, error);
            throw error;
        }
    },

    /**
     * Gets all operations from the main process.
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
     * @param {number} [limit=50] - Maximum number of errors to retrieve
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
     * @returns {boolean} True if API is functional
     */
    validateAPI: () => {
        try {
            // Test basic functionality
            const hasConstants = CONSTANTS !== undefined,
                hasContextBridge = contextBridge !== undefined,
                hasIpcRenderer = ipcRenderer !== undefined;

            if (process.env.NODE_ENV === "development") {
                console.log("[preload.js] API Validation:", {
                    channelCount: Object.keys(CONSTANTS.CHANNELS).length,
                    eventCount: Object.keys(CONSTANTS.EVENTS).length,
                    hasConstants,
                    hasContextBridge,
                    hasIpcRenderer,
                });
            }

            return hasIpcRenderer && hasContextBridge && hasConstants;
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
            console.log("[preload.js] Successfully exposed electronAPI to main world");
            const apiKeys = Object.keys(electronAPI),
                /** @type {string[]} */
                methods = apiKeys.filter((key) => typeof (/** @type {any} */ (electronAPI)[key]) === "function"),
                /** @type {string[]} */
                properties = apiKeys.filter((key) => typeof (/** @type {any} */ (electronAPI)[key]) !== "function");
            console.log("[preload.js] API Structure:", {
                methods,
                properties,
                total: apiKeys.length,
            });
        }
    } else {
        console.error("[preload.js] API validation failed - not exposing to main world");
    }
} catch (error) {
    console.error("[preload.js] Failed to expose electronAPI:", error);
}

// Development helpers - only available in development mode
if (process.env.NODE_ENV === "development") {
    try {
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
                    console.log("[preload.js] IPC test successful, app version:", version);
                    return true;
                } catch (error) {
                    console.error("[preload.js] IPC test failed:", error);
                    return false;
                }
            },
        });

        if (process.env.NODE_ENV === "development") {
            console.log("[preload.js] Development tools exposed");
        }
    } catch (error) {
        console.error("[preload.js] Failed to expose development tools:", error);
    }
}

// Cleanup and final validation
/**
 * Ensure the process beforeExit handler is only registered once even if this module
 * is executed multiple times during tests.
 */
const BEFORE_EXIT_REGISTRY_KEY = "__ffv_preload_beforeExitRegistry__",
    BEFORE_EXIT_LISTENER_SYMBOL = Symbol.for("ffv.preload.beforeExitListener");

/**
 * Retrieve (or initialize) the global registry that tracks beforeExit listener wrappers per process.
 * @returns {WeakMap<NodeJS.Process, Function>|null}
 */
function getProcessRegistry() {
    if (typeof globalThis === "undefined") {
        return null;
    }
    const scope = /** @type {any} */ (globalThis);
    if (!scope[BEFORE_EXIT_REGISTRY_KEY]) {
        try {
            scope[BEFORE_EXIT_REGISTRY_KEY] = new WeakMap();
        } catch (error) {
            console.warn("[preload.js] Unable to initialize beforeExit registry:", error);
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
                console.warn("[preload.js] Unable to remove beforeExit listener during cleanup:", error);
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
                    console.warn("[preload.js] Unable to remove stale beforeExit listener:", error);
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
            console.warn("[preload.js] Unable to prune stale beforeExit listeners:", error);
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
                        if (listener === handleBeforeExit || listener.listener === handleBeforeExit) {
                            storedWrapper = listener;
                            break;
                        }
                    }
                }
            } catch (error) {
                console.warn("[preload.js] Unable to capture beforeExit listener wrapper:", error);
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
