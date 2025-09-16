/* eslint-env node */
// Lazily resolve Electron at call-time so Vitest's vi.mock('electron') can hook properly
/** @type {any|null} */
let __electronCached = null;
function getElectron() {
    if (
        __electronCached &&
        (/** @type {any} */ (__electronCached).Menu ||
            /** @type {any} */ (__electronCached).app ||
            /** @type {any} */ (__electronCached).BrowserWindow)
    ) {
        return __electronCached;
    }
    try {
        // eslint-disable-next-line global-require
        const e = require("electron");
        __electronCached = /** @type {any} */ (e);
        return /** @type {any} */ (e);
    } catch {
        try {
            // @ts-ignore
            const e = (typeof globalThis !== "undefined" && /** @type {any} */ (globalThis).__electronHoistedMock) || null;
            if (e) {
                __electronCached = e;
                return e;
            }
        } catch { }
        return {};
    }
}

// Lazily initialize configuration to avoid import-time side effects in tests
/** @type {any|null} */
let __confInstance = null;
function getConf() {
    if (__confInstance) return __confInstance;
    try {
        const { Conf } = require("electron-conf");
        __confInstance = new Conf({ name: "settings" });
        return __confInstance;
    } catch (err) {
        // Fallback simple in-memory store for non-Electron/test environments
        /** @type {{ _store: Record<string, any>, get: (k: string, d?: any) => any, set: (k: string, v: any) => void }} */
        const fallback = {
            _store: {},
            get(key, def) {
                return Object.prototype.hasOwnProperty.call(this._store, key) ? this._store[key] : def;
            },
            set(key, val) {
                this._store[key] = val;
            },
        };
        __confInstance = fallback;
        return __confInstance;
    }
}

// Persistent reference to prevent menu GC/disappearance on Linux.
// See: https://github.com/electron/electron/issues/18397
let mainMenu = null;

const decoderOptionDefaults = {
    applyScaleAndOffset: true,
    expandSubFields: true,
    expandComponents: true,
    convertTypesToStrings: true,
    convertDateTimesToDates: true,
    includeUnknownData: true,
    mergeHeartRates: true,
};

function getDecoderOptions() {
    return getConf().get("decoderOptions", decoderOptionDefaults);
}

/**
 * @param {*} key
 * @param {*} value
 */
function setDecoderOption(key, value) {
    const options = /** @type {Record<string, any>} */ (getDecoderOptions());
    options[key] = value;
    getConf().set("decoderOptions", options);
    return options;
}

function getTheme() {
    return getConf().get("theme", "dark");
}

/**
 * @param {*} theme
 */
function setTheme(theme) {
    getConf().set("theme", theme);
}

// Add platform-specific (macOS) App menu for About, Preferences, and Quit
/**
 * @param {*} mainWindow
 */
function getPlatformAppMenu(mainWindow) {
    const { app, BrowserWindow } = /** @type {any} */ (getElectron());
    if (process.platform === "darwin") {
        return [
            {
                label: app.name,
                submenu: [
                    {
                        label: "About",
                        role: "about",
                        click: () => {
                            const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                            if (win && win.webContents) {
                                win.webContents.send("menu-about");
                            }
                        },
                    },
                    { type: "separator" },
                    {
                        label: "Preferences...",
                        accelerator: "CmdOrCtrl+,",
                        click: () => {
                            const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                            if (win && win.webContents) {
                                win.webContents.send("menu-preferences");
                            }
                        },
                    },
                    { type: "separator" },
                    { role: "services", submenu: [] },
                    { type: "separator" },
                    { role: "hide" },
                    { role: "hideothers" },
                    { role: "unhide" },
                    { type: "separator" },
                    { role: "quit" },
                ],
            },
        ];
    }
    // For Windows/Linux, add About and Preferences to Help menu
    return [];
}

/**
 * Builds and sets the application menu for the Electron app.
 * The menu includes File, Edit, View, Window, and Settings menus, with support for opening files,
 * displaying a list of recent files, and standard menu roles.
 *
 * @param {Electron.BrowserWindow} mainWindow - The main application window to which menu actions are dispatched.
 * @param {string} [currentTheme=null] - The current theme of the application, used to set the checked state of theme radio buttons.
 * @param {string|null} [loadedFitFilePath=null] - The path of the loaded FIT file, used to enable/disable the Summary Columns menu item.
 */
function createAppMenu(mainWindow, currentTheme = undefined, loadedFitFilePath = undefined) {
    const el = /** @type {any} */ (getElectron());
    try {
        if (!el || !el.Menu) {
            // Provide visibility into why Menu isn't present in CI
            // eslint-disable-next-line no-console
            console.warn("[createAppMenu] Debug: electron module keys:", Object.keys(el || {}));
        }
    } catch { }
    const { Menu, BrowserWindow, app, shell } = /** @type {any} */ (el);
    const theme = currentTheme || getTheme();
    // Allow tests to inject recent files deterministically via a global hook
    /** @type {string[]} */
    let injectedRecentFiles = [];
    try {
        // @ts-ignore
        const gf = typeof globalThis !== "undefined" ? /** @type {any} */ (globalThis).__mockRecentFiles : undefined;
        if (Array.isArray(gf)) injectedRecentFiles = gf.slice();
    } catch { }
    // Lazy import recent files utils to ensure vi.mock hooks correctly
    /** @type {{ loadRecentFiles: () => string[], getShortRecentName: (p: string) => string }} */
    let recentUtils;
    try {
        // eslint-disable-next-line global-require
        recentUtils = require("../../../utils/files/recent/recentFiles");
    } catch {
        // Some builds may have a different relative path
        try {
            // eslint-disable-next-line global-require
            recentUtils = require("../../../utils/files/recent/recentFiles");
        } catch {
            recentUtils = /** @type {any} */ ({ loadRecentFiles: () => [], getShortRecentName: (/** @type {string} */ p) => p });
        }
    }
    const recentFiles = injectedRecentFiles.length > 0
        ? injectedRecentFiles
        : /** @type {string[]} */ (recentUtils.loadRecentFiles());
    // If (!app.isPackaged) {
    //     Console.log("[createAppMenu] Called with:", { theme, loadedFitFilePath, recentFiles });
    // }

    /** @type {any[]} */
    const recentMenuItems =
        recentFiles.length > 0
            ? recentFiles.map((/** @type {string} */ file) => ({
                label: recentUtils.getShortRecentName(file),
                tooltip: file,
                click: () => {
                    if (mainWindow && mainWindow.webContents) {
                        mainWindow.webContents.send("open-recent-file", file);
                    }
                },
            }))
            : [{ label: "No Recent Files", enabled: false }],
        decoderOptions = getDecoderOptions(),
        decoderOptionEmojis = {
            applyScaleAndOffset: "📏",
            expandSubFields: "🧩",
            expandComponents: "🔗",
            convertTypesToStrings: "🔤",
            convertDateTimesToDates: "📅",
            includeUnknownData: "❓",
            mergeHeartRates: "❤️",
        };
    /**
     * @param {*} decoderOptions
     * @param {*} decoderOptionEmojis
     * @param {*} mainWindow
     */
    function createDecoderOptionMenuItems(decoderOptions, decoderOptionEmojis, mainWindow) {
        return Object.keys(decoderOptionDefaults).map((key) => ({
            label: `${decoderOptionEmojis[key] || ""} ${key}`.trim(),
            type: "checkbox",
            checked: Boolean(decoderOptions[key]),
            click: /** @param {*} menuItem */ (menuItem) => {
                const newOptions = setDecoderOption(key, menuItem.checked),
                    win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                if (win && win.webContents) {
                    win.webContents.send("decoder-options-changed", newOptions);
                }
            },
        }));
    }

    const decoderOptionsMenu = {
        label: "💿 Decoder Options",
        submenu: createDecoderOptionMenuItems(decoderOptions, decoderOptionEmojis, mainWindow),
    },
        /**
         * Defines the application menu template for the Electron app.
         *
         * The template includes the following menus:
         * - File: Contains options to open files, view recent files, and quit the application.
         * - Edit: Standard edit menu (cut, copy, paste, etc.).
         * - View: Standard view menu (reload, toggle dev tools, etc.).
         * - Window: Standard window menu (minimize, close, etc.).
         * - Settings: Contains options to configure application settings, such as theme.
         *
         * @type {Array<Object>}
         * @property {string} label - The display label for the menu item.
         * @property {Array<Object>} [submenu] - Submenu items for the menu.
         * @property {string} [accelerator] - Keyboard shortcut for the menu item.
         * @property {Function} [click] - Click handler for the menu item.
         * @property {string} [role] - Built-in role for standard menu items.
         */
        template = [
            ...getPlatformAppMenu(mainWindow),
            {
                label: "📁 File",
                submenu: [
                    {
                        label: "📂 Open...",
                        accelerator: "CmdOrCtrl+O",
                        click: () => {
                            if (mainWindow && mainWindow.webContents) {
                                mainWindow.webContents.send("menu-open-file");
                            }
                        },
                    },
                    { type: "separator" },
                    {
                        label: "🕑 Open Recent",
                        submenu: [
                            ...recentMenuItems,
                            {
                                label: "🧹 Clear Recent Files",
                                enabled: recentFiles.length > 0,
                                click: () => {
                                    const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                                    getConf().set("recentFiles", []);
                                    if (win && win.webContents) {
                                        win.webContents.send("show-notification", "Recent files cleared.", "info");
                                        win.webContents.send("unload-fit-file");
                                    }
                                    createAppMenu(win, /** @type {string} */(getTheme()), undefined);
                                },
                            },
                        ],
                    },
                    { type: "separator" },
                    {
                        label: "❌ Unload File",
                        enabled: Boolean(loadedFitFilePath),
                        click: () => {
                            const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                            if (win && win.webContents) {
                                win.webContents.send("unload-fit-file");
                            }
                        },
                    },
                    {
                        label: "💾 Save As...",
                        enabled: Boolean(loadedFitFilePath),
                        accelerator: "CmdOrCtrl+S",
                        click: () => {
                            const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                            if (win && win.webContents) {
                                win.webContents.send("menu-save-as");
                            }
                        },
                    },
                    {
                        label: "📤 Export...",
                        enabled: Boolean(loadedFitFilePath),
                        click: () => {
                            const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                            if (win && win.webContents) {
                                win.webContents.send("menu-export");
                            }
                        },
                    },
                    {
                        label: "🖨️ Print...",
                        enabled: Boolean(loadedFitFilePath),
                        accelerator: "CmdOrCtrl+P",
                        click: () => {
                            const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                            if (win && win.webContents) {
                                win.webContents.send("menu-print");
                            }
                        },
                    },
                    { type: "separator" },
                    {
                        label: "🚪 Close Window",
                        accelerator: "CmdOrCtrl+W",
                        click: () => {
                            const win = BrowserWindow.getFocusedWindow();
                            if (win) {
                                win.close();
                            }
                        },
                    },
                    { type: "separator" },
                    { role: "quit", label: "❎ Quit" },
                ],
            },
            {
                label: "👁️ View",
                submenu: [
                    { role: "reload", label: "🔄 Reload" },
                    { role: "forcereload", label: "🔁 Force Reload" },
                    { role: "toggledevtools", label: "🛠️ Toggle DevTools" },
                    { type: "separator" },
                    { role: "resetzoom", label: "🔎 Reset Zoom" },
                    { role: "zoomin", label: "➕ Zoom In" },
                    { role: "zoomout", label: "➖ Zoom Out" },
                    { type: "separator" },
                    {
                        label: "🖥️ Toggle Fullscreen",
                        accelerator: "F11",
                        role: "togglefullscreen",
                    },
                    { type: "separator" },
                    {
                        label: "♿ Accessibility",
                        submenu: [
                            {
                                label: "🔡 Font Size",
                                submenu: [
                                    {
                                        label: "🅰️ Extra Small",
                                        type: "radio",
                                        checked: getConf().get("fontSize", "medium") === "xsmall",
                                        click: () => {
                                            getConf().set("fontSize", "xsmall");
                                            const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                                            if (win && win.webContents) {
                                                win.webContents.send("set-font-size", "xsmall");
                                            }
                                        },
                                    },
                                    {
                                        label: "🔠 Small",
                                        type: "radio",
                                        checked: getConf().get("fontSize", "medium") === "small",
                                        click: () => {
                                            getConf().set("fontSize", "small");
                                            const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                                            if (win && win.webContents) {
                                                win.webContents.send("set-font-size", "small");
                                            }
                                        },
                                    },
                                    {
                                        label: "🔤 Medium",
                                        type: "radio",
                                        checked: getConf().get("fontSize", "medium") === "medium",
                                        click: () => {
                                            getConf().set("fontSize", "medium");
                                            const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                                            if (win && win.webContents) {
                                                win.webContents.send("set-font-size", "medium");
                                            }
                                        },
                                    },
                                    {
                                        label: "🔡 Large",
                                        type: "radio",
                                        checked: getConf().get("fontSize", "medium") === "large",
                                        click: () => {
                                            getConf().set("fontSize", "large");
                                            const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                                            if (win && win.webContents) {
                                                win.webContents.send("set-font-size", "large");
                                            }
                                        },
                                    },
                                    {
                                        label: "🅰️ Extra Large",
                                        type: "radio",
                                        checked: getConf().get("fontSize", "medium") === "xlarge",
                                        click: () => {
                                            getConf().set("fontSize", "xlarge");
                                            const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                                            if (win && win.webContents) {
                                                win.webContents.send("set-font-size", "xlarge");
                                            }
                                        },
                                    },
                                ],
                            },
                            {
                                label: "🎨 High Contrast Mode",
                                submenu: [
                                    {
                                        label: "⬛ Black (Default)",
                                        type: "radio",
                                        checked: getConf().get("highContrast", "black") === "black",
                                        click: () => {
                                            getConf().set("highContrast", "black");
                                            const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                                            if (win && win.webContents) {
                                                win.webContents.send("set-high-contrast", "black");
                                            }
                                        },
                                    },
                                    {
                                        label: "⬜ White",
                                        type: "radio",
                                        checked: getConf().get("highContrast", "black") === "white",
                                        click: () => {
                                            getConf().set("highContrast", "white");
                                            const win = BrowserWindow.getFocusedWindow() || mainWindow;
                                            if (win && win.webContents) {
                                                win.webContents.send("set-high-contrast", "white");
                                            }
                                        },
                                    },
                                    {
                                        label: "🟨 Yellow",
                                        type: "radio",
                                        checked: getConf().get("highContrast", "black") === "yellow",
                                        click: () => {
                                            getConf().set("highContrast", "yellow");
                                            const win = BrowserWindow.getFocusedWindow() || mainWindow;
                                            if (win && win.webContents) {
                                                win.webContents.send("set-high-contrast", "yellow");
                                            }
                                        },
                                    },
                                    {
                                        label: "🚫 Off",
                                        type: "radio",
                                        checked: getConf().get("highContrast", "off") === "off",
                                        click: () => {
                                            getConf().set("highContrast", "off");
                                            const win = BrowserWindow.getFocusedWindow() || mainWindow;
                                            if (win && win.webContents) {
                                                win.webContents.send("set-high-contrast", "off");
                                            }
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                label: "⚙️ Settings",
                submenu: [
                    {
                        label: "🎨 Theme",
                        submenu: [
                            {
                                label: "🌑 Dark",
                                type: "radio",
                                checked: theme === "dark" || !theme,
                                click: () => {
                                    setTheme("dark");
                                    const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                                    if (win && win.webContents) {
                                        win.webContents.send("set-theme", "dark");
                                    }
                                },
                            },
                            {
                                label: "🌕 Light",
                                type: "radio",
                                checked: theme === "light",
                                click: () => {
                                    setTheme("light");
                                    const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                                    if (win && win.webContents) {
                                        win.webContents.send("set-theme", "light");
                                    }
                                },
                            },
                        ],
                    },
                    {
                        label: "📊 Summary Columns...",
                        enabled: Boolean(loadedFitFilePath),
                        click: () => {
                            const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                            if (win && win.webContents) {
                                win.webContents.send("open-summary-column-selector");
                            }
                        },
                    },
                    decoderOptionsMenu,
                    {
                        label: "🔄 Check for Updates...",
                        click: () => {
                            const win = mainWindow || (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function" ? BrowserWindow.getFocusedWindow() : null);
                            if (win && win.webContents) {
                                win.webContents.send("menu-check-for-updates");
                            }
                        },
                    },
                ],
            },
            {
                label: "❓ Help",
                submenu: [
                    {
                        label: "ℹ️ About",
                        click: () => {
                            const win = BrowserWindow.getFocusedWindow() || mainWindow;
                            if (win && win.webContents) {
                                win.webContents.send("menu-about");
                            }
                        },
                    },
                    { type: "separator" },
                    {
                        label: "📖 Documentation",
                        click: () => {
                            if (shell && typeof shell.openExternal === "function") {
                                shell.openExternal(
                                    "https://github.com/Nick2bad4u/FitFileViewer#readme"
                                );
                            }
                        },
                    },
                    {
                        label: "🌐 GitHub Repository",
                        click: () => {
                            if (shell && typeof shell.openExternal === "function") {
                                shell.openExternal("https://github.com/Nick2bad4u/FitFileViewer");
                            }
                        },
                    },
                    {
                        label: "❗Report an Issue",
                        click: () => {
                            if (shell && typeof shell.openExternal === "function") {
                                shell.openExternal(
                                    "https://github.com/Nick2bad4u/FitFileViewer/issues"
                                );
                            }
                        },
                    },
                    { type: "separator" },
                    {
                        label: "⌨️ Keyboard Shortcuts",
                        click: () => {
                            const win = BrowserWindow.getFocusedWindow() || mainWindow;
                            if (win && win.webContents) {
                                win.webContents.send("menu-keyboard-shortcuts");
                            }
                        },
                    },
                    {
                        label: "🔄 Restart and Update",
                        enabled: false, // Will be enabled via IPC when update is downloaded
                        id: "restart-update",
                        click: () => {
                            const win = BrowserWindow.getFocusedWindow() || mainWindow;
                            if (win && win.webContents) {
                                win.webContents.send("menu-restart-update");
                            }
                        },
                    },
                ],
            },
        ];

    if (!app || !app.isPackaged) {
        // Log only the menu labels for debugging, avoid full serialization
        const menuLabels = template.map((item) => /** @type {Record<string, any>} */(item)["label"]);
        console.log("[createAppMenu] Setting application menu. Menu labels:", menuLabels);
        try {
            console.log("[createAppMenu] Debug: recentFiles loaded:", Array.isArray(recentFiles) ? recentFiles.slice() : recentFiles);
        } catch { }
    }
    if (!Array.isArray(template) || template.length === 0) {
        console.warn(
            "[createAppMenu] WARNING: Attempted to set an empty or invalid menu template. Skipping Menu.setApplicationMenu."
        );
        return;
    }
    try {
        if (Menu && typeof Menu.buildFromTemplate === "function") {
            mainMenu = Menu.buildFromTemplate(template);
            Menu.setApplicationMenu(mainMenu);
            return;
        }
        // In test/SSR environment without Menu API, expose template via a well-known global hook
        try {
            // @ts-ignore
            if (globalThis && !globalThis.__lastBuiltMenuTemplate) {
                // @ts-ignore
                globalThis.__lastBuiltMenuTemplate = template;
            } else if (globalThis) {
                // @ts-ignore
                globalThis.__lastBuiltMenuTemplate = template;
            }
        } catch { }
        console.warn("[createAppMenu] WARNING: Electron Menu API unavailable; template exposed for tests.");
    } catch (err) {
        console.error("[createAppMenu] ERROR: Failed to set application menu:", err);
    }
}

module.exports = { createAppMenu };
