const // Constants for better maintainability
    CONSTANTS = {
        DEFAULTS: {
            WINDOW: {
                height: 800,
                minHeight: 600,
                minWidth: 800,
                width: 1200,
            },
        },
        FILES: {
            WINDOW_STATE: "window-state.json",
        },
        PATHS: {
            HTML: {
                INDEX: "index.html",
            },
            ICONS: {
                FAVICON: "icons/favicon.ico",
            },
            PRELOAD: "preload.js",
        },
        WEB_PREFERENCES: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    },
    { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
/* eslint-env node */
/**
 * Window state shape
 * @typedef {Object} WindowState
 * @property {number} width
 * @property {number} height
 * @property {number} [x]
 * @property {number} [y]
 */
/**
 * @typedef {Object} DevHelpers
 * @property {() => {constants: typeof CONSTANTS, settingsPath: string, currentState: WindowState}} getConfig
 * @property {() => boolean} resetState
 * @property {() => { isValid: boolean, state?: WindowState, path: string, exists: boolean, error?: string }} validateSettings
 */
const path = require("node:path");

// Enhanced path resolution with error handling
/**
 * Resolve the path to the window state settings file.
 * @returns {string}
 */
function getSettingsPath() {
    try {
        const userDataPath = app.getPath("userData");
        return path.join(userDataPath, CONSTANTS.FILES.WINDOW_STATE);
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error("[windowStateUtils] Error getting settings path:", errMsg);
        // Fallback to current directory in case of error
        return path.join(process.cwd(), CONSTANTS.FILES.WINDOW_STATE);
    }
}

const settingsPath = getSettingsPath();

/**
 * Creates a new BrowserWindow with enhanced configuration and error handling
 * @returns {BrowserWindow} The created BrowserWindow instance
 */
/**
 * @returns {BrowserWindow}
 */
function createWindow() {
    try {
        const state = getWindowState(),
            // Enhanced window configuration
            /** @type {import('electron').BrowserWindowConstructorOptions} */
            windowConfig = {
                height: state.height,
                minHeight: CONSTANTS.DEFAULTS.WINDOW.minHeight,
                minWidth: CONSTANTS.DEFAULTS.WINDOW.minWidth,
                width: state.width,
                // Only assign if defined to satisfy exactOptionalPropertyTypes
                ...(typeof state.x === "number" ? { x: state.x } : {}),
                ...(typeof state.y === "number" ? { y: state.y } : {}),
                autoHideMenuBar: false,
                icon: path.join(__dirname, CONSTANTS.PATHS.ICONS.FAVICON),
                show: false,
                webPreferences: {
                    preload: path.join(__dirname, CONSTANTS.PATHS.PRELOAD),
                    ...CONSTANTS.WEB_PREFERENCES,
                    // Enable remote debugging for development
                    webSecurity: process.env.NODE_ENV !== "production",
                },
            };

        logWithContext("info", "Creating window with configuration", { config: windowConfig });

        const win = new BrowserWindow(windowConfig);

        // Enhanced window setup
        win.setMenuBarVisibility(true);

        // Enhanced event handlers
        win.on("close", () => {
            try {
                saveWindowState(win);
            } catch (error) {
                logWithContext("error", "Error in window close handler:", { error: safeErrorMessage(error) });
            }
        });

        win.on("closed", () => {
            logWithContext("info", "Window closed successfully");
        });

        // Show window when ready
        win.once("ready-to-show", () => {
            win.show();
            logWithContext("info", "Window displayed successfully");
        });

        // Load the main HTML file
        win.loadFile(CONSTANTS.PATHS.HTML.INDEX)
            .then(() => {
                logWithContext("info", "Main HTML file loaded successfully");
            })
            .catch((error) => {
                logWithContext("error", "Error loading main HTML file:", { error: safeErrorMessage(error) });
            });

        return win;
    } catch (error) {
        logWithContext("error", "Error creating window:", { error: safeErrorMessage(error) });
        throw error;
    }
}

/**
 * Retrieves the saved window state from disk with enhanced error handling
 * @returns {Object} Window state object with width, height, and optional x, y coordinates
 */
/**
 * @returns {WindowState}
 */
function getWindowState() {
    try {
        if (!fs.existsSync(settingsPath)) {
            logWithContext("info", "Window state file does not exist, using defaults");
            return { ...CONSTANTS.DEFAULTS.WINDOW };
        }

        const data = fs.readFileSync(settingsPath, "utf8");
        if (!data.trim()) {
            logWithContext("warn", "Window state file is empty, using defaults");
            return { ...CONSTANTS.DEFAULTS.WINDOW };
        }

        const state = JSON.parse(data),
            sanitizedState = sanitizeWindowState(state);

        logWithContext("info", "Window state loaded successfully", { state: sanitizedState });
        return sanitizedState;
    } catch (error) {
        logWithContext("error", "Error reading window state, using defaults:", {
            error: safeErrorMessage(error),
            path: settingsPath,
        });
        return { ...CONSTANTS.DEFAULTS.WINDOW };
    }
}

/**
 * Contextual logger with leveled output.
 * @param {"log"|"info"|"warn"|"error"} level
 * @param {string} message
 * @param {Record<string, any>} [context]
 */
function logWithContext(level, message, context = {}) {
    const timestamp = new Date().toISOString(),
        logMessage = `[${timestamp}] [windowStateUtils] ${message}`;

    if (context && Object.keys(context).length > 0) {
        // @ts-ignore - dynamic console indexing with validated level string
        console[level](logMessage, context);
    } else {
        // @ts-ignore
        console[level](logMessage);
    }
}

// Enhanced error handling and logging
/**
 * Safe error message extraction.
 * @param {unknown} error
 * @returns {string}
 */
function safeErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Sanitize and normalize persisted window state.
 * @param {Partial<WindowState>} state
 * @returns {WindowState}
 */
function sanitizeWindowState(state) {
    if (!validateWindowState(state)) {
        return { ...CONSTANTS.DEFAULTS.WINDOW };
    }
    const s = /** @type {WindowState} */ (state),
        sanitized = {
            height: Math.max(s.height, CONSTANTS.DEFAULTS.WINDOW.minHeight),
            width: Math.max(s.width, CONSTANTS.DEFAULTS.WINDOW.minWidth),
        };
    if (typeof s.x === "number") {
        // @ts-ignore - augmenting
        sanitized.x = s.x;
    }
    if (typeof s.y === "number") {
        // @ts-ignore
        sanitized.y = s.y;
    }
    return /** @type {WindowState} */ (sanitized);
}

/**
 * Saves the current window state to disk with enhanced validation and error handling
 * @param {BrowserWindow} win - The Electron BrowserWindow instance
 */
/**
 * @param {BrowserWindow} win
 * @returns {void}
 */
function saveWindowState(win) {
    if (!validateWindow(win)) {
        logWithContext("error", "Invalid window object provided to saveWindowState");
        return;
    }

    try {
        // Don't save state if window is minimized or maximized
        if (win.isMinimized() || win.isMaximized()) {
            logWithContext("info", "Skipping window state save - window is minimized or maximized");
            return;
        }

        const bounds = win.getBounds(),
            // Ensure directory exists
            dir = path.dirname(settingsPath),
            state = sanitizeWindowState(bounds);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(settingsPath, JSON.stringify(state, null, 2));
        logWithContext("info", "Window state saved successfully", { state });
    } catch (error) {
        logWithContext("error", "Error saving window state:", {
            error: safeErrorMessage(error),
            path: settingsPath,
        });
    }
}

/**
 * @param {unknown} win
 * @returns {win is BrowserWindow}
 */
function validateWindow(win) {
    return (
        Boolean(win) &&
        typeof win === "object" &&
        typeof (/** @type {any} */ (win).isDestroyed) === "function" &&
        !(/** @type {any} */ (win).isDestroyed())
    );
}

// Enhanced validation functions
/**
 * Type guard validating a window state object.
 * @param {unknown} state
 * @returns {state is WindowState}
 */
function validateWindowState(state) {
    if (!state || typeof state !== "object") {
        return false;
    }
    const obj = /** @type {Record<string, unknown>} */ (state),
        { height } = obj,
        { width } = obj,
        { x } = obj,
        { y } = obj;
    if (typeof width !== "number" || width <= 0) {
        return false;
    }
    if (typeof height !== "number" || height <= 0) {
        return false;
    }
    if ("x" in obj && x !== undefined && typeof x !== "number") {
        return false;
    }
    if ("y" in obj && y !== undefined && typeof y !== "number") {
        return false;
    }
    return true;
}

/**
 * Development and debugging helpers
 */
const devHelpers = {
    /**
     * Get current window state configuration
     */
    getConfig: () => ({
        constants: CONSTANTS,
        currentState: getWindowState(),
        settingsPath,
    }),

    /**
     * Reset window state to defaults
     */
    resetState: () => {
        try {
            if (fs.existsSync(settingsPath)) {
                fs.unlinkSync(settingsPath);
                logWithContext("info", "Window state reset to defaults");
                return true;
            }
            return false;
        } catch (error) {
            logWithContext("error", "Error resetting window state:", { error: safeErrorMessage(error) });
            return false;
        }
    },

    /**
     * Validate current settings file
     */
    validateSettings: () => {
        try {
            const state = getWindowState();
            return {
                exists: fs.existsSync(settingsPath),
                isValid: validateWindowState(state),
                path: settingsPath,
                state,
            };
        } catch (error) {
            return {
                error: safeErrorMessage(error),
                exists: false,
                isValid: false,
                path: settingsPath,
            };
        }
    },
};

// Module exports with enhanced structure
module.exports = {
    CONSTANTS,
    createWindow,
    // Core functions
    getWindowState,

    sanitizeWindowState,
    saveWindowState,
    // Constants and configuration
    settingsPath,

    // Utility functions
    validateWindow,
    validateWindowState,

    // Development helpers (only in development)
    ...(process.env.NODE_ENV === "development" && { devHelpers }),

    // Version information
    version: "1.0.0",
};

// Log successful initialization
logWithContext("info", "WindowStateUtils module initialized successfully");
