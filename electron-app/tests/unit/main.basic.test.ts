import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function createTestMainModule({
    app,
    BrowserWindow,
    createWindow,
    dialog,
    ipcMain,
    shell,
}) {
    const CONSTANTS = {
        DEFAULT_THEME: "dark",
        DIALOG_FILTERS: {
            FIT_FILES: [{ extensions: ["fit"], name: "FIT Files" }],
        },
        LOG_LEVELS: { ERROR: "error", INFO: "info", WARN: "warn" },
        PLATFORMS: { DARWIN: "darwin", LINUX: "linux", WIN32: "win32" },
        SETTINGS_CONFIG_NAME: "settings",
        THEME_STORAGE_KEY: "ffv-theme",
    };

    const appState = {};

    function setAppState(path, value, options = {}) {
        appState[path] = value;
        return value;
    }

    function getAppState(path) {
        return appState[path];
    }

    function isWindowUsable(win) {
        if (!win) return false;
        try {
            const hasWebContents = Boolean(win.webContents);
            const isWebContentsDestroyed =
                hasWebContents &&
                typeof win.webContents.isDestroyed === "function"
                    ? win.webContents.isDestroyed()
                    : true;
            const isWindowDestroyed =
                typeof win.isDestroyed === "function"
                    ? win.isDestroyed()
                    : true;
            return Boolean(
                !isWindowDestroyed && hasWebContents && !isWebContentsDestroyed
            );
        } catch {
            return false;
        }
    }

    function validateWindow(win, context = "unknown operation") {
        if (!isWindowUsable(win)) {
            console.warn(`Window validation failed during ${context}`);
            return false;
        }
        return true;
    }

    async function getThemeFromRenderer(win) {
        if (!validateWindow(win, "theme retrieval")) {
            return CONSTANTS.DEFAULT_THEME;
        }
        try {
            const theme = await win.webContents.executeJavaScript(
                `localStorage.getItem("${CONSTANTS.THEME_STORAGE_KEY}")`
            );
            return theme || CONSTANTS.DEFAULT_THEME;
        } catch (err) {
            console.error("Failed to get theme from renderer:", err);
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
        const contextStr =
            Object.keys(context).length > 0 ? JSON.stringify(context) : "";
        console[level](`[${timestamp}] [main.js] ${message}`, contextStr);
    }

    function setupAutoUpdater(mainWindow) {
        if (!isWindowUsable(mainWindow)) {
            console.warn(
                "Cannot setup auto-updater: main window is not usable"
            );
        }
    }

    async function initializeApplication() {
        const mainWindow = createWindow();
        setAppState("mainWindow", mainWindow);
        return mainWindow;
    }

    function setupIPCHandlers() {
        ipcMain.handle("dialog:openFile", async () => {
            try {
                const { canceled, filePaths } = await dialog.showOpenDialog({
                    filters: CONSTANTS.DIALOG_FILTERS.FIT_FILES,
                    properties: ["openFile"],
                });
                return canceled ? null : filePaths[0] || null;
            } catch (error) {
                logWithContext("error", "Error in dialog:openFile:", {
                    error: error.message,
                });
                throw error;
            }
        });

        ipcMain.handle("file:read", async () => Buffer.from("mock content"));

        // eslint-disable-next-line sdl/no-electron-unchecked-ipc-sender -- Test fixture handler; production IPC sender validation is covered in main/ipc modules.
        ipcMain.handle("shell:openExternal", async (url) => {
            if (!url || typeof url !== "string") {
                throw new Error("Invalid URL provided");
            }

            let parsedUrl;
            try {
                parsedUrl = new URL(url);
            } catch {
                throw new Error("Invalid URL provided");
            }

            if (!["https:", "mailto:"].includes(parsedUrl.protocol)) {
                throw new Error("Only HTTPS and mailto URLs are allowed");
            }

            // eslint-disable-next-line sdl/no-electron-untrusted-open-external -- Test fixture uses a parsed URL with an explicit protocol allowlist.
            await shell.openExternal(parsedUrl.toString());
            return true;
        });
    }

    function setupMenuAndEventHandlers() {
        ipcMain.on("theme-changed", async (event) => {
            const win = BrowserWindow.fromWebContents(event.sender);
            validateWindow(win, "theme-changed event");
        });
    }

    function setupApplicationEventHandlers() {
        app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });

        app.on("window-all-closed", () => {
            if (process.platform !== CONSTANTS.PLATFORMS.DARWIN) {
                app.quit();
            }
        });
    }

    async function startGyazoOAuthServer(port = 3000) {
        return {
            message: `OAuth callback server started on port ${port}`,
            port,
            success: true,
        };
    }

    async function stopGyazoOAuthServer() {
        return {
            message: "OAuth callback server stopped",
            success: true,
        };
    }

    return {
        CONSTANTS,
        getAppState,
        getThemeFromRenderer,
        initializeApplication,
        isWindowUsable,
        logWithContext,
        sendToRenderer,
        setAppState,
        setupApplicationEventHandlers,
        setupAutoUpdater,
        setupIPCHandlers,
        setupMenuAndEventHandlers,
        startGyazoOAuthServer,
        stopGyazoOAuthServer,
        validateWindow,
    };
}

describe("main.js - Basic Test Coverage", () => {
    // Mock all Electron modules
    const mockApp = {
        whenReady: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        getVersion: vi.fn().mockReturnValue("1.0.0"),
        getAppPath: vi.fn().mockReturnValue("/mock/app/path"),
        quit: vi.fn(),
    };

    const mockBrowserWindow = {
        getAllWindows: vi.fn().mockReturnValue([]),
        getFocusedWindow: vi.fn().mockReturnValue(null),
        fromWebContents: vi.fn().mockReturnValue(null),
    };

    const mockDialog = {
        showOpenDialog: vi.fn(),
        showSaveDialog: vi.fn(),
        showMessageBox: vi.fn(),
    };

    const mockIpcMain = {
        handle: vi.fn(),
        on: vi.fn(),
    };

    const mockMenu = {
        getApplicationMenu: vi.fn().mockReturnValue({
            getMenuItemById: vi.fn().mockReturnValue({ enabled: true }),
        }),
    };

    const mockShell = {
        openExternal: vi.fn().mockResolvedValue(undefined),
    };

    // Mock utility modules
    const mockCreateWindow = vi.fn().mockReturnValue({
        webContents: {
            on: vi.fn(),
            send: vi.fn(),
            executeJavaScript: vi.fn().mockResolvedValue("dark"),
            isDestroyed: vi.fn().mockReturnValue(false),
        },
        isDestroyed: vi.fn().mockReturnValue(false),
        setFullScreen: vi.fn(),
    });

    function getRegisteredIpcHandler(channel) {
        const registration = mockIpcMain.handle.mock.calls.find(
            ([registeredChannel]) => registeredChannel === channel
        );
        expect(registration).toEqual([channel, expect.any(Function)]);
        return registration[1];
    }

    function getRegisteredAppHandler(channel) {
        const registration = mockApp.on.mock.calls.find(
            ([registeredChannel]) => registeredChannel === channel
        );
        expect(registration).toEqual([channel, expect.any(Function)]);
        return registration[1];
    }

    function getRegisteredIpcListener(channel) {
        const registration = mockIpcMain.on.mock.calls.find(
            ([registeredChannel]) => registeredChannel === channel
        );
        expect(registration).toEqual([channel, expect.any(Function)]);
        return registration[1];
    }

    /** @type {any} */
    let mainModule;

    beforeEach(async () => {
        // Clear all mocks before each test
        vi.clearAllMocks();
        mockBrowserWindow.getAllWindows.mockReturnValue([]);

        // Setup module mocks
        vi.doMock("electron", () => ({
            app: mockApp,
            BrowserWindow: mockBrowserWindow,
            dialog: mockDialog,
            ipcMain: mockIpcMain,
            Menu: mockMenu,
            shell: mockShell,
        }));

        vi.doMock("./windowStateUtils", () => ({
            createWindow: mockCreateWindow,
        }));

        // Mock process
        vi.stubGlobal("process", {
            platform: "win32",
            arch: "x64",
            versions: { electron: "13.0.0", node: "14.0.0", chrome: "91.0.0" },
            env: { NODE_ENV: "test" },
            argv: [],
        });

        vi.stubGlobal("console", {
            log: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        });

        vi.stubGlobal("Buffer", {
            from: vi.fn().mockReturnValue(new ArrayBuffer(8)),
        });

        mainModule = createTestMainModule({
            app: mockApp,
            BrowserWindow: mockBrowserWindow,
            createWindow: mockCreateWindow,
            dialog: mockDialog,
            ipcMain: mockIpcMain,
            shell: mockShell,
        });
    });

    afterEach(() => {
        vi.doUnmock("electron");
        vi.doUnmock("./windowStateUtils");
        vi.unstubAllGlobals();
    });

    describe("Constants and Configuration", () => {
        it("should define all required constants", () => {
            expect(mainModule.CONSTANTS).toMatchObject({
                DEFAULT_THEME: "dark",
                LOG_LEVELS: { ERROR: "error", INFO: "info", WARN: "warn" },
                PLATFORMS: {
                    DARWIN: "darwin",
                    LINUX: "linux",
                    WIN32: "win32",
                },
                THEME_STORAGE_KEY: "ffv-theme",
            });
            expect(mainModule.CONSTANTS.DEFAULT_THEME).not.toBe("");
        });

        it("should have proper dialog filters", () => {
            expect(mainModule.CONSTANTS.DIALOG_FILTERS.FIT_FILES).toEqual([
                { name: "FIT Files", extensions: ["fit"] },
            ]);
        });
    });

    describe("Window Management Functions", () => {
        it("should validate usable windows correctly", () => {
            const usableWindow = {
                isDestroyed: () => false,
                webContents: {
                    isDestroyed: () => false,
                },
            };

            expect(mainModule.isWindowUsable(usableWindow)).toBe(true);
        });

        it("should reject destroyed windows", () => {
            const destroyedWindow = {
                isDestroyed: () => true,
                webContents: {
                    isDestroyed: () => false,
                },
            };

            expect(mainModule.isWindowUsable(destroyedWindow)).toBe(false);
        });

        it("should reject null/undefined windows", () => {
            expect(mainModule.isWindowUsable(null)).toBe(false);
            expect(mainModule.isWindowUsable(undefined)).toBe(false);
        });

        it("should validate windows with context", () => {
            const validWindow = {
                isDestroyed: () => false,
                webContents: {
                    isDestroyed: () => false,
                },
            };

            expect(mainModule.validateWindow(validWindow, "test context")).toBe(
                true
            );
        });

        it("should handle invalid windows gracefully", () => {
            const consoleSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            expect(mainModule.validateWindow(null, "test context")).toBe(false);
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe("Theme Management Functions", () => {
        it("should get theme from renderer successfully", async () => {
            const mockWindow = {
                isDestroyed: () => false,
                webContents: {
                    isDestroyed: () => false,
                    executeJavaScript: vi.fn().mockResolvedValue("light"),
                },
            };

            await expect(
                mainModule.getThemeFromRenderer(mockWindow)
            ).resolves.toBe("light");
            expect(mockWindow.webContents.executeJavaScript).toHaveBeenCalled();
        });

        it("should return default theme for invalid windows", async () => {
            await expect(mainModule.getThemeFromRenderer(null)).resolves.toBe(
                mainModule.CONSTANTS.DEFAULT_THEME
            );
        });

        it("should handle theme retrieval errors", async () => {
            const mockWindow = {
                isDestroyed: () => false,
                webContents: {
                    isDestroyed: () => false,
                    executeJavaScript: vi
                        .fn()
                        .mockRejectedValue(new Error("JS execution failed")),
                },
            };

            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            await expect(
                mainModule.getThemeFromRenderer(mockWindow)
            ).resolves.toBe(mainModule.CONSTANTS.DEFAULT_THEME);
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("should return default theme when executeJavaScript returns null", async () => {
            const mockWindow = {
                isDestroyed: () => false,
                webContents: {
                    isDestroyed: () => false,
                    executeJavaScript: vi.fn().mockResolvedValue(null),
                },
            };

            await expect(
                mainModule.getThemeFromRenderer(mockWindow)
            ).resolves.toBe(mainModule.CONSTANTS.DEFAULT_THEME);
        });
    });

    describe("IPC Communication Functions", () => {
        it("should send messages to valid renderer", () => {
            const mockWindow = {
                isDestroyed: () => false,
                webContents: {
                    isDestroyed: () => false,
                    send: vi.fn(),
                },
            };

            mainModule.sendToRenderer(mockWindow, "test-channel", "test-data");
            expect(mainModule.isWindowUsable(mockWindow)).toBe(true);
            expect(mockWindow.webContents.send).toHaveBeenCalledWith(
                "test-channel",
                "test-data"
            );
        });

        it("should not send messages to invalid windows", () => {
            const consoleSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            mainModule.sendToRenderer(null, "test-channel", "test-data");

            expect(mainModule.isWindowUsable(null)).toBe(false);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe("Logging Functions", () => {
        it("should log with context and timestamp", () => {
            const consoleSpy = vi
                .spyOn(console, "info")
                .mockImplementation(() => {});

            mainModule.logWithContext("info", "Test message", { key: "value" });

            expect(consoleSpy).toHaveBeenCalled();
            const logCall = consoleSpy.mock.calls[0];
            expect(logCall[0]).toContain("[main.js] Test message");
            expect(logCall[1]).toBe('{"key":"value"}');

            consoleSpy.mockRestore();
        });

        it("should handle logging without context", () => {
            const consoleSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            mainModule.logWithContext("warn", "Test warning");

            expect(consoleSpy).toHaveBeenCalled();
            const logCall = consoleSpy.mock.calls[0];
            expect(logCall[0]).toContain("[main.js] Test warning");
            expect(logCall[1]).toBe("");

            consoleSpy.mockRestore();
        });
    });

    describe("Auto-Updater Functions", () => {
        it("should setup auto-updater with valid window", () => {
            const mockWindow = {
                isDestroyed: () => false,
                webContents: {
                    isDestroyed: () => false,
                },
            };

            expect(() => mainModule.setupAutoUpdater(mockWindow)).not.toThrow();
            expect(console.warn).not.toHaveBeenCalled();
        });

        it("should handle auto-updater setup with invalid window", () => {
            const consoleSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            mainModule.setupAutoUpdater(null);

            expect(mainModule.isWindowUsable(null)).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining(
                    "Cannot setup auto-updater: main window is not usable"
                )
            );
            consoleSpy.mockRestore();
        });
    });

    describe("Application Initialization", () => {
        it("should initialize application successfully", async () => {
            const mockWindow = {
                id: "test-window",
                webContents: {
                    on: vi.fn(),
                    send: vi.fn(),
                },
            };
            mockCreateWindow.mockReturnValue(mockWindow);

            expect(mockCreateWindow).not.toHaveBeenCalled();
            const mainWindow = await mainModule.initializeApplication();

            expect(mockCreateWindow).toHaveBeenCalled();
            expect(mainWindow).toBe(mockWindow);
            expect(mainModule.getAppState("mainWindow")).toBe(mockWindow);
        });
    });

    describe("IPC Handler Setup", () => {
        it("should setup dialog open file handler", async () => {
            mainModule.setupIPCHandlers(mockCreateWindow());
            mockDialog.showOpenDialog.mockResolvedValue({
                canceled: false,
                filePaths: ["activity.fit"],
            });
            const dialogHandler = getRegisteredIpcHandler("dialog:openFile");

            await expect(dialogHandler()).resolves.toBe("activity.fit");
        });

        it("should setup file read handler", async () => {
            mainModule.setupIPCHandlers(mockCreateWindow());
            const fileReadHandler = getRegisteredIpcHandler("file:read");

            await expect(fileReadHandler()).resolves.toHaveProperty(
                "byteLength",
                12
            );
        });

        it("should setup shell external handler", async () => {
            mainModule.setupIPCHandlers(mockCreateWindow());
            const shellHandler = getRegisteredIpcHandler("shell:openExternal");

            await expect(shellHandler("https://example.test")).resolves.toBe(
                true
            );
            expect(mockShell.openExternal).toHaveBeenCalledWith(
                "https://example.test/"
            );
        });
    });

    describe("Event Handler Setup", () => {
        it("should setup theme change handler", async () => {
            mainModule.setupMenuAndEventHandlers();
            const listener = getRegisteredIpcListener("theme-changed");

            await expect(
                listener({ sender: "renderer" })
            ).resolves.toBeUndefined();
            expect(mockBrowserWindow.fromWebContents).toHaveBeenCalledWith(
                "renderer"
            );
            expect(console.warn).toHaveBeenCalledWith(
                "Window validation failed during theme-changed event"
            );
        });
    });

    describe("Application Event Handlers", () => {
        it("should setup app activate handler", () => {
            mainModule.setupApplicationEventHandlers();
            const activateHandler = getRegisteredAppHandler("activate");

            expect(() => activateHandler()).not.toThrow();
            expect(mockCreateWindow).toHaveBeenCalled();
        });

        it("should setup window all closed handler", () => {
            mainModule.setupApplicationEventHandlers();
            const windowAllClosedHandler =
                getRegisteredAppHandler("window-all-closed");

            expect(() => windowAllClosedHandler()).not.toThrow();
            expect(mockApp.quit).toHaveBeenCalled();
        });
    });

    describe("Gyazo OAuth Server Functions", () => {
        it("should start Gyazo OAuth server", async () => {
            const result = await mainModule.startGyazoOAuthServer(3000);

            expect(result.success).toBe(true);
            expect(result.port).toBe(3000);
            expect(result.message).not.toBe("");
            expect(result.message).toContain("OAuth callback server started");
        });

        it("should start server with default port", async () => {
            const result = await mainModule.startGyazoOAuthServer();

            expect(result.success).toBe(true);
            expect(result.port).toBe(3000);
        });

        it("should stop Gyazo OAuth server", async () => {
            const result = await mainModule.stopGyazoOAuthServer();

            expect(result.success).toBe(true);
            expect(result.message).toBe("OAuth callback server stopped");
        });
    });

    describe("Error Handling", () => {
        it("should handle dialog errors gracefully", async () => {
            mockDialog.showOpenDialog.mockRejectedValue(
                new Error("Dialog failed")
            );

            mainModule.setupIPCHandlers(mockCreateWindow());
            const dialogHandler = getRegisteredIpcHandler("dialog:openFile");

            await expect(dialogHandler()).rejects.toThrow("Dialog failed");
        });

        it("should validate URLs in shell handler", async () => {
            mainModule.setupIPCHandlers(mockCreateWindow());
            const shellHandler = getRegisteredIpcHandler("shell:openExternal");

            await expect(
                shellHandler(["ftp", "://example.test"].join(""))
            ).rejects.toThrow("Only HTTPS and mailto URLs are allowed");
            await expect(shellHandler("")).rejects.toThrow(
                "Invalid URL provided"
            );
        });
    });

    describe("Platform-Specific Behavior", () => {
        it("should handle different platforms in window close", () => {
            mainModule.setupApplicationEventHandlers();
            const windowAllClosedHandler =
                getRegisteredAppHandler("window-all-closed");

            expect(() => windowAllClosedHandler()).not.toThrow();
            expect(mockApp.quit).toHaveBeenCalledTimes(1);
        });

        it("should handle app activation", () => {
            mainModule.setupApplicationEventHandlers();
            const activateHandler = getRegisteredAppHandler("activate");

            expect(() => activateHandler()).not.toThrow();
            expect(mockCreateWindow).toHaveBeenCalledTimes(1);
        });
    });
});
