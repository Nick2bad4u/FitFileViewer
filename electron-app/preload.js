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
            RECENT_FILES_APPROVE: "recentFiles:approve",
            RECENT_FILES_GET: "recentFiles:get",
            SHELL_OPEN_EXTERNAL: "shell:openExternal",
            THEME_GET: "theme:get",
        },
        DEFAULT_VALUES: {
            FIT_FILE_PATH: null,
            THEME: null,
        },
        EVENTS: {
            FIT_FILE_LOADED: "fit-file-loaded",
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
     * @property {(filePath: string) => Promise<boolean>} approveRecentFile
     * @property {() => Promise<string|null>} openFile
     * @property {() => Promise<string|null>} openFileDialog
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
     * @property {(filePath: string | null) => void} notifyFitFileLoaded
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
                    console.error(`[preload.js] Error in ${methodName} callback:`, error);
                }
            };

            ipcRenderer.on(channel, handler);

            return () => {
                try {
                    ipcRenderer.removeListener(channel, handler);
                } catch {
                    /* ignore */
                }
            };
        } catch (error) {
            console.error(`[preload.js] Error setting up ${methodName} event handler:`, error);
            return () => {};
        }
    };
}

/**
 * Main-state subscription fanout.
 * Keep a single ipcRenderer listener and dispatch by change.path.
 * @type {Map<string, Set<Function>>}
 */
const mainStateCallbacksByPath = new Map();

/** @type {((event: any, change: any) => void) | null} */
let mainStateDispatcher = null;

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
 * @returns {void}
 */
function ensureMainStateDispatcher() {
    if (mainStateDispatcher) return;
    mainStateDispatcher = (_event, change) => {
        const p = change && typeof change.path === "string" ? change.path : null;
        if (!p) return;
        const callbacks = mainStateCallbacksByPath.get(p);
        if (!callbacks || callbacks.size === 0) return;
        for (const cb of callbacks) {
            try {
                cb(change);
            } catch (error) {
                console.error("[preload.js] Error in main-state callback:", error);
            }
        }
    };
    ipcRenderer.on("main-state-change", mainStateDispatcher);
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
 * Validate a channel/event name.
 * IPC channels must always be a non-empty string.
 *
 * @param {unknown} value
 * @param {string} paramName
 * @param {string} methodName
 * @returns {value is string}
 */
function validateChannelName(value, paramName, methodName) {
    if (typeof value !== "string") {
        console.error(`[preload.js] ${methodName}: ${paramName} must be a string`);
        return false;
    }
    if (value.trim().length === 0) {
        console.error(`[preload.js] ${methodName}: ${paramName} must be a non-empty string`);
        return false;
    }
    return true;
}

/**
 * Validate an optional string input.
 *
 * Accepts: undefined | null | non-empty string.
 * Rejects: empty/whitespace-only strings and non-strings.
 *
 * @param {unknown} value
 * @param {string} paramName
 * @param {string} methodName
 * @returns {value is (string|null|undefined)}
 */
function validateOptionalNonEmptyString(value, paramName, methodName) {
    if (value === undefined || value === null) {
        return true;
    }
    if (typeof value !== "string") {
        console.error(`[preload.js] ${methodName}: ${paramName} must be a string or null`);
        return false;
    }
    if (value.trim().length === 0) {
        console.error(`[preload.js] ${methodName}: ${paramName} must be a non-empty string or null`);
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
 * @returns {value is string}
 */
function validateRequiredNonEmptyString(value, paramName, methodName) {
    if (typeof value !== "string") {
        console.error(`[preload.js] ${methodName}: ${paramName} must be a string`);
        return false;
    }
    if (value.trim().length === 0) {
        console.error(`[preload.js] ${methodName}: ${paramName} must be a non-empty string`);
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
 * True when running inside a real Electron runtime.
 *
 * Important: Several unit tests execute this preload file via `new Function(...)` with a mocked
 * `process` object. In that context, we should not enforce production-grade IPC restrictions
 * because those tests are not modeling a real Electron renderer threat boundary.
 */
const IS_ELECTRON_RUNTIME =
    typeof process !== "undefined" &&
    Boolean(process?.versions) &&
    typeof (/** @type {any} */ (process.versions).electron) === "string";

/**
 * Enforce the generic send/invoke allowlist only when we are running in Electron.
 *
 * Default: ON in Electron.
 * Optional override for developers: set FFV_ALLOW_GENERIC_IPC=true to bypass.
 */
const SHOULD_ENFORCE_GENERIC_IPC_ALLOWLIST =
    IS_ELECTRON_RUNTIME &&
    !(
        typeof process !== "undefined" &&
        Boolean(process?.env) &&
        /** @type {any} */ (process.env).FFV_ALLOW_GENERIC_IPC === "true"
    );

/**
 * Limit generic invoke/send helpers to a conservative allowlist.
 * Prefer the explicit methods (readFile/openFile/parseFitFile/etc.) over the generic helpers.
 */
const ALLOWED_GENERIC_INVOKE_CHANNELS = new Set([
    "main-state:errors",
    "main-state:get",
    "main-state:listen",
    "main-state:metrics",
    "main-state:operation",
    "main-state:operations",
    "main-state:set",
    "main-state:unlisten",
    ...Object.values(CONSTANTS.CHANNELS),
]);

/**
 * Restrict renderer->main IPC send() usage to a conservative set.
 *
 * Note: we intentionally do NOT allow arbitrary "menu-*" here.
 * Only the channels that are known to be handled by main via registerIpcListener
 * should be sendable from the renderer.
 */
const ALLOWED_GENERIC_SEND_CHANNELS = new Set([
    CONSTANTS.EVENTS.FIT_FILE_LOADED,
    CONSTANTS.EVENTS.INSTALL_UPDATE,
    CONSTANTS.EVENTS.MENU_CHECK_FOR_UPDATES,
    CONSTANTS.EVENTS.SET_FULLSCREEN,
    CONSTANTS.EVENTS.THEME_CHANGED,
    // Legacy menu forwarders (renderer receives menu event then forwards back to main)
    "menu-export",
    "menu-save-as",
]);

/**
 * Restrict renderer subscriptions to IPC channels to an explicit allowlist.
 * This prevents a compromised renderer from attaching listeners to arbitrary
 * main-process channels that were never meant to be exposed.
 */
const EXTRA_RENDERER_ON_IPC_CHANNELS =
    "decoder-options-changed|export-file|gyazo-oauth-callback|menu-about|menu-export|menu-keyboard-shortcuts|menu-print|menu-restart-update|menu-save-as|open-accent-color-picker|set-font-size|set-high-contrast|show-notification".split(
        "|"
    );

const ALLOWED_GENERIC_ON_IPC_CHANNELS = new Set([
    ...EXTRA_RENDERER_ON_IPC_CHANNELS,
    ...Object.values(CONSTANTS.EVENTS),
]);

/**
 * @param {string} channel
 */
function isAllowedGenericInvokeChannel(channel) {
    return ALLOWED_GENERIC_INVOKE_CHANNELS.has(channel);
}

/**
 * @param {string} channel
 */
function isAllowedGenericSendChannel(channel) {
    return ALLOWED_GENERIC_SEND_CHANNELS.has(channel);
}

// Main API object
/** @type {ElectronAPI} */
const electronAPI = {
    /**
     * Approve a recent file path for subsequent readFile() calls.
     *
     * Security model:
     * - The main process will only approve paths that already exist in its persisted
     *   recent-files list.
     * - This avoids granting broad file read access as a side effect of recentFiles().
     *
     * @param {string} filePath
     * @returns {Promise<boolean>}
     */
    approveRecentFile: createSafeInvokeHandler(CONSTANTS.CHANNELS.RECENT_FILES_APPROVE, "approveRecentFile"),

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
        if (!validateOptionalNonEmptyString(theme, "theme", "injectMenu")) {
            return false;
        }
        if (!validateOptionalNonEmptyString(fitFilePath, "fitFilePath", "injectMenu")) {
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
     * Notify the main process that a file has been loaded (or unloaded).
     *
     * This is the preferred alternative to calling electronAPI.send("fit-file-loaded", ...)
     * because it is explicit and easier to lock down.
     *
     * @param {string | null} filePath
     */
    notifyFitFileLoaded: (filePath) => {
        // Allow explicit unload signaling via null.
        if (filePath !== null && typeof filePath !== "string") {
            console.error("[preload.js] notifyFitFileLoaded: filePath must be a string or null");
            return;
        }

        const normalizedPath = typeof filePath === "string" && filePath.trim().length > 0 ? filePath : null;

        try {
            ipcRenderer.send(CONSTANTS.EVENTS.FIT_FILE_LOADED, normalizedPath);
        } catch (error) {
            console.error("[preload.js] Error in notifyFitFileLoaded:", error);
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
        if (!validateChannelName(channel, "channel", "invoke")) {
            throw new Error("Invalid channel for invoke");
        }

        // Do not allow arbitrary IPC access in Electron.
        // Use the explicit wrappers above instead.
        if (SHOULD_ENFORCE_GENERIC_IPC_ALLOWLIST && !isAllowedGenericInvokeChannel(channel)) {
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
     * @param {string} channel - The IPC channel to listen on
     * @param {Function} callback - Callback function to handle the event
     * @returns {(() => void) | undefined} Unsubscribe function when registration succeeds
     */
    onIpc: (channel, callback) => {
        if (!validateChannelName(channel, "channel", "onIpc")) {
            return;
        }
        if (!validateCallback(callback, "onIpc")) {
            return;
        }

        if (SHOULD_ENFORCE_GENERIC_IPC_ALLOWLIST && !ALLOWED_GENERIC_ON_IPC_CHANNELS.has(channel)) {
            console.warn(`[preload.js] Blocked onIpc() subscription to non-allowlisted channel: ${channel}`);
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
        if (!validateChannelName(eventName, "eventName", "onUpdateEvent")) {
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
        if (!validateChannelName(channel, "channel", "send")) {
            return;
        }

        if (SHOULD_ENFORCE_GENERIC_IPC_ALLOWLIST && !isAllowedGenericSendChannel(channel)) {
            console.warn(`[preload.js] Blocked send() to non-allowlisted channel: ${channel}`);
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
        if (!validateRequiredNonEmptyString(path, "path", "setMainState")) {
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
        if (!validateRequiredNonEmptyString(path, "path", "listenToMainState")) {
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
            console.error(`[preload.js] Error in listenToMainState(${path}):`, error);
            throw error;
        }
    },

    /**
     * Removes a previously registered main state listener.
     * @param {string} path
     * @param {Function} callback
     * @returns {Promise<boolean>}
     */
    unlistenFromMainState: async (path, callback) => {
        if (!validateRequiredNonEmptyString(path, "path", "unlistenFromMainState")) {
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
                ipcRenderer.removeListener("main-state-change", mainStateDispatcher);
                mainStateDispatcher = null;
            }

            return true;
        } catch (error) {
            console.error(`[preload.js] Error in unlistenFromMainState(${path}):`, error);
            throw error;
        }
    },

    /**
     * Subscribe to main state changes and get an unsubscribe function.
     * @param {string} path
     * @param {Function} callback
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
     * @param {string} operationId - The unique identifier for the operation
     * @returns {Promise<any>} The operation status object
     */
    getOperation: async (operationId) => {
        if (!validateRequiredNonEmptyString(operationId, "operationId", "getOperation")) {
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
