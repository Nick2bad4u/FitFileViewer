/**
 * @typedef {{ getVersion?: () => string; getAppPath?: () => string }} AppInfoProvider
 *
 * @typedef {{ readFileSync?: (path: string) => Buffer | string }} FileReader
 *
 * @typedef {{ join: (...paths: string[]) => string }} PathJoiner
 *
 * @typedef {{ DEFAULT_THEME: string; SETTINGS_CONFIG_NAME: string }} InfoConstants
 *
 * @typedef {{ get: (key: string, fallback: unknown) => unknown }} ConfStore
 *
 * @typedef {new (options: { name: string }) => ConfStore} ConfConstructor
 *
 * @typedef {{ Conf: ConfConstructor }} ElectronConfModule
 *
 * @typedef {(event: unknown, ...args: unknown[]) => Promise<unknown>} InfoIpcHandler
 *
 * @typedef {(channel: string, handler: InfoIpcHandler) => void} RegisterIpcHandle
 *
 * @typedef {(
 *     level: "error" | "warn" | "info",
 *     message: string,
 *     context?: Record<string, unknown>
 * ) => void} LogWithContext
 *
 * @typedef {{
 *     registerIpcHandle: RegisterIpcHandle;
 *     appRef: () => AppInfoProvider | null | undefined;
 *     fs: FileReader;
 *     path: PathJoiner;
 *     CONSTANTS: InfoConstants;
 *     logWithContext?: LogWithContext;
 *     confModule?: ElectronConfModule;
 * }} RegisterInfoHandlersOptions
 */

/**
 * @param {unknown} error
 *
 * @returns {string}
 */
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Registers IPC handlers that expose platform and application metadata.
 *
 * @param {RegisterInfoHandlersOptions} options
 */
function registerInfoHandlers({
    registerIpcHandle,
    appRef,
    fs,
    path,
    CONSTANTS,
    logWithContext,
    confModule,
}) {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    /**
     * Safely read a value from electron-conf.
     *
     * Electron-conf can throw during require/initialization depending on
     * environment (e.g., missing Electron paths, corrupted config). These
     * handlers should never crash the IPC surface; instead we fall back to
     * defaults.
     *
     * @template T
     *
     * @param {string} key
     * @param {T} fallback
     * @param {(value: unknown) => T} normalize
     *
     * @returns {T}
     */
    const safeConfGet = (key, fallback, normalize) => {
        try {
            /** @type {ElectronConfModule} */
            const configModule = confModule ?? require("electron-conf");
            const { Conf } = configModule;
            const conf = new Conf({ name: CONSTANTS.SETTINGS_CONFIG_NAME });
            const value = conf.get(key, fallback);
            return normalize(value);
        } catch (error) {
            logWithContext?.(
                "warn",
                `Failed to read persisted setting: ${key}`,
                {
                    error: getErrorMessage(error),
                }
            );
            return normalize(fallback);
        }
    };

    /**
     * @param {unknown} value
     *
     * @returns {string}
     */
    const normalizeTheme = (value) => {
        const t = typeof value === "string" ? value.trim().toLowerCase() : "";
        return t === "dark" || t === "light" || t === "auto"
            ? t
            : CONSTANTS.DEFAULT_THEME;
    };

    /**
     * @param {unknown} value
     *
     * @returns {string}
     */
    const normalizeMapTab = (value) => {
        const t = typeof value === "string" ? value.trim() : "";
        // Conservative: only allow simple identifier-like tab names.
        if (/^[a-z0-9_-]{1,32}$/iu.test(t)) return t;
        return "map";
    };

    /** @type {Record<string, InfoIpcHandler>} */
    const handlers = {
        getAppVersion: async () => {
            const app = appRef();
            return app && typeof app.getVersion === "function"
                ? app.getVersion()
                : "";
        },
        getChromeVersion: async () => process.versions.chrome,
        getElectronVersion: async () => process.versions.electron,
        getLicenseInfo: async () => {
            try {
                const app = appRef();
                const basePath =
                    app && typeof app.getAppPath === "function"
                        ? app.getAppPath()
                        : process.cwd();
                if (!fs || typeof fs.readFileSync !== "function") {
                    throw new Error("Filesystem module unavailable");
                }
                const pkgPath = path.join(basePath, "package.json");
                const packageJsonBuffer = fs.readFileSync(pkgPath);
                const packageJson = JSON.parse(
                    packageJsonBuffer.toString("utf8")
                );
                return packageJson.license || "Unknown";
            } catch (error) {
                logWithContext?.(
                    "error",
                    "Failed to read license from package.json:",
                    {
                        error: getErrorMessage(error),
                    }
                );
                return "Unknown";
            }
        },
        getNodeVersion: async () => process.versions.node,
        getPlatformInfo: async () => ({
            arch: process.arch,
            platform: process.platform,
        }),
        "map-tab:get": async () =>
            safeConfGet("selectedMapTab", "map", normalizeMapTab),
        "theme:get": async () =>
            safeConfGet("theme", CONSTANTS.DEFAULT_THEME, normalizeTheme),
    };

    for (const [channel, handler] of Object.entries(handlers)) {
        registerIpcHandle(channel, async (...args) => {
            try {
                return await handler(...args);
            } catch (error) {
                logWithContext?.("error", `Error in ${channel}:`, {
                    error: getErrorMessage(error),
                });
                throw error;
            }
        });
    }
}

module.exports = { registerInfoHandlers };
