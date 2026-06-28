import { getErrorInfo, logWithLevel } from "../../logging/index.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import {
    getProcessStringValue,
    getProcessVersionValue,
} from "../../runtime/processEnvironment.js";
import {
    getLoadVersionInfoRuntime,
    type LoadVersionInfoRuntime,
} from "./loadVersionInfoRuntime.js";
import { type SystemInfoField, updateSystemInfo } from "./updateSystemInfo.js";
import type { ElectronAppInfoApi } from "../../../shared/preloadApi.js";

type VersionSystemInfo = Record<SystemInfoField, string>;

type VersionInfoElectronAPI = {
    readonly getAppVersion?: ElectronAppInfoApi["getAppVersion"];
    readonly getChromeVersion?: ElectronAppInfoApi["getChromeVersion"];
    readonly getElectronVersion?: ElectronAppInfoApi["getElectronVersion"];
    readonly getLicenseInfo?: ElectronAppInfoApi["getLicenseInfo"];
    readonly getNodeVersion?: ElectronAppInfoApi["getNodeVersion"];
    readonly getPlatformInfo?: ElectronAppInfoApi["getPlatformInfo"];
};

type VersionInfoSource = "electronAPI" | "fallback";

type LoadVersionInfoOptions = {
    readonly electronApiScope?: RendererElectronApiScope | undefined;
};

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

function loadVersionInfoRuntime(): LoadVersionInfoRuntime {
    return getLoadVersionInfoRuntime();
}

/**
 * Loads version information dynamically from electronAPI or fallback sources.
 */
export async function loadVersionInfo(): Promise<void> {
    await loadVersionInfoWithOptions({});
}

export async function loadVersionInfoWithOptions({
    electronApiScope,
}: LoadVersionInfoOptions): Promise<void> {
    try {
        logWithContext("info", "Starting version information loading");

        const electronAPI = getVersionInfoElectronAPI(electronApiScope);
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

    const electronVersion = getProcessVersionValue("electron");
    const nodeVersion = getProcessVersionValue("node");
    const chromeVersion = getProcessVersionValue("chrome");
    const platform = getProcessStringValue("platform");
    const architecture = getProcessStringValue("arch");

    if (electronVersion || nodeVersion || chromeVersion) {
        systemInfo.electron = electronVersion ?? DEFAULT_VALUES.electron;
        systemInfo.node = nodeVersion ?? DEFAULT_VALUES.node;
        systemInfo.chrome = chromeVersion ?? DEFAULT_VALUES.chrome;

        if (platform && architecture) {
            systemInfo.platform = `${platform} (${architecture})`;
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
            loadVersionInfoRuntime().queryVersionNumber("#version-number");

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

function getVersionInfoElectronAPI(
    scope?: RendererElectronApiScope
): VersionInfoElectronAPI | undefined {
    const electronAPI = getRendererElectronApi(isVersionInfoElectronAPI, scope);
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

    const api = value as VersionInfoElectronAPI;
    return (
        hasOptionalFunction(api.getAppVersion) &&
        hasOptionalFunction(api.getChromeVersion) &&
        hasOptionalFunction(api.getElectronVersion) &&
        hasOptionalFunction(api.getLicenseInfo) &&
        hasOptionalFunction(api.getNodeVersion) &&
        hasOptionalFunction(api.getPlatformInfo)
    );
}

function hasOptionalFunction(value: unknown): boolean {
    return value === undefined || typeof value === "function";
}
