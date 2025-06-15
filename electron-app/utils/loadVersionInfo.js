import { updateSystemInfo } from "./updateSystemInfo.js";

/**
 * Loads version information dynamically if available
 */
export async function loadVersionInfo() {
    try {
        // Try to get version from electronAPI if available
        if (window.electronAPI && typeof window.electronAPI.getAppVersion === "function") {
            const version = await window.electronAPI.getAppVersion();
            const versionNumber = document.getElementById("version-number");
            if (versionNumber && version) {
                versionNumber.textContent = version;
            }
        }

        // Update system information if electronAPI provides it
        if (window.electronAPI && typeof window.electronAPI.getSystemInfo === "function") {
            const systemInfo = await window.electronAPI.getSystemInfo();
            updateSystemInfo(systemInfo);
        } else {
            // Use process info if available (in renderer process)
            if (typeof process !== "undefined" && process.versions) {
                const systemInfo = {
                    version: window.electronAPI ? await window.electronAPI.getAppVersion() : "21.3.0",
                    electron: process.versions.electron || "36.4.0",
                    node: process.versions.node || "22.15.1",
                    chrome: process.versions.chrome || "136.0.7103.149",
                    platform: process.platform ? `${process.platform} (${process.arch})` : "win32 (x64)",
                    author: "Nick2bad4u",
                    license: "Unlicense",
                };
                updateSystemInfo(systemInfo);
            }
        }
    } catch (error) {
        console.warn("[aboutModal] Could not load version information:", error);
    }
}
