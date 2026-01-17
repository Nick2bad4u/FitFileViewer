/**
 * Bootstraps the main application window and wires up auto-updater integration. Extracted from the
 * monolithic main.js to make the orchestration easier to comprehend.
 *
 * @returns {Promise<any>} Resolves with the created BrowserWindow instance.
 */
export function initializeApplication(): Promise<any>;
