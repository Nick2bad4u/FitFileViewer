// @ts-nocheck
/**
 * @fileoverview Central Utils Barrel Export
 * @description Main entry point for all utility modules - provides organized access to all utilities
 * @author FitFileViewer Development Team
 * @version 1.0.0
 */

export * from "./app/index.js";
export { default as app } from "./app/index.js";
export { renderChartJS } from "./charts/core/renderChartJS.js";
// Re-export all utility categories for easy importing
export * from "./charts/index.js";
/**
 * Utility categories for organized imports
 * Allows imports like: import { charts, state } from './utils';
 */
export { default as charts } from "./charts/index.js";
// New consistency utilities
export * from "./config/constants.js";
export * from "./data/index.js";
export { default as data } from "./data/index.js";
export * from "./debug/index.js";
export { default as debug } from "./debug/index.js";
export * from "./docs/documentationStandards.js";

/**
 * Legacy compatibility exports
 * These maintain backward compatibility during the migration period
 * TODO: Remove after migration is complete
 */

export * from "./errors/errorHandling.js";
export { handleOpenFile } from "./files/import/handleOpenFile.js";
export * from "./files/index.js";
export { default as files } from "./files/index.js";
// Legacy direct exports for commonly used utilities
export { formatDistance } from "./formatting/formatters/formatDistance.js";
export { formatDuration } from "./formatting/formatters/formatDuration.js";

export * from "./formatting/index.js";
export { default as formatting } from "./formatting/index.js";
export * from "./maps/index.js";
export { default as maps } from "./maps/index.js";
export { default as rendering } from "./rendering/index.js";
export * from "./rendering/index.js";
export { unifiedState } from "./state/core/unifiedStateManager.js";
export * from "./state/index.js";
export { default as state } from "./state/index.js";
export { theme } from "./theming/core/theme.js";
export * from "./theming/index.js";
export { default as theming } from "./theming/index.js";
export * from "./ui/index.js";
export { default as ui } from "./ui/index.js";
export { showNotification } from "./ui/notifications/showNotification.js";

console.log("[Utils] Central barrel export loaded - all utilities available");
