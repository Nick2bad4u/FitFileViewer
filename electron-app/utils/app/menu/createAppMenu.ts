// Lazily resolve Electron at call-time so Vitest's vi.mock('electron') can hook properly
type BrowserWindowLike = {
    close?: () => void;
    isDestroyed?: () => boolean;
    webContents?: {
        send: (channel: string, ...args: unknown[]) => void;
    };
};

type ConfLike = {
    get: (key: string, defaultValue?: unknown) => unknown;
    set: (key: string, value: unknown) => void;
};

type ElectronAppLike = {
    clearRecentDocuments?: () => void;
    isPackaged?: boolean;
    name?: string;
};

type ElectronBrowserWindowLike = {
    getFocusedWindow?: () => BrowserWindowLike | null | undefined;
};

type ElectronClipboardLike = {
    writeText?: (text: string) => void;
};

type ElectronMenuLike = {
    buildFromTemplate?: (template: MenuItemLike[]) => unknown;
    setApplicationMenu?: (menu: unknown) => void;
};

type ElectronShellLike = {
    openExternal?: (url: string) => Promise<unknown> | unknown;
    showItemInFolder?: (path: string) => void;
};

type ElectronLike = {
    app?: ElectronAppLike;
    BrowserWindow?: ElectronBrowserWindowLike;
    clipboard?: ElectronClipboardLike;
    Menu?: ElectronMenuLike;
    shell?: ElectronShellLike;
    [key: string]: unknown;
};

type MenuItemLike = {
    accelerator?: string;
    checked?: boolean;
    click?: (menuItem: MenuItemLike) => unknown;
    enabled?: boolean;
    id?: string;
    label?: string;
    role?: string;
    submenu?: MenuItemLike[];
    type?: string;
    visible?: boolean;
    [key: string]: unknown;
};

type RecentFilesUtils = {
    getShortRecentName: (path: string) => string;
    loadRecentFiles: () => string[];
};

type FileAccessPolicy = {
    approveFilePath: (path: unknown, options?: { source?: string }) => string;
};

type FitFileViewerGlobal = typeof globalThis & {
    __electronHoistedMock?: ElectronLike;
    __FFV_createAppMenuExports?: { createAppMenu: typeof createAppMenu };
    __FFV_debugMenu?: boolean;
    __lastBuiltMenuTemplate?: MenuItemLike[];
    __mockRecentFiles?: unknown;
};

function getMenuGlobal(): FitFileViewerGlobal {
    return globalThis as FitFileViewerGlobal;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

let __electronCached: ElectronLike | null = null;
function getElectron(): ElectronLike {
    // Prefer the latest hoisted mock in test environments to avoid stale caches
    try {
        const hoisted =
            typeof globalThis === "undefined"
                ? null
                : getMenuGlobal().__electronHoistedMock;
        if (hoisted) {
            __electronCached = hoisted;
            return hoisted;
        }
    } catch {
        /* ignore */
    }
    if (
        __electronCached &&
        (__electronCached["Menu"] ||
            __electronCached["app"] ||
            __electronCached["BrowserWindow"])
    ) {
        return __electronCached;
    }
    try {
        const e = require("electron") as ElectronLike;
        __electronCached = e;
        return e;
    } catch {
        try {
            // Fallback to hoisted mock if available
            const hoisted2 =
                typeof globalThis === "undefined"
                    ? null
                    : getMenuGlobal().__electronHoistedMock;
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
let __confInstance: ConfLike | null = null;
function getConf(): ConfLike {
    if (__confInstance) return __confInstance;
    try {
        const { Conf } = require("electron-conf") as {
            Conf: new (options: { name: string }) => ConfLike;
        };
        __confInstance = new Conf({ name: "settings" });
        return __confInstance;
    } catch {
        // Fallback simple in-memory store for non-Electron/test environments
        const fallback: ConfLike & { _store: Record<string, unknown> } = {
            _store: {},
            get(key: string, def?: unknown): unknown {
                return Object.hasOwn(this._store, key) ? this._store[key] : def;
            },
            set(key: string, val: unknown): void {
                this._store[key] = val;
            },
        };
        __confInstance = fallback;
        return __confInstance;
    }
}

// Persistent reference to prevent menu GC/disappearance on Linux.
// See: https://github.com/electron/electron/issues/18397
let mainMenu: unknown = null;

// Determine if verbose createAppMenu debug logging should be enabled.
function shouldLogMenuDebug() {
    try {
        const envFlag =
            typeof process !== "undefined" &&
            Boolean(process.env) &&
            process.env["FFV_DEBUG_MENU"] === "1";
        const globalFlag =
            typeof globalThis !== "undefined" &&
            Boolean(getMenuGlobal().__FFV_debugMenu);
        return envFlag || globalFlag;
    } catch {
        return false;
    }
}

/**
 * Open a URL in the user's browser using the centralized allow/deny policy.
 * This is defense-in-depth: menu URLs are hard-coded, but keeping validation
 * consistent prevents future regressions from accidentally introducing unsafe
 * schemes.
 */
function safeOpenExternal(url: string): void {
    try {
        // Local module, no Electron dependency.
        const {
            validateExternalUrl,
        } = require("../../../main/security/externalUrlPolicy");
        const validated = validateExternalUrl(url);
        const { shell: sh } = getElectron();
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
 * Builds and sets the application menu for the Electron app. The menu includes
 * File, Edit, View, Window, and Settings menus, with support for opening files,
 * displaying a list of recent files, and standard menu roles.
 */
function createAppMenu(
    mainWindow: BrowserWindowLike | null | undefined,
    currentTheme: string | null = null,
    loadedFitFilePath: string | null = null
): void {
    const el = getElectron();
    try {
        if (!el || !el["Menu"]) {
            // Provide visibility into why Menu isn't present in CI

            console.warn(
                "[createAppMenu] Debug: electron module keys:",
                Object.keys(el || {})
            );
        }
    } catch {
        /* Ignore errors */
    }
    const { app, BrowserWindow, Menu, shell, clipboard } = el;
    const isUsableWindow = (
        candidate: BrowserWindowLike | null | undefined
    ): candidate is BrowserWindowLike => {
        if (!candidate) {
            return false;
        }
        if (
            typeof candidate.isDestroyed === "function" &&
            candidate.isDestroyed()
        ) {
            return false;
        }
        return true;
    };
    const resolveTargetWindow = (): BrowserWindowLike | null => {
        if (isUsableWindow(mainWindow)) {
            return mainWindow;
        }
        if (
            BrowserWindow &&
            typeof BrowserWindow.getFocusedWindow === "function"
        ) {
            const focused = BrowserWindow.getFocusedWindow() as
                | BrowserWindowLike
                | null
                | undefined;
            if (isUsableWindow(focused)) {
                return focused;
            }
        }
        return null;
    };
    const sendToRenderer = (channel: string, ...args: unknown[]): boolean => {
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
    let injectedRecentFiles: string[] = [];
    let hasInjectedRecentFiles = false;
    try {
        const gf =
            typeof globalThis === "undefined"
                ? undefined
                : getMenuGlobal().__mockRecentFiles;
        if (Array.isArray(gf)) {
            injectedRecentFiles = gf.filter(
                (entry): entry is string => typeof entry === "string"
            );
            hasInjectedRecentFiles = true;
        }
    } catch {
        /* Ignore errors */
    }
    // Lazy import recent files utils to ensure vi.mock hooks correctly
    let recentUtils: RecentFilesUtils;
    try {
        recentUtils = require("../../../utils/files/recent/recentFiles");
    } catch {
        // Some builds may have a different relative path
        try {
            recentUtils = require("../../../utils/files/recent/recentFiles");
        } catch {
            recentUtils = {
                getShortRecentName: (p: string) => p,
                loadRecentFiles: () => [],
            };
        }
    }
    // If tests injected recent files (even an empty array), honor that verbatim.
    // Otherwise, fall back to loading from recent files utility.
    const recentFiles = hasInjectedRecentFiles
        ? injectedRecentFiles
        : recentUtils.loadRecentFiles();

    // Best-effort file access policy integration.
    // This module is used in the main process; approving here ensures renderer readFile calls
    // can be authorized after a user clicks a recent file menu item.
    let fileAccessPolicy: FileAccessPolicy | null = null;
    try {
        fileAccessPolicy =
            require("../../../main/security/fileAccessPolicy") as FileAccessPolicy;
    } catch {
        fileAccessPolicy = null;
    }
    // If (!app.isPackaged) {
    //     Console.log("[createAppMenu] Called with:", { theme, loadedFitFilePath, recentFiles });
    // }

    const decoderOptionEmojis: Record<string, string> = {
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
                ? recentFiles.map((file: string) => ({
                      click: () => {
                          try {
                              fileAccessPolicy?.approveFilePath(file, {
                                  source: "menu:openRecent",
                              });
                          } catch {
                              // Non-fatal: if approval fails, the renderer may not be able to read
                              // the file depending on security policy.
                          }
                          if (!sendToRenderer("open-recent-file", file)) {
                              console.warn(
                                  "[createAppMenu] No active window available to open recent file."
                              );
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
                console.warn(
                    "[createAppMenu] Failed to clear native recent documents:",
                    error
                );
            }
            if (win && win.webContents) {
                win.webContents.send(
                    "show-notification",
                    "Recent files cleared.",
                    "info"
                );
                win.webContents.send("unload-fit-file");
            }
            createAppMenu(win, getTheme());
        },
        enabled: recentFiles.length > 0,
        label: "🧹 Clear Recent Files",
    };
    const recentSubmenuItems =
        recentFiles.length > 0
            ? [
                  ...recentMenuItems,
                  { type: "separator" },
                  clearRecentMenuItem,
              ]
            : [...recentMenuItems, clearRecentMenuItem];
    const revealLabel =
        process.platform === "darwin"
            ? "Reveal in Finder"
            : process.platform === "linux"
              ? "Reveal in File Manager"
              : "Reveal in File Explorer";
    function createDecoderOptionMenuItems(
        _decoderOptions: Record<string, unknown>,
        _decoderOptionEmojis: Record<string, string>,
        _mainWindow: BrowserWindowLike | null | undefined
    ): MenuItemLike[] {
        return Object.keys(decoderOptionDefaults).map((key) => ({
            checked: Boolean(_decoderOptions[key]),
            click: (menuItem: MenuItemLike) => {
                const newOptions = setDecoderOption(key, menuItem["checked"]),
                    win =
                        _mainWindow ||
                        (BrowserWindow &&
                        typeof BrowserWindow.getFocusedWindow === "function"
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
        submenu: createDecoderOptionMenuItems(
            decoderOptions,
            decoderOptionEmojis,
            mainWindow
        ),
    };

    // Experimental: folder-based FIT browser tab.
    // This is disabled by default and must be explicitly enabled by the user.
    const FIT_BROWSER_ENABLED_KEY = "fitBrowser.enabled";
    // Default ON (user can disable). This feature is still marked experimental in the UI.
    const isFitBrowserEnabled =
        getConf().get(FIT_BROWSER_ENABLED_KEY, true) === true;
    const isMac = process.platform === "darwin";
    const fileMenuItems: MenuItemLike[] = [
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
                        console.warn(
                            "[createAppMenu] shell.showItemInFolder unavailable."
                        );
                        sendToRenderer(
                            "show-notification",
                            "Unable to reveal file location on this platform.",
                            "warning"
                        );
                    }
                } catch (error) {
                    console.error(
                        "[createAppMenu] Failed to reveal file in folder:",
                        error
                    );
                    sendToRenderer(
                        "show-notification",
                        "Failed to reveal file in folder.",
                        "error"
                    );
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
                    if (
                        clipboard &&
                        typeof clipboard.writeText === "function"
                    ) {
                        clipboard.writeText(loadedFitFilePath);
                        sendToRenderer(
                            "show-notification",
                            "File path copied to clipboard.",
                            "success"
                        );
                    } else {
                        console.warn(
                            "[createAppMenu] clipboard.writeText unavailable."
                        );
                        sendToRenderer(
                            "show-notification",
                            loadedFitFilePath,
                            "info"
                        );
                    }
                } catch (error) {
                    console.error(
                        "[createAppMenu] Failed to copy file path:",
                        error
                    );
                    sendToRenderer(
                        "show-notification",
                        "Failed to copy file path.",
                        "error"
                    );
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
                const { BrowserWindow: BW } = getElectron();
                const win =
                    BW && typeof BW.getFocusedWindow === "function"
                        ? BW.getFocusedWindow()
                        : null;
                if (win && typeof win.close === "function") {
                    win.close();
                }
            },
            label: "🚪 Close Window",
        },
    ];
    if (!isMac) {
        const quitLabel = process.platform === "win32" ? "❎ Exit" : "❎ Quit";
        fileMenuItems.push(
            { type: "separator" },
            { label: quitLabel, role: "quit" }
        );
    }
    const template: MenuItemLike[] = [
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
                                    checked:
                                        getConf().get("fontSize", "medium") ===
                                        "xsmall",
                                    click: () => {
                                        getConf().set("fontSize", "xsmall");
                                        const win =
                                            mainWindow ||
                                            (BrowserWindow &&
                                            typeof BrowserWindow.getFocusedWindow ===
                                                "function"
                                                ? BrowserWindow.getFocusedWindow()
                                                : null);
                                        if (win && win.webContents) {
                                            win.webContents.send(
                                                "set-font-size",
                                                "xsmall"
                                            );
                                        }
                                    },
                                    label: "🅰️ Extra Small",
                                    type: "radio",
                                },
                                {
                                    checked:
                                        getConf().get("fontSize", "medium") ===
                                        "small",
                                    click: () => {
                                        getConf().set("fontSize", "small");
                                        const win =
                                            mainWindow ||
                                            (BrowserWindow &&
                                            typeof BrowserWindow.getFocusedWindow ===
                                                "function"
                                                ? BrowserWindow.getFocusedWindow()
                                                : null);
                                        if (win && win.webContents) {
                                            win.webContents.send(
                                                "set-font-size",
                                                "small"
                                            );
                                        }
                                    },
                                    label: "🔠 Small",
                                    type: "radio",
                                },
                                {
                                    checked:
                                        getConf().get("fontSize", "medium") ===
                                        "medium",
                                    click: () => {
                                        getConf().set("fontSize", "medium");
                                        const win =
                                            mainWindow ||
                                            (BrowserWindow &&
                                            typeof BrowserWindow.getFocusedWindow ===
                                                "function"
                                                ? BrowserWindow.getFocusedWindow()
                                                : null);
                                        if (win && win.webContents) {
                                            win.webContents.send(
                                                "set-font-size",
                                                "medium"
                                            );
                                        }
                                    },
                                    label: "🔤 Medium",
                                    type: "radio",
                                },
                                {
                                    checked:
                                        getConf().get("fontSize", "medium") ===
                                        "large",
                                    click: () => {
                                        getConf().set("fontSize", "large");
                                        const win =
                                            mainWindow ||
                                            (BrowserWindow &&
                                            typeof BrowserWindow.getFocusedWindow ===
                                                "function"
                                                ? BrowserWindow.getFocusedWindow()
                                                : null);
                                        if (win && win.webContents) {
                                            win.webContents.send(
                                                "set-font-size",
                                                "large"
                                            );
                                        }
                                    },
                                    label: "🔡 Large",
                                    type: "radio",
                                },
                                {
                                    checked:
                                        getConf().get("fontSize", "medium") ===
                                        "xlarge",
                                    click: () => {
                                        getConf().set("fontSize", "xlarge");
                                        const win =
                                            mainWindow ||
                                            (BrowserWindow &&
                                            typeof BrowserWindow.getFocusedWindow ===
                                                "function"
                                                ? BrowserWindow.getFocusedWindow()
                                                : null);
                                        if (win && win.webContents) {
                                            win.webContents.send(
                                                "set-font-size",
                                                "xlarge"
                                            );
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
                                    checked:
                                        getConf().get(
                                            "highContrast",
                                            "black"
                                        ) === "black",
                                    click: () => {
                                        getConf().set("highContrast", "black");
                                        const win =
                                            mainWindow ||
                                            (BrowserWindow &&
                                            typeof BrowserWindow.getFocusedWindow ===
                                                "function"
                                                ? BrowserWindow.getFocusedWindow()
                                                : null);
                                        if (win && win.webContents) {
                                            win.webContents.send(
                                                "set-high-contrast",
                                                "black"
                                            );
                                        }
                                    },
                                    label: "⬛ Black (Default)",
                                    type: "radio",
                                },
                                {
                                    checked:
                                        getConf().get(
                                            "highContrast",
                                            "black"
                                        ) === "white",
                                    click: () => {
                                        getConf().set("highContrast", "white");
                                        const { BrowserWindow: BW } =
                                            getElectron();
                                        const win =
                                            (BW &&
                                            typeof BW.getFocusedWindow ===
                                                "function"
                                                ? BW.getFocusedWindow()
                                                : null) || mainWindow;
                                        if (win && win.webContents) {
                                            win.webContents.send(
                                                "set-high-contrast",
                                                "white"
                                            );
                                        }
                                    },
                                    label: "⬜ White",
                                    type: "radio",
                                },
                                {
                                    checked:
                                        getConf().get(
                                            "highContrast",
                                            "black"
                                        ) === "yellow",
                                    click: () => {
                                        getConf().set("highContrast", "yellow");
                                        const { BrowserWindow: BW } =
                                            getElectron();
                                        const win =
                                            (BW &&
                                            typeof BW.getFocusedWindow ===
                                                "function"
                                                ? BW.getFocusedWindow()
                                                : null) || mainWindow;
                                        if (win && win.webContents) {
                                            win.webContents.send(
                                                "set-high-contrast",
                                                "yellow"
                                            );
                                        }
                                    },
                                    label: "🟨 Yellow",
                                    type: "radio",
                                },
                                {
                                    checked:
                                        getConf().get("highContrast", "off") ===
                                        "off",
                                    click: () => {
                                        getConf().set("highContrast", "off");
                                        const { BrowserWindow: BW } =
                                            getElectron();
                                        const win =
                                            (BW &&
                                            typeof BW.getFocusedWindow ===
                                                "function"
                                                ? BW.getFocusedWindow()
                                                : null) || mainWindow;
                                        if (win && win.webContents) {
                                            win.webContents.send(
                                                "set-high-contrast",
                                                "off"
                                            );
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
                                    (BrowserWindow &&
                                    typeof BrowserWindow.getFocusedWindow ===
                                        "function"
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
                            checked: usingPassedTheme
                                ? theme === "light"
                                : false,
                            click: () => {
                                setTheme("light");
                                const win =
                                    mainWindow ||
                                    (BrowserWindow &&
                                    typeof BrowserWindow.getFocusedWindow ===
                                        "function"
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
                            (BrowserWindow &&
                            typeof BrowserWindow.getFocusedWindow === "function"
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
                            (BrowserWindow &&
                            typeof BrowserWindow.getFocusedWindow === "function"
                                ? BrowserWindow.getFocusedWindow()
                                : null);
                        if (win && win.webContents) {
                            win.webContents.send(
                                "open-summary-column-selector"
                            );
                        }
                    },
                    enabled: Boolean(loadedFitFilePath),
                    label: "📊 Summary Columns...",
                },
                decoderOptionsMenu,

                {
                    checked: isFitBrowserEnabled,
                    click: (menuItem: MenuItemLike) => {
                        const nextEnabled = Boolean(
                            menuItem && menuItem["checked"]
                        );
                        getConf().set(FIT_BROWSER_ENABLED_KEY, nextEnabled);

                        const win = resolveTargetWindow() || mainWindow;
                        if (win && win.webContents) {
                            win.webContents.send(
                                "fit-browser-enabled-changed",
                                nextEnabled
                            );
                            win.webContents.send(
                                "show-notification",
                                nextEnabled
                                    ? "Browser tab enabled (experimental)."
                                    : "Browser tab disabled (experimental).",
                                "info"
                            );
                        }

                        // Refresh the menu so the checked state is consistent everywhere.
                        createAppMenu(win, getTheme(), loadedFitFilePath);
                    },
                    label: "🗂️ Show Browser Tab (Experimental)",
                    type: "checkbox",
                },

                {
                    click: () => {
                        const win =
                            mainWindow ||
                            (BrowserWindow &&
                            typeof BrowserWindow.getFocusedWindow === "function"
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
                        const { BrowserWindow: BW } = getElectron();
                        const win =
                            (BW && typeof BW.getFocusedWindow === "function"
                                ? BW.getFocusedWindow()
                                : null) || mainWindow;
                        if (win && win.webContents) {
                            win.webContents.send("menu-about");
                        }
                    },
                    label: "ℹ️ About",
                },
                { type: "separator" },
                {
                    click: () => {
                        safeOpenExternal(
                            "https://github.com/Nick2bad4u/FitFileViewer#readme"
                        );
                    },
                    label: "📖 Documentation",
                },
                {
                    click: () => {
                        safeOpenExternal(
                            "https://github.com/Nick2bad4u/FitFileViewer"
                        );
                    },
                    label: "🌐 GitHub Repository",
                },
                {
                    click: () => {
                        safeOpenExternal(
                            "https://github.com/Nick2bad4u/FitFileViewer/issues"
                        );
                    },
                    label: "❗Report an Issue",
                },
                { type: "separator" },
                {
                    click: () => {
                        const { BrowserWindow: BW } = getElectron();
                        const win =
                            (BW && typeof BW.getFocusedWindow === "function"
                                ? BW.getFocusedWindow()
                                : null) || mainWindow;
                        if (win && win.webContents) {
                            win.webContents.send("menu-keyboard-shortcuts");
                        }
                    },
                    label: "⌨️ Keyboard Shortcuts",
                },
                {
                    click: () => {
                        const { BrowserWindow: BW } = getElectron();
                        const win =
                            (BW && typeof BW.getFocusedWindow === "function"
                                ? BW.getFocusedWindow()
                                : null) || mainWindow;
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

    if ((!app || !app.isPackaged) && shouldLogMenuDebug()) {
        // Log only the menu labels for debugging, avoid full serialization
        const menuLabels = template.map((item) => item["label"]);
        console.log(
            "[createAppMenu] Setting application menu. Menu labels:",
            menuLabels
        );
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
        if (
            Menu &&
            typeof Menu.buildFromTemplate === "function" &&
            typeof Menu.setApplicationMenu === "function"
        ) {
            mainMenu = Menu.buildFromTemplate(template);
            Menu.setApplicationMenu(mainMenu);
            return;
        }
        // In test/SSR environment without Menu API, expose template via a well-known global hook
        try {
            const menuGlobal = getMenuGlobal();
            if (!menuGlobal.__lastBuiltMenuTemplate) {
                menuGlobal.__lastBuiltMenuTemplate = template;
            } else if (globalThis) {
                menuGlobal.__lastBuiltMenuTemplate = template;
            }
        } catch {
            /* Ignore errors */
        }
        console.warn(
            "[createAppMenu] WARNING: Electron Menu API unavailable; template exposed for tests."
        );
    } catch (error) {
        console.error(
            "[createAppMenu] ERROR: Failed to set application menu:",
            error
        );
    }
}

function getDecoderOptions(): Record<string, unknown> {
    const options = getConf().get("decoderOptions", decoderOptionDefaults);
    return isRecord(options) ? options : { ...decoderOptionDefaults };
}

// Add platform-specific (macOS) App menu for About, Preferences, and Quit
function getPlatformAppMenu(
    mainWindow: BrowserWindowLike | null | undefined
): MenuItemLike[] {
    const { app, BrowserWindow } = getElectron();
    if (process.platform === "darwin") {
        return [
            {
                label: (app && app.name) || "App",
                submenu: [
                    {
                        click: () => {
                            const win =
                                mainWindow ||
                                (BrowserWindow &&
                                typeof BrowserWindow.getFocusedWindow ===
                                    "function"
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
                                (BrowserWindow &&
                                typeof BrowserWindow.getFocusedWindow ===
                                    "function"
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

function getTheme(): string {
    const value = getConf().get("theme", "dark");
    const t = typeof value === "string" ? value.trim().toLowerCase() : "";
    return t === "dark" || t === "light" || t === "auto" ? t : "dark";
}

function setDecoderOption(
    key: string,
    value: unknown
): Record<string, unknown> {
    const options = getDecoderOptions();
    options[key] = value;
    getConf().set("decoderOptions", options);
    return options;
}

function setTheme(theme: string): void {
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
        getMenuGlobal().__FFV_createAppMenuExports = createAppMenuExports;
    }
}

if (typeof module !== "undefined" && module && module.exports) {
    module.exports = createAppMenuExports;
}
