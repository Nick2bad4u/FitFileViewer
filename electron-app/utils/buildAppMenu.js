/* eslint-env node */
const { loadRecentFiles, getShortRecentName } = require("./recentFiles");
const { Menu, BrowserWindow, app } = require("electron");
const { Conf } = require("electron-conf");
const conf = new Conf({ name: "settings" });

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
    return conf.get("decoderOptions", decoderOptionDefaults);
}

function setDecoderOption(key, value) {
    const options = getDecoderOptions();
    options[key] = value;
    conf.set("decoderOptions", options);
    return options;
}

function getTheme() {
    return conf.get("theme", "dark");
}

function setTheme(theme) {
    conf.set("theme", theme);
}

// Add platform-specific (macOS) App menu for About, Preferences, and Quit
function getPlatformAppMenu(mainWindow) {
    if (process.platform === "darwin") {
        return [
            {
                label: app.name,
                submenu: [
                    {
                        label: "About",
                        role: "about",
                        click: () => {
                            const win = BrowserWindow.getFocusedWindow() || mainWindow;
                            if (win && win.webContents) win.webContents.send("menu-about");
                        },
                    },
                    { type: "separator" },
                    {
                        label: "Preferences...",
                        accelerator: "CmdOrCtrl+,",
                        click: () => {
                            const win = BrowserWindow.getFocusedWindow() || mainWindow;
                            if (win && win.webContents) win.webContents.send("menu-preferences");
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
    } else {
        // For Windows/Linux, add About and Preferences to Help menu
        return [];
    }
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
function buildAppMenu(mainWindow, currentTheme = null, loadedFitFilePath = null) {
    const theme = currentTheme || getTheme();
    const recentFiles = loadRecentFiles();
    if (!app.isPackaged) {
        console.log("[buildAppMenu] Called with:", { theme, loadedFitFilePath, recentFiles });
    }

    const recentMenuItems =
        recentFiles.length > 0
            ? recentFiles.map((file) => ({
                  label: getShortRecentName(file),
                  tooltip: file,
                  click: () => {
                      if (mainWindow && mainWindow.webContents) {
                          mainWindow.webContents.send("open-recent-file", file);
                      }
                  },
              }))
            : [{ label: "No Recent Files", enabled: false }];

    const decoderOptions = getDecoderOptions();
    const decoderOptionEmojis = {
        applyScaleAndOffset: "📏",
        expandSubFields: "🧩",
        expandComponents: "🔗",
        convertTypesToStrings: "🔤",
        convertDateTimesToDates: "📅",
        includeUnknownData: "❓",
        mergeHeartRates: "❤️",
    };
    function createDecoderOptionMenuItems(decoderOptions, decoderOptionEmojis, mainWindow) {
        return Object.keys(decoderOptionDefaults).map((key) => ({
            label: `${decoderOptionEmojis[key] || ""} ${key}`.trim(),
            type: "checkbox",
            checked: !!decoderOptions[key],
            click: (menuItem) => {
                const newOptions = setDecoderOption(key, menuItem.checked);
                const win = BrowserWindow.getFocusedWindow() || mainWindow;
                if (win && win.webContents) {
                    win.webContents.send("decoder-options-changed", newOptions);
                }
            },
        }));
    }

    const decoderOptionsMenu = {
        label: "💿 Decoder Options",
        submenu: createDecoderOptionMenuItems(decoderOptions, decoderOptionEmojis, mainWindow),
    };

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
                                const win = BrowserWindow.getFocusedWindow() || mainWindow;
                                conf.set("recentFiles", []);
                                if (win && win.webContents) {
                                    win.webContents.send("show-notification", "Recent files cleared.", "info");
                                    win.webContents.send("unload-fit-file");
                                }
                                buildAppMenu(win, getTheme(), null);
                            },
                        },
                    ],
                },
                { type: "separator" },
                {
                    label: "❌ Unload File",
                    enabled: !!loadedFitFilePath,
                    click: () => {
                        const win = BrowserWindow.getFocusedWindow() || mainWindow;
                        if (win && win.webContents) {
                            win.webContents.send("unload-fit-file");
                        }
                    },
                },
                {
                    label: "💾 Save As...",
                    enabled: !!loadedFitFilePath,
                    accelerator: "CmdOrCtrl+S",
                    click: () => {
                        const win = BrowserWindow.getFocusedWindow() || mainWindow;
                        if (win && win.webContents) {
                            win.webContents.send("menu-save-as");
                        }
                    },
                },
                {
                    label: "📤 Export...",
                    enabled: !!loadedFitFilePath,
                    click: () => {
                        const win = BrowserWindow.getFocusedWindow() || mainWindow;
                        if (win && win.webContents) {
                            win.webContents.send("menu-export");
                        }
                    },
                },
                {
                    label: "🖨️ Print...",
                    enabled: !!loadedFitFilePath,
                    accelerator: "CmdOrCtrl+P",
                    click: () => {
                        const win = BrowserWindow.getFocusedWindow() || mainWindow;
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
                                    checked: conf.get("fontSize", "medium") === "xsmall",
                                    click: () => {
                                        conf.set("fontSize", "xsmall");
                                        const win = BrowserWindow.getFocusedWindow() || mainWindow;
                                        if (win && win.webContents) win.webContents.send("set-font-size", "xsmall");
                                    },
                                },
                                {
                                    label: "🔠 Small",
                                    type: "radio",
                                    checked: conf.get("fontSize", "medium") === "small",
                                    click: () => {
                                        conf.set("fontSize", "small");
                                        const win = BrowserWindow.getFocusedWindow() || mainWindow;
                                        if (win && win.webContents) win.webContents.send("set-font-size", "small");
                                    },
                                },
                                {
                                    label: "🔤 Medium",
                                    type: "radio",
                                    checked: conf.get("fontSize", "medium") === "medium",
                                    click: () => {
                                        conf.set("fontSize", "medium");
                                        const win = BrowserWindow.getFocusedWindow() || mainWindow;
                                        if (win && win.webContents) win.webContents.send("set-font-size", "medium");
                                    },
                                },
                                {
                                    label: "🔡 Large",
                                    type: "radio",
                                    checked: conf.get("fontSize", "medium") === "large",
                                    click: () => {
                                        conf.set("fontSize", "large");
                                        const win = BrowserWindow.getFocusedWindow() || mainWindow;
                                        if (win && win.webContents) win.webContents.send("set-font-size", "large");
                                    },
                                },
                                {
                                    label: "🅰️ Extra Large",
                                    type: "radio",
                                    checked: conf.get("fontSize", "medium") === "xlarge",
                                    click: () => {
                                        conf.set("fontSize", "xlarge");
                                        const win = BrowserWindow.getFocusedWindow() || mainWindow;
                                        if (win && win.webContents) win.webContents.send("set-font-size", "xlarge");
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
                                    checked: conf.get("highContrast", "black") === "black",
                                    click: () => {
                                        conf.set("highContrast", "black");
                                        const win = BrowserWindow.getFocusedWindow() || mainWindow;
                                        if (win && win.webContents) win.webContents.send("set-high-contrast", "black");
                                    },
                                },
                                {
                                    label: "⬜ White",
                                    type: "radio",
                                    checked: conf.get("highContrast", "black") === "white",
                                    click: () => {
                                        conf.set("highContrast", "white");
                                        const win = BrowserWindow.getFocusedWindow() || mainWindow;
                                        if (win && win.webContents) win.webContents.send("set-high-contrast", "white");
                                    },
                                },
                                {
                                    label: "🟨 Yellow",
                                    type: "radio",
                                    checked: conf.get("highContrast", "black") === "yellow",
                                    click: () => {
                                        conf.set("highContrast", "yellow");
                                        const win = BrowserWindow.getFocusedWindow() || mainWindow;
                                        if (win && win.webContents) win.webContents.send("set-high-contrast", "yellow");
                                    },
                                },
                                {
                                    label: "🚫 Off",
                                    type: "radio",
                                    checked: conf.get("highContrast", "off") === "off",
                                    click: () => {
                                        conf.set("highContrast", "off");
                                        const win = BrowserWindow.getFocusedWindow() || mainWindow;
                                        if (win && win.webContents) win.webContents.send("set-high-contrast", "off");
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
                                const win = BrowserWindow.getFocusedWindow() || mainWindow;
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
                                const win = BrowserWindow.getFocusedWindow() || mainWindow;
                                if (win && win.webContents) {
                                    win.webContents.send("set-theme", "light");
                                }
                            },
                        },
                    ],
                },
                {
                    label: "📊 Summary Columns...",
                    enabled: !!loadedFitFilePath,
                    click: () => {
                        const win = BrowserWindow.getFocusedWindow() || mainWindow;
                        if (win && win.webContents) {
                            win.webContents.send("open-summary-column-selector");
                        }
                    },
                },
                decoderOptionsMenu,
                {
                    label: "🔄 Check for Updates...",
                    click: () => {
                        const win = BrowserWindow.getFocusedWindow() || mainWindow;
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
                        require("electron").shell.openExternal("https://github.com/Nick2bad4u/FitFileViewer#readme");
                    },
                },
                {
                    label: "🌐 GitHub Repository",
                    click: () => {
                        require("electron").shell.openExternal("https://github.com/Nick2bad4u/FitFileViewer");
                    },
                },
                {
                    label: "❗Report an Issue",
                    click: () => {
                        require("electron").shell.openExternal("https://github.com/Nick2bad4u/FitFileViewer/issues");
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

    if (!app.isPackaged) {
        // Log only the menu labels for debugging, avoid full serialization
        const menuLabels = template.map((item) => item.label);
        console.log("[buildAppMenu] Setting application menu. Menu labels:", menuLabels);
    }
    if (!Array.isArray(template) || template.length === 0) {
        console.warn("[buildAppMenu] WARNING: Attempted to set an empty or invalid menu template. Skipping Menu.setApplicationMenu.");
        return;
    }
    try {
        mainMenu = Menu.buildFromTemplate(template);
        console.log("[buildAppMenu] Menu built and assigned to mainMenu:", !!mainMenu);
        Menu.setApplicationMenu(mainMenu);
        console.log("[buildAppMenu] Menu set successfully.");
    } catch (err) {
        console.error("[buildAppMenu] ERROR: Failed to set application menu:", err);
    }
}

module.exports = { buildAppMenu };
