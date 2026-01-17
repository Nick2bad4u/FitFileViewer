/**
 * Adds a global fullscreen toggle button to the application
 * Creates a floating button that allows users to toggle fullscreen mode for the active tab content
 * Only creates one button instance to prevent duplicates
 *
 * @returns {void}
 *
 * @example
 * // Add fullscreen button when app initializes
 * addFullScreenButton();
 *
 * @public
 * @since 1.0.0
 */
export function addFullScreenButton(): void;
/**
 * Alternative DOM setup function for backward compatibility
 * Sets up fullscreen functionality when DOM content is loaded
 *
 * @returns {void}
 *
 * @example
 * // Alternative setup method
 * setupDOMContentLoaded();
 *
 * @public
 * @since 1.0.0
 * @deprecated Use setupFullscreenListeners() instead
 */
export function setupDOMContentLoaded(): void;
/**
 * Sets up fullscreen event listeners for state changes and keyboard shortcuts
 * Handles fullscreen state changes, F11 key events, and initialization
 *
 * @returns {void}
 *
 * @example
 * // Setup listeners after DOM is ready
 * setupFullscreenListeners();
 *
 * @public
 * @since 1.0.0
 */
export function setupFullscreenListeners(): void;
