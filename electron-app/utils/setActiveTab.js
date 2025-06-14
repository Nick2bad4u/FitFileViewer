/**
 * Sets the active tab by adding the 'active' class to the tab button with the given ID,
 * and removing the 'active' class from all other tab buttons.
 *
 * @param {string} tabId - The ID of the tab button to activate.
 * @returns {void} - This function does not return anything.
 */
const tabButtons = document.querySelectorAll(".tab-button");

/**
 * Sets the active tab by adding the 'active' class to the tab button with the given ID,
 * and removing the 'active' class from all other tab buttons.
 *
 * @param {string} tabId - The ID of the tab button to activate.
 * @returns {void} - This function does not return anything.
 */
export function setActiveTab(tabId) {
    tabButtons.forEach((btn) => {
        btn.classList.remove("active");
    });
    if (tabId != null && typeof tabId === "string" && tabId.trim() !== "") {
        const tab = document.getElementById(tabId);
        if (tab) {
            tab.classList.add("active");
        } else {
            console.error(`Element with ID "${tabId}" not found in the DOM.`);
        }
    } else {
        console.warn("Invalid tabId provided. Expected a non-empty string. Received:", tabId);
    }
}
