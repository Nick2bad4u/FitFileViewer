import { logWithLevel } from "../../logging/index.js";
import { updateSystemInfo } from "./updateSystemInfo.js";

// Constants for better maintainability
const CONSTANTS = {
    DEFAULT_VALUES: {
        AUTHOR: "Nick2bad4u",
        CHROME: "unknown",
        ELECTRON: "unknown",
        LICENSE: "Unlicense",
        NODE: "unknown",
        PLATFORM: "unknown",
        VERSION: "unknown",
    },
    LOG_PREFIX: "[LoadVersionInfo]",
};

/**
 * Loads version information dynamically from electronAPI or fallback sources
 * Retrieves individual version components and updates the UI accordingly
 *
 * @example
 *     // Load version info on app startup
 *     await loadVersionInfo();
 *
 * @returns {Promise<void>}
 */
export async function loadVersionInfo() {
    try {
        logWithContext("info", "Starting version information loading");

        /** @type {{
         *     version: string;
         *     electron: string;
         *     node: string;
         *     chrome: string;
         *     platform: string;
         *     author: string;
         *     license: string;
         * }} */
        let systemInfo;

        if (validateElectronAPI()) {
            // Use electronAPI to get accurate version information
            systemInfo = await getSystemInfoFromElectronAPI();

            // Update version display separately for immediate feedback
            updateVersionDisplay(systemInfo.version);
        } else {
            // Fallback to process information or defaults
            systemInfo = getFallbackSystemInfo();
        }

        // Update the system information display
        updateSystemInfo(systemInfo);

        logWithContext("info", "Version information loading completed", {
            source: validateElectronAPI() ? "electronAPI" : "fallback",
            systemInfo,
        });
    } catch (/** @type {any} */ error) {
        logWithContext("error", "Failed to load version information", {
            error:
                error && typeof error === "object" && "message" in error
                    ? error.message
                    : String(error),
            stack:
                error && typeof error === "object" && "stack" in error
                    ? error.stack
                    : undefined,
        });

        // Try to show fallback information even on error
        try {
            const fallbackInfo = getFallbackSystemInfo();
            updateSystemInfo(fallbackInfo);
            logWithContext("info", "Fallback system info applied after error");
        } catch (/** @type {any} */ fallbackError) {
            logWithContext("error", "Failed to apply fallback system info", {
                error:
                    fallbackError &&
                    typeof fallbackError === "object" &&
                    "message" in fallbackError
                        ? fallbackError.message
                        : String(fallbackError),
            });
        }
    }
}

/**
 * Get fallback system information from process (if available) Note: In modern
 * Electron with context isolation, process is typically not available
 *
 * @returns {Object} System information object with fallback values
 */
/**
 * @returns {{
 *     version: string;
 *     electron: string;
 *     node: string;
 *     chrome: string;
 *     platform: string;
 *     author: string;
 *     license: string;
 * }}
 */
function getFallbackSystemInfo() {
    logWithContext("warn", "Using fallback system information");

    const systemInfo = {
        author: CONSTANTS.DEFAULT_VALUES.AUTHOR,
        chrome: CONSTANTS.DEFAULT_VALUES.CHROME,
        electron: CONSTANTS.DEFAULT_VALUES.ELECTRON,
        license: CONSTANTS.DEFAULT_VALUES.LICENSE,
        node: CONSTANTS.DEFAULT_VALUES.NODE,
        platform: CONSTANTS.DEFAULT_VALUES.PLATFORM,
        version: CONSTANTS.DEFAULT_VALUES.VERSION,
    };

    // Try to get versions from process if available (unlikely in sandboxed renderer)
    if (typeof process !== "undefined" && process.versions) {
        systemInfo.electron =
            process.versions.electron || CONSTANTS.DEFAULT_VALUES.ELECTRON;
        systemInfo.node =
            process.versions.node || CONSTANTS.DEFAULT_VALUES.NODE;
        systemInfo.chrome =
            process.versions.chrome || CONSTANTS.DEFAULT_VALUES.CHROME;

        if (process.platform && process.arch) {
            systemInfo.platform = `${process.platform} (${process.arch})`;
        }

        logWithContext("info", "Retrieved some fallback info from process", {
            chrome: systemInfo.chrome,
            electron: systemInfo.electron,
            node: systemInfo.node,
        });
    }

    return systemInfo;
}

/**
 * Get individual version information from electronAPI
 *
 * @returns {Promise<{
 *     version: string;
 *     electron: string;
 *     node: string;
 *     chrome: string;
 *     platform: string;
 *     author: string;
 *     license: string;
 * }>}
 *   System information object
 */
async function getSystemInfoFromElectronAPI() {
    const systemInfo = {
        author: CONSTANTS.DEFAULT_VALUES.AUTHOR,
        chrome: CONSTANTS.DEFAULT_VALUES.CHROME,
        electron: CONSTANTS.DEFAULT_VALUES.ELECTRON,
        license: CONSTANTS.DEFAULT_VALUES.LICENSE,
        node: CONSTANTS.DEFAULT_VALUES.NODE,
        platform: CONSTANTS.DEFAULT_VALUES.PLATFORM,
        version: CONSTANTS.DEFAULT_VALUES.VERSION,
    };

    try {
        // Get app version
        if (typeof globalThis.electronAPI.getAppVersion === "function") {
            systemInfo.version = await globalThis.electronAPI.getAppVersion();
            logWithContext("info", "App version retrieved", {
                version: systemInfo.version,
            });
        }

        // Get Electron version
        if (typeof globalThis.electronAPI.getElectronVersion === "function") {
            systemInfo.electron =
                await globalThis.electronAPI.getElectronVersion();
            logWithContext("info", "Electron version retrieved", {
                electron: systemInfo.electron,
            });
        }

        // Get Node.js version
        if (typeof globalThis.electronAPI.getNodeVersion === "function") {
            systemInfo.node = await globalThis.electronAPI.getNodeVersion();
            logWithContext("info", "Node.js version retrieved", {
                node: systemInfo.node,
            });
        }

        // Get Chrome version
        if (typeof globalThis.electronAPI.getChromeVersion === "function") {
            systemInfo.chrome = await globalThis.electronAPI.getChromeVersion();
            logWithContext("info", "Chrome version retrieved", {
                chrome: systemInfo.chrome,
            });
        }

        // Get platform information
        if (typeof globalThis.electronAPI.getPlatformInfo === "function") {
            const platformInfo = await globalThis.electronAPI.getPlatformInfo();
            systemInfo.platform = `${platformInfo.platform} (${platformInfo.arch})`;
            logWithContext("info", "Platform info retrieved", {
                platform: systemInfo.platform,
            });
        }

        // Get license information
        if (typeof globalThis.electronAPI.getLicenseInfo === "function") {
            systemInfo.license = await globalThis.electronAPI.getLicenseInfo();
            logWithContext("info", "License info retrieved", {
                license: systemInfo.license,
            });
        }
    } catch (/** @type {any} */ error) {
        logWithContext(
            "error",
            "Failed to retrieve system information from electronAPI",
            {
                error:
                    error && typeof error === "object" && "message" in error
                        ? error.message
                        : String(error),
            }
        );
    }

    return systemInfo;
}

/**
 * Scoped logging wrapper
 *
 * @param {"log" | "info" | "warn" | "error"} level
 * @param {string} message
 * @param {Record<string, any>} [context]
 */
function logWithContext(level, message, context) {
    const msg = `${CONSTANTS.LOG_PREFIX} ${message}`;
    logWithLevel(level, msg, context);
}

/**
 * Update the version number display in the UI
 *
 * @param {string} version - Application version
 */
function updateVersionDisplay(version) {
    try {
        const versionNumber = document.querySelector("#version-number");
        if (
            versionNumber &&
            version &&
            version !== CONSTANTS.DEFAULT_VALUES.VERSION
        ) {
            versionNumber.textContent = version;
            logWithContext("info", "Version display updated", { version });
        } else if (!versionNumber) {
            logWithContext("warn", "Version number element not found in DOM");
        }
    } catch (/** @type {any} */ error) {
        logWithContext("error", "Failed to update version display", {
            error:
                error && typeof error === "object" && "message" in error
                    ? error.message
                    : String(error),
            version,
        });
    }
}

/**
 * Validate electronAPI availability
 *
 * @returns {boolean} True if electronAPI is available
 */
function validateElectronAPI() {
    const hasAPI =
        globalThis.electronAPI && typeof globalThis.electronAPI === "object";
    if (!hasAPI) {
        logWithContext("warn", "electronAPI not available");
    }
    return hasAPI;
}
