/**
 * Toggles the visibility of tab content sections by setting the display style.
 * Only the tab content with the specified `visibleTabId` will be shown; all others will be hidden.
 * If `visibleTabId` does not match any of the IDs in `tabContentIds`, no tab content will be displayed.
 *
 * @param {string|null|undefined} visibleTabId - The ID of the tab content element to display.
 * If `null` or `undefined` is passed, no tab content will be displayed.
 */
export function toggleTabVisibility(visibleTabId) {
    const tabContentIds = [
        "content-data",
        "content-chartjs",
        "content-map",
        "content-summary",
        "content-altfit",
        "content-zwift",
    ];
    // Iterate through each tab content ID to toggle its visibility based on the `visibleTabId`.
    // Validate the DOM structure before toggling visibility
    // Cache DOM elements in a map for better performance
    const elementMap = {};
    for (let i = 0; i < tabContentIds.length; i++) {
        const id = tabContentIds[i];
        const el = document.getElementById(id);
        if (el) {
            elementMap[id] = el;
        } else {
            console.warn(
                `toggleTabVisibility: Missing element in the DOM: ${id}. Please check the HTML structure to ensure the element with ID '${id}' exists, or verify that it is dynamically added to the DOM before calling toggleTabVisibility.`
            );
        }
    }

    // Define constants for display styles
    const DISPLAY_BLOCK = "block";
    const DISPLAY_NONE = "none";

    // Toggle visibility using the cached elements
    Object.entries(elementMap).forEach(([id, el]) => {
        // Check if the current tab ID matches the visibleTabId.
        // If it matches, set the display style to DISPLAY_BLOCK to make it visible.
        // Otherwise, set the display style to DISPLAY_NONE to hide it.
        el.style.display = id === visibleTabId ? DISPLAY_BLOCK : DISPLAY_NONE;
    });
}
