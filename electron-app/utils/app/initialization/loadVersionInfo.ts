import { getErrorInfo, logWithLevel } from "../../logging/index.js";
import { getRendererElectronApi } from "../../runtime/electronApiRuntime.js";
import { getLoadVersionInfoRuntime } from "./loadVersionInfoRuntime.js";
import { type SystemInfoField, updateSystemInfo } from "./updateSystemInfo.js";
import type { ElectronAPI } from "../../../shared/preloadApi.js";

type VersionSystemInfo = Record<SystemInfoField, string>;

type VersionInfoElectronAPI = Partial<
    Pick<
        ElectronAPI,
        | "getAppVersion"
        | "getChromeVersion"
        | "getElectronVersion"
        | "getLicenseInfo"
        | "getNodeVersion"
        | "getPlatformInfo"
    >
>;

type VersionInfoSource = "electronAPI" | "fallback";

const DEFAULT_VALUES = {
    author: "Nick2bad4u",
    chrome: "unknown",
    electron: "unknown",
    license: "Unlicense",
    node: "unknown",
    platform: "unknown",
    version: "unknown",
} as const satisfies VersionSystemInfo;

const LOG_PREFIX = "[LoadVersionInfo]";
const loadVersionInfoRuntime = getLoadVersionInfoRuntime();

/**
 * Loads version information dynamically from electronAPI or fallback sources.
 */
export async function loadVersionInfo(): Promise<void> {
    try {
        logWithContext("info", "Starting version information loading");

        const electronAPI = getVersionInfoElectronAPI();
        const source: VersionInfoSource = electronAPI
            ? "electronAPI"
            : "fallback";
        const systemInfo = electronAPI
            ? await getSystemInfoFromElectronAPI(electronAPI)
            : getFallbackSystemInfo();

        if (electronAPI) {
            updateVersionDisplay(systemInfo.version);
        }

        updateSystemInfo(systemInfo);

        logWithContext("info", "Version information loading completed", {
            source,
            systemInfo,
        });
    } catch (error) {
        const errorInfo = getErrorInfo(error);

        logWithContext("error", "Failed to load version information", {
            error: errorInfo.message,
            stack: errorInfo.stack,
        });

        applyFallbackSystemInfoAfterError();
    }
}

function createDefaultSystemInfo(): VersionSystemInfo {
    return { ...DEFAULT_VALUES };
}

function getFallbackSystemInfo(): VersionSystemInfo {
    logWithContext("warn", "Using fallback system information");

    const systemInfo = createDefaultSystemInfo();

    if (typeof process !== "undefined" && process.versions) {
        systemInfo.electron =
            process.versions.electron ?? DEFAULT_VALUES.electron;
        systemInfo.node = process.versions.node ?? DEFAULT_VALUES.node;
        systemInfo.chrome = process.versions.chrome ?? DEFAULT_VALUES.chrome;

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

async function getSystemInfoFromElectronAPI(
    electronAPI: VersionInfoElectronAPI
): Promise<VersionSystemInfo> {
    const systemInfo = createDefaultSystemInfo();

    try {
        if (typeof electronAPI.getAppVersion === "function") {
            systemInfo.version = await electronAPI.getAppVersion();
            logWithContext("info", "App version retrieved", {
                version: systemInfo.version,
            });
        }

        if (typeof electronAPI.getElectronVersion === "function") {
            systemInfo.electron = await electronAPI.getElectronVersion();
            logWithContext("info", "Electron version retrieved", {
                electron: systemInfo.electron,
            });
        }

        if (typeof electronAPI.getNodeVersion === "function") {
            systemInfo.node = await electronAPI.getNodeVersion();
            logWithContext("info", "Node.js version retrieved", {
                node: systemInfo.node,
            });
        }

        if (typeof electronAPI.getChromeVersion === "function") {
            systemInfo.chrome = await electronAPI.getChromeVersion();
            logWithContext("info", "Chrome version retrieved", {
                chrome: systemInfo.chrome,
            });
        }

        if (typeof electronAPI.getPlatformInfo === "function") {
            const platformInfo = await electronAPI.getPlatformInfo();
            systemInfo.platform = `${platformInfo.platform} (${platformInfo.arch})`;
            logWithContext("info", "Platform info retrieved", {
                platform: systemInfo.platform,
            });
        }

        if (typeof electronAPI.getLicenseInfo === "function") {
            systemInfo.license = await electronAPI.getLicenseInfo();
            logWithContext("info", "License info retrieved", {
                license: systemInfo.license,
            });
        }
    } catch (error) {
        logWithContext(
            "error",
            "Failed to retrieve system information from electronAPI",
            {
                error: getErrorInfo(error).message,
            }
        );
    }

    return systemInfo;
}

function applyFallbackSystemInfoAfterError(): void {
    try {
        updateSystemInfo(getFallbackSystemInfo());
        logWithContext("info", "Fallback system info applied after error");
    } catch (fallbackError) {
        logWithContext("error", "Failed to apply fallback system info", {
            error: getErrorInfo(fallbackError).message,
        });
    }
}

function logWithContext(
    level: "error" | "info" | "log" | "warn",
    message: string,
    context?: Record<string, unknown>
): void {
    logWithLevel(level, `${LOG_PREFIX} ${message}`, context);
}

function updateVersionDisplay(version: string): void {
    try {
        const versionNumber =
            loadVersionInfoRuntime.queryVersionNumber("#version-number");

        if (versionNumber && version !== DEFAULT_VALUES.version) {
            versionNumber.textContent = version;
            logWithContext("info", "Version display updated", { version });
            return;
        }

        if (!versionNumber) {
            logWithContext("warn", "Version number element not found in DOM");
        }
    } catch (error) {
        logWithContext("error", "Failed to update version display", {
            error: getErrorInfo(error).message,
            version,
        });
    }
}

function getVersionInfoElectronAPI(): VersionInfoElectronAPI | undefined {
    const electronAPI = getRendererElectronApi(isVersionInfoElectronAPI);
    if (electronAPI) {
        return electronAPI;
    }

    logWithContext("warn", "electronAPI not available");
    return undefined;
}

function isVersionInfoElectronAPI(
    value: unknown
): value is VersionInfoElectronAPI {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const api = value as Record<string, unknown>;

    return [
        "getAppVersion",
        "getChromeVersion",
        "getElectronVersion",
        "getLicenseInfo",
        "getNodeVersion",
        "getPlatformInfo",
    ].every((methodName) => {
        const method = api[methodName];
        return method === undefined || typeof method === "function";
    });
}
