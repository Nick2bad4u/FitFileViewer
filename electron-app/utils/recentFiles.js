/* eslint-env node */
/**
 * Utility functions for managing recent files.
 *
 * @module recentFiles
 */

/**
 * Loads the list of recent files from disk.
 *
 * Attempts to read and parse a JSON file containing recent files.
 * If the file does not exist or an error occurs, returns an empty array.
 *
 * @function
 * @returns {string[]} An array of recent file paths, or an empty array if none are found or an error occurs.
 */

/**
 * Saves the list of recent files to disk, keeping only the most recent entries.
 *
 * @function
 * @param {string[]} list - The array of recent file paths to save.
 * @returns {void}
 */

/**
 * Adds a file path to the list of recent files.
 * If the file already exists in the list, it is moved to the top.
 * The updated list is then saved.
 *
 * @function
 * @param {string} filePath - The path of the file to add to the recent files list.
 * @returns {void}
 */

/**
 * Returns the base name (file name with extension) of the given file path.
 *
 * @function
 * @param {string} file - The full path to the file.
 * @returns {string} The base name of the file.
 */
// Utility functions for managing recent files
const path = require("path");
const fs = require("fs");
const { app } = require("electron");

let RECENT_FILES_PATH;
if (process.env.RECENT_FILES_PATH) {
    RECENT_FILES_PATH = process.env.RECENT_FILES_PATH;
} else {
    let userDataPath;
    try {
        // app may be undefined in test environments
        userDataPath = app && typeof app.getPath === "function" ? app.getPath("userData") : null;
    } catch {
        userDataPath = null;
    }
    if (userDataPath) {
        RECENT_FILES_PATH = path.join(userDataPath, "recent-files.json");
    } else {
        // fallback for tests or non-Electron environments
        RECENT_FILES_PATH = path.join(process.cwd(), "recent-files-test.json");
    }
}
// Maximum number of recent files to retain
const MAX_RECENT_FILES = 10;

/**
 * Loads the list of recent files from the RECENT_FILES_PATH.
 *
 * Attempts to read and parse a JSON file containing recent files.
 * If the file does not exist or an error occurs, returns an empty array.
 *
 * @returns {Array} An array of recent files, or an empty array if none are found or an error occurs.
 */
function loadRecentFiles() {
    try {
        if (fs.existsSync(RECENT_FILES_PATH)) {
            const data = fs.readFileSync(RECENT_FILES_PATH, "utf-8");
            return JSON.parse(data);
        }
    } catch (err) {
        console.error("Failed to load recent files:", err);
    }
    return [];
}

/**
 * Saves the list of recent files to disk, keeping only the most recent entries.
 *
 * @param {Array} list - The array of recent file paths to save.
 * @returns {void}
 */
function saveRecentFiles(list) {
    try {
        fs.writeFileSync(RECENT_FILES_PATH, JSON.stringify(list.slice(0, MAX_RECENT_FILES)), "utf-8");
    } catch (err) {
        console.error("Failed to save recent files:", err);
    }
}

/**
 * Adds a file path to the list of recent files.
 * If the file already exists in the list, it is moved to the top of the list.
 * The updated list is then saved to disk.
 *
 * @param {string} filePath - The path of the file to add to the recent files list.
 */
function addRecentFile(filePath) {
    let list = loadRecentFiles();
    if (!Array.isArray(list)) {
        console.warn("Invalid recent files list, resetting to an empty array.");
        list = [];
    }
    const originalList = [...list];
    if (list.includes(filePath)) {
        list = list.filter((f) => f !== filePath);
    }
    list.unshift(filePath);
    if (JSON.stringify(originalList) !== JSON.stringify(list)) {
        saveRecentFiles(list);
    }
}

/**
 * Returns the base name (file name with extension) of the given file path.
 *
 * @param {string} file - The full path to the file.
 * @returns {string} The base name of the file.
 */
function getShortRecentName(file) {
    if (!file) {
        console.warn("Invalid file path provided to getShortRecentName.");
        return "";
    }
    return path.basename(file);
}

module.exports = {
    loadRecentFiles,
    saveRecentFiles,
    addRecentFile,
    getShortRecentName,
};
