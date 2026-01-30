/**
 * Re-exports all modules in the charts/components category
 *
 * @file Barrel Export for charts/components
 */
// Note: chartStatusIndicator exports ChartCounts again via getChartCounts; avoid re-export to prevent duplicate symbol.
export * from "./createChartCanvas.js";
export * from "./createChartStatusIndicator.js";
export * from "./createChartStatusIndicatorFromCounts.js";
export * from "./createEnhancedChart.js";
// Global chart status indicators consolidated in dedicated module; avoid duplicate exports causing TS2308.
export * from "./createGlobalChartStatusIndicator.js";
