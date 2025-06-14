// utils/enableTabButtons.js
// Utility to enable or disable all tab buttons (except Open FIT File)

/**
 * Enable or disable all tab buttons (with class 'tab-button'), except the "Open FIT File" button.
 * The "Open FIT File" button is excluded from being disabled regardless of the value of the `enabled` parameter.
 * @param {boolean} enabled - true to enable, false to disable
 */
export function setTabButtonsEnabled(enabled) {
    // Cache the tab buttons outside the function
    const tabButtons = document.querySelectorAll(".tab-button");

    const TAB_DISABLED_CLASS = "tab-disabled";

    tabButtons.forEach((btn) => {
        btn.disabled = !enabled;
        if (!enabled) {
            btn.classList.add(TAB_DISABLED_CLASS);
        } else {
            btn.classList.remove(TAB_DISABLED_CLASS);
        }
    });
}
