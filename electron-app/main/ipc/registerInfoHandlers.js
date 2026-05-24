"use strict";
{
    const INFO_INVOKE_CHANNELS = [
        "getAppVersion",
        "getChromeVersion",
        "getElectronVersion",
        "getLicenseInfo",
        "getNodeVersion",
        "getPlatformInfo",
        "map-tab:get",
        "theme:get",
    ];
    const getErrorMessage = (error) =>
        error instanceof Error ? error.message : String(error);
    /**
     * Registers IPC handlers that expose platform and application metadata.
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
        const safeConfGet = (key, fallback, normalize) => {
            try {
                const configModule = confModule ?? require("electron-conf");
                const { Conf } = configModule;
                const conf = new Conf({
                    name: CONSTANTS.SETTINGS_CONFIG_NAME,
                });
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
        const normalizeTheme = (value) => {
            const theme =
                typeof value === "string" ? value.trim().toLowerCase() : "";
            return theme === "dark" || theme === "light" || theme === "auto"
                ? theme
                : CONSTANTS.DEFAULT_THEME;
        };
        const normalizeMapTab = (value) => {
            const tab = typeof value === "string" ? value.trim() : "";
            // Conservative: only allow simple identifier-like tab names.
            if (/^[a-z0-9_-]{1,32}$/iu.test(tab)) {
                return tab;
            }
            return "map";
        };
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
                    return isPackageMetadata(packageJson) &&
                        typeof packageJson.license === "string"
                        ? packageJson.license
                        : "Unknown";
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
        for (const channel of INFO_INVOKE_CHANNELS) {
            const handler = handlers[channel];
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
    function isPackageMetadata(value) {
        return value !== null && typeof value === "object";
    }
    module.exports = { registerInfoHandlers };
}
