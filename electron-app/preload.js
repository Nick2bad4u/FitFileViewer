/* eslint-env node */
/**
 * Preload script exposes a typed, secure IPC API to the renderer via contextBridge.
 * Incremental typing is applied using JSDoc so strict TypeScript checking over allowJs passes.
 */
const { contextBridge, ipcRenderer } = require("electron"),
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

    // Constants for better maintainability
    CONSTANTS = {
        CHANNELS: {
            DIALOG_OPEN_FILE: "dialog:openFile",
            FILE_READ: "file:read",
            FIT_PARSE: "fit:parse",
            FIT_DECODE: "fit:decode",
            RECENT_FILES_GET: "recentFiles:get",
            RECENT_FILES_ADD: "recentFiles:add",
            THEME_GET: "theme:get",
            APP_VERSION: "getAppVersion",
            ELECTRON_VERSION: "getElectronVersion",
            NODE_VERSION: "getNodeVersion",
            CHROME_VERSION: "getChromeVersion",
            LICENSE_INFO: "getLicenseInfo",
            PLATFORM_INFO: "getPlatformInfo",
            DEVTOOLS_INJECT_MENU: "devtools-inject-menu",
            SHELL_OPEN_EXTERNAL: "shell:openExternal",
            // Gyazo OAuth server channels
            GYAZO_SERVER_START: "gyazo:server:start",
            GYAZO_SERVER_STOP: "gyazo:server:stop",
        },
        EVENTS: {
            MENU_OPEN_FILE: "menu-open-file",
            OPEN_RECENT_FILE: "open-recent-file",
            SET_THEME: "set-theme",
            THEME_CHANGED: "theme-changed",
            OPEN_SUMMARY_COLUMN_SELECTOR: "open-summary-column-selector",
            MENU_CHECK_FOR_UPDATES: "menu-check-for-updates",
            INSTALL_UPDATE: "install-update",
            SET_FULLSCREEN: "set-fullscreen",
        },
        DEFAULT_VALUES: {
            THEME: null,
            FIT_FILE_PATH: null,
        },
    };

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

// Main API object
/** @type {ElectronAPI} */
const electronAPI = {
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
     * Reads a file from the given file path and returns its contents as an ArrayBuffer.
     * @param {string} filePath
     * @returns {Promise<ArrayBuffer>}
     */
    readFile: createSafeInvokeHandler(CONSTANTS.CHANNELS.FILE_READ, "readFile"),

    // FIT File Operations
    /**
     * Parses a FIT file from an ArrayBuffer and returns the decoded data.
     * @param {ArrayBuffer} arrayBuffer
     * @returns {Promise<any>}
     */
    parseFitFile: createSafeInvokeHandler(CONSTANTS.CHANNELS.FIT_PARSE, "parseFitFile"),

    /**
     * Decodes a FIT file from an ArrayBuffer and returns the parsed data.
     * @param {ArrayBuffer} arrayBuffer
     * @returns {Promise<any>}
     */
    decodeFitFile: createSafeInvokeHandler(CONSTANTS.CHANNELS.FIT_DECODE, "decodeFitFile"),

    // Recent Files Management
    /**
     * Gets the list of recent files.
     * @returns {Promise<string[]>}
     */
    recentFiles: createSafeInvokeHandler(CONSTANTS.CHANNELS.RECENT_FILES_GET, "recentFiles"),

    /**
     * Adds a file to the recent files list.
     * @param {string} filePath
     * @returns {Promise<string[]>}
     */
    addRecentFile: createSafeInvokeHandler(CONSTANTS.CHANNELS.RECENT_FILES_ADD, "addRecentFile"),

    // Theme Management
    /**
     * Gets the current theme from the main process.
     * @returns {Promise<string>}
     */
    getTheme: createSafeInvokeHandler(CONSTANTS.CHANNELS.THEME_GET, "getTheme"),

    /**
     * Sends a 'theme-changed' event to the main process.
     * @param {string} theme
     */
    sendThemeChanged: createSafeSendHandler(CONSTANTS.EVENTS.THEME_CHANGED, "sendThemeChanged"),
    // Application Information
    /**
     * Gets the app version from the main process.
     * @returns {Promise<string>}
     */
    getAppVersion: createSafeInvokeHandler(CONSTANTS.CHANNELS.APP_VERSION, "getAppVersion"),

    /**
     * Gets the Electron version.
     * @returns {Promise<string>}
     */
    getElectronVersion: createSafeInvokeHandler(CONSTANTS.CHANNELS.ELECTRON_VERSION, "getElectronVersion"),

    /**
     * Gets the Node.js version.
     * @returns {Promise<string>}
     */
    getNodeVersion: createSafeInvokeHandler(CONSTANTS.CHANNELS.NODE_VERSION, "getNodeVersion"),

    /**
     * Gets the Chrome version.
     * @returns {Promise<string>}
     */
    getChromeVersion: createSafeInvokeHandler(CONSTANTS.CHANNELS.CHROME_VERSION, "getChromeVersion"),

    /**
     * Gets the license info from the main process.
     * @returns {Promise<string>}
     */
    getLicenseInfo: createSafeInvokeHandler(CONSTANTS.CHANNELS.LICENSE_INFO, "getLicenseInfo") /**
     * Gets the platform and architecture.
     * @returns {Promise<{platform: string, arch: string}>}
     */,
    getPlatformInfo: createSafeInvokeHandler(CONSTANTS.CHANNELS.PLATFORM_INFO, "getPlatformInfo"),

    /**
     * Opens a URL in the user's default external browser.
     * @param {string} url - The URL to open (must be HTTP or HTTPS)
     * @returns {Promise<boolean>}
     */
    openExternal: createSafeInvokeHandler(CONSTANTS.CHANNELS.SHELL_OPEN_EXTERNAL, "openExternal"),

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

    // Event Handlers with enhanced error handling
    /**
     * Registers a handler for the 'menu-open-file' event.
     * @param {Function} callback
     */
    onMenuOpenFile: createSafeEventHandler(CONSTANTS.EVENTS.MENU_OPEN_FILE, "onMenuOpenFile"),

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
     * Registers a handler for the 'set-theme' event.
     * @param {Function} callback
     */
    onSetTheme: createSafeEventHandler(
        CONSTANTS.EVENTS.SET_THEME,
        "onSetTheme",
        (theme) => theme // Transform to extract just the theme
    ),

    /**
     * Registers a handler for the 'open-summary-column-selector' event.
     * @param {Function} callback
     */
    onOpenSummaryColumnSelector: createSafeEventHandler(
        CONSTANTS.EVENTS.OPEN_SUMMARY_COLUMN_SELECTOR,
        "onOpenSummaryColumnSelector"
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
     * Trigger a check for updates (menu or manual).
     */
    checkForUpdates: createSafeSendHandler(CONSTANTS.EVENTS.MENU_CHECK_FOR_UPDATES, "checkForUpdates"),

    /**
     * Trigger install of a downloaded update.
     */
    installUpdate: createSafeSendHandler(CONSTANTS.EVENTS.INSTALL_UPDATE, "installUpdate"),

    /**
     * Sets the full screen mode.
     * @param {boolean} flag - Whether to enable fullscreen
     */
    setFullScreen: createSafeSendHandler(CONSTANTS.EVENTS.SET_FULLSCREEN, "setFullScreen"),

    // Generic IPC Functions with enhanced validation
    /**
     * Registers a generic handler for any IPC event (for internal use).
     * @param {string} channel - The IPC channel to listen on
     * @param {Function} callback - Callback function to handle the event
     */
    onIpc: (channel, callback) => {
        if (!validateString(channel, "channel", "onIpc")) {
            return;
        }
        if (!validateCallback(callback, "onIpc")) {
            return;
        }

        try {
            ipcRenderer.on(channel, (event, ...args) => {
                try {
                    callback(event, ...args);
                } catch (error) {
                    console.error(`[preload.js] Error in onIpc(${channel}) callback:`, error);
                }
            });
        } catch (error) {
            console.error(`[preload.js] Error setting up onIpc(${channel}):`, error);
        }
    },

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
     * Validate the preload API is working correctly.
     * @returns {boolean} True if API is functional
     */
    validateAPI: () => {
        try {
            // Test basic functionality
            const hasIpcRenderer = typeof ipcRenderer !== "undefined",
                hasContextBridge = typeof contextBridge !== "undefined",
                hasConstants = typeof CONSTANTS !== "undefined";

            console.log("[preload.js] API Validation:", {
                hasIpcRenderer,
                hasContextBridge,
                hasConstants,
                channelCount: Object.keys(CONSTANTS.CHANNELS).length,
                eventCount: Object.keys(CONSTANTS.EVENTS).length,
            });

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
        console.log("[preload.js] Successfully exposed electronAPI to main world");

        // Log API structure in development
        if (process.env.NODE_ENV === "development") {
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
                version: "1.0.0",
                constants: CONSTANTS,
                apiMethods: Object.keys(electronAPI),
                timestamp: new Date().toISOString(),
            }),

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

            /**
             * Log current API state
             */
            logAPIState: () => {
                console.log("[preload.js] Current API State:", {
                    electronAPI: typeof electronAPI,
                    methodCount: Object.keys(electronAPI).length,
                    constants: CONSTANTS,
                    timestamp: new Date().toISOString(),
                });
            },
        });

        console.log("[preload.js] Development tools exposed");
    } catch (error) {
        console.error("[preload.js] Failed to expose development tools:", error);
    }
}

// Cleanup and final validation
process.once("beforeExit", () => {
    console.log("[preload.js] Process exiting, performing cleanup...");
});

// Report successful initialization
console.log("[preload.js] Preload script initialized successfully");
