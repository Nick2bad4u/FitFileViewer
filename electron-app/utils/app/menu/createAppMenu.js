// Lazily resolve Electron at call-time so Vitest's vi.mock('electron') can hook properly
/** @type {any|null} */
let __electronCached = null;
function getElectron() {
    // Prefer the latest hoisted mock in test environments to avoid stale caches
    try {
        // @ts-ignore
        const hoisted =
            typeof globalThis === "undefined" ? null : /** @type {any} */ (globalThis).__electronHoistedMock;
        if (hoisted) {
            __electronCached = hoisted;
            return hoisted;
        }
    } catch {
        /* ignore */
    }
    if (
        __electronCached &&
        /** @type {any} */ (
            __electronCached.Menu ||
                /** @type {any} */ (__electronCached).app ||
                /** @type {any} */ (__electronCached).BrowserWindow
        )
    ) {
        return __electronCached;
    }
    try {
        const e = require("electron");
        __electronCached = /** @type {any} */ (e);
        return /** @type {any} */ (e);
    } catch {
        try {
            // Fallback to hoisted mock if available
            // @ts-ignore
            const hoisted2 =
                typeof globalThis === "undefined" ? null : /** @type {any} */ (globalThis).__electronHoistedMock;
            if (hoisted2) {
                __electronCached = hoisted2;
                return hoisted2;
            }
        } catch {
            /* ignore */
        }
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
    } catch {
        // Fallback simple in-memory store for non-Electron/test environments
        /** @type {{ _store: Record<string, any>, get: (k: string, d?: any) => any, set: (k: string, v: any) => void }} */
        const fallback = {
            _store: {},
            get(key, def) {
                return Object.hasOwn(this._store, key) ? this._store[key] : def;
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

/**
 * Open a URL in the user's browser using the centralized allow/deny policy.
 * This is defense-in-depth: menu URLs are hard-coded, but keeping validation
 * consistent prevents future regressions from accidentally introducing unsafe
 * schemes.
 *
 * @param {string} url
 */
function safeOpenExternal(url) {
    try {
        // Local module, no Electron dependency.
        const { validateExternalUrl } = require("../../../main/security/externalUrlPolicy");
        const validated = validateExternalUrl(url);
        const { shell: sh } = /** @type {any} */ (getElectron());
        if (sh && typeof sh.openExternal === "function") {
            Promise.resolve(sh.openExternal(validated)).catch(() => {
                /* ignore */
            });
        }
    } catch {
        /* ignore */
    }
}

const decoderOptionDefaults = {
    applyScaleAndOffset: true,
    convertDateTimesToDates: true,
    convertTypesToStrings: true,
    expandComponents: true,
    expandSubFields: true,
    includeUnknownData: true,
    mergeHeartRates: true,
};

/**
 * Builds and sets the application menu for the Electron app.
 * The menu includes File, Edit, View, Window, and Settings menus, with support for opening files,
 * displaying a list of recent files, and standard menu roles.
 *
 * @param {Electron.BrowserWindow} mainWindow - The main application window to which menu actions are dispatched.
 * @param {string} [currentTheme=null] - The current theme of the application, used to set the checked state of theme radio buttons.
 * @param {string|null} [loadedFitFilePath=null] - The path of the loaded FIT file, used to enable/disable the Summary Columns menu item.
 */
function createAppMenu(mainWindow, currentTheme, loadedFitFilePath) {
    const el = /** @type {any} */ (getElectron());
    try {
        if (!el || !el.Menu) {
            // Provide visibility into why Menu isn't present in CI

            console.warn("[createAppMenu] Debug: electron module keys:", Object.keys(el || {}));
        }
    } catch {
        /* Ignore errors */
    }
    const { app, BrowserWindow, Menu, shell, clipboard } = /** @type {any} */ (el);
    const isUsableWindow = (candidate) => {
        if (!candidate) {
            return false;
        }
        if (typeof candidate.isDestroyed === "function" && candidate.isDestroyed()) {
            return false;
        }
        return true;
    };
    const resolveTargetWindow = () => {
        if (isUsableWindow(mainWindow)) {
            return mainWindow;
        }
        if (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function") {
            const focused = BrowserWindow.getFocusedWindow();
            if (isUsableWindow(focused)) {
                return focused;
            }
        }
        return null;
    };
    const sendToRenderer = (channel, ...args) => {
        const win = resolveTargetWindow();
        if (win && win.webContents) {
            win.webContents.send(channel, ...args);
            return true;
        }
        return false;
    };
    const usingPassedTheme = typeof currentTheme === "string";
    const theme = usingPassedTheme ? currentTheme : getTheme();
    // Allow tests to inject recent files deterministically via a global hook
    /** @type {string[]} */
    let injectedRecentFiles = [];
    /** @type {boolean} */
    let hasInjectedRecentFiles = false;
    try {
        // @ts-ignore
        const gf = typeof globalThis === "undefined" ? /** @type {any} */ undefined : globalThis.__mockRecentFiles;
        if (Array.isArray(gf)) {
            injectedRecentFiles = [...gf];
            hasInjectedRecentFiles = true;
        }
    } catch {
        /* Ignore errors */
    }
    // Lazy import recent files utils to ensure vi.mock hooks correctly
    /** @type {{ loadRecentFiles: () => string[], getShortRecentName: (p: string) => string }} */
    let recentUtils;
    try {
        recentUtils = require("../../../utils/files/recent/recentFiles");
    } catch {
        // Some builds may have a different relative path
        try {
            recentUtils = require("../../../utils/files/recent/recentFiles");
        } catch {
            recentUtils = /** @type {any} */ ({
                getShortRecentName: (/** @type {string} */ p) => p,
                loadRecentFiles: () => [],
            });
        }
    }
    // If tests injected recent files (even an empty array), honor that verbatim.
    // Otherwise, fall back to loading from recent files utility.
    const recentFiles = hasInjectedRecentFiles
        ? injectedRecentFiles
        : /** @type {string[]} */ (recentUtils.loadRecentFiles());

    // Best-effort file access policy integration.
    // This module is used in the main process; approving here ensures renderer readFile calls
    // can be authorized after a user clicks a recent file menu item.
    /** @type {null | { approveFilePath: (p: unknown, options?: { source?: string }) => string }} */
    let fileAccessPolicy = null;
    try {
        fileAccessPolicy = require("../../../main/security/fileAccessPolicy");
    } catch {
        fileAccessPolicy = null;
    }
    // If (!app.isPackaged) {
    //     Console.log("[createAppMenu] Called with:", { theme, loadedFitFilePath, recentFiles });
    // }

    /** @type {any[]} */
    const decoderOptionEmojis = {
            applyScaleAndOffset: "📏",
            convertDateTimesToDates: "📅",
            convertTypesToStrings: "🔤",
            expandComponents: "🔗",
            expandSubFields: "🧩",
            includeUnknownData: "❓",
            mergeHeartRates: "❤️",
        },
        decoderOptions = getDecoderOptions(),
        recentMenuItems =
            recentFiles.length > 0
                ? recentFiles.map((/** @type {string} */ file) => ({
                      click: () => {
                          try {
                              fileAccessPolicy?.approveFilePath(file, { source: "menu:openRecent" });
                          } catch {
                              // Non-fatal: if approval fails, the renderer may not be able to read
                              // the file depending on security policy.
                          }
                          if (!sendToRenderer("open-recent-file", file)) {
                              console.warn("[createAppMenu] No active window available to open recent file.");
                          }
                      },
                      label: recentUtils.getShortRecentName(file),
                  }))
                : [{ enabled: false, label: "No Recent Files" }];
    const clearRecentMenuItem = {
        click: () => {
            const win = resolveTargetWindow();
            getConf().set("recentFiles", []);
            try {
                if (app && typeof app.clearRecentDocuments === "function") {
                    app.clearRecentDocuments();
                }
            } catch (error) {
                console.warn("[createAppMenu] Failed to clear native recent documents:", error);
            }
            if (win && win.webContents) {
                win.webContents.send("show-notification", "Recent files cleared.", "info");
                win.webContents.send("unload-fit-file");
            }
            createAppMenu(win, /** @type {string} */ (getTheme()));
        },
        enabled: recentFiles.length > 0,
        label: "🧹 Clear Recent Files",
    };
    const recentSubmenuItems =
        recentFiles.length > 0
            ? [...recentMenuItems, { type: "separator" }, clearRecentMenuItem]
            : [...recentMenuItems, clearRecentMenuItem];
    const revealLabel =
        process.platform === "darwin"
            ? "Reveal in Finder"
            : process.platform === "linux"
              ? "Reveal in File Manager"
              : "Reveal in File Explorer";
    /**
     * @param {*} _decoderOptions
     * @param {*} _decoderOptionEmojis
     * @param {*} _mainWindow
     */
    function createDecoderOptionMenuItems(_decoderOptions, _decoderOptionEmojis, _mainWindow) {
        return Object.keys(decoderOptionDefaults).map((key) => ({
            checked: Boolean(_decoderOptions[key]),
            click: /** @param {*} menuItem */ (menuItem) => {
                const newOptions = setDecoderOption(key, menuItem.checked),
                    win =
                        _mainWindow ||
                        (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
                            ? BrowserWindow.getFocusedWindow()
                            : null);
                if (win && win.webContents) {
                    win.webContents.send("decoder-options-changed", newOptions);
                }
            },
            label: `${_decoderOptionEmojis[key] || ""} ${key}`.trim(),
            type: "checkbox",
        }));
    }

    const decoderOptionsMenu = {
        label: "💿 Decoder Options",
        submenu: createDecoderOptionMenuItems(decoderOptions, decoderOptionEmojis, mainWindow),
    };
    const isMac = process.platform === "darwin";
    const fileMenuItems = [
        {
            accelerator: "CmdOrCtrl+O",
            click: () => {
                sendToRenderer("menu-open-file");
            },
            label: "📂 Open FIT File...",
        },
        {
            accelerator: "CmdOrCtrl+Shift+O",
            click: () => {
                sendToRenderer("menu-open-overlay");
            },
            enabled: Boolean(loadedFitFilePath),
            label: "➕ Add FIT Files as Overlays...",
        },
        { type: "separator" },
        {
            label: "🕑 Open Recent",
            submenu: recentSubmenuItems,
        },
        { type: "separator" },
        {
            click: () => {
                sendToRenderer("unload-fit-file");
            },
            enabled: Boolean(loadedFitFilePath),
            label: "❌ Unload File",
        },
        {
            accelerator: "CmdOrCtrl+Alt+R",
            click: () => {
                if (!loadedFitFilePath) {
                    return;
                }
                try {
                    if (shell && typeof shell.showItemInFolder === "function") {
                        shell.showItemInFolder(loadedFitFilePath);
                    } else {
                        console.warn("[createAppMenu] shell.showItemInFolder unavailable.");
                        sendToRenderer(
                            "show-notification",
                            "Unable to reveal file location on this platform.",
                            "warning"
                        );
                    }
                } catch (error) {
                    console.error("[createAppMenu] Failed to reveal file in folder:", error);
                    sendToRenderer("show-notification", "Failed to reveal file in folder.", "error");
                }
            },
            enabled: Boolean(loadedFitFilePath),
            label: `📂 ${revealLabel}`,
        },
        {
            accelerator: "CmdOrCtrl+Alt+C",
            click: () => {
                if (!loadedFitFilePath) {
                    return;
                }
                try {
                    if (clipboard && typeof clipboard.writeText === "function") {
                        clipboard.writeText(loadedFitFilePath);
                        sendToRenderer("show-notification", "File path copied to clipboard.", "success");
                    } else {
                        console.warn("[createAppMenu] clipboard.writeText unavailable.");
                        sendToRenderer("show-notification", loadedFitFilePath, "info");
                    }
                } catch (error) {
                    console.error("[createAppMenu] Failed to copy file path:", error);
                    sendToRenderer("show-notification", "Failed to copy file path.", "error");
                }
            },
            enabled: Boolean(loadedFitFilePath),
            label: "📋 Copy File Path",
        },
        { type: "separator" },
        {
            accelerator: "CmdOrCtrl+S",
            click: () => {
                sendToRenderer("menu-save-as");
            },
            enabled: Boolean(loadedFitFilePath),
            label: "💾 Save As...",
        },
        {
            click: () => {
                sendToRenderer("menu-export");
            },
            enabled: Boolean(loadedFitFilePath),
            label: "📤 Export...",
        },
        {
            accelerator: "CmdOrCtrl+P",
            click: () => {
                sendToRenderer("menu-print");
            },
            enabled: Boolean(loadedFitFilePath),
            label: "🖨️ Print...",
        },
        { type: "separator" },
        {
            accelerator: "CmdOrCtrl+W",
            click: () => {
                const { BrowserWindow: BW } = /** @type {any} */ (getElectron());
                const win = BW && typeof BW.getFocusedWindow === "function" ? BW.getFocusedWindow() : null;
                if (win && typeof win.close === "function") {
                    win.close();
                }
            },
            label: "🚪 Close Window",
        },
    ];
    if (!isMac) {
        const quitLabel = process.platform === "win32" ? "❎ Exit" : "❎ Quit";
        fileMenuItems.push({ type: "separator" }, { label: quitLabel, role: "quit" });
    }
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
    const template = [
        ...getPlatformAppMenu(mainWindow),
        {
            label: "📁 File",
            submenu: fileMenuItems,
        },
        {
            label: "👁️ View",
            submenu: [
                { label: "🔄 Reload", role: "reload" },
                { label: "🔁 Force Reload", role: "forcereload" },
                { label: "🛠️ Toggle DevTools", role: "toggledevtools" },
                { type: "separator" },
                { label: "🔎 Reset Zoom", role: "resetzoom" },
                { label: "➕ Zoom In", role: "zoomin" },
                { label: "➖ Zoom Out", role: "zoomout" },
                { type: "separator" },
                {
                    accelerator: "F11",
                    label: "🖥️ Toggle Fullscreen",
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
                                    checked: getConf().get("fontSize", "medium") === "xsmall",
                                    click: () => {
                                        getConf().set("fontSize", "xsmall");
                                        const win =
                                            mainWindow ||
                                            (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
                                                ? BrowserWindow.getFocusedWindow()
                                                : null);
                                        if (win && win.webContents) {
                                            win.webContents.send("set-font-size", "xsmall");
                                        }
                                    },
                                    label: "🅰️ Extra Small",
                                    type: "radio",
                                },
                                {
                                    checked: getConf().get("fontSize", "medium") === "small",
                                    click: () => {
                                        getConf().set("fontSize", "small");
                                        const win =
                                            mainWindow ||
                                            (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
                                                ? BrowserWindow.getFocusedWindow()
                                                : null);
                                        if (win && win.webContents) {
                                            win.webContents.send("set-font-size", "small");
                                        }
                                    },
                                    label: "🔠 Small",
                                    type: "radio",
                                },
                                {
                                    checked: getConf().get("fontSize", "medium") === "medium",
                                    click: () => {
                                        getConf().set("fontSize", "medium");
                                        const win =
                                            mainWindow ||
                                            (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
                                                ? BrowserWindow.getFocusedWindow()
                                                : null);
                                        if (win && win.webContents) {
                                            win.webContents.send("set-font-size", "medium");
                                        }
                                    },
                                    label: "🔤 Medium",
                                    type: "radio",
                                },
                                {
                                    checked: getConf().get("fontSize", "medium") === "large",
                                    click: () => {
                                        getConf().set("fontSize", "large");
                                        const win =
                                            mainWindow ||
                                            (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
                                                ? BrowserWindow.getFocusedWindow()
                                                : null);
                                        if (win && win.webContents) {
                                            win.webContents.send("set-font-size", "large");
                                        }
                                    },
                                    label: "🔡 Large",
                                    type: "radio",
                                },
                                {
                                    checked: getConf().get("fontSize", "medium") === "xlarge",
                                    click: () => {
                                        getConf().set("fontSize", "xlarge");
                                        const win =
                                            mainWindow ||
                                            (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
                                                ? BrowserWindow.getFocusedWindow()
                                                : null);
                                        if (win && win.webContents) {
                                            win.webContents.send("set-font-size", "xlarge");
                                        }
                                    },
                                    label: "🅰️ Extra Large",
                                    type: "radio",
                                },
                            ],
                        },
                        {
                            label: "🎨 High Contrast Mode",
                            submenu: [
                                {
                                    checked: getConf().get("highContrast", "black") === "black",
                                    click: () => {
                                        getConf().set("highContrast", "black");
                                        const win =
                                            mainWindow ||
                                            (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
                                                ? BrowserWindow.getFocusedWindow()
                                                : null);
                                        if (win && win.webContents) {
                                            win.webContents.send("set-high-contrast", "black");
                                        }
                                    },
                                    label: "⬛ Black (Default)",
                                    type: "radio",
                                },
                                {
                                    checked: getConf().get("highContrast", "black") === "white",
                                    click: () => {
                                        getConf().set("highContrast", "white");
                                        const { BrowserWindow: BW } = /** @type {any} */ (getElectron());
                                        const win =
                                            (BW && typeof BW.getFocusedWindow === "function"
                                                ? BW.getFocusedWindow()
                                                : null) || mainWindow;
                                        if (win && win.webContents) {
                                            win.webContents.send("set-high-contrast", "white");
                                        }
                                    },
                                    label: "⬜ White",
                                    type: "radio",
                                },
                                {
                                    checked: getConf().get("highContrast", "black") === "yellow",
                                    click: () => {
                                        getConf().set("highContrast", "yellow");
                                        const { BrowserWindow: BW } = /** @type {any} */ (getElectron());
                                        const win =
                                            (BW && typeof BW.getFocusedWindow === "function"
                                                ? BW.getFocusedWindow()
                                                : null) || mainWindow;
                                        if (win && win.webContents) {
                                            win.webContents.send("set-high-contrast", "yellow");
                                        }
                                    },
                                    label: "🟨 Yellow",
                                    type: "radio",
                                },
                                {
                                    checked: getConf().get("highContrast", "off") === "off",
                                    click: () => {
                                        getConf().set("highContrast", "off");
                                        const { BrowserWindow: BW } = /** @type {any} */ (getElectron());
                                        const win =
                                            (BW && typeof BW.getFocusedWindow === "function"
                                                ? BW.getFocusedWindow()
                                                : null) || mainWindow;
                                        if (win && win.webContents) {
                                            win.webContents.send("set-high-contrast", "off");
                                        }
                                    },
                                    label: "🚫 Off",
                                    type: "radio",
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
                            // If no theme was passed in, default UI selection to dark
                            checked: usingPassedTheme ? theme === "dark" : true,
                            click: () => {
                                setTheme("dark");
                                const win =
                                    mainWindow ||
                                    (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
                                        ? BrowserWindow.getFocusedWindow()
                                        : null);
                                if (win && win.webContents) {
                                    win.webContents.send("set-theme", "dark");
                                }
                            },
                            label: "🌑 Dark",
                            type: "radio",
                        },
                        {
                            checked: usingPassedTheme ? theme === "light" : false,
                            click: () => {
                                setTheme("light");
                                const win =
                                    mainWindow ||
                                    (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
                                        ? BrowserWindow.getFocusedWindow()
                                        : null);
                                if (win && win.webContents) {
                                    win.webContents.send("set-theme", "light");
                                }
                            },
                            label: "🌕 Light",
                            type: "radio",
                        },
                    ],
                },
                {
                    click: () => {
                        const win =
                            mainWindow ||
                            (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
                                ? BrowserWindow.getFocusedWindow()
                                : null);
                        if (win && win.webContents) {
                            win.webContents.send("open-accent-color-picker");
                        }
                    },
                    label: "🎨 Accent Color...",
                },
                {
                    click: () => {
                        const win =
                            mainWindow ||
                            (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
                                ? BrowserWindow.getFocusedWindow()
                                : null);
                        if (win && win.webContents) {
                            win.webContents.send("open-summary-column-selector");
                        }
                    },
                    enabled: Boolean(loadedFitFilePath),
                    label: "📊 Summary Columns...",
                },
                decoderOptionsMenu,
                {
                    click: () => {
                        const win =
                            mainWindow ||
                            (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
                                ? BrowserWindow.getFocusedWindow()
                                : null);
                        if (win && win.webContents) {
                            win.webContents.send("menu-check-for-updates");
                        }
                    },
                    label: "🔄 Check for Updates...",
                },
            ],
        },
        {
            label: "❓ Help",
            submenu: [
                {
                    click: () => {
                        const { BrowserWindow: BW } = /** @type {any} */ (getElectron());
                        const win =
                            (BW && typeof BW.getFocusedWindow === "function" ? BW.getFocusedWindow() : null) ||
                            mainWindow;
                        if (win && win.webContents) {
                            win.webContents.send("menu-about");
                        }
                    },
                    label: "ℹ️ About",
                },
                { type: "separator" },
                {
                    click: () => {
                        safeOpenExternal("https://github.com/Nick2bad4u/FitFileViewer#readme");
                    },
                    label: "📖 Documentation",
                },
                {
                    click: () => {
                        safeOpenExternal("https://github.com/Nick2bad4u/FitFileViewer");
                    },
                    label: "🌐 GitHub Repository",
                },
                {
                    click: () => {
                        safeOpenExternal("https://github.com/Nick2bad4u/FitFileViewer/issues");
                    },
                    label: "❗Report an Issue",
                },
                { type: "separator" },
                {
                    click: () => {
                        const { BrowserWindow: BW } = /** @type {any} */ (getElectron());
                        const win =
                            (BW && typeof BW.getFocusedWindow === "function" ? BW.getFocusedWindow() : null) ||
                            mainWindow;
                        if (win && win.webContents) {
                            win.webContents.send("menu-keyboard-shortcuts");
                        }
                    },
                    label: "⌨️ Keyboard Shortcuts",
                },
                {
                    click: () => {
                        const { BrowserWindow: BW } = /** @type {any} */ (getElectron());
                        const win =
                            (BW && typeof BW.getFocusedWindow === "function" ? BW.getFocusedWindow() : null) ||
                            mainWindow;
                        if (win && win.webContents) {
                            win.webContents.send("menu-restart-update");
                        }
                    },
                    enabled: false, // Will be enabled via IPC when update is downloaded
                    id: "restart-update",
                    label: "🔄 Restart and Update",
                },
            ],
        },
    ];

    if (!app || !app.isPackaged) {
        // Log only the menu labels for debugging, avoid full serialization
        const menuLabels = template.map((item) => /** @type {Record<string, any>} */ (item).label);
        console.log("[createAppMenu] Setting application menu. Menu labels:", menuLabels);
        try {
            console.log(
                "[createAppMenu] Debug: recentFiles loaded:",
                Array.isArray(recentFiles) ? [...recentFiles] : recentFiles
            );
        } catch {
            /* Ignore errors */
        }
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
        } catch {
            /* Ignore errors */
        }
        console.warn("[createAppMenu] WARNING: Electron Menu API unavailable; template exposed for tests.");
    } catch (error) {
        console.error("[createAppMenu] ERROR: Failed to set application menu:", error);
    }
}

function getDecoderOptions() {
    return getConf().get("decoderOptions", decoderOptionDefaults);
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
                label: (app && app.name) || "App",
                submenu: [
                    {
                        click: () => {
                            const win =
                                mainWindow ||
                                (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
                                    ? BrowserWindow.getFocusedWindow()
                                    : null);
                            if (win && win.webContents) {
                                win.webContents.send("menu-about");
                            }
                        },
                        label: "About",
                        role: "about",
                    },
                    { type: "separator" },
                    {
                        accelerator: "CmdOrCtrl+,",
                        click: () => {
                            const win =
                                mainWindow ||
                                (BrowserWindow && typeof BrowserWindow.getFocusedWindow === "function"
                                    ? BrowserWindow.getFocusedWindow()
                                    : null);
                            if (win && win.webContents) {
                                win.webContents.send("menu-preferences");
                            }
                        },
                        label: "Preferences...",
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

function getTheme() {
    const value = getConf().get("theme", "dark");
    const t = typeof value === "string" ? value.trim().toLowerCase() : "";
    return t === "dark" || t === "light" || t === "auto" ? t : "dark";
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

/**
 * @param {*} theme
 */
function setTheme(theme) {
    getConf().set("theme", theme);
}

const createAppMenuExports = { createAppMenu };

if (typeof globalThis !== "undefined") {
    try {
        Object.defineProperty(globalThis, "__FFV_createAppMenuExports", {
            configurable: true,
            enumerable: false,
            value: createAppMenuExports,
            writable: true,
        });
    } catch {
        // Fallback if defineProperty fails (e.g., frozen globalThis)
        /** @type {any} */ (globalThis).__FFV_createAppMenuExports = createAppMenuExports;
    }
}

if (typeof module !== "undefined" && module && module.exports) {
    module.exports = createAppMenuExports;
}
