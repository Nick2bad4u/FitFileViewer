/**
 * Get the currently active tab
 *
 * @returns {string} Currently active tab name
 */
export function getActiveTab(): string;
/**
 * Initialize active tab state management by wiring state subscription
 */
export function initializeActiveTabState(): void;
/**
 * Update active tab efficiently
 *
 * @param {string} tabId
 *
 * @returns {boolean}
 */
export function updateActiveTab(tabId: string): boolean;
