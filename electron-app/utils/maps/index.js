/**
 * @fileoverview Main Category Barrel Export for maps
 * @description Re-exports all subcategories in the maps category
 */
export * from "./core/index.js"; // Base map core exports
// Avoid duplicate re-exports of common types (GlobalData, LapMesg, WindowExtensions)
// Explicitly import and re-export only unique controls/layers symbols if needed.
// For now, rely on consumers importing from their specific subpaths to avoid TS2308 conflicts.
