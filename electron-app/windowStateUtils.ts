/* eslint-disable @typescript-eslint/consistent-type-imports, @typescript-eslint/no-unnecessary-boolean-literal-compare, @typescript-eslint/prefer-readonly-parameter-types, listeners/no-inline-function-event-listener, listeners/no-missing-remove-event-listener, n/no-sync, perfectionist/sort-union-types, promise/always-return, promise/prefer-await-to-then, unicorn/filename-case -- Window state is persisted synchronously during Electron lifecycle events. */
import { app, BrowserWindow } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";

import { logWithContext } from "./main/logging/logWithContext.js";
import { getProcessEnvironmentValue } from "./utils/runtime/processEnvironment.js";

type BrowserWindowConstructorOptions =
    import("electron").BrowserWindowConstructorOptions;
type BrowserWindowInstance = import("electron").BrowserWindow;

export interface WindowState {
    height: number;
    width: number;
    x?: number;
    y?: number;
}

type WindowStateDirectoryPath = string & {
    readonly __windowStateDirectoryPath: "WindowStateDirectoryPath";
};

type WindowStateFilePath = string & {
    readonly __windowStateFilePath: "WindowStateFilePath";
};

export interface DevHelpers {
    getConfig: () => {
        constants: typeof CONSTANTS;
        currentState: WindowState;
        settingsPath: string;
    };
    resetState: () => boolean;
    validateSettings: () =>
        | {
              error?: never;
              exists: boolean;
              isValid: boolean;
              path: string;
              state: WindowState;
          }
        | {
              error: string;
              exists: boolean;
              isValid: false;
              path: string;
              state?: never;
          };
}

export const CONSTANTS = {
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
} as const;

function safeErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function getEnvironmentValue(key: string): string | undefined {
    return getProcessEnvironmentValue(key);
}

function isBooleanCallback(value: unknown): value is () => boolean {
    return typeof value === "function";
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateWindowState(state: unknown): state is WindowState {
    if (!isObjectRecord(state)) {
        return false;
    }

    const { height, width, x, y } = state;
    if (typeof width !== "number" || width <= 0) {
        return false;
    }
    if (typeof height !== "number" || height <= 0) {
        return false;
    }
    if ("x" in state && x !== undefined && typeof x !== "number") {
        return false;
    }
    if ("y" in state && y !== undefined && typeof y !== "number") {
        return false;
    }
    return true;
}

export function sanitizeWindowState(state: unknown): WindowState {
    if (!validateWindowState(state)) {
        return { ...CONSTANTS.DEFAULTS.WINDOW };
    }

    const sanitized: WindowState = {
        height: Math.max(state.height, CONSTANTS.DEFAULTS.WINDOW.minHeight),
        width: Math.max(state.width, CONSTANTS.DEFAULTS.WINDOW.minWidth),
    };
    if (typeof state.x === "number") {
        sanitized.x = state.x;
    }
    if (typeof state.y === "number") {
        sanitized.y = state.y;
    }
    return sanitized;
}

function isPathWithinDirectory(
    candidatePath: string,
    directory: string
): boolean {
    const relativePath = path.relative(directory, candidatePath);
    return (
        relativePath === "" ||
        (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
    );
}

function createWindowStateFilePath(
    storageDirectory: string
): WindowStateFilePath {
    const resolvedDirectory = path.resolve(storageDirectory);
    const resolvedFilePath = path.resolve(
        resolvedDirectory,
        CONSTANTS.FILES.WINDOW_STATE
    );

    if (!isWindowStateFilePath(resolvedFilePath, resolvedDirectory)) {
        throw new Error("Resolved window state path escaped its directory");
    }

    return resolvedFilePath;
}

function getWindowStateDirectory(
    filePath: WindowStateFilePath
): WindowStateDirectoryPath {
    const directoryPath = path.dirname(filePath);
    if (!isWindowStateDirectoryPath(directoryPath, filePath)) {
        throw new Error("Unable to derive window state directory path");
    }

    return directoryPath;
}

function isWindowStateDirectoryPath(
    candidatePath: string,
    filePath: WindowStateFilePath
): candidatePath is WindowStateDirectoryPath {
    return candidatePath === path.dirname(filePath);
}

function isWindowStateFilePath(
    candidatePath: string,
    storageDirectory: string
): candidatePath is WindowStateFilePath {
    return (
        path.basename(candidatePath) === CONSTANTS.FILES.WINDOW_STATE &&
        isPathWithinDirectory(candidatePath, storageDirectory)
    );
}

function windowStateDirectoryExists(
    directoryPath: WindowStateDirectoryPath
): boolean {
    return fs.existsSync(directoryPath);
}

function windowStateFileExists(filePath: WindowStateFilePath): boolean {
    return fs.existsSync(filePath);
}

function deleteWindowStateFile(filePath: WindowStateFilePath): void {
    fs.unlinkSync(filePath);
}

function ensureWindowStateDirectory(
    directoryPath: WindowStateDirectoryPath
): void {
    if (windowStateDirectoryExists(directoryPath)) {
        return;
    }

    fs.mkdirSync(directoryPath, { recursive: true });
}

function readWindowStateFile(filePath: WindowStateFilePath): string {
    return fs.readFileSync(filePath, "utf8");
}

function writeWindowStateFile(
    filePath: WindowStateFilePath,
    state: WindowState
): void {
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

function getSettingsPath(): WindowStateFilePath {
    try {
        const userDataPath = app.getPath("userData");
        return createWindowStateFilePath(userDataPath);
    } catch (error) {
        logWithContext("error", "Error getting window state settings path", {
            error: safeErrorMessage(error),
        });
        return createWindowStateFilePath(process.cwd());
    }
}

export function resolveWebSecuritySetting(
    packagedAppOverride = app?.isPackaged === true
): boolean {
    const isPackaged = packagedAppOverride;
    const isDevelopment = getEnvironmentValue("NODE_ENV") === "development";
    const disableWebSecurity =
        !isPackaged &&
        isDevelopment &&
        getEnvironmentValue("FFV_DISABLE_WEB_SECURITY") === "true";

    if (disableWebSecurity) {
        logWithContext(
            "warn",
            "Web security disabled via FFV_DISABLE_WEB_SECURITY=true (unpackaged development only)"
        );
    }

    return !disableWebSecurity;
}

export const settingsPath = getSettingsPath();

export function getWindowState(): WindowState {
    try {
        if (!windowStateFileExists(settingsPath)) {
            logWithContext(
                "info",
                "Window state file does not exist, using defaults"
            );
            return { ...CONSTANTS.DEFAULTS.WINDOW };
        }

        const data = readWindowStateFile(settingsPath);
        if (!data.trim()) {
            logWithContext(
                "warn",
                "Window state file is empty, using defaults"
            );
            return { ...CONSTANTS.DEFAULTS.WINDOW };
        }

        const state = sanitizeWindowState(JSON.parse(data));
        logWithContext("info", "Window state loaded successfully", {
            state,
        });
        return state;
    } catch (error) {
        logWithContext("error", "Error reading window state, using defaults", {
            error: safeErrorMessage(error),
            path: settingsPath,
        });
        return { ...CONSTANTS.DEFAULTS.WINDOW };
    }
}

export function validateWindow(win: unknown): win is BrowserWindowInstance {
    if (win === null || typeof win !== "object") {
        return false;
    }

    const candidate = win as { readonly isDestroyed?: unknown };
    return (
        isBooleanCallback(candidate.isDestroyed) &&
        candidate.isDestroyed() !== true
    );
}

export function saveWindowState(win: BrowserWindowInstance): void {
    if (!validateWindow(win)) {
        logWithContext(
            "error",
            "Invalid window object provided to saveWindowState"
        );
        return;
    }

    try {
        if (win.isMinimized() || win.isMaximized()) {
            logWithContext(
                "info",
                "Skipping window state save - window is minimized or maximized"
            );
            return;
        }

        const bounds = win.getBounds();
        const dir = getWindowStateDirectory(settingsPath);
        const state = sanitizeWindowState(bounds);
        ensureWindowStateDirectory(dir);
        writeWindowStateFile(settingsPath, state);
        logWithContext("info", "Window state saved successfully", {
            state,
        });
    } catch (error) {
        logWithContext("error", "Error saving window state", {
            error: safeErrorMessage(error),
            path: settingsPath,
        });
    }
}

export function createWindowConfig(
    state: WindowState
): BrowserWindowConstructorOptions {
    return {
        autoHideMenuBar: false,
        height: state.height,
        icon: path.join(__dirname, CONSTANTS.PATHS.ICONS.FAVICON),
        minHeight: CONSTANTS.DEFAULTS.WINDOW.minHeight,
        minWidth: CONSTANTS.DEFAULTS.WINDOW.minWidth,
        show: false,
        webPreferences: {
            ...CONSTANTS.WEB_PREFERENCES,
            preload: path.join(__dirname, CONSTANTS.PATHS.PRELOAD),
            webSecurity: resolveWebSecuritySetting(),
            webviewTag: false,
        },
        width: state.width,
        ...(typeof state.x === "number" ? { x: state.x } : {}),
        ...(typeof state.y === "number" ? { y: state.y } : {}),
    };
}

export function createWindow(): BrowserWindowInstance {
    try {
        const state = getWindowState();
        const windowConfig = createWindowConfig(state);

        logWithContext("info", "Creating window with configuration", {
            config: windowConfig,
        });

        const win = new BrowserWindow(windowConfig);
        win.setMenuBarVisibility(true);
        win.on("close", () => {
            try {
                saveWindowState(win);
            } catch (error) {
                logWithContext("error", "Error in window close handler", {
                    error: safeErrorMessage(error),
                });
            }
        });
        win.on("closed", () => {
            logWithContext("info", "Window closed successfully");
        });
        win.once("ready-to-show", () => {
            win.show();
            logWithContext("info", "Window displayed successfully");
        });

        void win
            .loadFile(path.join(__dirname, CONSTANTS.PATHS.HTML.INDEX))
            .then(() => {
                logWithContext("info", "Main HTML file loaded successfully");
            })
            .catch((error: unknown) => {
                logWithContext("error", "Error loading main HTML file", {
                    error: safeErrorMessage(error),
                });
            });

        return win;
    } catch (error) {
        logWithContext("error", "Error creating window", {
            error: safeErrorMessage(error),
        });
        throw error;
    }
}

const developmentDevHelpers: DevHelpers = {
    getConfig: () => ({
        constants: CONSTANTS,
        currentState: getWindowState(),
        settingsPath,
    }),
    resetState: () => {
        try {
            if (windowStateFileExists(settingsPath)) {
                deleteWindowStateFile(settingsPath);
                logWithContext("info", "Window state reset to defaults");
                return true;
            }
            return false;
        } catch (error) {
            logWithContext("error", "Error resetting window state", {
                error: safeErrorMessage(error),
            });
            return false;
        }
    },
    validateSettings: () => {
        try {
            const state = getWindowState();
            return {
                exists: windowStateFileExists(settingsPath),
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

export const devHelpers: DevHelpers | undefined =
    getEnvironmentValue("NODE_ENV") === "development"
        ? developmentDevHelpers
        : undefined;

logWithContext("info", "WindowStateUtils module initialized successfully");
/* eslint-enable @typescript-eslint/consistent-type-imports, @typescript-eslint/no-unnecessary-boolean-literal-compare, @typescript-eslint/prefer-readonly-parameter-types, listeners/no-inline-function-event-listener, listeners/no-missing-remove-event-listener, n/no-sync, perfectionist/sort-union-types, promise/always-return, promise/prefer-await-to-then, unicorn/filename-case -- End synchronous window-state persistence quarantine. */
