/**
 * Clears the cached DOM elements (useful for testing or DOM changes)
 *
 * @returns {void}
 */
export function clearSystemInfoCache(): void;
/**
 * Updates the system information display in the UI
 *
 * Takes a system information object and updates the corresponding DOM elements
 * with version, runtime, and platform information. Uses cached DOM elements for
 * performance and validates both input and DOM structure.
 *
 * @example
 *     updateSystemInfo({
 *         version: "1.2.3",
 *         electron: "28.0.0",
 *         node: "18.17.1",
 *         chrome: "120.0.6099.109",
 *         platform: "win32",
 *         author: "FitFileViewer Team",
 *         license: "MIT",
 *     });
 *
 * @param {Object} info - System information object
 * @param {string} [info.version] - Application version
 * @param {string} [info.electron] - Electron version
 * @param {string} [info.node] - Node.js version
 * @param {string} [info.chrome] - Chrome version
 * @param {string} [info.platform] - Platform name
 * @param {string} [info.author] - Application author
 * @param {string} [info.license] - Application license
 *
 * @returns {boolean} True if update was successful, false otherwise
 */
export function updateSystemInfo(info: {
    version?: string | undefined;
    electron?: string | undefined;
    node?: string | undefined;
    chrome?: string | undefined;
    platform?: string | undefined;
    author?: string | undefined;
    license?: string | undefined;
}): boolean;
