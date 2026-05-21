/**
 * Provides safe, lazy-loaded accessors to recent files utilities. Avoids
 * evaluating Node-only requires in the renderer environment.
 */
let recentModule = null;
function isRecentFilesModule(value) {
    return typeof value === "object" && value !== null;
}
/** Adds a file to the recent-files list when Node file access is available. */
export function addRecentFile(filePath) {
    const mod = loadRecentModule();
    if (typeof mod?.addRecentFile === "function") {
        return mod.addRecentFile(filePath);
    }
    // No-op in renderer/SSR without Node file access
}
/** Returns a display-safe basename for a recent file path. */
export function getShortRecentName(file) {
    const mod = loadRecentModule();
    if (
        typeof file === "string" &&
        typeof mod?.getShortRecentName === "function"
    ) {
        return mod.getShortRecentName(file);
    }
    if (typeof file !== "string") {
        return "";
    }
    // Fallback basename logic without path module
    const parts = file.split(/[/\\]/);
    return parts.at(-1) || "";
}
/** Loads recent files when Node file access is available. */
export function loadRecentFiles() {
    const mod = loadRecentModule();
    if (typeof mod?.loadRecentFiles === "function") {
        return mod.loadRecentFiles();
    }
    return [];
}
/** Saves the recent-files list when Node file access is available. */
export function saveRecentFiles(list) {
    const mod = loadRecentModule();
    if (typeof mod?.saveRecentFiles === "function") {
        return mod.saveRecentFiles(list);
    }
    // No-op in renderer/SSR without Node file access
}
function loadRecentModule() {
    if (recentModule) {
        return recentModule;
    }
    try {
        // Only attempt to require in environments where require exists (Node/Electron main/tests)
        if (typeof require === "function") {
            const requiredModule = require("./recentFiles.js");
            if (isRecentFilesModule(requiredModule)) {
                recentModule = requiredModule;
                return recentModule;
            }
        }
    } catch {
        // Ignore renderer environments without CommonJS access.
    }
    return null;
}
const recentAPI = {
    addRecentFile,
    getShortRecentName,
    loadRecentFiles,
    saveRecentFiles,
};
export default recentAPI;
