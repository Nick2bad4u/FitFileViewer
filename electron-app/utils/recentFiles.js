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
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const RECENT_FILES_PATH = path.join(
	app.getPath('userData'),
	'recent-files.json',
);
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
			const data = fs.readFileSync(RECENT_FILES_PATH, 'utf-8');
			return JSON.parse(data);
		}
	} catch (err) {
		console.error('Failed to load recent files:', err);
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
		fs.writeFileSync(
			RECENT_FILES_PATH,
			JSON.stringify(list.slice(0, MAX_RECENT_FILES)),
			'utf-8',
		);
	} catch (err) {
		console.error('Failed to save recent files:', err);
	}
}

/**
 * Adds a file path to the list of recent files.
 * If the file already exists in the list, it is moved to the top.
 * The updated list is then saved.
 *
 * @param {string} filePath - The path of the file to add to the recent files list.
 */
function addRecentFile(filePath) {
	let list = loadRecentFiles();
	list = list.filter((f) => f !== filePath);
	list.unshift(filePath);
	saveRecentFiles(list);
}

/**
 * Returns the base name (file name with extension) of the given file path.
 *
 * @param {string} file - The full path to the file.
 * @returns {string} The base name of the file.
 */
function getShortRecentName(file) {
	return path.basename(file);
}

module.exports = {
	loadRecentFiles,
	saveRecentFiles,
	addRecentFile,
	getShortRecentName,
};
