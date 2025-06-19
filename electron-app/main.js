/* eslint-env node */
const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require("electron");
const { createWindow } = require("./windowStateUtils");
const path = require("path");
const fs = require("fs");
const http = require("http");
const url = require("url");
const { autoUpdater } = require("electron-updater");

const { loadRecentFiles, addRecentFile } = require("./utils/recentFiles");
const { createAppMenu } = require("./utils/createAppMenu");
const { mainProcessState } = require("./utils/mainProcessStateManager");

// Constants
const CONSTANTS = {
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
function getAppState(path) {
    return mainProcessState.get(path);
}

function setAppState(path, value, options = {}) {
    return mainProcessState.set(path, value, options);
}

// Utility functions
function isWindowUsable(win) {
    return win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed();
}

function validateWindow(win, context = "unknown operation") {
    if (!isWindowUsable(win)) {
        // Only log warning if window should exist but doesn't (avoid noise during normal shutdown)
        if (!getAppState("appIsQuitting")) {
            logWithContext("warn", `Window validation failed during ${context}`, {
                hasWindow: !!win,
                isDestroyed: win?.isDestroyed(),
                hasWebContents: !!win?.webContents,
                webContentsDestroyed: win?.webContents?.isDestroyed(),
            });
        }
        return false;
    }
    return true;
}

async function getThemeFromRenderer(win) {
    if (!validateWindow(win, "theme retrieval")) return CONSTANTS.DEFAULT_THEME;

    try {
        const theme = await win.webContents.executeJavaScript(`localStorage.getItem("${CONSTANTS.THEME_STORAGE_KEY}")`);
        return theme || CONSTANTS.DEFAULT_THEME;
    } catch (err) {
        console.error("[main.js] Failed to get theme from renderer:", err);
        return CONSTANTS.DEFAULT_THEME;
    }
}

function sendToRenderer(win, channel, ...args) {
    if (validateWindow(win, `IPC send to ${channel}`)) {
        win.webContents.send(channel, ...args);
    }
}

function logWithContext(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : "";
    console[level](`[${timestamp}] [main.js] ${message}`, contextStr);
}

// Enhanced error handling wrapper
function createErrorHandler(operation) {
    return async (...args) => {
        try {
            return await operation(...args);
        } catch (error) {
            logWithContext("error", `Error in ${operation.name || "operation"}:`, {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    };
}

// Enhanced Auto-Updater Setup with better error handling
function setupAutoUpdater(mainWindow) {
    if (!validateWindow(mainWindow, "auto-updater setup")) {
        logWithContext("warn", "Cannot setup auto-updater: main window is not usable");
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
        logWithContext("error", "Error initializing logger:", { error: err.message });
        autoUpdater.logger = console;
    }

    autoUpdater.logger.transports.file.level = CONSTANTS.LOG_LEVELS.INFO;

    // Enhanced logging for update feed URL
    if (autoUpdater.feedURL !== undefined && autoUpdater.feedURL !== null) {
        const feedInfo = { feedURL: autoUpdater.feedURL };
        autoUpdater.logger.info(`AutoUpdater feed URL: ${autoUpdater.feedURL}`);
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
        "update-available": (info) => {
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.AVAILABLE, info);
        },
        "update-not-available": (info) => {
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.NOT_AVAILABLE, info);
        },
        error: (err) => {
            const errorMessage = err == null ? "unknown" : err.message || err.toString();
            autoUpdater.logger.error(`AutoUpdater Error: ${errorMessage}`);
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.ERROR, errorMessage);
        },
        "download-progress": (progressObj) => {
            sendToRenderer(mainWindow, CONSTANTS.UPDATE_EVENTS.DOWNLOAD_PROGRESS, progressObj);
        },
        "update-downloaded": (info) => {
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
        autoUpdater.on(event, handler);
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
                await autoUpdater.checkForUpdatesAndNotify();
                setAppState("autoUpdaterInitialized", true);
            } catch (error) {
                logWithContext("error", "Failed to setup auto-updater:", { error: error.message });
            }
        }

        try {
            const theme = await getThemeFromRenderer(mainWindow);
            logWithContext("info", "Retrieved theme from renderer", { theme });
            createAppMenu(mainWindow, theme, getAppState("loadedFitFilePath"));
            sendToRenderer(mainWindow, "set-theme", theme);
        } catch (error) {
            logWithContext("warn", "Failed to get theme from renderer, using fallback", { error: error.message });
            createAppMenu(mainWindow, CONSTANTS.DEFAULT_THEME, getAppState("loadedFitFilePath"));
            sendToRenderer(mainWindow, "set-theme", CONSTANTS.DEFAULT_THEME);
        }
    });

    return mainWindow;
}
// Enhanced IPC handlers with better error handling and organization
function setupIPCHandlers(mainWindow) {
    // File dialog handler
    ipcMain.handle(
        "dialog:openFile",
        createErrorHandler(async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog({
                filters: CONSTANTS.DIALOG_FILTERS.FIT_FILES,
                properties: ["openFile"],
            });
            if (canceled || filePaths.length === 0) return null;

            addRecentFile(filePaths[0]);
            setAppState("loadedFitFilePath", filePaths[0]);

            // Fetch current theme from renderer before rebuilding menu
            const win = BrowserWindow.getFocusedWindow() || mainWindow;
            const theme = await getThemeFromRenderer(win);
            createAppMenu(win, theme, getAppState("loadedFitFilePath"));

            return filePaths[0];
        })
    ); // FIT file loaded handler
    ipcMain.on("fit-file-loaded", async (event, filePath) => {
        setAppState("loadedFitFilePath", filePath);
        const win = BrowserWindow.fromWebContents(event.sender);
        if (validateWindow(win, "fit-file-loaded event")) {
            try {
                const theme = await getThemeFromRenderer(win);
                createAppMenu(win, theme, getAppState("loadedFitFilePath"));
            } catch (error) {
                logWithContext("error", "Failed to update menu after fit file loaded:", { error: error.message });
            }
        }
    });

    // Recent files handlers
    ipcMain.handle(
        "recentFiles:get",
        createErrorHandler(async () => {
            return loadRecentFiles();
        })
    );
    ipcMain.handle(
        "recentFiles:add",
        createErrorHandler(async (event, filePath) => {
            addRecentFile(filePath);
            const win = BrowserWindow.getFocusedWindow() || mainWindow;
            const theme = await getThemeFromRenderer(win);
            createAppMenu(win, theme, getAppState("loadedFitFilePath"));
            return loadRecentFiles();
        })
    );

    // File operations handlers
    ipcMain.handle(
        "file:read",
        createErrorHandler(async (event, filePath) => {
            return new Promise((resolve, reject) => {
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        logWithContext("error", "Error reading file:", { filePath, error: err.message });
                        reject(err);
                    } else {
                        resolve(data.buffer);
                    }
                });
            });
        })
    );

    // FIT file parsing handlers
    ipcMain.handle(
        "fit:parse",
        createErrorHandler(async (event, arrayBuffer) => {
            const fitParser = require("./fitParser");
            const buffer = Buffer.from(arrayBuffer);
            return await fitParser.decodeFitFile(buffer);
        })
    );

    ipcMain.handle(
        "fit:decode",
        createErrorHandler(async (event, arrayBuffer) => {
            const fitParser = require("./fitParser");
            const buffer = Buffer.from(arrayBuffer);
            return await fitParser.decodeFitFile(buffer);
        })
    );

    // Application info handlers
    const infoHandlers = {
        "theme:get": async () => {
            const { Conf } = require("electron-conf");
            const conf = new Conf({ name: CONSTANTS.SETTINGS_CONFIG_NAME });
            return conf.get("theme", CONSTANTS.DEFAULT_THEME);
        },
        "map-tab:get": async () => {
            const { Conf } = require("electron-conf");
            const conf = new Conf({ name: CONSTANTS.SETTINGS_CONFIG_NAME });
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
                const packageJsonPath = path.join(app.getAppPath(), "package.json");
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
                return packageJson.license || "Unknown";
            } catch (err) {
                logWithContext("error", "Failed to read license from package.json:", { error: err.message });
                return "Unknown";
            }
        },
    };
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
}
// Enhanced menu and event handlers
function setupMenuAndEventHandlers() {
    // Theme change handler
    ipcMain.on("theme-changed", async (event, theme) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (validateWindow(win, "theme-changed event")) {
            createAppMenu(win, theme || CONSTANTS.DEFAULT_THEME, getAppState("loadedFitFilePath"));
        }
    });

    // Update handlers
    const updateHandlers = {
        "menu-check-for-updates": () => {
            try {
                autoUpdater.checkForUpdates();
            } catch (error) {
                logWithContext("error", "Failed to check for updates:", { error: error.message });
            }
        },
        "install-update": () => {
            try {
                autoUpdater.quitAndInstall();
            } catch (err) {
                logWithContext("error", "Error during quitAndInstall:", { error: err.message });
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
                autoUpdater.quitAndInstall();
            } catch (err) {
                logWithContext("error", "Error during restart and install:", { error: err.message });
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
        "menu-save-as": async (event) => {
            const win = BrowserWindow.fromWebContents(event.sender);
            const loadedFilePath = getAppState("loadedFitFilePath");
            if (!loadedFilePath) return;

            try {
                const { canceled, filePath } = await dialog.showSaveDialog(win, {
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
                logWithContext("error", "Failed to save file:", { error: err.message });
            }
        },
        "menu-export": async (event) => {
            const win = BrowserWindow.fromWebContents(event.sender);
            const loadedFilePath = getAppState("loadedFitFilePath");
            if (!loadedFilePath) return;

            try {
                const { canceled, filePath } = await dialog.showSaveDialog(win, {
                    title: "Export As",
                    defaultPath: loadedFilePath.replace(/\.fit$/i, ".csv"),
                    filters: CONSTANTS.DIALOG_FILTERS.EXPORT_FILES,
                });

                if (!canceled && filePath) {
                    sendToRenderer(win, "export-file", filePath);
                }
            } catch (err) {
                logWithContext("error", "Failed to show export dialog:", { error: err.message });
            }
        },
    };

    // Register file menu handlers
    Object.entries(fileMenuHandlers).forEach(([event, handler]) => {
        ipcMain.on(event, handler);
    });

    // Fullscreen handler
    ipcMain.on("set-fullscreen", (event, flag) => {
        const win = BrowserWindow.getFocusedWindow();
        if (validateWindow(win, "set-fullscreen event")) {
            win.setFullScreen(!!flag);
        }
    });

    // Development helper for menu injection
    ipcMain.handle("devtools-inject-menu", (event, theme, fitFilePath) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        const t = theme || CONSTANTS.DEFAULT_THEME;
        const f = fitFilePath || null;
        logWithContext("info", "Manual menu injection requested", { theme: t, fitFilePath: f });
        createAppMenu(win, t, f);
        return true;
    });
}

// Enhanced application event handlers
function setupApplicationEventHandlers() {
    // App activation handler (macOS)
    app.on("activate", function () {
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
    app.on("browser-window-focus", async (event, win) => {
        if (process.platform === CONSTANTS.PLATFORMS.LINUX) {
            try {
                const theme = await getThemeFromRenderer(win);
                createAppMenu(win, theme, getAppState("loadedFitFilePath"));
            } catch (err) {
                logWithContext("error", "Error setting menu on browser-window-focus:", { error: err.message });
            }
        }
    });

    // Window all closed handler
    app.on("window-all-closed", function () {
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
                logWithContext("error", "Failed to stop Gyazo server during quit:", { error: error.message });
                app.quit();
            }
        }
    });

    // Security: Prevent navigation to untrusted URLs
    app.on("web-contents-created", (event, contents) => {
        const allowedOrigins = [
            "file://",
            "about:blank",
            "https://gyazo.com/oauth/", // Allow Gyazo OAuth
            "https://gyazo.com/api/oauth/login", // Allow Gyazo API OAuth
            "https://imgur.com/oauth/", // Allow Imgur OAuth (if needed)
        ];

        contents.on("will-navigate", (event, navigationUrl) => {
            if (!allowedOrigins.some((origin) => navigationUrl.startsWith(origin))) {
                event.preventDefault();
                logWithContext("warn", "Blocked navigation to untrusted URL:", { url: navigationUrl });
            }
        });

        // Prevent new windows from opening untrusted URLs
        contents.setWindowOpenHandler(({ url }) => {
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
    global.devHelpers = {
        getAppState: () => mainProcessState.data,
        cleanupEventHandlers,
        rebuildMenu: (theme, filePath) => {
            const win = BrowserWindow.getFocusedWindow();
            if (validateWindow(win, "dev helper rebuild menu")) {
                createAppMenu(win, theme || CONSTANTS.DEFAULT_THEME, filePath || getAppState("loadedFitFilePath"));
            }
        },
        logState: () => {
            logWithContext("info", "Current application state:", {
                loadedFitFilePath: getAppState("loadedFitFilePath"),
                hasMainWindow: !!getAppState("mainWindow"),
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
        if (process.env.NODE_ENV === "development" || process.argv.includes("--dev")) {
            exposeDevHelpers();
        }

        logWithContext("info", "Application initialized successfully");
    } catch (error) {
        logWithContext("error", "Failed to initialize application:", { error: error.message });
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
                const parsedUrl = url.parse(req.url, true);

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
                                        h1 { color: #e74c3c; margin: 0 0 20px 0; }
                                        p { color: #666; line-height: 1.6; margin: 0 0 20px 0; }
                                        .error { background: #ffeaea; padding: 15px; border-radius: 8px; margin: 20px 0; }
                                    </style>
                                </head>
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
                if (err.code === "EADDRINUSE") {
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
            logWithContext("error", "Failed to start Gyazo OAuth server:", { error: error.message });
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
