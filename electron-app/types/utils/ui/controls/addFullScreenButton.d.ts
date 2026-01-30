/**
 * Adds a global fullscreen toggle button to the application Creates a floating
 * button that allows users to toggle fullscreen mode for the active tab content
 * Only creates one button instance to prevent duplicates
 *
 * @since 1.0.0
 *
 * @example
 *     // Add fullscreen button when app initializes
 *     addFullScreenButton();
 *
 * @returns {void}
 *
 * @public
 */
export function addFullScreenButton(): void;
/**
 * Alternative DOM setup function for backward compatibility Sets up fullscreen
 * functionality when DOM content is loaded
 *
 * @deprecated Use setupFullscreenListeners() instead
 *
 * @since 1.0.0
 *
 * @example
 *     // Alternative setup method
 *     setupDOMContentLoaded();
 *
 * @returns {void}
 *
 * @public
 */
export function setupDOMContentLoaded(): void;
/**
 * Sets up fullscreen event listeners for state changes and keyboard shortcuts
 * Handles fullscreen state changes, F11 key events, and initialization
 *
 * @since 1.0.0
 *
 * @example
 *     // Setup listeners after DOM is ready
 *     setupFullscreenListeners();
 *
 * @returns {void}
 *
 * @public
 */
export function setupFullscreenListeners(): void;
