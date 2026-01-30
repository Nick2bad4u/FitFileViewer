/**
 * Provides safe, lazy-loaded accessors to recent files utilities. Avoids
 * evaluating Node-only requires in the renderer environment.
 *
 * @file Barrel Export for files/recent
 */

/** @type {any | null} */
let __recentModule = null;

export function addRecentFile(filePath) {
    const mod = loadRecentModule();
    if (mod && typeof mod.addRecentFile === "function")
        return mod.addRecentFile(filePath);
    // No-op in renderer/SSR without Node file access
}

export function getShortRecentName(file) {
    const mod = loadRecentModule();
    if (mod && typeof mod.getShortRecentName === "function")
        return mod.getShortRecentName(file);
    if (typeof file !== "string") return "";
    // Fallback basename logic without path module
    const parts = file.split(/[/\\]/);
    return parts.at(-1) || "";
}

export function loadRecentFiles() {
    const mod = loadRecentModule();
    if (mod && typeof mod.loadRecentFiles === "function")
        return mod.loadRecentFiles();
    return [];
}

export function saveRecentFiles(list) {
    const mod = loadRecentModule();
    if (mod && typeof mod.saveRecentFiles === "function")
        return mod.saveRecentFiles(list);
    // No-op in renderer/SSR without Node file access
}

function loadRecentModule() {
    if (__recentModule) return __recentModule;
    try {
        // Only attempt to require in environments where require exists (Node/Electron main/tests)
        if (typeof require === "function") {
            __recentModule = require("./recentFiles.js");
            return __recentModule;
        }
    } catch {
        /* ignore */
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
