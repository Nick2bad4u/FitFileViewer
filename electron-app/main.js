/* eslint-env node */
const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require("electron");
const { createWindow } = require("./windowStateUtils");
const path = require("path");
const fs = require("fs");
const http = require("http");
const url = require("url");
// Auto-updater required where used below
const { autoUpdater: _autoUpdater } = require("electron-updater");

const { loadRecentFiles, addRecentFile } = require("./utils/files/recent/recentFiles");
const { createAppMenu } = require("./utils/app/menu/createAppMenu");
const { mainProcessState } = require("./utils/state/integration/mainProcessStateManager"),

// Constants
 CONSTANTS = {
    DEFAULT_THEME: "dark",
    THEME_STORAGE_KEY: "ffv-theme",
    SETTINGS_CONFIG_NAME: "settings",
    LOG_LEVELS: {
        INFO: "info",
        WARN: "warn",
        ERROR: "error",
    },
    PLATFORMS: {
        DARWIN: "darwin",
        LINUX: "linux",
        WIN32: "win32",
    },
    DIALOG_FILTERS: {
        FIT_FILES: [{ name: "FIT Files", extensions: ["fit"] }],
        EXPORT_FILES: [
            { name: "CSV (Summary Table)", extensions: ["csv"] },
            { name: "GPX (Track)", extensions: ["gpx"] },
            { name: "All Files", extensions: ["*"] },
        ],
        ALL_FILES: [
            { name: "FIT Files", extensions: ["fit"] },
            { name: "All Files", extensions: ["*"] },
        ],
    },
    UPDATE_EVENTS: {
        CHECKING: "update-checking",
        AVAILABLE: "update-available",
        NOT_AVAILABLE: "update-not-available",
        ERROR: "update-error",
        DOWNLOAD_PROGRESS: "update-download-progress",
        DOWNLOADED: "update-downloaded",
    },
};

// State getters and setters using the new state management system
/**
 * @param {string} path
 */
function getAppState(path) {
    return mainProcessState.get(path);
}

/**
 * @param {string} path
 * @param {any} value
 */
function setAppState(path, value, options = {}) {
    return mainProcessState.set(path, value, options);
}

// Utility functions
/**
 * @param {any} win
 */
function isWindowUsable(win) {
    if (!win) return false;
    try {
        const hasWebContents = !!(win.webContents);
        const wcd = hasWebContents && typeof win.webContents.isDestroyed === 'function' ? win.webContents.isDestroyed() : true;
        const wd = typeof win.isDestroyed === 'function' ? win.isDestroyed() : true;
        return Boolean(!wd && hasWebContents && !wcd);
    } catch {
        return false;
    }
}

/**
 * @param {any} win
 */
function validateWindow(win, context = "unknown operation") {
    if (!isWindowUsable(win)) {
        // Only log warning if window should exist but doesn't (avoid noise during normal shutdown)
        if (!getAppState("appIsQuitting")) {
            logWithContext("warn", `Window validation failed during ${context}`, {
                hasWindow: Boolean(win),
                isDestroyed: win?.isDestroyed(),
                hasWebContents: Boolean(win?.webContents),
                webContentsDestroyed: win?.webContents?.isDestroyed(),
            });
        }
        return false;
    }
    return true;
}

/**
 * @param {any} win
 */
async function getThemeFromRenderer(win) {
    if (!validateWindow(win, "theme retrieval")) {return CONSTANTS.DEFAULT_THEME;}

    try {
        const theme = await win.webContents.executeJavaScript(`localStorage.getItem("${CONSTANTS.THEME_STORAGE_KEY}")`);
        return theme || CONSTANTS.DEFAULT_THEME;
    } catch (err) {
        console.error("[main.js] Failed to get theme from renderer:", err);
        return CONSTANTS.DEFAULT_THEME;
    }
}

/**
 * @param {any} win
 * @param {any} channel
 * @param {...any} args
 */
function sendToRenderer(win, channel, ...args) {
    if (validateWindow(win, `IPC send to ${channel}`)) {
        win.webContents.send(channel, ...args);
    }
}

/**
 * @param {any} level
 * @param {any} message
 */
function logWithContext(level, message, context = {}) {
    const timestamp = new Date().toISOString(),
     hasContext = context && typeof context === 'object' && Object.keys(context).length > 0;
    if (hasContext) {
        /** @type {any} */ (console)[level](`[${timestamp}] [main.js] ${message}`, JSON.stringify(context));
    } else {
        /** @type {any} */ (console)[level](`[${timestamp}] [main.js] ${message}`);
    }
}

// Enhanced error handling wrapper
/**
 * @param {Function} operation
 * @returns {Function}
 */
// @ts-expect-error - Function designed for future use, currently unused
function _createErrorHandler(operation) {
    return async (/** @type {any} */ ...args) => {
        try {
            return await operation(...args);
        } catch (error) {
            logWithContext("error", `Error in ${operation.name || "operation"}:`, {
                error: /** @type {Error} */ (error).message,
                stack: /** @type {Error} */ (error).stack,
            });
            throw error;
        }
    };
}

// Enhanced Auto-Updater Setup with better error handling
/**
 * @param {any} mainWindow
 */
function setupAutoUpdater(mainWindow) {
    // Alias back to name expected in existing code
    const autoUpdater = _autoUpdater;
    if (!isWindowUsable(mainWindow)) {
        // Emit a single plain warn string as expected by tests
        console.warn("Cannot setup auto-updater: main window is not usable");
        return;
    }

    // Set feed URL if needed (autoUpdater will use GitHub by default if configured in package.json)
    autoUpdater.autoDownload = true;

    // Enhanced logger initialization
    try {
        const log = require("electron-log");
        if (log) {
            autoUpdater.logger = log;
        } else {
            logWithContext("warn", "Logger initialization failed. Falling back to console logging.");
            autoUpdater.logger = console;
        }
    } catch (err) {
        logWithContext("error", "Error initializing logger:", { error: /** @type {Error} */ (err).message });
        autoUpdater.logger = console;
    }

    // Type cast logger to access transports property
    /** @type {any} */ (autoUpdater.logger).transports.file.level = CONSTANTS.LOG_LEVELS.INFO;

    // Enhanced logging for update feed URL - type cast autoUpdater to access feedURL
    if (/** @type {any} */ (autoUpdater).feedURL !== undefined && /** @type {any} */ (autoUpdater).feedURL !== null) {
        const feedInfo = { feedURL: /** @type {any} */ (autoUpdater).feedURL };
        autoUpdater.logger.info(`AutoUpdater feed URL: ${/** @type {any} */ (autoUpdater).feedURL}`);
        logWithContext("info", "AutoUpdater feed URL configured", feedInfo);
    } else {
        autoUpdater.logger.info("AutoUpdater using default feed (likely GitHub releases)");
        logWithContext("info", "AutoUpdater using default feed (likely GitHub releases)");
    }

    // Enhanced event handlers with better error handling
    const updateEventHandlers = {
        "checking-for-update": () => {
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.CHECKING);
        },
        "update-available": (/** @type {any} */ info) => {
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.AVAILABLE, info);
        },
        "update-not-available": (/** @type {any} */ info) => {
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.NOT_AVAILABLE, info);
        },
        error: (/** @type {any} */ err) => {
            const errorMessage = err == null ? "unknown" : err.message || err.toString();
            if (autoUpdater.logger) {
                autoUpdater.logger.error(`AutoUpdater Error: ${errorMessage}`);
            }
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.ERROR, errorMessage);
        },
        "download-progress": (/** @type {any} */ progressObj) => {
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.DOWNLOAD_PROGRESS, progressObj);
        },
        "update-downloaded": (/** @type {any} */ info) => {
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.DOWNLOADED, info);
            const menu = Menu.getApplicationMenu();
            if (menu) {
                const restartItem = menu.getMenuItemById("restart-update");
                if (restartItem && restartItem.enabled !== undefined) {
                    restartItem.enabled = true;
                }
            }
        },
    }; // Register all update event handlers
    Object.entries(updateEventHandlers).forEach(([event, handler]) => {
        /** @type {any} */ (autoUpdater).on(event, handler);
        mainProcessState.registerEventHandler(autoUpdater, event, handler, `autoUpdater:${event}`);
    });
}

// Enhanced application initialization
async function initializeApplication() {
    const mainWindow = createWindow();
    setAppState("mainWindow", mainWindow);

    // Set the custom menu immediately after window creation to avoid menu flash/disappearance
    logWithContext("info", "Calling createAppMenu after window creation");
    createAppMenu(mainWindow, CONSTANTS.DEFAULT_THEME, getAppState("loadedFitFilePath"));

    // Enhanced theme synchronization
    mainWindow.webContents.on("did-finish-load", async () => {
        logWithContext("info", "did-finish-load event fired, syncing theme");

        // Setup auto-updater after window is fully loaded to avoid "window not usable" warning
        if (!getAppState("autoUpdaterInitialized")) {
            try {
                setupAutoUpdater(mainWindow);
                await _autoUpdater.checkForUpdatesAndNotify();
                setAppState("autoUpdaterInitialized", true);
            } catch (error) {
                logWithContext("error", "Failed to setup auto-updater:", {
                    error: /** @type {Error} */ (error).message,
                });
            }
        }

        try {
            const theme = await getThemeFromRenderer(mainWindow);
            logWithContext("info", "Retrieved theme from renderer", { theme });
            createAppMenu(mainWindow, theme, getAppState("loadedFitFilePath"));
            sendToRenderer(mainWindow, "set-theme", theme);
        } catch (error) {
            logWithContext("warn", "Failed to get theme from renderer, using fallback", {
                error: /** @type {Error} */ (error).message,
            });
            createAppMenu(mainWindow, CONSTANTS.DEFAULT_THEME, getAppState("loadedFitFilePath"));
            sendToRenderer(mainWindow, "set-theme", CONSTANTS.DEFAULT_THEME);
        }
    });

    return mainWindow;
}
// Enhanced IPC handlers with better error handling and organization
/**
 * @param {any} mainWindow
 */
function setupIPCHandlers(mainWindow) {
    // File dialog handler
    ipcMain.handle("dialog:openFile", async (/** @type {any} */ _event) => {
        try {
            const { canceled, filePaths } = await dialog.showOpenDialog({
                filters: CONSTANTS.DIALOG_FILTERS.FIT_FILES,
                properties: ["openFile"],
            });
            if (canceled || filePaths.length === 0) {return null;}

            if (filePaths[0]) {
                addRecentFile(filePaths[0]);
                setAppState("loadedFitFilePath", filePaths[0]);

                // Fetch current theme from renderer before rebuilding menu
                const win = BrowserWindow.getFocusedWindow() || mainWindow;
                if (win) {
                    const theme = await getThemeFromRenderer(win);
                    createAppMenu(win, theme, getAppState("loadedFitFilePath"));
                }

                return filePaths[0];
            }
            return null;
        } catch (error) {
            logWithContext("error", "Error in dialog:openFile:", {
                error: /** @type {Error} */ (error).message,
                stack: /** @type {Error} */ (error).stack,
            });
            throw error;
        }
    });
    ipcMain.on("fit-file-loaded", async (event, filePath) => {
        setAppState("loadedFitFilePath", filePath);
        const win = BrowserWindow.fromWebContents(event.sender);
        if (validateWindow(win, "fit-file-loaded event")) {
            try {
                const theme = await getThemeFromRenderer(/** @type {any} */ (win));
                createAppMenu(/** @type {any} */ (win), theme, getAppState("loadedFitFilePath"));
            } catch (error) {
                logWithContext("error", "Failed to update menu after fit file loaded:", {
                    error: /** @type {Error} */ (error).message,
                });
            }
        }
    });

    // Recent files handlers
    ipcMain.handle("recentFiles:get", async (/** @type {any} */ _event) => {
        try {
            return loadRecentFiles();
        } catch (error) {
            logWithContext("error", "Error in recentFiles:get:", {
                error: /** @type {Error} */ (error).message,
            });
            throw error;
        }
    });
    ipcMain.handle("recentFiles:add", async (/** @type {any} */ _event, /** @type {string} */ filePath) => {
        try {
            addRecentFile(filePath);
            const win = BrowserWindow.getFocusedWindow() || mainWindow;
            if (win) {
                const theme = await getThemeFromRenderer(win);
                createAppMenu(win, theme, getAppState("loadedFitFilePath"));
            }
            return loadRecentFiles();
        } catch (error) {
            logWithContext("error", "Error in recentFiles:add:", {
                error: /** @type {Error} */ (error).message,
            });
            throw error;
        }
    });

    // File operations handlers
    ipcMain.handle("file:read", async (/** @type {any} */ _event, /** @type {string} */ filePath) => {
        try {
            return new Promise((resolve, reject) => {
                fs.readFile(filePath, (/** @type {any} */ err, /** @type {any} */ data) => {
                    if (err) {
                        logWithContext("error", "Error reading file:", {
                            filePath,
                            error: /** @type {Error} */ (err).message,
                        });
                        reject(err);
                    } else {
                        resolve(data.buffer);
                    }
                });
            });
        } catch (error) {
            logWithContext("error", "Error in file:read:", {
                error: /** @type {Error} */ (error).message,
            });
            throw error;
        }
    });

    // FIT file parsing handlers
    ipcMain.handle("fit:parse", async (/** @type {any} */ _event, /** @type {ArrayBuffer} */ arrayBuffer) => {
        try {
            const fitParser = require("./fitParser"),
             buffer = Buffer.from(arrayBuffer);
            return await fitParser.decodeFitFile(buffer);
        } catch (error) {
            logWithContext("error", "Error in fit:parse:", {
                error: /** @type {Error} */ (error).message,
            });
            throw error;
        }
    });

    ipcMain.handle("fit:decode", async (/** @type {any} */ _event, /** @type {ArrayBuffer} */ arrayBuffer) => {
        try {
            const fitParser = require("./fitParser"),
             buffer = Buffer.from(arrayBuffer);
            return await fitParser.decodeFitFile(buffer);
        } catch (error) {
            logWithContext("error", "Error in fit:decode:", {
                error: /** @type {Error} */ (error).message,
            });
            throw error;
        }
    });

    // Application info handlers
    const infoHandlers = {
        "theme:get": async () => {
            const { Conf } = require("electron-conf"),
             conf = new Conf({ name: CONSTANTS.SETTINGS_CONFIG_NAME });
            return conf.get("theme", CONSTANTS.DEFAULT_THEME);
        },
        "map-tab:get": async () => {
            const { Conf } = require("electron-conf"),
             conf = new Conf({ name: CONSTANTS.SETTINGS_CONFIG_NAME });
            return conf.get("selectedMapTab", "map");
        },
        getAppVersion: async () => app.getVersion(),
        getElectronVersion: async () => process.versions.electron,
        getNodeVersion: async () => process.versions.node,
        getChromeVersion: async () => process.versions.chrome,
        getPlatformInfo: async () => ({
            platform: process.platform,
            arch: process.arch,
        }),
        getLicenseInfo: async () => {
            try {
                const packageJsonPath = path.join(app.getAppPath(), "package.json"),
                 packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
                return packageJson.license || "Unknown";
            } catch (err) {
                logWithContext("error", "Failed to read license from package.json:", {
                    error: /** @type {Error} */ (err).message,
                });
            }
        },
    };

    Object.entries(infoHandlers).forEach(([channel, /** @type {Function} */ handler]) => {
        ipcMain.handle(channel, async (/** @type {any} */ event, .../** @type {any[]} */ args) => {
            try {
                return await /** @type {any} */ (handler)(event, ...args);
            } catch (error) {
                logWithContext("error", `Error in ${channel}:`, {
                    error: /** @type {Error} */ (error).message,
                });
                throw error;
            }
        });
    });

    // External link handler
    ipcMain.handle("shell:openExternal", async (/** @type {any} */ _event, /** @type {string} */ url) => {
        try {
            if (!url || typeof url !== "string") {
                throw new Error("Invalid URL provided");
            }

            // Basic URL validation
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                throw new Error("Only HTTP and HTTPS URLs are allowed");
            }

            await shell.openExternal(url);
            return true;
        } catch (error) {
            logWithContext("error", "Error in shell:openExternal:", {
                error: /** @type {Error} */ (error).message,
            });
            throw error;
        }
    });

    // Gyazo OAuth Server Handlers
    ipcMain.handle("gyazo:server:start", async (/** @type {any} */ _event, /** @type {number} */ port = 3000) => {
        try {
            return await startGyazoOAuthServer(port);
        } catch (error) {
            logWithContext("error", "Error in gyazo:server:start:", {
                error: /** @type {Error} */ (error).message,
            });
            throw error;
        }
    });

    ipcMain.handle("gyazo:server:stop", async (/** @type {any} */ _event) => {
        try {
            return await stopGyazoOAuthServer();
        } catch (error) {
            logWithContext("error", "Error in gyazo:server:stop:", {
                error: /** @type {Error} */ (error).message,
            });
            throw error;
        }
    });
}
/*
    // NOTE: These handlers are already registered above - commenting out duplicates
    // Register all info handlers
    Object.entries(infoHandlers).forEach(([channel, handler]) => {
        ipcMain.handle(channel, createErrorHandler(handler));
    });

    // External link handler
    ipcMain.handle(
        "shell:openExternal",
        createErrorHandler(async (event, url) => {
            if (!url || typeof url !== "string") {
                throw new Error("Invalid URL provided");
            }

            // Basic URL validation
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                throw new Error("Only HTTP and HTTPS URLs are allowed");
            }

            await shell.openExternal(url);
            return true;
        })
    );

    // Gyazo OAuth Server Handlers
    ipcMain.handle(
        "gyazo:server:start",
        createErrorHandler(async (event, port = 3000) => {
            return await startGyazoOAuthServer(port);
        })
    );

    ipcMain.handle(
        "gyazo:server:stop",
        createErrorHandler(async () => {
            return await stopGyazoOAuthServer();
        })
    );
    */

// Enhanced menu and event handlers
function setupMenuAndEventHandlers() {
    // Theme change handler
    ipcMain.on("theme-changed", async (event, theme) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (validateWindow(win, "theme-changed event")) {
            createAppMenu(/** @type {any} */ (win), theme || CONSTANTS.DEFAULT_THEME, getAppState("loadedFitFilePath"));
        }
    });

    // Update handlers
    const updateHandlers = {
        "menu-check-for-updates": () => {
            try {
                _autoUpdater.checkForUpdates();
            } catch (error) {
                logWithContext("error", "Failed to check for updates:", {
                    error: /** @type {Error} */ (error).message,
                });
            }
        },
        "install-update": () => {
            try {
                _autoUpdater.quitAndInstall();
            } catch (err) {
                logWithContext("error", "Error during quitAndInstall:", { error: /** @type {Error} */ (err).message });
                if (process.platform === CONSTANTS.PLATFORMS.LINUX) {
                    dialog.showMessageBox({
                        type: "info",
                        title: "Manual Update Required",
                        message:
                            "Your Linux Distro does not support auto-updating, please download and install the latest version manually from the website.",
                    });
                }
            }
        },
        "menu-restart-update": () => {
            try {
                _autoUpdater.quitAndInstall();
            } catch (err) {
                logWithContext("error", "Error during restart and install:", {
                    error: /** @type {Error} */ (err).message,
                });
                if (process.platform === CONSTANTS.PLATFORMS.LINUX) {
                    dialog.showMessageBox({
                        type: "info",
                        title: "Manual Update Required",
                        message:
                            "Your Linux Distro does not support auto-updating, please download and install the latest version manually from the website.",
                    });
                }
            }
        },
    };

    // Register update handlers
    Object.entries(updateHandlers).forEach(([event, handler]) => {
        ipcMain.on(event, handler);
    }); // File menu action handlers
    const fileMenuHandlers = {
        "menu-save-as": async (/** @type {any} */ event) => {
            const win = BrowserWindow.fromWebContents(event.sender),
             loadedFilePath = getAppState("loadedFitFilePath");
            if (!loadedFilePath || !win) {return;}

            try {
                const { canceled, filePath } = await dialog.showSaveDialog(/** @type {any} */ (win), {
                    title: "Save As",
                    defaultPath: loadedFilePath,
                    filters: CONSTANTS.DIALOG_FILTERS.ALL_FILES,
                });

                if (!canceled && filePath) {
                    fs.copyFileSync(loadedFilePath, filePath);
                    sendToRenderer(win, "show-notification", "File saved successfully.", "success");
                }
            } catch (err) {
                sendToRenderer(win, "show-notification", `Save failed: ${err}`, "error");
                logWithContext("error", "Failed to save file:", { error: /** @type {Error} */ (err).message });
            }
        },
        "menu-export": async (/** @type {any} */ event) => {
            const win = BrowserWindow.fromWebContents(event.sender),
             loadedFilePath = getAppState("loadedFitFilePath");
            if (!loadedFilePath || !win) {return;}

            try {
                const { canceled, filePath } = await dialog.showSaveDialog(/** @type {any} */ (win), {
                    title: "Export As",
                    defaultPath: loadedFilePath.replace(/\.fit$/i, ".csv"),
                    filters: CONSTANTS.DIALOG_FILTERS.EXPORT_FILES,
                });

                if (!canceled && filePath) {
                    sendToRenderer(win, "export-file", filePath);
                }
            } catch (err) {
                logWithContext("error", "Failed to show export dialog:", { error: /** @type {Error} */ (err).message });
            }
        },
    };

    // Register file menu handlers
    Object.entries(fileMenuHandlers).forEach(([event, handler]) => {
        ipcMain.on(event, handler);
    });

    // Fullscreen handler
    ipcMain.on("set-fullscreen", (/** @type {any} */ _event, /** @type {any} */ flag) => {
        const win = BrowserWindow.getFocusedWindow();
        if (validateWindow(win, "set-fullscreen event")) {
            /** @type {any} */ (win).setFullScreen(Boolean(flag));
        }
    });

    // Development helper for menu injection
    ipcMain.handle(
        "devtools-inject-menu",
        (/** @type {any} */ event, /** @type {any} */ theme, /** @type {any} */ fitFilePath) => {
            const win = BrowserWindow.fromWebContents(event.sender),
             t = theme || CONSTANTS.DEFAULT_THEME,
             f = fitFilePath || null;
            logWithContext("info", "Manual menu injection requested", { theme: t, fitFilePath: f });
            if (win) {
                createAppMenu(/** @type {any} */ (win), t, f);
            }
            return true;
        }
    );
}

// Enhanced application event handlers
function setupApplicationEventHandlers() {
    // App activation handler (macOS)
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            const win = createWindow();
            createAppMenu(win, CONSTANTS.DEFAULT_THEME, getAppState("loadedFitFilePath"));
        } else {
            const win = BrowserWindow.getFocusedWindow() || getAppState("mainWindow");
            if (validateWindow(win, "app activate event")) {
                createAppMenu(win, CONSTANTS.DEFAULT_THEME, getAppState("loadedFitFilePath"));
            }
        }
    });

    // Browser window focus handler (Linux)
    app.on("browser-window-focus", async (/** @type {any} */ _event, /** @type {any} */ win) => {
        if (process.platform === CONSTANTS.PLATFORMS.LINUX) {
            try {
                const theme = await getThemeFromRenderer(win);
                createAppMenu(win, theme, getAppState("loadedFitFilePath"));
            } catch (err) {
                logWithContext("error", "Error setting menu on browser-window-focus:", {
                    error: /** @type {Error} */ (err).message,
                });
            }
        }
    });

    // Window all closed handler
    app.on("window-all-closed", () => {
        setAppState("appIsQuitting", true);
        if (process.platform !== CONSTANTS.PLATFORMS.DARWIN) {
            app.quit();
        }
    });

    // Cleanup Gyazo server when app is quitting
    app.on("before-quit", async (event) => {
        setAppState("appIsQuitting", true);
        const gyazoServer = getAppState("gyazoServer");
        if (gyazoServer) {
            event.preventDefault();
            try {
                await stopGyazoOAuthServer();
                app.quit();
            } catch (error) {
                logWithContext("error", "Failed to stop Gyazo server during quit:", {
                    error: /** @type {Error} */ (error).message,
                });
                app.quit();
            }
        }
    });

    // Security: Prevent navigation to untrusted URLs
    app.on("web-contents-created", (/** @type {any} */ _event, /** @type {any} */ contents) => {
        const allowedOrigins = [
            "file://",
            "about:blank",
            "https://gyazo.com/oauth/", // Allow Gyazo OAuth
            "https://gyazo.com/api/oauth/login", // Allow Gyazo API OAuth
            "https://imgur.com/oauth/", // Allow Imgur OAuth (if needed)
        ];

        contents.on("will-navigate", (/** @type {any} */ event, /** @type {any} */ navigationUrl) => {
            if (!allowedOrigins.some((origin) => navigationUrl.startsWith(origin))) {
                event.preventDefault();
                logWithContext("warn", "Blocked navigation to untrusted URL:", { url: navigationUrl });
            }
        });

        // Prevent new windows from opening untrusted URLs
        contents.setWindowOpenHandler((/** @type {{ url: any }} */ { url }) => {
            if (!allowedOrigins.some((origin) => url.startsWith(origin))) {
                logWithContext("warn", "Blocked opening untrusted URL in new window:", { url });
                return { action: "deny" };
            }
            return { action: "allow" };
        });
    });
}

// Cleanup functions
function cleanupEventHandlers() {
    mainProcessState.cleanupEventHandlers();
}

// Development helpers
function exposeDevHelpers() {
    /** @type {any} */ (global).devHelpers = {
        getAppState: () => mainProcessState.data,
        cleanupEventHandlers,
        rebuildMenu: (/** @type {any} */ theme, /** @type {any} */ filePath) => {
            const win = BrowserWindow.getFocusedWindow();
            if (validateWindow(win, "dev helper rebuild menu")) {
                createAppMenu(
                    /** @type {any} */ (win),
                    theme || CONSTANTS.DEFAULT_THEME,
                    filePath || getAppState("loadedFitFilePath")
                );
            }
        },
        logState: () => {
            logWithContext("info", "Current application state:", {
                loadedFitFilePath: getAppState("loadedFitFilePath"),
                hasMainWindow: Boolean(getAppState("mainWindow")),
                eventHandlersCount: mainProcessState.data.eventHandlers.size,
            });
        },
    };

    logWithContext("info", "Development helpers exposed on global.devHelpers");
}

// Main application initialization
app.whenReady().then(async () => {
    try {
        const mainWindow = await initializeApplication();

        // Setup all IPC handlers
        setupIPCHandlers(mainWindow);
        // Setup menu and event handlers
        setupMenuAndEventHandlers();

        // Setup application event handlers
        setupApplicationEventHandlers();

        // Expose development helpers in development mode
        if (/** @type {any} */ (process.env).NODE_ENV === "development" || process.argv.includes("--dev")) {
            exposeDevHelpers();
        }

        logWithContext("info", "Application initialized successfully");
    } catch (error) {
        logWithContext("error", "Failed to initialize application:", { error: /** @type {Error} */ (error).message });
    }
});

// Gyazo OAuth Server Functions
async function startGyazoOAuthServer(port = 3000) {
    // Stop existing server if running
    const existingServer = getAppState("gyazoServer");
    if (existingServer) {
        await stopGyazoOAuthServer();
    }

    return new Promise((resolve, reject) => {
        try {
            const server = http.createServer((req, res) => {
                const parsedUrl = url.parse(/** @type {string} */ (req.url), true);

                // Handle CORS and preflight requests
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                res.setHeader("Access-Control-Allow-Headers", "Content-Type");

                if (req.method === "OPTIONS") {
                    res.writeHead(200);
                    res.end();
                    return;
                }

                if (parsedUrl.pathname === "/gyazo/callback") {
                    const { code, state, error } = parsedUrl.query;

                    // Send a response to the browser
                    if (error) {
                        res.writeHead(200, { "Content-Type": "text/html" });
                        res.end(`
                            <!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Gyazo OAuth - Error</title>
                                        body {
                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            // Removed unused createErrorHandler placeholder to satisfy lint no-unused-vars
                                <body>
                                    <div class="container">
                                        <h1>❌ Authorization Failed</h1>
                                        <div class="error">
                                            <strong>Error:</strong> ${error}
                                        </div>
                                        <p>Please close this window and try again from the FitFileViewer application.</p>
                                    </div>
                                </body>
                            </html>
                        `);
                    } else if (code && state) {
                        res.writeHead(200, { "Content-Type": "text/html" });
                        res.end(`
                            <!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Gyazo OAuth - Success</title>
                                    <style>
                                        body {
                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                            margin: 0; padding: 40px; min-height: 100vh; display: flex;
                                            align-items: center; justify-content: center;
                                        }
                                        .container {
                                            background: white; padding: 40px; border-radius: 12px;
                                            box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center;
                                            max-width: 500px;
                                        }
                                        h1 { color: #27ae60; margin: 0 0 20px 0; }
                                        p { color: #666; line-height: 1.6; margin: 0 0 20px 0; }
                                        .success { background: #eafaf1; padding: 15px; border-radius: 8px; margin: 20px 0; }
                                        .auto-close { font-size: 14px; color: #888; margin-top: 20px; }
                                    </style>
                                    <script>
                                        setTimeout(function () {
                                            window.close();
                                        }, 3000);
                                    </script>
                                </head>
                                <body>
                                    <div class="container">
                                        <h1>✅ Authorization Successful!</h1>
                                        <div class="success">
                                            <strong>Success!</strong> Your Gyazo account has been connected to FitFileViewer.
                                        </div>
                                        <p>You can now upload charts to your Gyazo account. This window will close automatically.</p>
                                        <div class="auto-close">Closing in 3 seconds...</div>
                                    </div>
                                </body>
                            </html>
                        `); // Send the code to the renderer process
                        const mainWindow = getAppState("mainWindow");
                        if (validateWindow(mainWindow, "gyazo-oauth-callback")) {
                            mainWindow.webContents.send("gyazo-oauth-callback", { code, state });
                        }
                    } else {
                        res.writeHead(400, { "Content-Type": "text/html" });
                        res.end(`
                            <!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Gyazo OAuth - Invalid Request</title>
                                    <style>
                                        body {
                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                            margin: 0; padding: 40px; min-height: 100vh; display: flex;
                                            align-items: center; justify-content: center;
                                        }
                                        .container {
                                            background: white; padding: 40px; border-radius: 12px;
                                            box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center;
                                            max-width: 500px;
                                        }
                                        h1 { color: #f39c12; margin: 0 0 20px 0; }
                                        p { color: #666; line-height: 1.6; margin: 0 0 20px 0; }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <h1>⚠️ Invalid Request</h1>
                                        <p>Missing authorization code or state parameter. Please try again from the FitFileViewer application.</p>
                                    </div>
                                </body>
                            </html>
                        `);
                    }
                } else {
                    // 404 for other paths
                    res.writeHead(404, { "Content-Type": "text/plain" });
                    res.end("Not Found");
                }
            });

            server.on("error", (err) => {
                if (/** @type {any} */ (err).code === "EADDRINUSE") {
                    logWithContext("warn", `Port ${port} is in use, trying port ${port + 1}`);
                    // Try next port
                    if (port < 3010) {
                        startGyazoOAuthServer(port + 1)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        reject(new Error("Unable to find an available port for OAuth callback server"));
                    }
                } else {
                    reject(err);
                }
            });
            server.listen(port, "localhost", () => {
                setAppState("gyazoServer", server);
                setAppState("gyazoServerPort", port);
                logWithContext("info", `Gyazo OAuth callback server started on http://localhost:${port}`);
                resolve({
                    success: true,
                    port,
                    message: `OAuth callback server started on port ${port}`,
                });
            });
        } catch (error) {
            logWithContext("error", "Failed to start Gyazo OAuth server:", {
                error: /** @type {Error} */ (error).message,
            });
            reject(error);
        }
    });
}

async function stopGyazoOAuthServer() {
    return new Promise((resolve) => {
        const gyazoServer = getAppState("gyazoServer");
        if (gyazoServer) {
            gyazoServer.close(() => {
                logWithContext("info", "Gyazo OAuth callback server stopped");
                setAppState("gyazoServer", null);
                setAppState("gyazoServerPort", null);
                resolve({
                    success: true,
                    message: "OAuth callback server stopped",
                });
            });
        } else {
            resolve({
                success: true,
                message: "No server was running",
            });
        }
    });
}
