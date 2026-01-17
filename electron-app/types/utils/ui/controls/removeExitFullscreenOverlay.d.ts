/**
 * Removes the exit fullscreen overlay button from the specified container
 *
 * Uses caching for improved performance and supports both modern and legacy removal methods.
 * Automatically cleans up cache entries when overlays are removed.
 *
 * @param {HTMLElement} container - The DOM element from which to remove the overlay button
 * @throws {TypeError} If container is not a valid DOM element
 * @example
 * // Remove exit fullscreen overlay from a chart container
 * removeExitFullscreenOverlay(document.getElementById('chart-container'));
 */
export function removeExitFullscreenOverlay(container: HTMLElement): void;
