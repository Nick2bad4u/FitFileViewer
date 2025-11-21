/**
 * Adds a file path to the list of recent files.
 * If the file already exists in the list, it is moved to the top of the list.
 * The updated list is then saved to disk.
 *
 * @param {string} filePath - The path of the file to add to the recent files list.
 */
export function addRecentFile(filePath: string): void;
/**
 * Returns the base name (file name with extension) of the given file path.
 *
 * @param {string} file - The full path to the file.
 * @returns {string} The base name of the file.
 */
export function getShortRecentName(file: string): string;
/**
 * Loads the list of recent files from the RECENT_FILES_PATH.
 *
 * Attempts to read and parse a JSON file containing recent files.
 * If the file does not exist or an error occurs, returns an empty array.
 *
 * @returns {Array<string>} An array of recent files, or an empty array if none are found or an error occurs.
 */
export function loadRecentFiles(): Array<string>;
/**
 * Saves the list of recent files to disk, keeping only the most recent entries.
 *
 * @param {Array<string>} list - The array of recent file paths to save.
 * @returns {void}
 */
export function saveRecentFiles(list: Array<string>): void;
//# sourceMappingURL=recentFiles.d.ts.map
