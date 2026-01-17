/** @typedef {import('../core/getChartCounts.js').ChartCounts} ChartCounts */
/**
 * Sets up automatic updates for the chart status indicator
 * Called whenever charts are rendered or field toggles change
 */
export function setupChartStatusUpdates(): void;
/**
 * Updates both the settings and global chart status indicators synchronously
 * This ensures they always show the same counts
 */
export function updateAllChartStatusIndicators(): void;
/**
 * Update a single chart status indicator element
 * @param {HTMLElement|null} indicator
 */
export function updateChartStatusIndicator(indicator?: HTMLElement | null): void;
export type ChartCounts = import("../core/getChartCounts.js").ChartCounts;
