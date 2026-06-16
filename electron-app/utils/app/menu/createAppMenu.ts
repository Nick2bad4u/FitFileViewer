// Lazily resolve Electron at call-time so Vitest's vi.mock('electron') can hook properly
import { validateExternalUrl } from "../../../shared/externalUrlPolicy.js";
import { createElectronConf } from "../../../main/runtime/electronConfAccess.js";
import { getElectron as getRuntimeElectron } from "../../../main/runtime/electronAccess.js";
import { approveFilePath } from "../../../main/security/fileAccessPolicy.js";
import {
    getShortRecentName,
    loadRecentFiles,
} from "../../files/recent/recentFiles.js";
import { getProcessEnvironmentValue } from "../../runtime/processEnvironment.js";

type RendererIpcEventChannel =
    import("../../../shared/ipc").RendererIpcEventChannel;

type BrowserWindowLike = {
    close?: () => void;
    isDestroyed?: () => boolean;
    webContents?: {
        send?: (channel: RendererIpcEventChannel, ...args: unknown[]) => void;
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

let lastBuiltMenuTemplateForTests: MenuItemLike[] | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUsableWindow(
    candidate: BrowserWindowLike | null | undefined
): candidate is BrowserWindowLike {
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
}

function sendToWindow(
    win: BrowserWindowLike | null | undefined,
    channel: RendererIpcEventChannel,
    ...args: unknown[]
): boolean {
    if (isUsableWindow(win) && typeof win.webContents?.send === "function") {
        win.webContents.send(channel, ...args);
        return true;
    }
    return false;
}

const getMenuRuntimeElectron =
    getRuntimeElectron as unknown as () => ElectronLike;

let __electronCached: ElectronLike | null = null;
function hasUsableElectronReference(
    candidate: ElectronLike | null
): candidate is ElectronLike {
    return Boolean(
        candidate?.["Menu"] ||
        candidate?.["app"] ||
        candidate?.["BrowserWindow"]
    );
}

function getElectron(): ElectronLike {
    try {
        const e = getMenuRuntimeElectron();
        __electronCached = e;
        return e;
    } catch {
        /* ignore */
    }

    if (hasUsableElectronReference(__electronCached)) {
        return __electronCached;
    }

    return {};
}

// Lazily initialize configuration to avoid import-time side effects in tests
let __confInstance: ConfLike | null = null;
function getConf(): ConfLike {
    if (__confInstance) return __confInstance;
    try {
        const conf = createElectronConf<ConfLike>({ name: "settings" });
        if (conf) {
            __confInstance = conf;
            return __confInstance;
        }
    } catch {
        /* Fall back below. */
    }

    try {
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
    } catch {
        const fallback: ConfLike = {
            get(_key: string, def?: unknown): unknown {
                return def;
            },
            set(_key: string, _val: unknown): void {
                void _key;
                void _val;
            },
        };
        __confInstance = fallback;
        return __confInstance;
    }
}

// Persistent reference to prevent menu GC/disappearance on Linux.
// See: https://github.com/electron/electron/issues/18397
let mainMenu: unknown = null;
let recentFilesOverrideForTests: null | string[] = null;

export function setCreateAppMenuRecentFilesOverrideForTests(
    files: null | readonly string[]
): void {
    recentFilesOverrideForTests = files === null ? null : [...files];
}

function getRecentFilesOverrideForTests(): null | string[] {
    return recentFilesOverrideForTests === null
        ? null
        : [...recentFilesOverrideForTests];
}

// Determine if verbose createAppMenu debug logging should be enabled.
function getMenuProcessEnvironmentValue(name: string): string | undefined {
    return getProcessEnvironmentValue(name);
}

function shouldLogMenuDebug() {
    try {
        return getMenuProcessEnvironmentValue("FFV_DEBUG_MENU") === "1";
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
export function createAppMenu(
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
    const resolveTargetWindow = (): BrowserWindowLike | null => {
        if (isUsableWindow(mainWindow)) {
            return mainWindow;
        }
        if (
            BrowserWindow &&
            typeof BrowserWindow.getFocusedWindow === "function"
        ) {
            const focused = BrowserWindow.getFocusedWindow();
            if (isUsableWindow(focused)) {
                return focused;
            }
        }
        return null;
    };
    const sendToRenderer = (
        channel: RendererIpcEventChannel,
        ...args: unknown[]
    ): boolean => sendToWindow(resolveTargetWindow(), channel, ...args);
    const usingPassedTheme = typeof currentTheme === "string";
    const theme = usingPassedTheme ? currentTheme : getTheme();
    const recentFiles = getRecentFilesOverrideForTests() ?? loadRecentFiles();
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
                              approveFilePath(file, {
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
                      label: getShortRecentName(file),
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
            sendToWindow(
                win,
                "show-notification",
                "Recent files cleared.",
                "info"
            );
            sendToWindow(win, "unload-fit-file");
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
                sendToWindow(win, "decoder-options-changed", newOptions);
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
                                        sendToWindow(
                                            win,
                                            "set-font-size",
                                            "xsmall"
                                        );
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
                                        sendToWindow(
                                            win,
                                            "set-font-size",
                                            "small"
                                        );
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
                                        sendToWindow(
                                            win,
                                            "set-font-size",
                                            "medium"
                                        );
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
                                        sendToWindow(
                                            win,
                                            "set-font-size",
                                            "large"
                                        );
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
                                        sendToWindow(
                                            win,
                                            "set-font-size",
                                            "xlarge"
                                        );
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
                                        sendToWindow(
                                            win,
                                            "set-high-contrast",
                                            "black"
                                        );
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
                                        sendToWindow(
                                            win,
                                            "set-high-contrast",
                                            "white"
                                        );
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
                                        sendToWindow(
                                            win,
                                            "set-high-contrast",
                                            "yellow"
                                        );
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
                                        sendToWindow(
                                            win,
                                            "set-high-contrast",
                                            "off"
                                        );
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
                                sendToWindow(win, "set-theme", "dark");
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
                                sendToWindow(win, "set-theme", "light");
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
                        sendToWindow(win, "open-accent-color-picker");
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
                        sendToWindow(win, "open-summary-column-selector");
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
                        sendToWindow(
                            win,
                            "fit-browser-enabled-changed",
                            nextEnabled
                        );
                        sendToWindow(
                            win,
                            "show-notification",
                            nextEnabled
                                ? "Browser tab enabled (experimental)."
                                : "Browser tab disabled (experimental).",
                            "info"
                        );

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
                        sendToWindow(win, "menu-check-for-updates");
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
                        sendToWindow(win, "menu-about");
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
                        sendToWindow(win, "menu-keyboard-shortcuts");
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
                        sendToWindow(win, "menu-restart-update");
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
        lastBuiltMenuTemplateForTests = template;
        console.warn(
            "[createAppMenu] WARNING: Electron Menu API unavailable; template captured for tests."
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
                            sendToWindow(win, "menu-about");
                        },
                        label: "About",
                        role: "about",
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

export function getCreateAppMenuLastBuiltTemplateForTests():
    | MenuItemLike[]
    | undefined {
    return lastBuiltMenuTemplateForTests;
}

export function setCreateAppMenuLastBuiltTemplateForTests(
    template: MenuItemLike[] | undefined
): void {
    lastBuiltMenuTemplateForTests = template;
}

export default {
    createAppMenu,
    getCreateAppMenuLastBuiltTemplateForTests,
    setCreateAppMenuRecentFilesOverrideForTests,
    setCreateAppMenuLastBuiltTemplateForTests,
};
