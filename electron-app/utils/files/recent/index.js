/**
 * Provides safe, lazy-loaded accessors to recent files utilities. Avoids
 * evaluating Node-only requires in the renderer environment.
 *
 * @file Barrel Export for files/recent
 */

/**
 * @typedef {object} RecentFilesModule
 * @property {(filePath: string) => void} [addRecentFile]
 * @property {(file: string) => string} [getShortRecentName]
 * @property {() => string[]} [loadRecentFiles]
 * @property {(list: string[]) => void} [saveRecentFiles]
 */

/** @type {RecentFilesModule | null} */
let __recentModule = null;

/**
 * @param {unknown} value
 * @returns {value is RecentFilesModule}
 */
function isRecentFilesModule(value) {
    return typeof value === "object" && value !== null;
}

/**
 * @param {string} filePath
 * @returns {void}
 */
export function addRecentFile(filePath) {
    const mod = loadRecentModule();
    if (mod && typeof mod.addRecentFile === "function")
        return mod.addRecentFile(filePath);
    // No-op in renderer/SSR without Node file access
}

/**
 * @param {unknown} file
 * @returns {string}
 */
export function getShortRecentName(file) {
    const mod = loadRecentModule();
    if (typeof file === "string" && typeof mod?.getShortRecentName === "function")
        return mod.getShortRecentName(file);
    if (typeof file !== "string") return "";
    // Fallback basename logic without path module
    const parts = file.split(/[/\\]/);
    return parts.at(-1) || "";
}

/**
 * @returns {string[]}
 */
export function loadRecentFiles() {
    const mod = loadRecentModule();
    if (mod && typeof mod.loadRecentFiles === "function")
        return mod.loadRecentFiles();
    return [];
}

/**
 * @param {string[]} list
 * @returns {void}
 */
export function saveRecentFiles(list) {
    const mod = loadRecentModule();
    if (mod && typeof mod.saveRecentFiles === "function")
        return mod.saveRecentFiles(list);
    // No-op in renderer/SSR without Node file access
}

/**
 * @returns {RecentFilesModule | null}
 */
function loadRecentModule() {
    if (__recentModule) return __recentModule;
    try {
        // Only attempt to require in environments where require exists (Node/Electron main/tests)
        if (typeof require === "function") {
            const requiredModule = /** @type {unknown} */ (require("./recentFiles.js"));
            if (isRecentFilesModule(requiredModule)) {
                __recentModule = requiredModule;
                return __recentModule;
            }
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
