/**
 * Check if tab buttons are currently enabled
 * @returns {boolean} True if tab buttons are enabled
 */
export function areTabButtonsEnabled(): boolean;
/**
 * Debug function to manually test and fix tab button states
 */
export function debugTabButtons(): void;
/**
 * Debug function to check current tab states
 */
export function debugTabState(): void;
/**
 * Force enable all tab buttons (for debugging)
 */
export function forceEnableTabButtons(): void;
/**
 * Force fix tab button states - this will override everything
 */
export function forceFixTabButtons(): void;
/**
 * Initialize tab button state management
 */
export function initializeTabButtonState(): void;
/**
 * Enable or disable all tab buttons (with class 'tab-button'), except the "Open FIT File" button.
 * The "Open FIT File" button (ID: openFileBtn) is excluded from being disabled regardless
 * of the value of the `enabled` parameter, allowing users to always open new files.
 * @param {boolean} enabled - true to enable, false to disable
 */
/**
 * Enable/disable all non "open file" tab buttons with defensive HTMLElement narrowing.
 * @param {boolean} enabled
 */
export function setTabButtonsEnabled(enabled: boolean): void;
/**
 * Test function to manually check if tab buttons can receive click events
 */
export function testTabButtonClicks(): void;
//# sourceMappingURL=enableTabButtons.d.ts.map
