"use strict";
/* eslint-disable @typescript-eslint/consistent-type-imports, @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unnecessary-boolean-literal-compare, @typescript-eslint/prefer-readonly-parameter-types, import-x/no-commonjs, import-x/unambiguous, listeners/no-inline-function-event-listener, listeners/no-missing-remove-event-listener, n/global-require, n/no-sync, no-undef, perfectionist/sort-union-types, promise/always-return, promise/prefer-await-to-then, unicorn/filename-case -- This is a CommonJS Electron main-process bridge that persists small window-state data synchronously during lifecycle events. */
{
    const electron = require("electron");
    const fs = require("node:fs");
    const path = require("node:path");
    const { logWithContext } = require("./main/logging/logWithContext");
    const { app, BrowserWindow } = electron;
    const CONSTANTS = {
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
    };
    function safeErrorMessage(error) {
        return error instanceof Error ? error.message : String(error);
    }
    function getEnvironmentValue(key) {
        const processValue = globalThis.process;
        if (
            processValue === null ||
            typeof processValue !== "object" ||
            !("env" in processValue)
        ) {
            return undefined;
        }
        const { env } = processValue;
        if (env === null || typeof env !== "object" || !(key in env)) {
            return undefined;
        }
        const value = env[key];
        return typeof value === "string" ? value : undefined;
    }
    function isBooleanCallback(value) {
        return typeof value === "function";
    }
    function isObjectRecord(value) {
        return value !== null && typeof value === "object";
    }
    function validateWindowState(state) {
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
    function sanitizeWindowState(state) {
        if (!validateWindowState(state)) {
            return { ...CONSTANTS.DEFAULTS.WINDOW };
        }
        const sanitized = {
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
    function getSettingsPath() {
        try {
            const userDataPath = app.getPath("userData");
            return path.join(userDataPath, CONSTANTS.FILES.WINDOW_STATE);
        } catch (error) {
            logWithContext(
                "error",
                "Error getting window state settings path",
                {
                    error: safeErrorMessage(error),
                }
            );
            return path.join(process.cwd(), CONSTANTS.FILES.WINDOW_STATE);
        }
    }
    function resolveWebSecuritySetting() {
        const isProduction = getEnvironmentValue("NODE_ENV") === "production";
        const disableWebSecurity =
            !isProduction &&
            getEnvironmentValue("FFV_DISABLE_WEB_SECURITY") === "true";
        if (disableWebSecurity) {
            logWithContext(
                "warn",
                "Web security disabled via FFV_DISABLE_WEB_SECURITY=true (development only)"
            );
        }
        return !disableWebSecurity;
    }
    const settingsPath = getSettingsPath();
    function getWindowState() {
        try {
            if (!fs.existsSync(settingsPath)) {
                logWithContext(
                    "info",
                    "Window state file does not exist, using defaults"
                );
                return { ...CONSTANTS.DEFAULTS.WINDOW };
            }
            const data = fs.readFileSync(settingsPath, "utf8");
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
            logWithContext(
                "error",
                "Error reading window state, using defaults",
                {
                    error: safeErrorMessage(error),
                    path: settingsPath,
                }
            );
            return { ...CONSTANTS.DEFAULTS.WINDOW };
        }
    }
    function validateWindow(win) {
        if (win === null || typeof win !== "object") {
            return false;
        }
        const { isDestroyed } = win;
        return isBooleanCallback(isDestroyed) && isDestroyed() !== true;
    }
    function saveWindowState(win) {
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
            const dir = path.dirname(settingsPath);
            const state = sanitizeWindowState(bounds);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(settingsPath, JSON.stringify(state, null, 2));
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
    function createWindow() {
        try {
            const state = getWindowState();
            const windowConfig = {
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
                .loadFile(CONSTANTS.PATHS.HTML.INDEX)
                .then(() => {
                    logWithContext(
                        "info",
                        "Main HTML file loaded successfully"
                    );
                })
                .catch((error) => {
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
    const devHelpers = {
        getConfig: () => ({
            constants: CONSTANTS,
            currentState: getWindowState(),
            settingsPath,
        }),
        resetState: () => {
            try {
                if (fs.existsSync(settingsPath)) {
                    fs.unlinkSync(settingsPath);
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
    const exportedApi = {
        CONSTANTS,
        createWindow,
        getWindowState,
        sanitizeWindowState,
        saveWindowState,
        settingsPath,
        validateWindow,
        validateWindowState,
        ...(getEnvironmentValue("NODE_ENV") === "development" && {
            devHelpers,
        }),
        version: "1.0.0",
    };
    module.exports = exportedApi;
    logWithContext("info", "WindowStateUtils module initialized successfully");
}
/* eslint-enable @typescript-eslint/consistent-type-imports, @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unnecessary-boolean-literal-compare, @typescript-eslint/prefer-readonly-parameter-types, import-x/no-commonjs, import-x/unambiguous, listeners/no-inline-function-event-listener, listeners/no-missing-remove-event-listener, n/global-require, n/no-sync, no-undef, perfectionist/sort-union-types, promise/always-return, promise/prefer-await-to-then, unicorn/filename-case -- End CommonJS Electron main-process bridge quarantine. */
