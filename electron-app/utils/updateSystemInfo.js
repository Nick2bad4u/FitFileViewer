/**
 * Updates the system information display in the UI.
 * @param {Object} info - System information object.
 * @param {string} [info.version] - Application version.
 * @param {string} [info.electron] - Electron version.
 * @param {string} [info.node] - Node.js version.
 * @param {string} [info.chrome] - Chrome version.
 * @param {string} [info.platform] - Platform name.
 * @param {string} [info.author] - Application author.
 * @param {string} [info.license] - Application license.
 * @returns {void}
 */

// Cache the node list if the DOM structure is static
let cachedSystemInfoItems = null;

/**
 * Updates the system information display in the UI.
 * @param {Object} info - System information object.
 * @returns {void}
 */
export function updateSystemInfo(info) {
    if (!cachedSystemInfoItems) {
        cachedSystemInfoItems = document.querySelectorAll(".system-info-value");
        if (cachedSystemInfoItems.length < 7) {
            console.warn(
                `[updateSystemInfo] Expected 7 .system-info-value elements, but found ${cachedSystemInfoItems.length}. ` +
                    "Check the HTML structure to ensure all system info fields are present."
            );
        }
    }
    const systemInfoItems = cachedSystemInfoItems;
    // Define the explicit mapping order between info properties and DOM elements
    const infoKeys = ["version", "electron", "node", "chrome", "platform", "author", "license"];
    for (let i = 0; i < infoKeys.length; i++) {
        const key = infoKeys[i];
        if (systemInfoItems[i]) {
            systemInfoItems[i].textContent = info[key] || "";
        }
    }
}
