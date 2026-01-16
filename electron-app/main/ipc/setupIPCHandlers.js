const { addRecentFile, loadRecentFiles } = require("../../utils/files/recent/recentFiles");
const { CONSTANTS } = require("../constants");
const { logWithContext } = require("../logging/logWithContext");
const { safeCreateAppMenu } = require("../menu/safeCreateAppMenu");
const { startGyazoOAuthServer, stopGyazoOAuthServer } = require("../oauth/gyazoOAuthServer");
const { appRef, browserWindowRef, dialogRef, shellRef } = require("../runtime/electronAccess");
const { ensureFitParserStateIntegration } = require("../runtime/fitParserIntegration");
const { fs, path } = require("../runtime/nodeModules");
const { validateExternalUrl } = require("../security/externalUrlPolicy");
const { assertFileReadAllowed } = require("../security/fileAccessPolicy");
const { getAppState, setAppState } = require("../state/appState");
const { getThemeFromRenderer } = require("../theme/getThemeFromRenderer");
const { registerIpcHandle, registerIpcListener } = require("./ipcRegistry");
const { registerDialogHandlers } = require("./registerDialogHandlers");
const { registerRecentFileHandlers } = require("./registerRecentFileHandlers");

const MAX_FIT_FILE_BYTES = 100 * 1024 * 1024; // 100 MB safety cap

/**
 * Registers all IPC handlers for the main process. The structure mirrors the legacy implementation
 * but lives in a dedicated module to keep main.js lean.
 *
 * @param {any} mainWindow - Primary BrowserWindow instance (may be undefined in some test scenarios).
 */
function setupIPCHandlers(mainWindow) {
    ensureFitParserStateIntegration().catch((error) => {
        logWithContext("warn", "Fit parser state integration failed to initialize", {
            error: /** @type {Error} */ (error)?.message,
        });
    });

    registerDialogHandlers({
        addRecentFile,
        browserWindowRef,
        CONSTANTS,
        dialogRef,
        getThemeFromRenderer,
        logWithContext,
        mainWindow,
        registerIpcHandle,
        safeCreateAppMenu,
        setAppState,
    });

    registerRecentFileHandlers({
        registerIpcHandle,
        addRecentFile,
        loadRecentFiles,
        browserWindowRef,
        mainWindow,
        getThemeFromRenderer,
        safeCreateAppMenu,
        getAppState,
        logWithContext,
    });

    registerIpcListener("fit-file-loaded", async (event, filePath) => {
        // Support clearing the loaded file state.
        // Renderer sends null when a file is unloaded.
        if (filePath === null || filePath === undefined || (typeof filePath === "string" && filePath.trim() === "")) {
            setAppState("loadedFitFilePath", null);
        } else {
            try {
                // Don't trust renderer-provided paths blindly; only persist if it is an approved FIT path.
                const approvedPath = assertFileReadAllowed(filePath);
                setAppState("loadedFitFilePath", approvedPath);
            } catch (error) {
                logWithContext("warn", "Rejected fit-file-loaded with unapproved path", {
                    error: /** @type {Error} */ (error)?.message,
                    filePath,
                });
                return;
            }
        }
        const win = browserWindowRef().fromWebContents(event.sender);
        if (win) {
            try {
                const theme = await getThemeFromRenderer(win);
                safeCreateAppMenu(win, theme, getAppState("loadedFitFilePath"));
            } catch (error) {
                logWithContext("error", "Failed to update menu after fit file loaded:", {
                    error: /** @type {Error} */ (error).message,
                });
            }
        }
    });

    registerIpcHandle("file:read", async (_event, filePath) => {
        try {
            // Validate *and authorize* file reads.
            // This blocks arbitrary local file disclosure via IPC.
            let authorizedPath;
            try {
                authorizedPath = assertFileReadAllowed(filePath);
            } catch (policyError) {
                const error = policyError instanceof Error ? policyError : new Error(String(policyError));
                logWithContext("error", "Error in file:read:", {
                    error: error.message,
                    filePath,
                });
                throw error;
            }

            if (!fs || typeof fs.readFile !== "function") {
                throw new Error("Filesystem module unavailable");
            }

            return new Promise((resolve, reject) => {
                const read = () => {
                    fs.readFile(authorizedPath, (err, data) => {
                        if (err) {
                            logWithContext("error", "Error reading file:", {
                                error: /** @type {Error} */ (err).message,
                                filePath: authorizedPath,
                            });
                            reject(err);
                            return;
                        }

                        if (data && typeof data.byteLength === "number" && data.byteLength > MAX_FIT_FILE_BYTES) {
                            reject(new Error("File size exceeds 100MB limit"));
                            return;
                        }

                        resolve(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
                    });
                };

                // Preflight size check if stat is available.
                if (typeof fs.stat === "function") {
                    fs.stat(authorizedPath, (statErr, stats) => {
                        if (statErr) {
                            read();
                            return;
                        }
                        const size = stats && typeof stats.size === "number" ? stats.size : 0;
                        if (size > MAX_FIT_FILE_BYTES) {
                            reject(new Error("File size exceeds 100MB limit"));
                            return;
                        }
                        read();
                    });
                    return;
                }

                read();
            });
        } catch (error) {
            logWithContext("error", "Error in file:read:", {
                error: /** @type {Error} */ (error).message,
            });
            throw error;
        }
    });

    registerIpcHandle("fit:parse", async (_event, arrayBuffer) => {
        try {
            await ensureFitParserStateIntegration();
            const buffer = toFitBuffer(arrayBuffer);
            const fitParser = require("../../fitParser");
            return await fitParser.decodeFitFile(buffer);
        } catch (error) {
            logWithContext("error", "Error in fit:parse:", {
                error: /** @type {Error} */ (error).message,
            });
            throw error;
        }
    });

    registerIpcHandle("fit:decode", async (_event, arrayBuffer) => {
        try {
            await ensureFitParserStateIntegration();
            const buffer = toFitBuffer(arrayBuffer);
            const fitParser = require("../../fitParser");
            return await fitParser.decodeFitFile(buffer);
        } catch (error) {
            logWithContext("error", "Error in fit:decode:", {
                error: /** @type {Error} */ (error).message,
            });
            throw error;
        }
    });

    const infoHandlers = {
        getAppVersion: async () => {
            const app = appRef();
            return app && app.getVersion ? app.getVersion() : "";
        },
        getChromeVersion: async () => process.versions.chrome,
        getElectronVersion: async () => process.versions.electron,
        getLicenseInfo: async () => {
            try {
                const pkgPath = (() => {
                    const app = appRef();
                    return path.join(app && app.getAppPath ? app.getAppPath() : process.cwd(), "package.json");
                })();
                const raw = fs.readFileSync(pkgPath);
                const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw);
                const packageJson = JSON.parse(text);
                return packageJson.license || "Unknown";
            } catch (error) {
                logWithContext("error", "Failed to read license from package.json:", {
                    error: /** @type {Error} */ (error).message,
                });
                return "Unknown";
            }
        },
        getNodeVersion: async () => process.versions.node,
        getPlatformInfo: async () => ({
            arch: process.arch,
            platform: process.platform,
        }),
        "map-tab:get": async () => {
            try {
                const { Conf } = require("electron-conf");
                const conf = new Conf({ name: CONSTANTS.SETTINGS_CONFIG_NAME });
                const value = conf.get("selectedMapTab", "map");
                const t = typeof value === "string" ? value.trim() : "";
                return /^[a-z0-9_-]{1,32}$/iu.test(t) ? t : "map";
            } catch {
                return "map";
            }
        },
        "theme:get": async () => {
            try {
                const { Conf } = require("electron-conf");
                const conf = new Conf({ name: CONSTANTS.SETTINGS_CONFIG_NAME });
                const value = conf.get("theme", CONSTANTS.DEFAULT_THEME);
                const t = typeof value === "string" ? value.trim().toLowerCase() : "";
                return t === "dark" || t === "light" || t === "auto" ? t : CONSTANTS.DEFAULT_THEME;
            } catch {
                return CONSTANTS.DEFAULT_THEME;
            }
        },
    };

    for (const [channel, handler] of Object.entries(infoHandlers)) {
        registerIpcHandle(channel, async (event, ...args) => {
            try {
                return await handler(event, ...args);
            } catch (error) {
                logWithContext("error", `Error in ${channel}:`, {
                    error: /** @type {Error} */ (error).message,
                });
                throw error;
            }
        });
    }

    registerIpcHandle("shell:openExternal", async (_event, url) => {
        try {
            const validated = validateExternalUrl(url);
            // Preserve the original string (post-trim) to avoid surprising canonicalization
            // like adding a trailing slash.
            await shellRef().openExternal(validated);
            return true;
        } catch (error) {
            logWithContext("error", "Error in shell:openExternal:", {
                error: /** @type {Error} */ (error).message,
            });
            throw error;
        }
    });

    registerIpcHandle("gyazo:server:start", async (_event, port = 3000) => {
        try {
            const numericPort = typeof port === "number" ? port : Number(port);
            if (!Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65_535) {
                throw new Error("Invalid port provided");
            }
            return await startGyazoOAuthServer(numericPort);
        } catch (error) {
            logWithContext("error", "Error in gyazo:server:start:", {
                error: /** @type {Error} */ (error).message,
            });
            throw error;
        }
    });

    registerIpcHandle("gyazo:server:stop", async (_event) => {
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

/**
 * @param {unknown} value
 * @returns {Buffer}
 */
function toFitBuffer(value) {
    if (value instanceof ArrayBuffer) {
        if (value.byteLength > MAX_FIT_FILE_BYTES) {
            throw new Error(`FIT data too large (${value.byteLength} bytes)`);
        }
        return Buffer.from(value);
    }
    if (value && typeof value === "object" && ArrayBuffer.isView(value) && value.buffer instanceof ArrayBuffer) {
        // @ts-ignore - ArrayBufferView typing
        if (value.byteLength > MAX_FIT_FILE_BYTES) {
            // @ts-ignore - ArrayBufferView typing
            throw new Error(`FIT data too large (${value.byteLength} bytes)`);
        }
        // @ts-ignore - ArrayBufferView typing
        return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    }
    throw new TypeError("Invalid FIT data: expected ArrayBuffer");
}

module.exports = { setupIPCHandlers };
