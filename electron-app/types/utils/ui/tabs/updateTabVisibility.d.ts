/**
 * Get currently visible tab content
 * @returns {string|null} Currently visible tab name or null
 */
export function getVisibleTabContent(): string | null;
/**
 * Hide all tab content
 */
export function hideAllTabContent(): void;
/**
 * Initialize tab visibility state management
 */
export function initializeTabVisibilityState(): void;
/**
 * Show specific tab content
 * @param {string} tabName - Name of the tab to show
 */
export function showTabContent(tabName: string): void;
/**
 * Toggles the visibility of tab content sections by setting the display style.
 * Only the tab content with the specified `visibleTabId` will be shown; all others will be hidden.
 * If `visibleTabId` does not match any of the IDs in `tabContentIds`, no tab content will be displayed.
 *
 * @param {string|null|undefined} visibleTabId - The ID of the tab content element to display.
 * If `null` or `undefined` is passed, no tab content will be displayed.
 */
export function updateTabVisibility(visibleTabId: string | null | undefined): void;
