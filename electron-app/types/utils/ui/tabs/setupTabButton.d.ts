/**
 * Sets up a tab button by assigning a click event handler to it.
 *
 * @param {string} id - The ID of the button element.
 * @param {Function} handler - The event handler function to be executed on click.
 * @returns {Function|void} Cleanup function to remove the event listener, or void if setup failed
 * @throws {void} Logs a warning if the button with the given `id` is not found.
 */
export function setupTabButton(id: string, handler: Function): Function | void;
/**
 * Clears the cache and removes all event handlers
 * Useful for cleanup during page navigation or testing
 */
export function clearTabButtonCache(): void;
